import {
  CLASSES,
  DIFFICULTIES,
  ITEM_TYPES,
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

  it("ITEM_TYPES conține cele 5 tipuri, inclusiv cele cerute", () => {
    const keys = ITEM_TYPES.map((t) => t.key);
    expect(keys).toEqual([
      "grila",
      "completare",
      "probleme",
      "adevfals",
      "corespondenta",
    ]);
    expect(ITEM_TYPES.every((t) => t.label && t.instr)).toBe(true);
  });

  it("buildGeneratePrompt: total = suma tipurilor selectate; tipurile cu n=0 sunt excluse", () => {
    const p = buildGeneratePrompt("VII", "Ecuații", "mediu", false, [
      { key: "grila", n: 5 },
      { key: "completare", n: 0 },
      { key: "probleme", n: 2 },
    ]);
    expect(p).toContain("clasa a VII-a");
    expect(p).toContain("Ecuații");
    expect(p).toContain("7 itemi"); // 5 + 2
    expect(p).toContain("mediu");
    expect(p).toMatch(/alegere multipl/i);
    expect(p).toMatch(/rezolvare de probleme/i);
    expect(p).not.toMatch(/completare/i); // n=0 → exclus (și fără barem)
    expect(p).toMatch(/NU include r[ăa]spunsurile/i);
  });

  it("buildGeneratePrompt: baremul acoperă toate tipurile de răspuns", () => {
    const withAns = buildGeneratePrompt("VII", "Ecuații", "mediu", true, [
      { key: "grila", n: 3 },
      { key: "adevfals", n: 2 },
      { key: "corespondenta", n: 1 },
    ]);
    expect(withAns).toMatch(/Barem/i);
    expect(withAns).toContain("6 itemi");
    expect(withAns).toMatch(/adev[ăa]rat\/fals/i);
    expect(withAns).toMatch(/coresponden/i);
  });

  it("buildGeneratePrompt: fallback la 5 probleme dacă nimic nu e selectat", () => {
    const p = buildGeneratePrompt("V", "x", "ușor", false, []);
    expect(p).toContain("5 itemi");
    expect(p).toMatch(/rezolvare de probleme/i);
  });

  it("buildGeneratePrompt: clamp la 15 itemi per tip", () => {
    const p = buildGeneratePrompt("V", "x", "ușor", false, [
      { key: "grila", n: 999 },
    ]);
    expect(p).toContain("15 itemi");
  });

  it("buildCorrectPrompt include textul OCR + cerința de notă", () => {
    const p = buildCorrectPrompt("2x+3=11 => x=5");
    expect(p).toContain("2x+3=11 => x=5");
    expect(p).toMatch(/not[ăa]/i);
  });
});
