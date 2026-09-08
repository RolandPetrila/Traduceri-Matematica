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

  it("DUPĂ RELOAD: traducerea restaurată se aruncă dacă sursa a fost corectată", () => {
    // Regresia care a scăpat prima dată (confirmată LIVE pe v63 de auditorul de
    // dovezi): după reload, provenienţa traducerii afișate era necunoscută
    // (`builtFromKey = null`), guardul ieșea imediat, iar vederea tradusă intra în
    // cache ca valabilă pentru orice sursă. Cristina traduce, închide, revine a
    // doua zi, corectează o formulă, apasă SK ⇒ primea traducerea VECHE.
    //
    // Acum, la restaurare, `builtFromKey` = cheia instantaneului salvat în clipa
    // plecării din limba-sursă. Deci corectura de a doua zi îl invalidează.
    const sursaSalvata = doc("Unghiul drept");
    const cheiaInstantaneu = JSON.stringify(sursaSalvata);

    // starea de după reload: sursa din instantaneu + vederea SK restaurată
    const c = new Map<string, ReturnType<typeof doc>>();
    c.set("ro", sursaSalvata);
    c.set("sk", doc("Pravý uhol"));

    // Cristina corectează originalul, apoi apasă SK.
    const sursaCorectata = JSON.stringify(doc("Unghiul drept are 90 de grade"));
    const aruncate = pruneStaleTranslations(
      c,
      "ro",
      sursaCorectata,
      cheiaInstantaneu,
    );

    expect(aruncate).toBe(1);
    expect(c.has("sk")).toBe(false); // se retraduce, cu corectură
    expect(c.has("ro")).toBe(true);
  });

  it("DUPĂ RELOAD, fără corectură: traducerea restaurată rămâne (fără cotă DeepL irosită)", () => {
    const sursaSalvata = doc("Unghiul drept");
    const cheia = JSON.stringify(sursaSalvata);
    const c = new Map<string, ReturnType<typeof doc>>();
    c.set("ro", sursaSalvata);
    c.set("sk", doc("Pravý uhol"));

    expect(pruneStaleTranslations(c, "ro", cheia, cheia)).toBe(0);
    expect(c.get("sk")).toEqual(doc("Pravý uhol"));
  });

  it("editările făcute ÎN limba-țintă (R-EDIT) supraviețuiesc cât timp sursa nu se schimbă", () => {
    const c = cacheCu("Unghiul drept", "Pravý uhol — corectat de Cristina");
    const cheie = JSON.stringify(doc("Unghiul drept"));
    pruneStaleTranslations(c, "ro", cheie, cheie);
    expect(c.get("sk")).toEqual(doc("Pravý uhol — corectat de Cristina"));
  });
});
