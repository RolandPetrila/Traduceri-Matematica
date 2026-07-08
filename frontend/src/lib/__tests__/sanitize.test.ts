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

  // R-MATH: a real Gemini geometry figure must survive sanitization intact.
  // Guards against a DOMPurify version bump silently stripping figure content.
  it("preserves a full Gemini SVG figure (R-MATH)", () => {
    const fig =
      '<div style="display:flex;gap:16px">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 255 170" style="font-family:Cambria">' +
      '<text x="10" y="12" font-weight="bold">P₁</text>' +
      '<circle cx="5" cy="5" r="2.5" fill="#333"/>' +
      '<line x1="0" y1="0" x2="10" y2="10" stroke-dasharray="5,3" stroke="#aaa"/>' +
      '<polygon fill="#e8f0fe" stroke="#333" stroke-linejoin="round" points="0,0 10,0 5,8"/>' +
      "</svg></div>";
    const out = sanitizeHtml(fig);
    expect(out).toContain("<svg");
    expect(out).toContain("<polygon");
    expect(out).toContain("<text");
    expect(out).toContain('stroke-dasharray="5,3"');
    expect(out).toContain('fill="#e8f0fe"');
  });
});
