import { norm } from "./math-input";

/**
 * Protejează fix-ul radical (2026-07-26): un `√5` fără paranteze trebuie să
 * devină `\sqrt{5}` (cu vinculum), NU să rămână glif Unicode (fără linie) — cauza
 * bug-ului „radical incomplet în limită" (screenshot 227).
 */
describe("norm() — intrare prietenoasă → LaTeX", () => {
  it("radical fără paranteze → \\sqrt{...}", () => {
    expect(norm("√5")).toBe("\\sqrt{5}");
    expect(norm("√x")).toBe("\\sqrt{x}");
    expect(norm("√25")).toBe("\\sqrt{25}");
  });

  it("radical cu paranteze (radicand cu mai mulți termeni)", () => {
    expect(norm("√(6x+3)")).toBe("\\sqrt{6x+3}");
    expect(norm("sqrt(2+3)")).toBe("\\sqrt{2+3}");
  });

  it("radicali de ordin 3 și 4 (∛ ∜)", () => {
    expect(norm("∛8")).toBe("\\sqrt[3]{8}");
    expect(norm("∜16")).toBe("\\sqrt[4]{16}");
  });

  it("radical în numărătorul unei limite rămâne cu vinculum", () => {
    // Exact cazul din screenshot 227: √5 în corpul limitei.
    const body = norm("√5");
    expect(body).toContain("\\sqrt{5}");
    expect(body).not.toMatch(/√/); // niciun glif Unicode rămas
  });

  it("puteri și indici (² ³ ₁ ₙ)", () => {
    expect(norm("x²")).toBe("x^2");
    expect(norm("a₁")).toBe("a_1");
    expect(norm("xⁿ")).toBe("x^n");
  });

  it("simboluri uzuale (∞ · × ÷ ≤ ≥ ≠ ± π)", () => {
    expect(norm("∞")).toBe("\\infty");
    expect(norm("a·b")).toBe("a\\cdot b");
    expect(norm("a×b")).toBe("a\\times b");
    expect(norm("a÷b")).toBe("a\\div b");
    expect(norm("x≤y")).toBe("x\\le y");
    expect(norm("x≥y")).toBe("x\\ge y");
    expect(norm("x≠y")).toBe("x\\ne y");
    expect(norm("±π")).toBe("\\pm \\pi");
  });

  it("idempotentă pe LaTeX deja corect", () => {
    expect(norm("\\dfrac{1}{2}")).toBe("\\dfrac{1}{2}");
    expect(norm("\\sqrt[3]{x}")).toBe("\\sqrt[3]{x}");
    expect(norm("\\lim\\limits_{x\\to a} f(x)")).toBe(
      "\\lim\\limits_{x\\to a} f(x)",
    );
  });
});
