/**
 * B (2026-07-27): Figuri geometrice inserabile — paletă SVG-ca-imagine (decizie Roland §17).
 * Fiecare figură = SVG curat (negru pe alb, notații A/B/C, muchii ascunse punctate).
 * Se inserează ca <img> (data-URI) prin extensia Image (allowBase64) → se exportă curat
 * în PDF/HTML (img inline). Nu e editabilă pe foaie (doar redimensionabilă) — vs NodeView
 * parametric (amânat). Stil unic: viewBox 120×112, stroke #111827, etichete serif.
 */

export type Figure = {
  key: string;
  title: string;
  grup: "Plane" | "Corpuri";
  svg: string;
};

const VB = "0 0 120 112";
function svg(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" width="120" height="112">${inner}</svg>`;
}
/** shapes = contur (stroke), labels = text (fill). Muchii ascunse: adaugă stroke-dasharray="4 3". */
function fig(shapes: string, labels = ""): string {
  return svg(
    `<g fill="none" stroke="#111827" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${shapes}</g>` +
      `<g fill="#111827" font-family="Georgia,'Times New Roman',serif" font-size="14">${labels}</g>`,
  );
}
const t = (x: number, y: number, s: string, anchor = "start") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}">${s}</text>`;

// ---- Figuri plane ----
const triunghi = fig(
  `<polygon points="60,16 14,98 106,98"/>`,
  t(60, 12, "A", "middle") + t(6, 108, "B") + t(108, 108, "C"),
);
const triunghiDr = fig(
  `<polygon points="18,16 18,98 106,98"/><polyline points="18,84 32,84 32,98"/>`,
  t(12, 14, "A") + t(6, 108, "B") + t(108, 108, "C"),
);
const triunghiEch = fig(
  `<polygon points="60,14 16,96 104,96"/>` +
    `<line x1="36" y1="57" x2="40" y2="53"/><line x1="80" y1="53" x2="84" y2="57"/><line x1="58" y1="96" x2="62" y2="96" stroke-width="2.5"/>`,
  t(60, 10, "A", "middle") + t(8, 108, "B") + t(106, 108, "C"),
);
const patrat = fig(
  `<rect x="28" y="20" width="64" height="64"/>`,
  t(22, 16, "A") + t(96, 16, "B") + t(96, 100, "C") + t(22, 100, "D"),
);
const dreptunghi = fig(
  `<rect x="14" y="30" width="92" height="52"/>`,
  t(8, 26, "A") +
    t(110, 26, "B", "end") +
    t(110, 98, "C", "end") +
    t(8, 98, "D"),
);
const paralelogram = fig(
  `<polygon points="34,26 106,26 86,86 14,86"/>`,
  t(30, 22, "A") + t(108, 22, "B") + t(90, 100, "C") + t(8, 100, "D"),
);
const romb = fig(
  `<polygon points="60,14 102,58 60,102 18,58"/>` +
    `<line x1="60" y1="14" x2="60" y2="102" stroke-dasharray="4 3"/><line x1="18" y1="58" x2="102" y2="58" stroke-dasharray="4 3"/>`,
  t(60, 10, "A", "middle") +
    t(106, 62, "B") +
    t(60, 112, "C", "middle") +
    t(4, 62, "D"),
);
const trapez = fig(
  `<polygon points="36,26 84,26 108,92 12,92"/>`,
  t(32, 22, "A") + t(88, 22, "B") + t(110, 104, "C", "end") + t(10, 104, "D"),
);
const cerc = fig(
  `<circle cx="58" cy="56" r="42"/><circle cx="58" cy="56" r="1.6" fill="#111827"/><line x1="58" y1="56" x2="100" y2="56"/>`,
  t(48, 54, "O") + t(76, 50, "r"),
);

// ---- Corpuri geometrice (muchii ascunse = punctate) ----
const cub = fig(
  `<polygon points="28,36 84,36 84,92 28,92"/>` +
    `<line x1="28" y1="36" x2="50" y2="14"/><line x1="84" y1="36" x2="106" y2="14"/><line x1="84" y1="92" x2="106" y2="70"/>` +
    `<line x1="50" y1="14" x2="106" y2="14"/><line x1="106" y1="14" x2="106" y2="70"/>` +
    `<line x1="50" y1="14" x2="50" y2="70" stroke-dasharray="4 3"/><line x1="50" y1="70" x2="106" y2="70" stroke-dasharray="4 3"/><line x1="50" y1="70" x2="28" y2="92" stroke-dasharray="4 3"/>`,
);
const paralelipiped = fig(
  `<polygon points="16,44 90,44 90,90 16,90"/>` +
    `<line x1="16" y1="44" x2="34" y2="24"/><line x1="90" y1="44" x2="108" y2="24"/><line x1="90" y1="90" x2="108" y2="70"/>` +
    `<line x1="34" y1="24" x2="108" y2="24"/><line x1="108" y1="24" x2="108" y2="70"/>` +
    `<line x1="34" y1="24" x2="34" y2="70" stroke-dasharray="4 3"/><line x1="34" y1="70" x2="108" y2="70" stroke-dasharray="4 3"/><line x1="34" y1="70" x2="16" y2="90" stroke-dasharray="4 3"/>`,
);
const cilindru = fig(
  `<ellipse cx="60" cy="22" rx="34" ry="11"/>` +
    `<line x1="26" y1="22" x2="26" y2="88"/><line x1="94" y1="22" x2="94" y2="88"/>` +
    `<path d="M 26,88 A 34,11 0 0 0 94,88"/>` +
    `<path d="M 26,88 A 34,11 0 0 1 94,88" stroke-dasharray="4 3"/>`,
);
const con = fig(
  `<line x1="60" y1="12" x2="26" y2="90"/><line x1="60" y1="12" x2="94" y2="90"/>` +
    `<path d="M 26,90 A 34,11 0 0 0 94,90"/>` +
    `<path d="M 26,90 A 34,11 0 0 1 94,90" stroke-dasharray="4 3"/>`,
);
const sfera = fig(
  `<circle cx="60" cy="56" r="42"/>` +
    `<path d="M 18,56 A 42,13 0 0 0 102,56"/>` +
    `<path d="M 18,56 A 42,13 0 0 1 102,56" stroke-dasharray="4 3"/>` +
    `<circle cx="60" cy="56" r="1.6" fill="#111827"/>`,
);
const piramida = fig(
  `<line x1="60" y1="12" x2="22" y2="82"/><line x1="60" y1="12" x2="84" y2="82"/><line x1="60" y1="12" x2="102" y2="60"/>` +
    `<polyline points="22,82 84,82 102,60"/>` +
    `<line x1="60" y1="12" x2="40" y2="60" stroke-dasharray="4 3"/>` +
    `<polyline points="22,82 40,60 102,60" stroke-dasharray="4 3"/>`,
);
const prisma = fig(
  `<polygon points="30,90 78,90 54,42"/>` +
    `<line x1="30" y1="90" x2="50" y2="74"/><line x1="78" y1="90" x2="98" y2="74"/><line x1="54" y1="42" x2="74" y2="26"/>` +
    `<polyline points="50,74 74,26 98,74"/>` +
    `<line x1="50" y1="74" x2="98" y2="74" stroke-dasharray="4 3"/>`,
);

export const FIGURES: Figure[] = [
  { key: "triunghi", title: "Triunghi oarecare", grup: "Plane", svg: triunghi },
  {
    key: "triunghi-dr",
    title: "Triunghi dreptunghic",
    grup: "Plane",
    svg: triunghiDr,
  },
  {
    key: "triunghi-ech",
    title: "Triunghi echilateral",
    grup: "Plane",
    svg: triunghiEch,
  },
  { key: "patrat", title: "Pătrat", grup: "Plane", svg: patrat },
  { key: "dreptunghi", title: "Dreptunghi", grup: "Plane", svg: dreptunghi },
  {
    key: "paralelogram",
    title: "Paralelogram",
    grup: "Plane",
    svg: paralelogram,
  },
  { key: "romb", title: "Romb", grup: "Plane", svg: romb },
  { key: "trapez", title: "Trapez", grup: "Plane", svg: trapez },
  { key: "cerc", title: "Cerc", grup: "Plane", svg: cerc },
  { key: "cub", title: "Cub", grup: "Corpuri", svg: cub },
  {
    key: "paralelipiped",
    title: "Paralelipiped dreptunghic",
    grup: "Corpuri",
    svg: paralelipiped,
  },
  { key: "cilindru", title: "Cilindru", grup: "Corpuri", svg: cilindru },
  { key: "con", title: "Con", grup: "Corpuri", svg: con },
  { key: "sfera", title: "Sferă", grup: "Corpuri", svg: sfera },
  { key: "piramida", title: "Piramidă", grup: "Corpuri", svg: piramida },
  {
    key: "prisma",
    title: "Prismă triunghiulară",
    grup: "Corpuri",
    svg: prisma,
  },
];

/** Data-URI (base64) pt <img src>. SVG-urile sunt ASCII → btoa e sigur. */
export function figureDataUri(svgStr: string): string {
  return `data:image/svg+xml;base64,${btoa(svgStr)}`;
}
