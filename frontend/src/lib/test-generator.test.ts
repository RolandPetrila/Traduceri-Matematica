import {
  CLASSES,
  DIFFICULTIES,
  classGroups,
  buildGeneratePrompt,
  buildCorrectPrompt,
} from "./test-generator";

describe("test-generator", () => {
  it("CLASSES + DIFFICULTIES", () => {
    expect(CLASSES).toContain("VII");
    expect(DIFFICULTIES).toEqual(["ușor", "mediu", "greu"]);
  });

  it("classGroups întoarce teme reale din bibliotecă pentru o clasă acoperită", () => {
    const g = classGroups("VIII");
    expect(Array.isArray(g)).toBe(true);
    expect(g.length).toBeGreaterThan(0);
    // fără duplicate
    expect(new Set(g).size).toBe(g.length);
  });

  it("buildGeneratePrompt include clasa/tema/nr/dificultate și respectă baremul", () => {
    const p = buildGeneratePrompt("VII", "Ecuații", 8, "mediu", false);
    expect(p).toContain("clasa a VII-a");
    expect(p).toContain("Ecuații");
    expect(p).toContain("8 probleme");
    expect(p).toContain("mediu");
    expect(p).toMatch(/NU include r[ăa]spunsurile/i);
    const withAns = buildGeneratePrompt("VII", "Ecuații", 8, "mediu", true);
    expect(withAns).toMatch(/Barem/i);
  });

  it("buildGeneratePrompt limitează nr. itemi la [1,30]", () => {
    expect(buildGeneratePrompt("V", "x", 999, "ușor", false)).toContain(
      "30 probleme",
    );
    // negativ → clamp la min 1 (0/gol → fallback 5, ca în panou)
    expect(buildGeneratePrompt("V", "x", -5, "ușor", false)).toContain(
      "1 probleme",
    );
    expect(buildGeneratePrompt("V", "x", 0, "ușor", false)).toContain(
      "5 probleme",
    );
  });

  it("buildCorrectPrompt include textul OCR + cerința de notă", () => {
    const p = buildCorrectPrompt("2x+3=11 => x=5");
    expect(p).toContain("2x+3=11 => x=5");
    expect(p).toMatch(/not[ăa]/i);
  });
});
