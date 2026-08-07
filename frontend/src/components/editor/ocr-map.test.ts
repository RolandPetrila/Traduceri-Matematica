import {
  parseInlineToNodes,
  sectionToBlocks,
  structuredPagesToBlocks,
  rawTextToBlocks,
  fixTruncatedMathAlnum,
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

describe("sectionToBlocks — tabel (R7.1, Azure prebuilt-layout)", () => {
  type TNode = {
    type: string;
    content?: TNode[];
    attrs?: Record<string, unknown>;
    text?: string;
  };
  const cellText = (cell: TNode): string =>
    textOf((cell.content?.[0]?.content ?? []) as unknown);

  it("grilă cu antet → table > tableRow > tableHeader/tableCell", () => {
    const blocks = sectionToBlocks({
      type: "table",
      headerRows: 1,
      rows: [
        ["Parameter", "Einheit", "Ergebnis", "Verfahren"],
        ["pH", "-", "7.2", "DIN 38404"],
        ["Chlor", "mg/l", "0.05", "DIN EN ISO"],
      ],
    }) as TNode[];
    expect(blocks).toHaveLength(1);
    const table = blocks[0];
    expect(table.type).toBe("table");
    expect(table.content).toHaveLength(3); // 3 rânduri
    const headerCells = table.content![0].content!;
    expect(headerCells.every((c) => c.type === "tableHeader")).toBe(true);
    expect(headerCells).toHaveLength(4);
    expect(cellText(headerCells[0])).toBe("Parameter");
    const bodyCells = table.content![1].content!;
    expect(bodyCells.every((c) => c.type === "tableCell")).toBe(true);
    expect(cellText(bodyCells[2])).toBe("7.2");
  });

  it("rânduri neuniforme → grilă dreptunghiulară (celule goale valide)", () => {
    const blocks = sectionToBlocks({
      type: "table",
      rows: [["a", "b", "c"], ["x"]],
    }) as TNode[];
    const table = blocks[0];
    expect(table.content![1].content).toHaveLength(3); // completat la 3 coloane
    // Celula lipsă = paragraf gol valid (block+), nu undefined.
    const filler = table.content![1].content![2];
    expect(filler.content?.[0]?.type).toBe("paragraph");
  });

  it("fără headerRows → toate celulele = tableCell", () => {
    const blocks = sectionToBlocks({
      type: "table",
      rows: [["1", "2"]],
    }) as TNode[];
    expect(
      blocks[0].content![0].content!.every((c) => c.type === "tableCell"),
    ).toBe(true);
  });

  it("tabel gol → marcaj onest, nu nod de tabel invalid", () => {
    const blocks = sectionToBlocks({ type: "table", rows: [] }) as TNode[];
    expect(blocks[0].type).toBe("paragraph");
  });
});

describe("sectionToBlocks — ordine multi-coloană (R7.3)", () => {
  // Structura REALĂ din IMG-WA0001 (diagnostic Gemini): itemii a-f împărțiți pe
  // coloane vizuale — a,d stânga; b,c,e,f dreapta. Aplatizarea naivă = a,d,b,c,e,f.
  it("itemi a)-f) pe coloane → ordine naturală a,b,c,d,e,f", () => {
    const blocks = sectionToBlocks({
      type: "two_column",
      left: [
        { type: "paragraph", content: "a) $\\frac{7}{2n-1}$" },
        { type: "paragraph", content: "d) $\\frac{11}{n-2}$" },
      ],
      right: [
        { type: "paragraph", content: "b) $\\frac{5}{n}$" },
        { type: "paragraph", content: "c) $\\frac{9}{n+1}$" },
        { type: "paragraph", content: "e) $\\frac{17}{3n+1}$" },
        { type: "paragraph", content: "f) $\\frac{12}{n+11}$" },
      ],
    });
    const letters = blocks
      .map((b) => textOf(b.content).trim().charAt(0))
      .filter((ch) => /[a-f]/.test(ch));
    expect(letters).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("itemi numerici 1./2./3. pe coloane → ordine 1,2,3", () => {
    const blocks = sectionToBlocks({
      type: "two_column",
      left: [{ type: "paragraph", content: "1. unu" }],
      right: [
        { type: "paragraph", content: "2. doi" },
        { type: "paragraph", content: "3. trei" },
      ],
    });
    expect(blocks.map((b) => textOf(b.content).trim())).toEqual([
      "1. unu",
      "2. doi",
      "3. trei",
    ]);
  });

  it("REGRESIE: pași de construcție ($P_1$/figuri) NU se reordonează (ordine vizuală)", () => {
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
    // Stânga întâi (P1) apoi dreapta (P2) — neschimbat.
    expect(mathOf(blocks[0].content)).toEqual(["P_1", "[AB]"]);
    expect(blocks.filter((b) => b.type === "image")).toHaveLength(2);
  });
});

describe("fixTruncatedMathAlnum — litere-math trunchiate din PDF stricat (SEV1)", () => {
  it("Math-Italic trunchiat la Hangul → ASCII (∢푀푂푃 → ∢MOP)", () => {
    expect(fixTruncatedMathAlnum("∢푀푂푃.")).toBe("∢MOP.");
    // 푥 (U+D465) → x ; 푖 (U+D456) → i
    expect(fixTruncatedMathAlnum("2푥° - 40° ș푖")).toBe("2x° - 40° și");
  });

  it("text normal (diacritice, ℕℝ, ², °, cifre) rămâne NEATINS", () => {
    const s = "Text cu ș ț â î ă, ℕ ℝ ∢ 90° x² și 123";
    expect(fixTruncatedMathAlnum(s)).toBe(s);
  });

  it("parseInlineToNodes aplică reparația (garbaj → text lizibil)", () => {
    const nodes = parseInlineToNodes("Unghiul ∢푀푂푃 este drept");
    expect(textOf(nodes)).toBe("Unghiul ∢MOP este drept");
  });
});

describe("figure caption cu $latex$ (SEV2)", () => {
  it("caption cu formulă → nod math, NU text brut cu `$`", () => {
    const blocks = sectionToBlocks({
      type: "figure",
      img_b64: "AAA",
      caption: "Unghi MNY cu $m(\\angle MNy) = 60^\\circ$",
    });
    // blocks[0] = imaginea, blocks[1] = caption-ul parsat
    const cap = blocks[1];
    expect(cap.type).toBe("paragraph");
    expect(mathOf(cap.content)).toEqual(["m(\\angle MNy) = 60^\\circ"]);
    // NU mai apare `$` brut în text
    expect(textOf(cap.content)).not.toContain("$");
  });
});

describe("filtru zgomot — cifre izolate (randuri 1 fantoma, limite)", () => {
  it("paragrafe care sunt DOAR o cifră → eliminate; restul păstrat", () => {
    const blocks = sectionToBlocks({
      type: "paragraph",
      content: "1\n1\na) $\\lim_{x\\to\\infty} x$\n1\nb) $\\lim x$",
    });
    // cele 3 „1" dispar; rămân a) și b)
    expect(blocks).toHaveLength(2);
    // D: \lim standalone (etichetă scurtă + formulă, nimic altceva) → \displaystyle
    expect(mathOf(blocks[0].content)).toEqual([
      "\\displaystyle \\lim_{x\\to\\infty} x",
    ]);
    expect(textOf(blocks[0].content)).toContain("a)");
    expect(mathOf(blocks[1].content)).toEqual(["\\displaystyle \\lim x"]);
  });

  it("NU elimina cifre in context (90 grade sau 12 puncte)", () => {
    const blocks = sectionToBlocks({
      type: "paragraph",
      content: "90°\n12 puncte",
    });
    expect(blocks).toHaveLength(2);
  });
});

describe("D — \\lim standalone → \\displaystyle (repro Screenshot (260).png)", () => {
  it("etichetă literă + formulă (fără alt text) → prefix \\displaystyle", () => {
    const blocks = sectionToBlocks({
      type: "list",
      content: "a) $\\lim_{x\\to\\infty}\\frac{1+2x+x^2}{1+3x+x^2}$",
    });
    expect(mathOf(blocks[0].content)).toEqual([
      "\\displaystyle \\lim_{x\\to\\infty}\\frac{1+2x+x^2}{1+3x+x^2}",
    ]);
  });

  it("etichetă combinată „1. a)” + formulă → prefix \\displaystyle", () => {
    const blocks = sectionToBlocks({
      type: "list",
      content: "1. a) $\\lim_{x\\to 1}\\frac{x-1}{x^2+x-2}$",
    });
    expect(mathOf(blocks[0].content)).toEqual([
      "\\displaystyle \\lim_{x\\to 1}\\frac{x-1}{x^2+x-2}",
    ]);
  });

  it("formulă fără nicio etichetă (linie goală înainte) → tot prefix \\displaystyle", () => {
    const blocks = sectionToBlocks({
      type: "paragraph",
      content: "$\\lim_{n\\to\\infty} a_n$",
    });
    expect(mathOf(blocks[0].content)).toEqual([
      "\\displaystyle \\lim_{n\\to\\infty} a_n",
    ]);
  });

  it("\\lim MENȚIONAT ÎN PROZĂ (text substanțial înainte) → NEATINS, rămâne inline", () => {
    const blocks = sectionToBlocks({
      type: "paragraph",
      content: "Dacă șirul are $\\lim_{n\\to\\infty} a_n = L$",
    });
    expect(mathOf(blocks[0].content)).toEqual(["\\lim_{n\\to\\infty} a_n = L"]);
  });

  it("\\lim urmat de text (concluzie de propoziție) → NEATINS", () => {
    const blocks = sectionToBlocks({
      type: "paragraph",
      content: "a) $\\lim_{x\\to 0} f(x) = 5$ deci funcția e continuă",
    });
    expect(mathOf(blocks[0].content)).toEqual(["\\lim_{x\\to 0} f(x) = 5"]);
  });

  it("deja are \\displaystyle → nu se dublează", () => {
    const blocks = sectionToBlocks({
      type: "list",
      content: "a) $\\displaystyle\\lim_{x\\to 0} f(x)$",
    });
    expect(mathOf(blocks[0].content)).toEqual([
      "\\displaystyle\\lim_{x\\to 0} f(x)",
    ]);
  });

  it("\\liminf / \\limsup / \\limits — NU sunt \\lim, rămân NEATINSE", () => {
    const liminf = sectionToBlocks({
      type: "list",
      content: "a) $\\liminf_{n\\to\\infty} a_n$",
    });
    expect(mathOf(liminf[0].content)).toEqual(["\\liminf_{n\\to\\infty} a_n"]);

    const limsup = sectionToBlocks({
      type: "list",
      content: "b) $\\limsup_{n\\to\\infty} a_n$",
    });
    expect(mathOf(limsup[0].content)).toEqual(["\\limsup_{n\\to\\infty} a_n"]);
  });

  it("formulă standalone FĂRĂ \\lim (ex. fracție simplă) → NEATINSĂ (fix scoped la \\lim)", () => {
    const blocks = sectionToBlocks({
      type: "list",
      content: "a) $\\frac{1}{2}$",
    });
    expect(mathOf(blocks[0].content)).toEqual(["\\frac{1}{2}"]);
  });

  // Payload REAL /api/ocr pe limite_matematica.jpeg (verificat 2026-08-09, curl direct
  // pe traduceri-api.vercel.app — vezi finding_ocr_map_inline_vs_displaystyle_2026_08_09).
  // Copiat ca literal (nu citit din scratchpad, care e efemer/netrackuit prin
  // conventie si n-ar supravietui unui checkout curat in CI) — spatiile din jurul
  // `\to`/`+`/`-` sunt
  // EXACT cum le emite Gemini (diferit de restul testelor, scrise fara spatii).
  it("REGRESIE — payload OCR real (toate 9 limitele a-i) primesc \\displaystyle", () => {
    const blocks = sectionToBlocks({
      type: "list",
      content:
        "a) $\\lim_{x \\to \\infty} \\frac{1 + 2x + x^2}{1 + 3x + x^2}$\n" +
        "b) $\\lim_{x \\to 1} \\frac{x - 1}{x^2 + x - 2}$\n" +
        "c) $\\lim_{x \\to -2} \\frac{x^2 + x - 2}{x^4 - 16}$\n" +
        "d) $\\lim_{x \\to 1} \\frac{\\sqrt{6x + 3} - \\sqrt{8x + 1}}{x^2 + 3x - 4}$\n" +
        "e) $\\lim_{x \\to -\\infty} \\frac{2 + x}{\\sqrt{x^2 + 4}}$\n" +
        "f) $\\lim_{x \\to \\infty} (x - \\sqrt[3]{x^3 - x^2 + 6x - 5})$\n" +
        "g) $\\lim_{x \\to \\infty} \\frac{\\sin 13x}{x}$\n" +
        "h) $\\lim_{x \\to 2} \\frac{\\sin (x^3 - 8)}{x - 2}$\n" +
        "i) $\\lim_{x \\to -1} \\frac{2}{(x + 1)(x^2 - 1)}$",
    });
    expect(blocks).toHaveLength(9);
    for (const b of blocks) {
      const math = mathOf(b.content);
      expect(math).toHaveLength(1);
      expect(math[0]).toMatch(/^\\displaystyle \\lim/);
    }
  });
});
