import { sanitizeHtml } from "@/lib/sanitize";

describe("sanitizeHtml", () => {
  it("strips inline event handlers (onerror)", () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)">');
    expect(out).not.toContain("onerror");
  });

  it("removes <script> but keeps surrounding text", () => {
    const out = sanitizeHtml("<p>salut</p><script>alert(1)</script>");
    expect(out).not.toContain("<script");
    expect(out).toContain("salut");
  });

  it("keeps allowed SVG figure elements (Gemini geometry)", () => {
    const out = sanitizeHtml(
      '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3"></circle></svg>',
    );
    expect(out).toContain("<svg");
    expect(out).toContain("<circle");
  });

  it("strips onload from an svg element", () => {
    const out = sanitizeHtml(
      '<svg onload="alert(1)"><rect x="0" y="0"></rect></svg>',
    );
    expect(out).not.toContain("onload");
  });

  it("leaves LaTeX delimiters in text untouched", () => {
    const out = sanitizeHtml("<p>Fie $x^2 + 1$ un numar real.</p>");
    expect(out).toContain("$x^2 + 1$");
  });
});
