/**
 * Intrare matematică prietenoasă → LaTeX (partajat de constructor + editarea
 * formulelor). Cristina scrie/lipește semne Unicode (x², a₁, √5, ∞, π, ×…) și
 * `norm()` le transformă în LaTeX corect pentru KaTeX. NU tastează LaTeX brut.
 *
 * Fix radical (2026-07-26): înainte, doar `√(…)` cu paranteze devenea `\sqrt{…}`.
 * Un `√5` fără paranteze rămânea glif Unicode → KaTeX îl randează ca `\surd`,
 * adică FĂRĂ linia de deasupra (vinculum) — părea incomplet (ex. în numărătorul
 * unei limite). Acum `√5`, `√x`, `√(6x+3)`, `∛8`, `∜16` devin radicali corecți.
 */

const SUP: Record<string, string> = {
  "⁰": "^0",
  "¹": "^1",
  "²": "^2",
  "³": "^3",
  "⁴": "^4",
  "⁵": "^5",
  "⁶": "^6",
  "⁷": "^7",
  "⁸": "^8",
  "⁹": "^9",
  ⁿ: "^n",
};
const SUB: Record<string, string> = {
  "₀": "_0",
  "₁": "_1",
  "₂": "_2",
  "₃": "_3",
  "₄": "_4",
  "₅": "_5",
  "₆": "_6",
  "₇": "_7",
  "₈": "_8",
  "₉": "_9",
  ₙ: "_n",
};

/** Un „atom" de radicand fără paranteze: un număr sau o secvență de litere. */
const RADICAND = "([0-9]+(?:[.,][0-9]+)?|[A-Za-zα-ωΑ-Ω]+)";
const reRoot2Paren = /√\s*\(([^()]*)\)/g;
const reRoot2Atom = new RegExp("√\\s*" + RADICAND, "g");
const reRoot3Paren = /∛\s*\(([^()]*)\)/g;
const reRoot3Atom = new RegExp("∛\\s*" + RADICAND, "g");
const reRoot4Paren = /∜\s*\(([^()]*)\)/g;
const reRoot4Atom = new RegExp("∜\\s*" + RADICAND, "g");

/**
 * Intrare prietenoasă → LaTeX. Idempotentă pe LaTeX deja corect (nu conține
 * glife Unicode de tratat), deci poate rula și la re-editarea unei formule.
 */
export function norm(s: string): string {
  let out = s;
  // Radicali: întâi forma cu paranteze (radicand cu mai mulți termeni), apoi
  // forma cu un singur atom. Ordinea contează: `√(2+3)` ≠ `√2`.
  out = out
    .replace(reRoot3Paren, "\\sqrt[3]{$1}")
    .replace(reRoot4Paren, "\\sqrt[4]{$1}")
    .replace(reRoot2Paren, "\\sqrt{$1}")
    .replace(/sqrt\(([^()]*)\)/gi, "\\sqrt{$1}")
    .replace(reRoot3Atom, "\\sqrt[3]{$1}")
    .replace(reRoot4Atom, "\\sqrt[4]{$1}")
    .replace(reRoot2Atom, "\\sqrt{$1}");
  for (const [k, v] of Object.entries(SUP)) out = out.split(k).join(v);
  for (const [k, v] of Object.entries(SUB)) out = out.split(k).join(v);
  // Comenzile-cuvânt (\cdot, \times…) au nevoie de un spațiu terminator, altfel
  // se lipesc de litera următoare și devin o comandă necunoscută (ex. `a·b` →
  // `a\cdotb`, rupt în KaTeX). Adăugăm spațiu, apoi `.trim()` scoate cel de la coadă.
  // NU colapsăm toate spațiile: spațiile din LaTeX-ul bibliotecii (214 formule) sunt
  // nesemnificative în math-mode, deci colapsul n-ar aduce nimic — doar risc inutil.
  out = out
    .replace(/∞/g, "\\infty ")
    .replace(/·/g, "\\cdot ")
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/±/g, "\\pm ")
    .replace(/π/g, "\\pi ");
  return out.trim();
}

/**
 * Construcții matematice GATA-FĂCUTE (cerință Roland 2026-07-26): utilizatorul NU
 * vrea să învețe „ce scriu → ce obțin"; vrea toate structurile vizibile, un click
 * = inserată pe foaie, apoi o editează la click (dialogul de editare). Fiecare are
 * `latex` (șablon cu litere-substituent a/b/x/n) și `label` (tooltip în română).
 * Ordinea = de la simplu la complex, gruparea firească pentru gimnaziu→liceu.
 */
export type MathConstruction = { latex: string; title: string };
export const MATH_CONSTRUCTIONS: MathConstruction[] = [
  { latex: "x^{2}", title: "La pătrat" },
  { latex: "x^{n}", title: "La puterea n" },
  { latex: "x_{n}", title: "Indice (x cu n jos)" },
  { latex: "x_{n}^{2}", title: "Indice și putere" },
  { latex: "\\dfrac{a}{b}", title: "Fracție" },
  { latex: "\\sqrt{a}", title: "Radical" },
  { latex: "\\sqrt[n]{a}", title: "Radical de ordin n" },
  { latex: "|x|", title: "Modul (valoare absolută)" },
  { latex: "\\lim_{x \\to a} f(x)", title: "Limită" },
  { latex: "\\sum_{i=1}^{n} a_{i}", title: "Sumă (Σ)" },
  { latex: "\\prod_{i=1}^{n} a_{i}", title: "Produs (Π)" },
  { latex: "\\int f(x)\\, dx", title: "Integrală" },
  { latex: "\\int_{a}^{b} f(x)\\, dx", title: "Integrală definită" },
  { latex: "f'(x)", title: "Derivată" },
  { latex: "\\sin x", title: "Sinus" },
  { latex: "\\cos x", title: "Cosinus" },
  { latex: "\\operatorname{tg} x", title: "Tangentă" },
  { latex: "\\vec{v}", title: "Vector" },
  { latex: "\\overline{AB}", title: "Bară deasupra (segment / conjugat)" },
  { latex: "\\binom{n}{k}", title: "Combinări (n peste k)" },
  { latex: "\\angle ABC", title: "Unghi" },
  { latex: "90^{\\circ}", title: "Grade" },
  { latex: "\\begin{cases} a \\\\ b \\end{cases}", title: "Sistem (acoladă)" },
  {
    latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
    title: "Matrice 2×2",
  },
];

/** Un buton din paletă: `ins` = ce se inserează în câmp; `glyph` = ce se afișează. */
export type PaletteItem = { ins: string; title: string; glyph?: string };

/**
 * Set curat de simboluri pentru inserare cu UN CLICK în câmpurile matematice
 * (constructor + editare). Acoperă exact cererea: ² ³ √ ∞ π ≤ ≥ ≠ · × etc.
 * `norm()` traduce fiecare glif în LaTeX, deci utilizatorul NU vede „^2"/„sqrt".
 */
export const MATH_PALETTE: PaletteItem[] = [
  { ins: "²", title: "La pătrat (ridicat la 2)" },
  { ins: "³", title: "La cub (ridicat la 3)" },
  { ins: "ⁿ", title: "La puterea n" },
  { ins: "₁", title: "Indice 1" },
  { ins: "₂", title: "Indice 2" },
  { ins: "ₙ", title: "Indice n" },
  { ins: "√", title: "Radical (√ceva sau √(expresie))" },
  { ins: "∛", title: "Radical de ordin 3" },
  { ins: "π", title: "pi" },
  { ins: "∞", title: "infinit" },
  { ins: "≤", title: "mai mic sau egal" },
  { ins: "≥", title: "mai mare sau egal" },
  { ins: "≠", title: "diferit" },
  { ins: "·", title: "înmulțire (punct)" },
  { ins: "×", title: "înmulțire (×)" },
  { ins: "÷", title: "împărțire" },
  { ins: "±", title: "plus-minus" },
  { ins: "→", title: "tinde către" },
  { ins: "(", title: "paranteză deschisă" },
  { ins: ")", title: "paranteză închisă" },
];
