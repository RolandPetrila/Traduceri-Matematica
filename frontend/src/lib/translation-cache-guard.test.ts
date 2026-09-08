/**
 * FAZA 2 — regresie pentru „cache-ul servește traducerea veche după ce editezi sursa".
 * Scenariul real: traduce SK → revine RO → corectează → apasă SK → primea versiunea
 * veche, fără corectură, fără mesaj. Găsit live de auditorul de dovezi, 08.09.2026.
 */

import { pruneStaleTranslations } from "./translation-cache-guard";

const doc = (t: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: t }] }],
});

function cacheCu(ro: string, sk?: string, en?: string) {
  const m = new Map<string, ReturnType<typeof doc>>();
  m.set("ro", doc(ro));
  if (sk) m.set("sk", doc(sk));
  if (en) m.set("en", doc(en));
  return m;
}

describe("pruneStaleTranslations", () => {
  it("SCENARIUL REAL: sursa editată → traducerile vechi sunt aruncate, sursa rămâne", () => {
    const c = cacheCu("Unghiul drept", "Pravý uhol", "Right angle");
    const cheiaVeche = JSON.stringify(doc("Unghiul drept"));
    const cheiaNoua = JSON.stringify(doc("Unghiul drept are 90 de grade"));

    const aruncate = pruneStaleTranslations(c, "ro", cheiaNoua, cheiaVeche);

    expect(aruncate).toBe(2);
    expect(c.has("sk")).toBe(false);
    expect(c.has("en")).toBe(false);
    expect(c.get("ro")).toEqual(doc("Unghiul drept"));
  });

  it("sursa NEschimbată → nimic aruncat (traducerile din cache rămân instant, fără cotă DeepL)", () => {
    const c = cacheCu("Unghiul drept", "Pravý uhol");
    const cheie = JSON.stringify(doc("Unghiul drept"));
    expect(pruneStaleTranslations(c, "ro", cheie, cheie)).toBe(0);
    expect(c.has("sk")).toBe(true);
  });

  it("fără traduceri anterioare (builtFromKey null) → nimic de aruncat", () => {
    const c = cacheCu("Unghiul drept");
    expect(pruneStaleTranslations(c, "ro", "orice", null)).toBe(0);
    expect(c.size).toBe(1);
  });

  it("editările făcute ÎN limba-țintă (R-EDIT) supraviețuiesc cât timp sursa nu se schimbă", () => {
    const c = cacheCu("Unghiul drept", "Pravý uhol — corectat de Cristina");
    const cheie = JSON.stringify(doc("Unghiul drept"));
    pruneStaleTranslations(c, "ro", cheie, cheie);
    expect(c.get("sk")).toEqual(doc("Pravý uhol — corectat de Cristina"));
  });
});
