import katex from "katex";
import {
  nodeToLatex,
  textNode,
  emptyOf,
  convertTo,
  resizeMatrix,
  resizeSystem,
  isValidNode,
  type FracNode,
  type RootNode,
  type SumNode,
  type SystemNode,
  type MatrixNode,
} from "./math-builder-tree";

/** KaTeX trebuie să randeze fără eroare (throwOnError) — dovada că LaTeX-ul e valid. */
function katexOk(latex: string): boolean {
  try {
    katex.renderToString(latex, { throwOnError: true, strict: false });
    return true;
  } catch {
    return false;
  }
}

describe("math-builder-tree · nodeToLatex (flat, ca înainte)", () => {
  it("frac plat", () => {
    const n: FracNode = {
      kind: "frac",
      num: textNode("1+2x"),
      den: textNode("1+3x"),
    };
    expect(nodeToLatex(n)).toBe("\\dfrac{1+2x}{1+3x}");
    expect(katexOk(nodeToLatex(n))).toBe(true);
  });

  it("radical: ordin 2 fără paranteză, ordin n cu []", () => {
    const r2: RootNode = {
      kind: "root",
      order: "2",
      radicand: textNode("6x+3"),
    };
    expect(nodeToLatex(r2)).toBe("\\sqrt{6x+3}");
    const rn: RootNode = { kind: "root", order: "3", radicand: textNode("8") };
    expect(nodeToLatex(rn)).toBe("\\sqrt[3]{8}");
  });

  it("frunză Unicode → LaTeX prin norm (√5, ², π)", () => {
    expect(nodeToLatex(textNode("√5"))).toBe("\\sqrt{5}");
    expect(nodeToLatex(textNode("x²"))).toBe("x^2");
    expect(nodeToLatex(textNode("2π"))).toBe("2\\pi");
  });

  it('slot gol → □ în interiorul structurii; text gol la vârf → ""', () => {
    expect(nodeToLatex(textNode(""))).toBe("");
    const n: FracNode = { kind: "frac", num: textNode(""), den: textNode("2") };
    expect(nodeToLatex(n)).toBe("\\dfrac{\\square}{2}");
  });
});

describe("math-builder-tree · RECURSIV (M2 — cazurile lui Roland)", () => {
  it("radical ÎN fracție (√ la numărător)", () => {
    const n: FracNode = {
      kind: "frac",
      num: { kind: "root", order: "2", radicand: textNode("6x+3") },
      den: textNode("2"),
    };
    expect(nodeToLatex(n)).toBe("\\dfrac{\\sqrt{6x+3}}{2}");
    expect(katexOk(nodeToLatex(n))).toBe(true);
  });

  it("fracție ÎN fracție", () => {
    const inner: FracNode = {
      kind: "frac",
      num: textNode("1"),
      den: textNode("x"),
    };
    const outer: FracNode = { kind: "frac", num: inner, den: textNode("y") };
    expect(nodeToLatex(outer)).toBe("\\dfrac{\\dfrac{1}{x}}{y}");
    expect(katexOk(nodeToLatex(outer))).toBe(true);
  });

  it("sumă cu FRACȚIE la termen", () => {
    const s: SumNode = {
      kind: "sum",
      lo: "k=1",
      hi: "n",
      body: { kind: "frac", num: textNode("1"), den: textNode("k^2") },
    };
    expect(nodeToLatex(s)).toBe("\\sum_{k=1}^{n} \\dfrac{1}{k^2}");
    expect(katexOk(nodeToLatex(s))).toBe(true);
  });

  it("radical ÎNTR-UN sistem (o ecuație = radical)", () => {
    const sys: SystemNode = {
      kind: "system",
      eqs: [
        { kind: "root", order: "2", radicand: textNode("x+1") },
        textNode("y=2"),
      ],
    };
    expect(nodeToLatex(sys)).toBe(
      "\\begin{cases} \\sqrt{x+1} \\\\ y=2 \\end{cases}",
    );
    expect(katexOk(nodeToLatex(sys))).toBe(true);
  });

  it("nesting adânc (fracție cu radical de sumă la numitor) randează valid", () => {
    const deep: FracNode = {
      kind: "frac",
      num: textNode("1"),
      den: {
        kind: "root",
        order: "2",
        radicand: {
          kind: "sum",
          lo: "i=1",
          hi: "n",
          body: textNode("a_i"),
        },
      },
    };
    expect(katexOk(nodeToLatex(deep))).toBe(true);
    expect(nodeToLatex(deep)).toContain("\\sqrt{\\sum_{i=1}^{n} a_i}");
  });
});

describe("math-builder-tree · helpers", () => {
  it("convertTo duce textul în slotul primar", () => {
    const fromText = textNode("6x+3");
    const asRoot = convertTo(fromText, "root");
    expect(asRoot).toEqual({
      kind: "root",
      order: "2",
      radicand: textNode("6x+3"),
    });
    const asFrac = convertTo(textNode("a"), "frac") as FracNode;
    expect(asFrac.num).toEqual(textNode("a"));
  });

  it("emptyOf produce structuri valide", () => {
    for (const k of [
      "frac",
      "root",
      "lim",
      "sum",
      "integral",
      "matrix",
      "system",
    ] as const) {
      expect(isValidNode(emptyOf(k))).toBe(true);
    }
  });

  it("resizeMatrix păstrează celulele existente", () => {
    const m = emptyOf("matrix") as MatrixNode;
    (m.cells[0] as { value: string }).value = "a";
    const bigger = resizeMatrix(m, 3, 3);
    expect(bigger.cells.length).toBe(9);
    expect(bigger.cells[0]).toEqual(textNode("a"));
  });

  it("resizeSystem păstrează ecuațiile existente", () => {
    const s = emptyOf("system") as SystemNode;
    (s.eqs[0] as { value: string }).value = "x=1";
    const bigger = resizeSystem(s, 4);
    expect(bigger.eqs.length).toBe(4);
    expect(bigger.eqs[0]).toEqual(textNode("x=1"));
  });

  it("isValidNode respinge structuri corupte", () => {
    expect(isValidNode(null)).toBe(false);
    expect(isValidNode({ kind: "frac" })).toBe(false);
    expect(isValidNode({ kind: "banana" })).toBe(false);
    expect(isValidNode(textNode("ok"))).toBe(true);
  });
});
