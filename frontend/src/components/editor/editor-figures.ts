/**
 * Figuri geometrice inserabile — paletă SVG-ca-imagine (decizie Roland §17, B 2026-07-27).
 * Fiecare figură = SVG curat (negru pe alb, notații A/B/C, muchii ascunse punctate),
 * inserată ca <img> (data-URI) prin extensia Image → export curat în PDF/HTML/DOCX.
 *
 * M5 (2026-08-04): figuri PARAMETRICE. Fiecare figură plană are `labels` (etichetele
 * vârfurilor, editabile) și `sides` (lungimi de laturi, opționale — apar doar dacă le
 * completezi). `renderFigure(fig, labels, sides)` reconstruiește SVG-ul. Figura rămâne
 * <img> cu SVG → EXPORT NEATINS (aceeași cale ca înainte); parametrii se stochează pe
 * nod (`data-fig-*`) → click pe figură = re-editare (vezi FigureEditDialog). Corpurile
 * geometrice rămân statice (fără etichete parametrice). `svg` = randarea implicită
 * (etichete default, fără laturi) → folosită la thumbnail-ul din paletă și la inserare.
 */

export type Anchor = "start" | "middle" | "end";
/** O etichetă de vârf: poziție + valoare implicită (editabilă). */
export type LabelSlot = {
  x: number;
  y: number;
  anchor?: Anchor;
  default: string;
};
/** Un slot de lungime de latură: poziție + numele laturii (hint în dialog). Valoare = "" implicit. */
export type SideSlot = { x: number; y: number; anchor?: Anchor; name: string };

export type Figure = {
  key: string;
  title: string;
  grup: "Plane" | "Corpuri";
  /** Geometria statică (contur stroke). */
  shapes: string;
  /** Etichetele vârfurilor (editabile). */
  labels: LabelSlot[];
  /** Lungimile laturilor (opționale). */
  sides: SideSlot[];
  /** Randarea implicită (thumbnail paletă + inserare default). */
  svg: string;
};

const VB = "0 0 120 112";
function svgWrap(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" width="120" height="112">${inner}</svg>`;
}

/** Escape minimal pentru text SVG (valorile pot conține <, &, >). */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const t = (x: number, y: number, s: string, anchor: Anchor = "start") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}">${esc(s)}</text>`;

/** shapes = contur (stroke), labelsText = etichete (fill). */
function fig(shapes: string, labelsText = ""): string {
  return svgWrap(
    `<g fill="none" stroke="#111827" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${shapes}</g>` +
      `<g fill="#111827" font-family="Georgia,'Times New Roman',serif" font-size="14">${labelsText}</g>`,
  );
}

/**
 * Reconstruiește SVG-ul unei figuri cu etichetele + laturile date. Lipsă/undefined →
 * cade pe valoarea implicită (etichete) sau se omite (laturi goale). Sursa de adevăr
 * pentru randarea din paletă, din previzualizarea de editare și pentru <img>-ul inserat.
 */
export function renderFigure(
  f: Pick<Figure, "shapes" | "labels" | "sides">,
  labels?: (string | undefined)[],
  sides?: (string | undefined)[],
): string {
  const labelsText = f.labels
    .map((L, i) => {
      const v = labels?.[i];
      const val = v == null || v === "" ? L.default : v;
      return val ? t(L.x, L.y, val, L.anchor) : "";
    })
    .join("");
  const sidesText = f.sides
    .map((S, i) => {
      const v = (sides?.[i] ?? "").trim();
      return v ? t(S.x, S.y, v, S.anchor) : "";
    })
    .join("");
  return fig(f.shapes, labelsText + sidesText);
}

export function defaultLabels(f: Figure): string[] {
  return f.labels.map((l) => l.default);
}
export function emptySides(f: Figure): string[] {
  return f.sides.map(() => "");
}

/** Construiește un Figure calculând `svg` implicit din shapes+labels (fără laturi). */
function make(
  key: string,
  title: string,
  grup: "Plane" | "Corpuri",
  shapes: string,
  labels: LabelSlot[] = [],
  sides: SideSlot[] = [],
): Figure {
  const base = { key, title, grup, shapes, labels, sides };
  return { ...base, svg: renderFigure(base) };
}

/* ────────────────────────────── Figuri plane ────────────────────────────── */

const triunghi = make(
  "triunghi",
  "Triunghi oarecare",
  "Plane",
  `<polygon points="60,16 14,98 106,98"/>`,
  [
    { x: 60, y: 12, anchor: "middle", default: "A" },
    { x: 6, y: 108, default: "B" },
    { x: 108, y: 108, default: "C" },
  ],
  [
    { x: 33, y: 52, anchor: "end", name: "AB" },
    { x: 60, y: 112, anchor: "middle", name: "BC" },
    { x: 87, y: 52, anchor: "start", name: "CA" },
  ],
);

const triunghiDr = make(
  "triunghi-dr",
  "Triunghi dreptunghic",
  "Plane",
  `<polygon points="18,16 18,98 106,98"/><polyline points="18,84 32,84 32,98"/>`,
  [
    { x: 12, y: 14, default: "A" },
    { x: 6, y: 108, default: "B" },
    { x: 108, y: 108, default: "C" },
  ],
  [
    { x: 14, y: 57, anchor: "end", name: "AB" },
    { x: 62, y: 112, anchor: "middle", name: "BC" },
    { x: 66, y: 52, anchor: "start", name: "CA" },
  ],
);

const triunghiEch = make(
  "triunghi-ech",
  "Triunghi echilateral",
  "Plane",
  `<polygon points="60,14 16,96 104,96"/>` +
    `<line x1="36" y1="57" x2="40" y2="53"/><line x1="80" y1="53" x2="84" y2="57"/><line x1="58" y1="96" x2="62" y2="96" stroke-width="2.5"/>`,
  [
    { x: 60, y: 10, anchor: "middle", default: "A" },
    { x: 8, y: 108, default: "B" },
    { x: 106, y: 108, default: "C" },
  ],
  [
    { x: 34, y: 50, anchor: "end", name: "AB" },
    { x: 60, y: 110, anchor: "middle", name: "BC" },
    { x: 86, y: 50, anchor: "start", name: "CA" },
  ],
);

const patrat = make(
  "patrat",
  "Pătrat",
  "Plane",
  `<rect x="28" y="20" width="64" height="64"/>`,
  [
    { x: 22, y: 16, default: "A" },
    { x: 96, y: 16, default: "B" },
    { x: 96, y: 100, default: "C" },
    { x: 22, y: 100, default: "D" },
  ],
  [
    { x: 60, y: 14, anchor: "middle", name: "AB" },
    { x: 96, y: 56, anchor: "start", name: "BC" },
    { x: 60, y: 98, anchor: "middle", name: "CD" },
    { x: 24, y: 56, anchor: "end", name: "DA" },
  ],
);

const dreptunghi = make(
  "dreptunghi",
  "Dreptunghi",
  "Plane",
  `<rect x="14" y="30" width="92" height="52"/>`,
  [
    { x: 8, y: 26, default: "A" },
    { x: 110, y: 26, anchor: "end", default: "B" },
    { x: 110, y: 98, anchor: "end", default: "C" },
    { x: 8, y: 98, default: "D" },
  ],
  [
    { x: 60, y: 24, anchor: "middle", name: "AB" },
    { x: 110, y: 60, anchor: "start", name: "BC" },
    { x: 60, y: 96, anchor: "middle", name: "CD" },
    { x: 10, y: 60, anchor: "end", name: "DA" },
  ],
);

const paralelogram = make(
  "paralelogram",
  "Paralelogram",
  "Plane",
  `<polygon points="34,26 106,26 86,86 14,86"/>`,
  [
    { x: 30, y: 22, default: "A" },
    { x: 108, y: 22, default: "B" },
    { x: 90, y: 100, default: "C" },
    { x: 8, y: 100, default: "D" },
  ],
  [
    { x: 70, y: 20, anchor: "middle", name: "AB" },
    { x: 100, y: 56, anchor: "start", name: "BC" },
    { x: 50, y: 100, anchor: "middle", name: "CD" },
    { x: 20, y: 56, anchor: "end", name: "DA" },
  ],
);

const romb = make(
  "romb",
  "Romb",
  "Plane",
  `<polygon points="60,14 102,58 60,102 18,58"/>` +
    `<line x1="60" y1="14" x2="60" y2="102" stroke-dasharray="4 3"/><line x1="18" y1="58" x2="102" y2="58" stroke-dasharray="4 3"/>`,
  [
    { x: 60, y: 10, anchor: "middle", default: "A" },
    { x: 106, y: 62, default: "B" },
    { x: 60, y: 112, anchor: "middle", default: "C" },
    { x: 4, y: 62, default: "D" },
  ],
  [
    { x: 85, y: 34, anchor: "start", name: "AB" },
    { x: 85, y: 86, anchor: "start", name: "BC" },
    { x: 35, y: 86, anchor: "end", name: "CD" },
    { x: 35, y: 34, anchor: "end", name: "DA" },
  ],
);

const trapez = make(
  "trapez",
  "Trapez",
  "Plane",
  `<polygon points="36,26 84,26 108,92 12,92"/>`,
  [
    { x: 32, y: 22, default: "A" },
    { x: 88, y: 22, default: "B" },
    { x: 110, y: 104, anchor: "end", default: "C" },
    { x: 10, y: 104, default: "D" },
  ],
  [
    { x: 60, y: 20, anchor: "middle", name: "AB" },
    { x: 100, y: 59, anchor: "start", name: "BC" },
    { x: 60, y: 106, anchor: "middle", name: "DC" },
    { x: 20, y: 59, anchor: "end", name: "DA" },
  ],
);

const cerc = make(
  "cerc",
  "Cerc",
  "Plane",
  `<circle cx="58" cy="56" r="42"/><circle cx="58" cy="56" r="1.6" fill="#111827"/><line x1="58" y1="56" x2="100" y2="56"/>`,
  [
    { x: 48, y: 54, default: "O" },
    { x: 76, y: 50, default: "r" },
  ],
  [],
);

/* ─────────────── Corpuri geometrice (statice — fără parametri) ─────────────── */

const cub = make(
  "cub",
  "Cub",
  "Corpuri",
  `<polygon points="28,36 84,36 84,92 28,92"/>` +
    `<line x1="28" y1="36" x2="50" y2="14"/><line x1="84" y1="36" x2="106" y2="14"/><line x1="84" y1="92" x2="106" y2="70"/>` +
    `<line x1="50" y1="14" x2="106" y2="14"/><line x1="106" y1="14" x2="106" y2="70"/>` +
    `<line x1="50" y1="14" x2="50" y2="70" stroke-dasharray="4 3"/><line x1="50" y1="70" x2="106" y2="70" stroke-dasharray="4 3"/><line x1="50" y1="70" x2="28" y2="92" stroke-dasharray="4 3"/>`,
);

const paralelipiped = make(
  "paralelipiped",
  "Paralelipiped dreptunghic",
  "Corpuri",
  `<polygon points="16,44 90,44 90,90 16,90"/>` +
    `<line x1="16" y1="44" x2="34" y2="24"/><line x1="90" y1="44" x2="108" y2="24"/><line x1="90" y1="90" x2="108" y2="70"/>` +
    `<line x1="34" y1="24" x2="108" y2="24"/><line x1="108" y1="24" x2="108" y2="70"/>` +
    `<line x1="34" y1="24" x2="34" y2="70" stroke-dasharray="4 3"/><line x1="34" y1="70" x2="108" y2="70" stroke-dasharray="4 3"/><line x1="34" y1="70" x2="16" y2="90" stroke-dasharray="4 3"/>`,
);

const cilindru = make(
  "cilindru",
  "Cilindru",
  "Corpuri",
  `<ellipse cx="60" cy="22" rx="34" ry="11"/>` +
    `<line x1="26" y1="22" x2="26" y2="88"/><line x1="94" y1="22" x2="94" y2="88"/>` +
    `<path d="M 26,88 A 34,11 0 0 0 94,88"/>` +
    `<path d="M 26,88 A 34,11 0 0 1 94,88" stroke-dasharray="4 3"/>`,
);

const con = make(
  "con",
  "Con",
  "Corpuri",
  `<line x1="60" y1="12" x2="26" y2="90"/><line x1="60" y1="12" x2="94" y2="90"/>` +
    `<path d="M 26,90 A 34,11 0 0 0 94,90"/>` +
    `<path d="M 26,90 A 34,11 0 0 1 94,90" stroke-dasharray="4 3"/>`,
);

const sfera = make(
  "sfera",
  "Sferă",
  "Corpuri",
  `<circle cx="60" cy="56" r="42"/>` +
    `<path d="M 18,56 A 42,13 0 0 0 102,56"/>` +
    `<path d="M 18,56 A 42,13 0 0 1 102,56" stroke-dasharray="4 3"/>` +
    `<circle cx="60" cy="56" r="1.6" fill="#111827"/>`,
);

const piramida = make(
  "piramida",
  "Piramidă",
  "Corpuri",
  `<line x1="60" y1="12" x2="22" y2="82"/><line x1="60" y1="12" x2="84" y2="82"/><line x1="60" y1="12" x2="102" y2="60"/>` +
    `<polyline points="22,82 84,82 102,60"/>` +
    `<line x1="60" y1="12" x2="40" y2="60" stroke-dasharray="4 3"/>` +
    `<polyline points="22,82 40,60 102,60" stroke-dasharray="4 3"/>`,
);

const prisma = make(
  "prisma",
  "Prismă triunghiulară",
  "Corpuri",
  `<polygon points="30,90 78,90 54,42"/>` +
    `<line x1="30" y1="90" x2="50" y2="74"/><line x1="78" y1="90" x2="98" y2="74"/><line x1="54" y1="42" x2="74" y2="26"/>` +
    `<polyline points="50,74 74,26 98,74"/>` +
    `<line x1="50" y1="74" x2="98" y2="74" stroke-dasharray="4 3"/>`,
);

export const FIGURES: Figure[] = [
  triunghi,
  triunghiDr,
  triunghiEch,
  patrat,
  dreptunghi,
  paralelogram,
  romb,
  trapez,
  cerc,
  cub,
  paralelipiped,
  cilindru,
  con,
  sfera,
  piramida,
  prisma,
];

/** Caută o figură după cheie (pt re-editare din parametrii stocați pe nod). */
export function figureByKey(key: string): Figure | undefined {
  return FIGURES.find((f) => f.key === key);
}

/** Data-URI (base64) pt <img src>. Suportă și diacritice în etichete (UTF-8 → base64). */
export function figureDataUri(svgStr: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`;
}
