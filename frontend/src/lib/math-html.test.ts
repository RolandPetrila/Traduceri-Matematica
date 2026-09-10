import { renderMathText, normalizeMathDelimiters } from "./math-html";

describe("normalizeMathDelimiters", () => {
  it("\\(...\\) → $...$ (inline) și \\[...\\] → $$...$$ (bloc)", () => {
    expect(normalizeMathDelimiters("text \\(x^2\\) rest")).toBe(
      "text $x^2$ rest",
    );
    expect(normalizeMathDelimiters("\\[a=b\\]")).toBe("$$a=b$$");
  });
  it("compactează whitespace-ul intern al blocului multi-linie", () => {
    expect(normalizeMathDelimiters("\\[\n  x = 1\n\\]")).toBe("$$x = 1$$");
  });
  it("nu atinge $...$ existent", () => {
    expect(normalizeMathDelimiters("deja $x$ ok")).toBe("deja $x$ ok");
  });
});

describe("renderMathText", () => {
  it("randează KaTeX din $...$ și $$...$$", () => {
    expect(renderMathText("$x^2$")).toContain("katex");
    expect(renderMathText("$$x^2$$")).toContain("katex");
  });
  it("randează KaTeX și din delimitatorii \\(...\\) / \\[...\\] (Cerebras/Mistral)", () => {
    expect(renderMathText("val \\(x^2\\)")).toContain("katex");
    expect(renderMathText("\\[\\frac{1}{2}\\]")).toContain("katex");
  });
  it("markdown minim: **bold**, titlu #, listă *", () => {
    expect(renderMathText("**tare**")).toContain("<strong>tare</strong>");
    expect(renderMathText("### Titlu")).toContain("<strong>Titlu</strong>");
    expect(renderMathText("* element")).toContain("• element");
  });
  it("escape-uiește HTML-ul din textul simplu (fără injecție)", () => {
    expect(renderMathText("<script>")).toContain("&lt;script&gt;");
    expect(renderMathText("<script>")).not.toContain("<script>");
  });

  // P7 (Faza 4.5a, 2026-09-10): defectul REAL din jurnalul Faza 4 (#10) —
  // bold ÎN JURUL unei formule, pe o singură linie. `**b) $...$**` tăia
  // cele două `**` în bucăți de text separate de KaTeX; regexul de bold nu
  // vedea niciodată perechea. Diagnosticul inițial (bold peste linie nouă)
  // era un bug real, dar diferit — nu reproducea acest caz.
  it("P7: bold ÎN JURUL unei formule, pe o singură linie — cazul real din jurnal", () => {
    const html = renderMathText("**b) $6\\sqrt{3}$**");
    expect(html).toContain("<strong>");
    expect(html).toContain("katex");
    expect(html).not.toContain("*");
  });

  it("P7: bold întins pe două linii — bug secundar, reparat în aceeași trecere", () => {
    expect(renderMathText("**Titlu\ncontinuare**")).toBe(
      "<strong>Titlu<br>continuare</strong>",
    );
  });
});
