import { getCycle, getLevel, getNode } from "./curriculum";
import { buildScolarePrompt } from "./prompt";
import {
  signature,
  isDuplicate,
  record,
  bucketKey,
  avoidList,
  extractStems,
  clearHistory,
} from "./history";
import { verifyArithmetic } from "./verify-fisa";

const pilot = () => ({
  cycle: getCycle("gimnaziu")!,
  level: getLevel("gimnaziu", "clasa-5")!,
  node: getNode("gimnaziu", "clasa-5", "matematica")!,
});

describe("buildScolarePrompt (pilot Clasa 5 Matematică)", () => {
  test("include clasa, materia, dificultatea, nr exerciții", () => {
    const p = pilot();
    const prompt = buildScolarePrompt({
      ...p,
      dificultate: "Standard",
      nrExercitii: 6,
    });
    expect(prompt).toContain("Clasa a V-a");
    expect(prompt).toContain("Matematică");
    expect(prompt).toContain("Standard");
    expect(prompt).toContain("6 exerciții");
  });

  test("include capitolele din programa oficială + excerpt de regulament", () => {
    const p = pilot();
    const prompt = buildScolarePrompt({
      ...p,
      dificultate: "Ușor",
      regulament: "REGULA-TEST: doar puteri și fracții.",
    });
    expect(prompt).toContain("Divizibilitate");
    expect(prompt).toContain("REGULA-TEST");
  });

  test("include lista de evitat + cerința specifică", () => {
    const p = pilot();
    const prompt = buildScolarePrompt({
      ...p,
      dificultate: "Standard",
      avoid: ["2^5 = ?", "transformă 1,25"],
      cerintaSpecifica: "doar exerciții cu puteri",
    });
    expect(prompt).toContain("EVITĂ");
    expect(prompt).toContain("2^5 = ?");
    expect(prompt).toContain("doar exerciții cu puteri");
  });

  test("nod in_reforma → avertisment de reformă", () => {
    const prompt = buildScolarePrompt({
      cycle: getCycle("liceu")!,
      level: getLevel("liceu", "clasa-11")!,
      node: getNode("liceu", "clasa-11", "matematica")!,
      dificultate: "Standard",
    });
    expect(prompt.toLowerCase()).toContain("reform");
  });
});

describe("anti-repetare (semnătură + istoric)", () => {
  beforeEach(() => clearHistory());

  test("semnătura e deterministă și ignoră baremul", () => {
    const a = "Fișă\n1. cât e 2+2?\n\nBarem\n1. 4";
    const b = "Fișă\n1. cât e 2+2?\n\nBarem\n1. patru"; // barem diferit
    const c = "Fișă\n1. cât e 3+3?\n\nBarem\n1. 6"; // enunț diferit
    expect(signature(a)).toBe(signature(b));
    expect(signature(a)).not.toBe(signature(c));
  });

  test("isDuplicate devine true după record; re-roll evită", () => {
    const bucket = bucketKey("gimnaziu", "clasa-5", "matematica");
    const fisa = "1. 2^5 = ?\n2. 1,25 = ?";
    const sig = signature(fisa);
    expect(isDuplicate(bucket, sig)).toBe(false);
    record(bucket, sig, extractStems(fisa));
    expect(isDuplicate(bucket, sig)).toBe(true);
    // enunțurile salvate apar în lista de evitat
    expect(avoidList(bucket).join(" ")).toContain("2^5");
  });

  test("extractStems ia enunțurile numerotate", () => {
    const stems = extractStems("Titlu\n1. primul\n2. al doilea\nBarem\n1. x");
    expect(stems).toEqual(["primul", "al doilea"]);
  });
});

describe("verificare aritmetică (D7)", () => {
  test("operații corecte → 0 probleme", () => {
    const r = verifyArithmetic("1. 2 + 3 = 5\n2. 10 : 2 = 5\n3. 4 × 3 = 12");
    expect(r.checked).toBe(3);
    expect(r.issues).toEqual([]);
  });

  test("operație greșită → semnalată", () => {
    const r = verifyArithmetic("2 + 2 = 5");
    expect(r.issues.length).toBe(1);
    expect(r.issues[0].expected).toBe(4);
    expect(r.issues[0].found).toBe(5);
  });

  test("puteri: ^ și superscript unicode", () => {
    expect(verifyArithmetic("2^5 = 32").issues).toEqual([]);
    expect(verifyArithmetic("2⁵ = 32").issues).toEqual([]);
    expect(verifyArithmetic("2⁵ = 30").issues.length).toBe(1);
  });

  test("zecimale românești (virgulă)", () => {
    expect(verifyArithmetic("1,5 + 2,5 = 4").issues).toEqual([]);
    expect(verifyArithmetic("1,5 + 2,5 = 5").issues.length).toBe(1);
  });

  test("egalitate ÎNLĂNȚUITĂ nu dă fals-pozitiv (bug prins la proba LIVE)", () => {
    // „b + 10 = 20 + 10 = 30" ancora greșit lookbehind-ul la „0 + 10 = 30".
    expect(verifyArithmetic("c = b + 10 = 20 + 10 = 30").issues).toEqual([]);
    expect(verifyArithmetic("2 + 3 + 4 = 9").issues).toEqual([]); // sumă lanț, nu „3+4=9"
  });

  test("lanț de puteri cu „⋅” (DOT OPERATOR U+22C5) nu dă fals-pozitiv (bug prins la proba LIVE, F1 Clasa 6)", () => {
    // Gemini randează \cdot ca U+22C5, nu U+00B7 — CHAIN nu-l recunoștea, deci
    // „5^1=2" (mijlocul lanțului „...5^1=2⋅3⋅5=30") era verificat izolat și greșit semnalat.
    expect(
      verifyArithmetic("c.m.m.d.c.(90,120)=2^1⋅3^1⋅5^1=2⋅3⋅5=30").issues,
    ).toEqual([]);
    expect(
      verifyArithmetic("c.m.m.m.c.(90,120)=2^3⋅3^2⋅5^1=8⋅9⋅5=360").issues,
    ).toEqual([]);
  });

  test("lanț de puteri cu LaTeX brut (\\cdot) nu dă fals-pozitiv — aceeași clasă de bug, mecanism diferit", () => {
    // raw text-ul AI poate fi LaTeX NEprocesat (verificat prin capturarea răspunsului
    // real /api/proxy la o probă live F1): un lanț ca „5^1 = 2 \cdot 3 \cdot 5 = 30"
    // are backslash imediat după „2", nu glifa „⋅" — CHAIN fără „\" nu-l recunoștea.
    expect(
      verifyArithmetic(
        "c.m.m.d.c.(90,120)=2^1 \\cdot 3^1 \\cdot 5^1 = 2 \\cdot 3 \\cdot 5 = 30",
      ).issues,
    ).toEqual([]);
  });

  test("listă numerotată multi-rând nu confundă numărul liniei următoare", () => {
    const r = verifyArithmetic("1. 2 + 3 = 5\n2. 10 : 2 = 5");
    expect(r.checked).toBe(2);
    expect(r.issues).toEqual([]);
  });
});
