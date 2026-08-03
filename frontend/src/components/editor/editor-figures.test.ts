import {
  FIGURES,
  figureByKey,
  renderFigure,
  defaultLabels,
  emptySides,
} from "./editor-figures";

describe("editor-figures · M5 parametric", () => {
  it("randarea implicită (fără parametri) == svg-ul precalculat (backward-compat)", () => {
    for (const f of FIGURES) {
      expect(renderFigure(f, defaultLabels(f), emptySides(f))).toBe(f.svg);
    }
  });

  it("toate figurile au SVG valid + viewBox comun", () => {
    for (const f of FIGURES) {
      expect(f.svg.startsWith("<svg")).toBe(true);
      expect(f.svg).toContain('viewBox="0 0 120 112"');
      expect(f.svg.endsWith("</svg>")).toBe(true);
    }
  });

  it("etichetele custom înlocuiesc defaults (triunghi A/B/C → M/N/P)", () => {
    const tri = figureByKey("triunghi")!;
    const svg = renderFigure(tri, ["M", "N", "P"], emptySides(tri));
    expect(svg).toContain(">M<");
    expect(svg).toContain(">N<");
    expect(svg).toContain(">P<");
    expect(svg).not.toContain(">A<");
  });

  it("lungimile de laturi apar DOAR când sunt completate", () => {
    const tri = figureByKey("triunghi")!;
    const fara = renderFigure(tri, defaultLabels(tri), ["", "", ""]);
    expect(fara).not.toContain(">5<");
    const cu = renderFigure(tri, defaultLabels(tri), ["5", "", ""]);
    expect(cu).toContain(">5<");
  });

  it("eticheta goală cade pe default; corpurile n-au parametri", () => {
    const patrat = figureByKey("patrat")!;
    // un slot gol → revine la litera implicită
    const svg = renderFigure(patrat, ["", "B", "C", "D"], emptySides(patrat));
    expect(svg).toContain(">A<");
    const cub = figureByKey("cub")!;
    expect(cub.labels.length).toBe(0);
    expect(cub.sides.length).toBe(0);
  });

  it("escape XML pe valori periculoase (nu sparge SVG-ul)", () => {
    const tri = figureByKey("triunghi")!;
    const svg = renderFigure(tri, ["A<b>", "B", "C"], emptySides(tri));
    expect(svg).toContain("&lt;b&gt;");
    expect(svg).not.toContain("<b>");
  });

  it("figureByKey găsește și lipsa returnează undefined", () => {
    expect(figureByKey("triunghi")?.key).toBe("triunghi");
    expect(figureByKey("inexistent")).toBeUndefined();
  });
});
