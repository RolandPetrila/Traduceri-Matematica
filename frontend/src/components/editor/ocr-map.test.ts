import {
  parseInlineToNodes,
  sectionToBlocks,
  structuredPagesToBlocks,
  rawTextToBlocks,
  type OcrPage,
} from "./ocr-map";

/**
 * Gate F9 (2026-07-29): maparea OCR→noduri TipTap. Fixture-urile au FORMA răspunsului
 * real `/api/ocr` (fetch pe o imagine reală în scratchpad/ocr_fixture_raw.json):
 * `two_column` cu `step`+`figure(img_b64)`, `$P_3$`/`$\angle$`, `observation` cu `**`+`\n`.
 * Edge-cases (advisor): `$$…$$`, `$` neîmperecheat, latex gol, figură fără img_b64,
 * figură în two_column, `level` 0/7, `\n\n`.
 */

const textOf = (nodes: unknown): string =>
  (nodes as { type: string; text?: string }[])
    .filter((n) => n.type === "text")
    .map((n) => n.text)
    .join("");

const mathOf = (nodes: unknown): string[] =>
  (nodes as { type: string; attrs?: { latex?: string } }[])
    .filter((n) => n.type === "inlineMath")
    .map((n) => n.attrs?.latex || "");

describe("parseInlineToNodes — formule + marcaje", () => {
  it("`$…$` inline → nod inlineMath cu latex-ul exact", () => {
    const nodes = parseInlineToNodes(
      "Fie $\\angle MNy$ cu $m(\\angle M) = 60^{\\circ}$.",
    );
    expect(mathOf(nodes)).toEqual([
      "\\angle MNy",
      "m(\\angle M) = 60^{\\circ}",
    ]);
    expect(textOf(nodes)).toBe("Fie  cu .");
  });

  it("`$$…$$` (display) NU se sparge în două noduri goale (R-MATH)", () => {
    const nodes = parseInlineToNodes("Rezultat: $$x^2 + y^2 = r^2$$ final");
    expect(mathOf(nodes)).toEqual(["x^2 + y^2 = r^2"]);
    // niciun nod math gol
    expect(mathOf(nodes).every((l) => l.length > 0)).toBe(true);
  });

  it("latex GOL (`$ $` / `$$$$`) → text literal, niciun nod invizibil", () => {
    const nodes = parseInlineToNodes("cost $ $ and $$$$ end");
    expect(mathOf(nodes)).toEqual([]);
    expect(nodes.some((n) => n.type === "inlineMath")).toBe(false);
  });

  it("`$` neîmperecheat → text literal, nu math", () => {
    const nodes = parseInlineToNodes("preț 5$ pe bucată");
    expect(mathOf(nodes)).toEqual([]);
    expect(textOf(nodes)).toBe("preț 5$ pe bucată");
  });

  it("`**bold**` și `*italic*` → marcaje", () => {
    const nodes = parseInlineToNodes("**Observație.** un *exemplu*") as {
      type: string;
      text?: string;
      marks?: { type: string }[];
    }[];
    const bold = nodes.find((n) => n.text === "Observație.");
    const ital = nodes.find((n) => n.text === "exemplu");
    expect(bold?.marks?.[0].type).toBe("bold");
    expect(ital?.marks?.[0].type).toBe("italic");
  });

  it("marcaj + formulă amestecate păstrează ambele", () => {
    const nodes = parseInlineToNodes(
      "**Exemplu.** $\\triangle ABC$ cu $AB = 4$",
    );
    expect(mathOf(nodes)).toEqual(["\\triangle ABC", "AB = 4"]);
    const bold = (
      nodes as { text?: string; marks?: { type: string }[] }[]
    ).find((n) => n.text === "Exemplu.");
    expect(bold?.marks?.[0].type).toBe("bold");
  });
});

describe("sectionToBlocks — tipuri de secțiuni", () => {
  it("heading cu level clamp 1..6", () => {
    expect(
      sectionToBlocks({ type: "heading", content: "T", level: 0 })[0].attrs,
    ).toEqual({
      level: 1,
    });
    expect(
      sectionToBlocks({ type: "heading", content: "T", level: 7 })[0].attrs,
    ).toEqual({
      level: 6,
    });
  });

  it("heading foarte lung (>200) → paragraf(e), nu titlu", () => {
    const long = "x".repeat(250);
    const blocks = sectionToBlocks({
      type: "heading",
      content: long,
      level: 2,
    });
    expect(blocks.every((b) => b.type === "paragraph")).toBe(true);
  });

  it("figure CU img_b64 → nod image + caption italic", () => {
    const blocks = sectionToBlocks({
      type: "figure",
      img_b64: "iVBORw0KGgoAAAANS",
      caption: "Triunghi ABC",
    });
    expect(blocks[0].type).toBe("image");
    expect((blocks[0].attrs as { src: string }).src).toMatch(
      /^data:image\/png;base64,iVBOR/,
    );
    expect(blocks[1].type).toBe("paragraph"); // caption
  });

  it("figure FĂRĂ img_b64 → paragraf [Figură: …], nu <img> rupt", () => {
    const blocks = sectionToBlocks({ type: "figure", caption: "Triunghi ABC" });
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("paragraph");
    expect(textOf(blocks[0].content)).toBe("[Figură: Triunghi ABC]");
    expect(blocks.some((b) => b.type === "image")).toBe(false);
  });

  it("two_column → aplatizat (stânga apoi dreapta), figurile din interior recursate", () => {
    const blocks = sectionToBlocks({
      type: "two_column",
      left: [
        { type: "step", content: "$P_1$: Construim $[AB]$" },
        { type: "figure", img_b64: "AAA", caption: "AB" },
      ],
      right: [
        { type: "step", content: "$P_2$: Arc din $A$" },
        { type: "figure", img_b64: "BBB", caption: "arc" },
      ],
    });
    const images = blocks.filter((b) => b.type === "image");
    expect(images).toHaveLength(2); // ambele figuri (advisor: NU se pierd în two_column)
    expect(mathOf(blocks[0].content)).toEqual(["P_1", "[AB]"]); // step stâng întâi (2 formule)
  });

  it("list / observation cu `\\n` → paragrafe separate", () => {
    const blocks = sectionToBlocks({
      type: "observation",
      content: "**Observații**\n1. Prima\n2. A doua",
    });
    expect(blocks).toHaveLength(3);
    expect(blocks.every((b) => b.type === "paragraph")).toBe(true);
  });
});

describe("structuredPagesToBlocks — pagini + semnale", () => {
  it("mai multe pagini → pageBreak între ele, titlu = heading L1", () => {
    const pages: OcrPage[] = [
      {
        title: "Pagina 1",
        sections: [{ type: "paragraph", content: "text 1" }],
      },
      {
        title: "Pagina 2",
        sections: [{ type: "paragraph", content: "text 2" }],
      },
    ];
    const { blocks } = structuredPagesToBlocks(pages);
    expect(blocks.filter((b) => b.type === "pageBreak")).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: "heading", attrs: { level: 1 } });
  });

  it("detectează fallback Mistral (fără figuri/LaTeX)", () => {
    const { mistralFallback } = structuredPagesToBlocks([
      {
        source: "mistral-ocr",
        sections: [{ type: "paragraph", content: "brut" }],
      },
    ]);
    expect(mistralFallback).toBe(true);
  });

  it("pagini goale → un paragraf onest, niciodată doc gol invalid", () => {
    const { blocks } = structuredPagesToBlocks([{ sections: [] }]);
    expect(blocks.length).toBeGreaterThan(0);
  });
});

describe("rawTextToBlocks — text brut", () => {
  it("split pe `\\n\\n` → paragrafe", () => {
    const blocks = rawTextToBlocks("Primul paragraf.\n\nAl doilea paragraf.");
    expect(blocks).toHaveLength(2);
    expect(textOf(blocks[0].content)).toBe("Primul paragraf.");
  });

  it("gol → un paragraf marcaj, nu array gol", () => {
    expect(rawTextToBlocks("   ").length).toBeGreaterThan(0);
  });
});
