import { extractTranslatable, rebuildTranslated } from "./editor-translate";
import type { JSONContent } from "@tiptap/core";

/**
 * Gate F8 (2026-07-29): extract→rebuild trebuie să păstreze STRUCTURA + FORMULELE +
 * MARCAJELE. Testăm fără server: identitate (rebuild cu aceleași secțiuni = doc original)
 * + traducere simulată (uppercase pe text, `$…$` intact) + gardă `|||SEP|||`.
 */

const p = (...content: JSONContent[]): JSONContent => ({
  type: "paragraph",
  content,
});
const t = (text: string, marks?: JSONContent["marks"]): JSONContent =>
  marks ? { type: "text", text, marks } : { type: "text", text };
const math = (latex: string): JSONContent => ({
  type: "inlineMath",
  attrs: { latex },
});
const doc = (...content: JSONContent[]): JSONContent => ({
  type: "doc",
  content,
});

/** Simulează traducerea: uppercase pe text, dar `$…$` rămâne intact (ca math_protect). */
function fakeTranslate(sections: string[]): string[] {
  return sections.map((s) =>
    s.replace(/(\$[^$]*\$)|([^$]+)/g, (_m, mth, txt) =>
      mth ? mth : (txt as string).toUpperCase(),
    ),
  );
}

describe("editor-translate — extract/rebuild păstrează structura", () => {
  it("identitate: rebuild cu aceleași secțiuni = documentul original", () => {
    const d = doc(
      { type: "heading", attrs: { level: 1 }, content: [t("Titlu")] },
      p(t("Fie "), math("x^2"), t(" un număr pozitiv.")),
    );
    const { sections, skeleton, mathInlineType } = extractTranslatable(d);
    const back = rebuildTranslated(skeleton, sections, mathInlineType);
    expect(back).toEqual(d);
  });

  it("formula inline supraviețuiește traducerii (R-MATH)", () => {
    const d = doc(p(t("Aria este "), math("\\pi r^2"), t(" totdeauna.")));
    const { sections, skeleton, mathInlineType } = extractTranslatable(d);
    // formula e în secțiune ca $latex$
    expect(sections[0]).toContain("$\\pi r^2$");
    const back = rebuildTranslated(
      skeleton,
      fakeTranslate(sections),
      mathInlineType,
    );
    const para = back.content![0];
    const mathNode = para.content!.find((n) => n.type === "inlineMath");
    expect(mathNode).toBeDefined();
    expect(mathNode!.attrs!.latex).toBe("\\pi r^2"); // NEschimbată
    // textul din jur e „tradus" (uppercase)
    expect(para.content!.map((n) => n.text).join("")).toContain("ARIA ESTE ");
  });

  it("marcajele se păstrează (bold rămâne bold după traducere)", () => {
    const bold = [{ type: "bold" }];
    const d = doc(p(t("normal "), t("îngroșat", bold), t(" iar normal")));
    const { sections, skeleton, mathInlineType } = extractTranslatable(d);
    // 3 segmente (marcaje diferite)
    expect(sections).toHaveLength(3);
    const back = rebuildTranslated(
      skeleton,
      fakeTranslate(sections),
      mathInlineType,
    );
    const runs = back.content![0].content!;
    const boldRun = runs.find((n) => n.marks && n.marks[0]?.type === "bold");
    expect(boldRun).toBeDefined();
    expect(boldRun!.text).toBe("ÎNGROȘAT");
  });

  it("o frază fără marcaje = O singură secțiune (context complet)", () => {
    const d = doc(p(t("Aceasta este o propoziție întreagă fără marcaje.")));
    const { sections } = extractTranslatable(d);
    expect(sections).toHaveLength(1);
  });

  it("tabelele + listele: textul din celule/itemi se extrage, structura rămâne", () => {
    const d = doc({
      type: "bulletList",
      content: [
        { type: "listItem", content: [p(t("primul"))] },
        { type: "listItem", content: [p(t("al doilea"))] },
      ],
    });
    const { sections, skeleton, mathInlineType } = extractTranslatable(d);
    expect(sections).toEqual(["primul", "al doilea"]);
    const back = rebuildTranslated(
      skeleton,
      ["PRIMUL", "AL DOILEA"],
      mathInlineType,
    );
    expect(back.content![0].type).toBe("bulletList");
    expect(back.content![0].content).toHaveLength(2);
  });

  it("conținut cu |||SEP||| supraviețuiește extract→rebuild (fără mangling)", () => {
    const d = doc(p(t("înainte |||SEP||| după")));
    const { sections, skeleton, mathInlineType } = extractTranslatable(d);
    expect(sections[0]).toBe("înainte |||SEP||| după");
    const back = rebuildTranslated(skeleton, sections, mathInlineType);
    expect(back).toEqual(d);
  });

  it("doc gol / doar structură fără text → 0 secțiuni", () => {
    const d = doc({ type: "paragraph" });
    const { sections } = extractTranslatable(d);
    expect(sections).toHaveLength(0);
  });
});
