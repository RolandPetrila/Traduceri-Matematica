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

const cell = (text: string): JSONContent => ({
  type: "tableCell",
  attrs: { colspan: 1, rowspan: 1 },
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

const DOC_WITH_TABLE: JSONContent = {
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
          content: [cell("Unghiul"), cell("Măsura")],
        },
        {
          type: "tableRow",
          content: [
            cell("Ascuțit"),
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
    extractTranslatable(DOC_WITH_TABLE);

  it("textul din celule INTRĂ efectiv la traducere", () => {
    expect(sections).toContain("Unghiul");
    expect(sections).toContain("Măsura");
    expect(sections).toContain("Ascuțit");
  });

  it("paragraful din afara tabelului e tradus la fel", () => {
    expect(sections).toContain("Tabel de valori");
  });

  it("formula dintr-o celulă pleacă protejată ca `$latex$`, nu ca text liber", () => {
    const withFormula = sections.find((s) => s.includes("$"));
    expect(withFormula).toBe("mai mic de $90^\\circ$");
  });

  it("reconstrucția păstrează STRUCTURA tabelului (R-LAYOUT)", () => {
    const translated = sections.map((s) =>
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
    const result = rebuildTranslated(skeleton, translated, mathInlineType);

    const table = result.content!.find((n) => n.type === "table")!;
    expect(table).toBeDefined();
    expect(table.content).toHaveLength(2); // două rânduri
    expect(table.content![0].content).toHaveLength(2); // două celule
    expect(table.content![0].content![0].type).toBe("tableCell");
    expect(table.content![0].content![0].attrs).toEqual({
      colspan: 1,
      rowspan: 1,
    });
  });

  it("textul tradus ajunge ÎN celule, iar formula rămâne intactă (R-MATH)", () => {
    const translated = sections.map((s) =>
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
    const result = rebuildTranslated(skeleton, translated, mathInlineType);
    const serialized = JSON.stringify(result);

    expect(serialized).toContain("Uhol");
    expect(serialized).toContain("Ostrý");
    // Formula NU se traduce și nu se transformă în text.
    expect(serialized).toContain('"latex":"90^\\\\circ"');
    expect(serialized).not.toContain("$90");
  });
});
