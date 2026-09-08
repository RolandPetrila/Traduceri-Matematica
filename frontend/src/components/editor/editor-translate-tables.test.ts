/**
 * FAZA 2 (2a — „suport complet, traduce și tabelele").
 *
 * Comentariul din capul lui `editor-translate.ts` susținea că tabelele sunt
 * „păstrate ca noduri (nu intră la traducere)". Parcurgerea recursivă spune
 * altceva: coboară în tableRow → tableCell → paragraph, unde conținutul E inline.
 * Testul de aici tranșează întrebarea cu fapte, în loc s-o lase pe seama unui
 * comentariu — documentația acestui proiect a mai mințit.
 *
 * Verifică și că STRUCTURA tabelului supraviețuiește reconstrucției (R-LAYOUT) și
 * că formulele din celule rămân neatinse (R-MATH).
 */

import { extractTranslatable, rebuildTranslated } from "./editor-translate";
import type { JSONContent } from "@tiptap/core";

const celula = (text: string): JSONContent => ({
  type: "tableCell",
  attrs: { colspan: 1, rowspan: 1 },
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

const DOC_CU_TABEL: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Tabel de valori" }],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [celula("Unghiul"), celula("Măsura")],
        },
        {
          type: "tableRow",
          content: [
            celula("Ascuțit"),
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1 },
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "mai mic de " },
                    { type: "inlineMath", attrs: { latex: "90^\\circ" } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("traducerea tabelelor (decizia 2a)", () => {
  const { sections, skeleton, mathInlineType } =
    extractTranslatable(DOC_CU_TABEL);

  it("textul din celule INTRĂ efectiv la traducere", () => {
    expect(sections).toContain("Unghiul");
    expect(sections).toContain("Măsura");
    expect(sections).toContain("Ascuțit");
  });

  it("paragraful din afara tabelului e tradus la fel", () => {
    expect(sections).toContain("Tabel de valori");
  });

  it("formula dintr-o celulă pleacă protejată ca `$latex$`, nu ca text liber", () => {
    const cuFormula = sections.find((s) => s.includes("$"));
    expect(cuFormula).toBe("mai mic de $90^\\circ$");
  });

  it("reconstrucția păstrează STRUCTURA tabelului (R-LAYOUT)", () => {
    const traduse = sections.map((s) =>
      s === "Unghiul"
        ? "Uhol"
        : s === "Măsura"
          ? "Miera"
          : s === "Ascuțit"
            ? "Ostrý"
            : s === "Tabel de valori"
              ? "Tabuľka hodnôt"
              : s.replace("mai mic de", "menej ako"),
    );
    const rezultat = rebuildTranslated(skeleton, traduse, mathInlineType);

    const tabel = rezultat.content!.find((n) => n.type === "table")!;
    expect(tabel).toBeDefined();
    expect(tabel.content).toHaveLength(2); // două rânduri
    expect(tabel.content![0].content).toHaveLength(2); // două celule
    expect(tabel.content![0].content![0].type).toBe("tableCell");
    expect(tabel.content![0].content![0].attrs).toEqual({
      colspan: 1,
      rowspan: 1,
    });
  });

  it("textul tradus ajunge ÎN celule, iar formula rămâne intactă (R-MATH)", () => {
    const traduse = sections.map((s) =>
      s === "Unghiul"
        ? "Uhol"
        : s === "Măsura"
          ? "Miera"
          : s === "Ascuțit"
            ? "Ostrý"
            : s === "Tabel de valori"
              ? "Tabuľka hodnôt"
              : s.replace("mai mic de", "menej ako"),
    );
    const rezultat = rebuildTranslated(skeleton, traduse, mathInlineType);
    const serializat = JSON.stringify(rezultat);

    expect(serializat).toContain("Uhol");
    expect(serializat).toContain("Ostrý");
    // Formula NU se traduce și nu se transformă în text.
    expect(serializat).toContain('"latex":"90^\\\\circ"');
    expect(serializat).not.toContain("$90");
  });
});
