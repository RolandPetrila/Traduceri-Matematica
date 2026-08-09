/**
 * Primitive de desen determinist pentru fișele Școlare (grădiniță + primar cl.0-1).
 * AI-ul NU generează SVG — alege un TIP + parametri dintr-un enum fix (vezi
 * `drawing-rule.ts`); fiecare funcție de aici întoarce markup SVG/HTML randat de
 * codul nostru, din catalogul `catalog.ts`. Parametri necunoscuți → `null` (parse-render
 * face fallback la textul original, niciodată crash). Fără interpolare de string
 * netrusted în atribute SVG — totul trece prin lookup în `OBIECTE`/`PALETA`.
 */
import { OBIECTE, PALETA, FORME_UNESTE } from "./catalog";

const WRAP_STYLE =
  "display:flex;align-items:center;justify-content:center;gap:16px;" +
  "margin:6px 0;break-inside:avoid;flex-wrap:wrap;";

function svg(
  inner: string,
  w: number,
  h: number,
  viewBox = "0 0 64 64",
): string {
  return `<svg width="${w}" height="${h}" viewBox="${viewBox}" style="flex-shrink:0">${inner}</svg>`;
}

/** Colorează un obiect (model alături, opțional) — ex. „colorează mărul cu roșu". */
export function coloreaza(
  obiect: string | undefined,
  culoare: string | undefined,
  model: boolean,
): string | null {
  const build = obiect ? OBIECTE[obiect] : undefined;
  const hex = culoare ? PALETA[culoare] : undefined;
  if (!build || !hex) return null;
  const modelHtml = model
    ? `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;border:2px solid #fdcb6e;background:#fff9e6;padding:6px 10px;border-radius:12px">` +
      `<span style="font-size:0.8rem;font-weight:bold;color:#d63031">MODEL</span>` +
      svg(build(hex), 46, 46) +
      `</div>`
    : "";
  return `<div style="${WRAP_STYLE}">${modelHtml}${svg(build("#ffffff"), 120, 120)}</div>`;
}

/** Traseu punctat de trasat, cu markere de start/final (obiect opțional la fiecare capăt). */
export function traseu(
  start: string | undefined,
  final: string | undefined,
): string {
  const startMark =
    start && OBIECTE[start]
      ? svg(OBIECTE[start]("#f1c40f"), 44, 44)
      : `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#e74c3c"></span>`;
  const finalMark =
    final && OBIECTE[final]
      ? svg(OBIECTE[final]("#f1c40f"), 44, 44)
      : `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#27ae60"></span>`;
  const path = svg(
    `<path d="M 10 35 Q 100 5, 200 35 T 390 35" fill="none" stroke="#74b9ff" stroke-width="4" stroke-dasharray="8 8" stroke-linecap="round"/>` +
      `<circle cx="10" cy="35" r="5" fill="#e74c3c"/><circle cx="390" cy="35" r="5" fill="#27ae60"/>`,
    260,
    46,
    "0 0 400 70",
  );
  return `<div style="${WRAP_STYLE}">${startMark}${path}${finalMark}</div>`;
}

/** Unește punctele 1..n după o formă fixă din catalog (stea/triunghi/patrat/casa). */
export function uneste(forma: string | undefined): string | null {
  const puncte = forma ? FORME_UNESTE[forma] : undefined;
  if (!puncte) return null;
  const ghid = `<polygon points="${puncte.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#dfe6e9" stroke-width="2" stroke-dasharray="4 4"/>`;
  const dots = puncte
    .map(([x, y], i) => {
      const n = i + 1;
      const ly = y < 70 ? y + 18 : y - 12;
      return (
        `<circle cx="${x}" cy="${y}" r="7" fill="#e74c3c"/>` +
        `<text x="${x}" y="${ly}" font-size="12" font-weight="bold" fill="#d63031" text-anchor="middle">${n}</text>`
      );
    })
    .join("");
  return `<div style="${WRAP_STYLE}">${svg(ghid + dots, 220, 154, "0 0 200 140")}</div>`;
}

/** Simetrie — jumătate desenată solid, jumătate ghidaj punctat de completat. Doar „fluture" la pilot. */
export function simetrie(obiect: string | undefined): string | null {
  if (obiect !== "fluture") return null;
  const stanga =
    `<path d="M32 30 Q10 4 4 30 Q10 52 32 40" fill="#ffffff" stroke="#2c3e50" stroke-width="3"/>` +
    `<path d="M32 40 Q10 52 16 60 Q28 62 32 46" fill="#ffffff" stroke="#2c3e50" stroke-width="3"/>`;
  const dreaptaGhid =
    `<path d="M32 30 Q54 4 60 30 Q54 52 32 40" fill="none" stroke="#dfe6e9" stroke-width="2.5" stroke-dasharray="4 4"/>` +
    `<path d="M32 40 Q54 52 48 60 Q36 62 32 46" fill="none" stroke="#dfe6e9" stroke-width="2.5" stroke-dasharray="4 4"/>`;
  const corp =
    `<ellipse cx="32" cy="34" rx="4" ry="16" fill="#f1c40f" stroke="#2c3e50" stroke-width="2"/>` +
    `<circle cx="32" cy="20" r="6" fill="#f1c40f" stroke="#2c3e50" stroke-width="2"/>`;
  return `<div style="${WRAP_STYLE}">${svg(stanga + dreaptaGhid + corp, 130, 130, "0 0 64 64")}</div>`;
}

/** Baloane de colorat, fiecare cu eticheta culorii dedesubt. */
export function baloane(culori: string[]): string | null {
  const valide = culori.filter((c) => PALETA[c]);
  if (!valide.length || valide.length !== culori.length) return null;
  const cards = valide
    .map((c) => {
      const hex = PALETA[c];
      const balonSvg = svg(
        `<ellipse cx="35" cy="38" rx="26" ry="32" fill="#ffffff" stroke="#2c3e50" stroke-width="3"/>` +
          `<polygon points="35,70 30,76 40,76" fill="#2c3e50"/>` +
          `<path d="M 35 76 Q 25 84, 35 92" fill="none" stroke="#2c3e50" stroke-width="2"/>`,
        60,
        82,
        "0 0 70 95",
      );
      return (
        `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">` +
        balonSvg +
        `<span style="padding:2px 10px;border-radius:14px;font-weight:bold;font-size:0.8rem;color:#fff;background:${hex}">${c.toUpperCase()}</span>` +
        `</div>`
      );
    })
    .join("");
  return `<div style="${WRAP_STYLE}">${cards}</div>`;
}
