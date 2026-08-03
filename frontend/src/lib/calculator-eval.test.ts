import {
  normalizeExpr,
  evaluateExpr,
  samplePoints,
  plotToSvg,
} from "./calculator-eval";

describe("calculator-eval · normalizeExpr", () => {
  it("radical √(...) și √<atom>", () => {
    expect(normalizeExpr("√(6x+3)")).toBe("sqrt(6x+3)");
    expect(normalizeExpr("√9")).toBe("sqrt(9)");
    expect(normalizeExpr("√x")).toBe("sqrt(x)");
  });
  it("ln→log (natural), log→log10 (zecimal), ordinea corectă", () => {
    expect(normalizeExpr("ln(2)")).toBe("log(2)");
    expect(normalizeExpr("log(100)")).toBe("log10(100)");
    // ambele într-o expresie: ln rămâne natural, log devine zecimal
    expect(normalizeExpr("ln(2)+log(100)")).toBe("log(2)+log10(100)");
  });
  it("tg→tan, π→pi, operatori Unicode", () => {
    expect(normalizeExpr("tg(0)")).toBe("tan(0)");
    expect(normalizeExpr("2π")).toBe("2pi");
    expect(normalizeExpr("3×4÷2")).toBe("3*4/2");
  });
});

describe("calculator-eval · evaluateExpr", () => {
  it("aritmetică + puteri", () => {
    expect(evaluateExpr("2^10").ok && evaluateExpr("2^10")).toMatchObject({
      value: "1024",
    });
    const r = evaluateExpr("2^10 + 4");
    expect(r).toEqual({ ok: true, value: "1028" });
  });
  it("radical + funcții trig (notație școlară)", () => {
    const r1 = evaluateExpr("√16");
    expect(r1.ok && parseFloat(r1.value)).toBe(4);
    const r2 = evaluateExpr("sin(π/6)");
    expect(r2.ok && parseFloat(r2.value)).toBeCloseTo(0.5, 6);
    const r3 = evaluateExpr("log(1000)"); // zecimal → 3
    expect(r3.ok && parseFloat(r3.value)).toBeCloseTo(3, 9);
  });
  it("matrice: determinant, produs, inversă", () => {
    expect(evaluateExpr("det([[1,2],[3,4]])")).toEqual({
      ok: true,
      value: "-2",
    });
    const inv = evaluateExpr("inv([[1,2],[3,4]])");
    expect(inv.ok).toBe(true);
  });
  it("gol → ok:false fără eroare; garbaj → ok:false cu eroare", () => {
    expect(evaluateExpr("")).toEqual({ ok: false, error: "" });
    const bad = evaluateExpr("2 +* 3");
    expect(bad.ok).toBe(false);
  });
});

describe("calculator-eval · samplePoints + plotToSvg", () => {
  it("eșantionează f(x)=x^2 (finit) și 1/x (null la 0)", () => {
    const p = samplePoints("x^2", -2, 2, 4); // x = -2,-1,0,1,2
    const at0 = p.find((q) => Math.abs(q.x) < 1e-9);
    expect(at0?.y).toBe(0);
    const at2 = p.find((q) => Math.abs(q.x - 2) < 1e-9);
    expect(at2?.y).toBe(4);
    const inv = samplePoints("1/x", -1, 1, 2); // include x=0 → Infinity → null
    const invAt0 = inv.find((q) => Math.abs(q.x) < 1e-9);
    expect(invAt0?.y).toBeNull();
  });
  it("plotToSvg produce SVG valid cu polilinie; fără funcții → doar cadru/axe", () => {
    const svg = plotToSvg([{ expr: "x^2 - 3", color: "#2563eb" }]);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("<polyline");
    expect(svg.endsWith("</svg>")).toBe(true);
    const empty = plotToSvg([]);
    expect(empty.startsWith("<svg")).toBe(true);
    expect(empty).not.toContain("<polyline");
  });
});
