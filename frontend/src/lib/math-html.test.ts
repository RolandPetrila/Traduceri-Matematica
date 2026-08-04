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
});
