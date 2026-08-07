/**
 * Strat de verificare a corectitudinii pentru fișele generate AI (D7).
 * Fișele AI NU au garanția planșelor deterministe → scanăm egalitățile aritmetice
 * DETECTABILE (operații simple + puteri) și semnalăm nepotrivirile. Onest limitat:
 * NU verifică probleme cu enunț liber / raționament. Bannerul „verifică înainte de
 * tipărire" se afișează MEREU, indiferent de rezultat. Vezi docs/PLAN_SCOLARE §4.3/D7.
 */

const SUPERSCRIPT: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
};

export interface ArithIssue {
  expr: string;
  expected: number;
  found: number;
}

export interface VerifyResult {
  /** Nr egalități verificabile găsite. */
  checked: number;
  /** Egalitățile greșite. */
  issues: ArithIssue[];
}

/** Parsează un număr românesc (virgulă zecimală) sau internațional. */
function num(s: string): number {
  return parseFloat(s.replace(",", "."));
}

const EPS = 1e-6;

/** Aplică operatorul (+, -, ×/x/*, :/÷//). */
function apply(a: number, op: string, b: number): number | null {
  switch (op) {
    case "+":
      return a + b;
    case "-":
    case "−":
      return a - b;
    case "×":
    case "x":
    case "*":
    case "·":
      return a * b;
    case ":":
    case "÷":
    case "/":
      return b === 0 ? null : a / b;
    default:
      return null;
  }
}

// Caractere care, dacă apar imediat lângă egalitate (pe același rând, ignorând
// spații/tab-uri), semnalează că e mijloc de număr sau parte dintr-un lanț
// (ex. „b + 10 = 20 + 10 = 30") → NU o verificăm izolat. NU includem „." / „,":
// punctul de listă („1. 2+3=5") și sfârșitul de propoziție sunt legitime.
// „·" (U+00B7 MIDDLE DOT) ȘI „⋅" (U+22C5 DOT OPERATOR) sunt ambele glife de
// înmulțire folosite de AI (Gemini randează `\cdot` ca U+22C5) — lipsa celei
// de-a doua a produs fals-pozitive pe lanțuri ca „2^1⋅3^1⋅5^1=2⋅3⋅5=30"
// (prins la proba live pe Clasa 6 Matematică, F1).
const CHAIN = "0123456789+-−×x*·⋅:÷/^=";

/** Graniță curată: lângă egalitate (pe același rând) nu e cifră/operator/=. */
function cleanBoundary(text: string, start: number, end: number): boolean {
  let i = start - 1;
  while (i >= 0 && (text[i] === " " || text[i] === "\t")) i--;
  if (i >= 0 && text[i] !== "\n" && CHAIN.indexOf(text[i]) >= 0) return false;
  let j = end;
  while (j < text.length && (text[j] === " " || text[j] === "\t")) j++;
  if (j < text.length && text[j] !== "\n" && CHAIN.indexOf(text[j]) >= 0)
    return false;
  return true;
}

/** Scanează textul pt egalități aritmetice verificabile și întoarce nepotrivirile. */
export function verifyArithmetic(rawText: string): VerifyResult {
  const issues: ArithIssue[] = [];
  let checked = 0;

  // Convertim superscript unicode (2⁵ → 2^5) ca puterile să fie detectate uniform.
  // (target es5 → fără spread pe string; folosim replace per-caracter.)
  const text = rawText.replace(
    /(\d)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g,
    (_m, base: string, sup: string) =>
      `${base}^${sup.replace(/./g, (c) => SUPERSCRIPT[c] ?? "")}`,
  );

  // 1. Puteri: A^B = C (B întreg mic). (exec while-loop = es5-safe, fără matchAll.)
  const powRe = /(\d+(?:[.,]\d+)?)\s*\^\s*(\d+)\s*=\s*(-?\d+(?:[.,]\d+)?)/g;
  let pm: RegExpExecArray | null;
  while ((pm = powRe.exec(text)) !== null) {
    if (!cleanBoundary(text, pm.index, pm.index + pm[0].length)) continue;
    const exp = parseInt(pm[2], 10);
    if (exp > 30) continue; // evită numere astronomice
    const expected = Math.pow(num(pm[1]), exp);
    const found = num(pm[3]);
    checked++;
    if (Math.abs(expected - found) > EPS) {
      issues.push({ expr: pm[0].trim(), expected, found });
    }
  }

  // 2. Operație binară simplă: A op B = C (numai numeric, un singur operator).
  const binRe =
    /(-?\d+(?:[.,]\d+)?)\s*([+\-−×x*·:÷/])\s*(\d+(?:[.,]\d+)?)\s*=\s*(-?\d+(?:[.,]\d+)?)/g;
  let bm: RegExpExecArray | null;
  while ((bm = binRe.exec(text)) !== null) {
    if (!cleanBoundary(text, bm.index, bm.index + bm[0].length)) continue;
    const expected = apply(num(bm[1]), bm[2], num(bm[3]));
    if (expected === null) continue;
    const found = num(bm[4]);
    checked++;
    if (Math.abs(expected - found) > EPS) {
      issues.push({ expr: bm[0].trim(), expected, found });
    }
  }

  return { checked, issues };
}
