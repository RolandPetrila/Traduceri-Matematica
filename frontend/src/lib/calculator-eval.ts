/**
 * Motor Calculator (2026-08-04) — logică PURĂ (fără React), testabilă direct.
 * Folosește math.js (MIT, gratis, 100% în browser). `normalizeExpr` traduce
 * notația școlară RO (√, π, ln, tg, ×, ÷) în sintaxa math.js. `evaluateExpr`
 * calculează; `samplePoints` eșantionează f(x); `plotToSvg` generează un SVG
 * curat (negru pe alb) → afișat în panou ȘI inserabil în editor ca figură
 * (export-safe, exact ca figurile geometrice).
 */
import { evaluate, compile, format } from "mathjs";

/**
 * Notație prietenoasă → math.js. Ordinea contează: `ln(`→`log(` ÎNAINTE de
 * `log(`→`log10(` (altfel `ln` ar deveni `log10`). Convenție școlară RO:
 * log = zecimal (base 10), ln = natural.
 */
export function normalizeExpr(input: string): string {
  let s = input;
  // radical: √(...) și √<atom>
  s = s.replace(/√\s*\(/g, "sqrt(");
  s = s.replace(/√\s*([0-9]+(?:\.[0-9]+)?|[a-zA-Z]\w*)/g, "sqrt($1)");
  // funcții / constante. ORDINE: întâi `log(`→`log10(`, apoi `ln(`→`log(` — altfel
  // `log(`-ul nou creat din `ln` ar fi re-prins de a doua regulă (`ln(2)`→`log10(2)`, greșit).
  s = s.replace(/\blog\s*\(/g, "log10(");
  s = s.replace(/\bln\s*\(/g, "log(");
  s = s.replace(/\btg\s*\(/g, "tan(");
  s = s.replace(/\bctg\s*\(/g, "cot(");
  s = s.replace(/π/g, "pi");
  // operatori Unicode
  s = s
    .replace(/×/g, "*")
    .replace(/·/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
  return s.trim();
}

export type EvalResult =
  { ok: true; value: string } | { ok: false; error: string };

/** Evaluează o expresie (aritmetică, funcții, matrice). Returnează rezultat formatat sau eroare. */
export function evaluateExpr(input: string): EvalResult {
  const e = normalizeExpr(input);
  if (!e) return { ok: false, error: "" };
  try {
    const v = evaluate(e);
    if (typeof v === "function" || v === undefined) {
      return { ok: false, error: "Expresie incompletă" };
    }
    const value =
      typeof v === "number"
        ? format(v, { precision: 12 })
        : format(v, { precision: 12 });
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: (err as Error).message || "Eroare de sintaxă" };
  }
}

export type Pt = { x: number; y: number | null };

/** Eșantionează y=f(x) pe [xmin,xmax] în n+1 puncte. y=null unde nu e finit/eroare. */
export function samplePoints(
  input: string,
  xmin: number,
  xmax: number,
  n = 240,
): Pt[] {
  const code = compile(normalizeExpr(input));
  const pts: Pt[] = [];
  const dx = (xmax - xmin) / n;
  for (let i = 0; i <= n; i++) {
    const x = xmin + i * dx;
    let y: number | null = null;
    try {
      const val = code.evaluate({ x });
      if (typeof val === "number" && Number.isFinite(val)) y = val;
    } catch {
      y = null;
    }
    pts.push({ x, y });
  }
  return pts;
}

/** Percentila unei liste sortate (pt auto-range robust la asimptote). */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round(p * (sorted.length - 1))),
  );
  return sorted[idx];
}

export type PlotFn = { expr: string; color: string; label?: string };
export type PlotOpts = {
  xmin?: number;
  xmax?: number;
  width?: number;
  height?: number;
};

/**
 * Generează un SVG cu axele + graficele funcțiilor. y-range auto (percentile
 * 2–98 + padding) ca să nu explodeze pe asimptote; segmentele se rup la y=null
 * sau la salturi mari (asimptote verticale). SVG negru pe alb → export-safe.
 */
export function plotToSvg(fns: PlotFn[], opts: PlotOpts = {}): string {
  const xmin = opts.xmin ?? -10;
  const xmax = opts.xmax ?? 10;
  const W = opts.width ?? 420;
  const H = opts.height ?? 300;
  const pad = 4;

  const series = fns
    .filter((f) => f.expr.trim())
    .map((f) => {
      let pts: Pt[] = [];
      try {
        pts = samplePoints(f.expr, xmin, xmax, 240);
      } catch {
        pts = [];
      }
      return { ...f, pts };
    });

  // y-range robust din toate valorile finite
  const allY = series
    .flatMap((s) => s.pts.map((p) => p.y))
    .filter((y): y is number => y != null)
    .sort((a, b) => a - b);
  let ymin: number;
  let ymax: number;
  if (allY.length >= 2) {
    ymin = percentile(allY, 0.02);
    ymax = percentile(allY, 0.98);
    if (ymin === ymax) {
      ymin -= 1;
      ymax += 1;
    }
    const padY = (ymax - ymin) * 0.1;
    ymin -= padY;
    ymax += padY;
  } else {
    ymin = -10;
    ymax = 10;
  }

  const sx = (x: number) => pad + ((x - xmin) / (xmax - xmin)) * (W - 2 * pad);
  const sy = (y: number) =>
    H - pad - ((y - ymin) / (ymax - ymin)) * (H - 2 * pad);

  // axe (x=0, y=0) dacă sunt în cadru
  const axisParts: string[] = [];
  if (0 >= ymin && 0 <= ymax) {
    const y0 = sy(0);
    axisParts.push(
      `<line x1="${pad}" y1="${y0.toFixed(1)}" x2="${(W - pad).toFixed(1)}" y2="${y0.toFixed(1)}" stroke="#6b7280" stroke-width="1"/>`,
    );
  }
  if (0 >= xmin && 0 <= xmax) {
    const x0 = sx(0);
    axisParts.push(
      `<line x1="${x0.toFixed(1)}" y1="${pad}" x2="${x0.toFixed(1)}" y2="${(H - pad).toFixed(1)}" stroke="#6b7280" stroke-width="1"/>`,
    );
  }

  // fiecare funcție: rupem segmentul la y=null sau salt mare (asimptotă)
  const jumpLimit = (ymax - ymin) * 1.5;
  const curveParts = series.map((s) => {
    const segments: string[] = [];
    let cur: string[] = [];
    let prevY: number | null = null;
    for (const p of s.pts) {
      if (p.y == null || p.y < ymin - jumpLimit || p.y > ymax + jumpLimit) {
        if (cur.length > 1) segments.push(cur.join(" "));
        cur = [];
        prevY = null;
        continue;
      }
      if (prevY != null && Math.abs(p.y - prevY) > jumpLimit) {
        if (cur.length > 1) segments.push(cur.join(" "));
        cur = [];
      }
      cur.push(`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`);
      prevY = p.y;
    }
    if (cur.length > 1) segments.push(cur.join(" "));
    return segments
      .map(
        (seg) =>
          `<polyline points="${seg}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`,
      )
      .join("");
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff" stroke="#111827" stroke-width="1"/>` +
    axisParts.join("") +
    curveParts.join("") +
    `</svg>`
  );
}

/** Data-URI (base64) pt <img src>. */
export function svgDataUri(svgStr: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`;
}
