/**
 * Model RECURSIV pentru constructorul de formule (M2, 2026-08-04).
 *
 * Înainte: constructorul era mono-segment — un câmp = text plat → LaTeX. Nu puteai
 * pune o structură ÎN altă structură pe cale vizuală (ex. un radical în numărătorul
 * unei fracții). Acum orice „slot de expresie" (numărător, radicand, corp de sumă,
 * celulă de matrice, ecuație de sistem…) este el însuși un `BNode` → compoziție
 * recursivă la ORICE adâncime, cu o singură implementare (0 cod per combinație).
 *
 * `nodeToLatex` e o funcție PURĂ (fără React) → testabilă direct. Reutilizează
 * `norm()` din `math-input.ts` (intrare prietenoasă Unicode → LaTeX) pentru frunze.
 */
import { norm } from "./math-input";

/** Structurile suportate. „text" = frunză (câmp simplu). */
export type BuilderKind =
  "text" | "frac" | "root" | "lim" | "sum" | "integral" | "matrix" | "system";

/** Tipurile de structuri care pot sta „la vârf" (selectorul segmentat). */
export const TOP_KINDS: Exclude<BuilderKind, "text">[] = [
  "frac",
  "lim",
  "root",
  "matrix",
  "system",
  "sum",
  "integral",
];

export const KIND_LABEL: Record<BuilderKind, string> = {
  text: "Text",
  frac: "Fracție",
  lim: "Limită",
  root: "Radical",
  matrix: "Matrice",
  system: "Sistem",
  sum: "Σ Sumă",
  integral: "∫ Integrală",
};

export type TextNode = { kind: "text"; value: string };
export type FracNode = { kind: "frac"; num: BNode; den: BNode };
export type RootNode = { kind: "root"; order: string; radicand: BNode };
export type LimNode = { kind: "lim"; v: string; to: string; body: BNode };
export type SumNode = { kind: "sum"; lo: string; hi: string; body: BNode };
export type IntegralNode = {
  kind: "integral";
  lo: string;
  hi: string;
  dvar: string;
  body: BNode;
};
export type MatrixNode = {
  kind: "matrix";
  rows: number;
  cols: number;
  cells: BNode[];
};
export type SystemNode = { kind: "system"; eqs: BNode[] };

export type BNode =
  | TextNode
  | FracNode
  | RootNode
  | LimNode
  | SumNode
  | IntegralNode
  | MatrixNode
  | SystemNode;

/** Substituent KaTeX pentru un slot gol (pătrățel gol). */
export const PLACEHOLDER = "\\square";

export function textNode(value = ""): TextNode {
  return { kind: "text", value };
}

/** Nodul „gol" implicit pentru fiecare tip (câmpuri cu valori de pornire prietenoase). */
export function emptyOf(kind: BuilderKind): BNode {
  switch (kind) {
    case "text":
      return textNode();
    case "frac":
      return { kind: "frac", num: textNode(), den: textNode() };
    case "root":
      return { kind: "root", order: "2", radicand: textNode() };
    case "lim":
      return { kind: "lim", v: "x", to: "∞", body: textNode() };
    case "sum":
      return { kind: "sum", lo: "k=1", hi: "n", body: textNode() };
    case "integral":
      return {
        kind: "integral",
        lo: "a",
        hi: "b",
        dvar: "x",
        body: textNode(),
      };
    case "matrix":
      return {
        kind: "matrix",
        rows: 2,
        cols: 2,
        cells: [textNode(), textNode(), textNode(), textNode()],
      };
    case "system":
      return { kind: "system", eqs: [textNode(), textNode()] };
  }
}

/**
 * Transformă un nod într-o structură, ducând textul curent în slotul primar
 * (numărător/radicand/corp/prima ecuație/prima celulă) — nu pierzi ce ai tastat.
 */
export function convertTo(node: BNode, kind: BuilderKind): BNode {
  const carried = node.kind === "text" ? node.value : "";
  const base = emptyOf(kind);
  if (!carried) return base;
  switch (base.kind) {
    case "frac":
      return { ...base, num: textNode(carried) };
    case "root":
      return { ...base, radicand: textNode(carried) };
    case "lim":
    case "sum":
    case "integral":
      return { ...base, body: textNode(carried) };
    case "system":
      return { ...base, eqs: [textNode(carried), textNode()] };
    case "matrix": {
      const cells = [...base.cells];
      cells[0] = textNode(carried);
      return { ...base, cells };
    }
    default:
      return base;
  }
}

/** Redimensionează o matrice păstrând celulele existente pe pozițiile (r,c). */
export function resizeMatrix(
  node: MatrixNode,
  rows: number,
  cols: number,
): MatrixNode {
  const cells: BNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const old =
        r < node.rows && c < node.cols
          ? node.cells[r * node.cols + c]
          : undefined;
      cells.push(old ?? textNode());
    }
  }
  return { ...node, rows, cols, cells };
}

/** Redimensionează un sistem păstrând ecuațiile existente. */
export function resizeSystem(node: SystemNode, n: number): SystemNode {
  const eqs: BNode[] = [];
  for (let i = 0; i < n; i++) eqs.push(node.eqs[i] ?? textNode());
  return { ...node, eqs };
}

/** LaTeX pentru un slot: nod → LaTeX, cu □ dacă e gol (ca să se vadă structura). */
function slot(n: BNode): string {
  return nodeToLatex(n) || PLACEHOLDER;
}

/**
 * Nod recursiv → LaTeX. La vârf, un text gol dă "" (nimic de inserat); în interiorul
 * unei structuri, un slot gol dă □ (via `slot`).
 */
export function nodeToLatex(node: BNode): string {
  switch (node.kind) {
    case "text":
      return norm(node.value);
    case "frac":
      return `\\dfrac{${slot(node.num)}}{${slot(node.den)}}`;
    case "root": {
      const o = norm(node.order).trim();
      const rad = slot(node.radicand);
      return o && o !== "2" ? `\\sqrt[${o}]{${rad}}` : `\\sqrt{${rad}}`;
    }
    case "lim": {
      const head = `\\lim\\limits_{${norm(node.v) || "x"}\\to ${norm(node.to) || "\\infty"}}`;
      return `${head} ${slot(node.body)}`;
    }
    case "sum":
      return `\\sum_{${norm(node.lo) || "k=1"}}^{${norm(node.hi) || "n"}} ${slot(node.body)}`;
    case "integral": {
      const dv = norm(node.dvar) || "x";
      return `\\int_{${norm(node.lo) || "a"}}^{${norm(node.hi) || "b"}} ${slot(node.body)}\\, d${dv}`;
    }
    case "matrix": {
      const rows: string[] = [];
      for (let r = 0; r < node.rows; r++) {
        const cells: string[] = [];
        for (let c = 0; c < node.cols; c++) {
          cells.push(slot(node.cells[r * node.cols + c] ?? textNode()));
        }
        rows.push(cells.join(" & "));
      }
      return `\\begin{pmatrix} ${rows.join(" \\\\ ")} \\end{pmatrix}`;
    }
    case "system":
      return `\\begin{cases} ${node.eqs.map(slot).join(" \\\\ ")} \\end{cases}`;
  }
}

/** Validare defensivă a unui draft citit din localStorage (structură necunoscută → null). */
export function isValidNode(x: unknown): x is BNode {
  if (!x || typeof x !== "object") return false;
  const n = x as { kind?: unknown };
  switch (n.kind) {
    case "text":
      return typeof (x as TextNode).value === "string";
    case "frac":
      return (
        isValidNode((x as FracNode).num) && isValidNode((x as FracNode).den)
      );
    case "root":
      return (
        typeof (x as RootNode).order === "string" &&
        isValidNode((x as RootNode).radicand)
      );
    case "lim":
      return (
        typeof (x as LimNode).v === "string" &&
        typeof (x as LimNode).to === "string" &&
        isValidNode((x as LimNode).body)
      );
    case "sum":
      return (
        typeof (x as SumNode).lo === "string" &&
        typeof (x as SumNode).hi === "string" &&
        isValidNode((x as SumNode).body)
      );
    case "integral":
      return (
        typeof (x as IntegralNode).lo === "string" &&
        typeof (x as IntegralNode).hi === "string" &&
        typeof (x as IntegralNode).dvar === "string" &&
        isValidNode((x as IntegralNode).body)
      );
    case "matrix": {
      const m = x as MatrixNode;
      return (
        Number.isFinite(m.rows) &&
        Number.isFinite(m.cols) &&
        Array.isArray(m.cells) &&
        m.cells.every(isValidNode)
      );
    }
    case "system": {
      const s = x as SystemNode;
      return Array.isArray(s.eqs) && s.eqs.every(isValidNode);
    }
    default:
      return false;
  }
}
