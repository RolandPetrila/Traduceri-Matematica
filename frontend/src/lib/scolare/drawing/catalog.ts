/**
 * Catalog FIX de obiecte/culori pentru motorul de desen Școlare (grădiniță +
 * primar cl.0-1). AI-ul alege o CHEIE din acest catalog (niciodată markup/culoare
 * brută) — randarea SVG e 100% deterministă, în codul nostru. Vezi
 * docs/PLAN_SCOLARE_DESEN_2026-08-09.md.
 */

/** Nume-culoare (RO) → hex. Contur e mereu negru (#2c3e50), separat de fill. */
export const PALETA: Record<string, string> = {
  rosu: "#e74c3c",
  galben: "#f1c40f",
  albastru: "#0984e3",
  verde: "#27ae60",
  portocaliu: "#e67e22",
  mov: "#8e44ad",
  roz: "#fd79a8",
  maro: "#8b5a2b",
  negru: "#2c3e50",
};

const CONTUR = "#2c3e50";

/** Un obiect desenabil: dat fill-ul interior (hex sau "none"), întoarce markup SVG intern. */
type ObiectSvg = (fill: string) => string;

/** viewBox comun 0 0 64 64 pentru toate obiectele din catalog. */
export const OBIECTE: Record<string, ObiectSvg> = {
  mar: (f) =>
    `<circle cx="32" cy="38" r="18" fill="${f}" stroke="${CONTUR}" stroke-width="3"/>` +
    `<path d="M32 20 Q35 10 39 18" stroke="${CONTUR}" stroke-width="3" fill="none"/>` +
    `<path d="M32 20 Q20 12 32 26" fill="none" stroke="${CONTUR}" stroke-width="2.5"/>`,
  soare: (f) =>
    `<circle cx="32" cy="32" r="16" fill="${f}" stroke="${CONTUR}" stroke-width="3"/>` +
    `<g stroke="${CONTUR}" stroke-width="3" stroke-linecap="round">` +
    `<line x1="32" y1="4" x2="32" y2="12"/><line x1="32" y1="52" x2="32" y2="60"/>` +
    `<line x1="4" y1="32" x2="12" y2="32"/><line x1="52" y1="32" x2="60" y2="32"/>` +
    `<line x1="12" y1="12" x2="18" y2="18"/><line x1="46" y1="46" x2="52" y2="52"/>` +
    `<line x1="12" y1="52" x2="18" y2="46"/><line x1="46" y1="18" x2="52" y2="12"/></g>`,
  stea: (f) =>
    `<polygon points="32,6 39,25 59,25 43,37 49,57 32,45 15,57 21,37 5,25 25,25" fill="${f}" stroke="${CONTUR}" stroke-width="3"/>`,
  floare: (f) =>
    `<g fill="${f}" stroke="${CONTUR}" stroke-width="2.5">` +
    `<circle cx="32" cy="14" r="10"/><circle cx="32" cy="50" r="10"/>` +
    `<circle cx="14" cy="32" r="10"/><circle cx="50" cy="32" r="10"/></g>` +
    `<circle cx="32" cy="32" r="9" fill="${f === "none" ? "none" : "#f1c40f"}" stroke="${CONTUR}" stroke-width="2.5"/>`,
  patrat: (f) =>
    `<rect x="12" y="12" width="40" height="40" rx="3" fill="${f}" stroke="${CONTUR}" stroke-width="3"/>`,
  cerc: (f) =>
    `<circle cx="32" cy="32" r="22" fill="${f}" stroke="${CONTUR}" stroke-width="3"/>`,
  triunghi: (f) =>
    `<polygon points="32,8 58,54 6,54" fill="${f}" stroke="${CONTUR}" stroke-width="3"/>`,
  casa: (f) =>
    `<polygon points="10,58 10,30 32,10 54,30 54,58" fill="${f}" stroke="${CONTUR}" stroke-width="3"/>` +
    `<rect x="26" y="40" width="12" height="18" fill="${CONTUR}"/>`,
  fluture: (f) =>
    `<g fill="${f}" stroke="${CONTUR}" stroke-width="2.5">` +
    `<path d="M32 30 Q10 4 4 30 Q10 52 32 40"/>` +
    `<path d="M32 40 Q10 52 16 60 Q28 62 32 46"/></g>` +
    `<ellipse cx="32" cy="34" rx="4" ry="16" fill="${f === "none" ? "#f1c40f" : f}" stroke="${CONTUR}" stroke-width="2"/>`,
};

/**
 * Puncte fixe (dot-to-dot) per formă — coordonate în viewBox 0 0 200 140.
 * `stea`: 5 vârfuri ale unei stele, ÎN ORDINEA DE CONECTARE „sări-unul" (1→2→3→4→5→1
 * = pentagramă reală când se unesc cu linii drepte) — NU ordinea unghiulară (aia ar
 * desena un pentagon, nu o stea).
 */
export const FORME_UNESTE: Record<string, [number, number][]> = {
  stea: [
    [100, 10],
    [135, 119],
    [43, 51],
    [157, 51],
    [65, 119],
  ],
  triunghi: [
    [100, 15],
    [175, 125],
    [25, 125],
  ],
  patrat: [
    [40, 20],
    [160, 20],
    [160, 120],
    [40, 120],
  ],
  casa: [
    [100, 10],
    [175, 55],
    [175, 130],
    [25, 130],
    [25, 55],
  ],
};
