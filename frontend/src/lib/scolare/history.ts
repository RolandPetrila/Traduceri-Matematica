/**
 * Anti-repetare pt fișele „Școlare" — semnătură canonică + istoric în localStorage
 * (modelul P4 Planșe `history.js`). Garanția „niciodată exact aceeași fișă" e în cod:
 * generează → semnătură → dacă e în istoric, re-roll cu listă de evitat → salvează.
 * Logică PURĂ + guard localStorage (SSR-safe). Vezi docs/PLAN_SCOLARE_2026-08-07.md §4.3/D6.
 */

const STORAGE_KEY = "scolare_history_v1";
const FIFO_CAP = 300; // per bucket, ca P4

type Bucket = { sig: string; stems: string[] }[];
type Store = Record<string, Bucket>;

/** Cheia de bucket per (ciclu/nivel/nod). */
export function bucketKey(
  cycleId: string,
  levelId: string,
  nodeId: string,
): string {
  return `${cycleId}/${levelId}/${nodeId}`;
}

/** Elimină secțiunea de barem/soluții (pt semnătură contează enunțul, nu răspunsurile). */
function stripBarem(text: string): string {
  const m = text.search(/\n\s*(#+\s*)?(barem|solu[țt]ii|r[ăa]spunsuri)\b/i);
  return m >= 0 ? text.slice(0, m) : text;
}

/** Normalizează enunțul: minuscule, spații colapsate, fără spații de margine. */
function normalize(text: string): string {
  return stripBarem(text).toLowerCase().replace(/\s+/g, " ").trim();
}

/** Hash determinist FNV-1a 32-bit → hex (fără crypto, funcționează offline). */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Semnătura canonică a unei fișe (pe enunț, fără barem). */
export function signature(text: string): string {
  return fnv1a(normalize(text));
}

/** Extrage enunțurile scurte (pt lista de evitat) — primele linii numerotate. */
export function extractStems(text: string, max = 8): string[] {
  const stems: string[] = [];
  for (const line of stripBarem(text).split("\n")) {
    const m = line.match(/^\s*\d+[.)]\s*(.+)/);
    if (m) stems.push(m[1].trim().slice(0, 80));
    if (stems.length >= max) break;
  }
  return stems;
}

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / indisponibil → ignoră (anti-repetare e plasă, nu blocant) */
  }
}

/** True dacă semnătura a mai fost generată în acest bucket. */
export function isDuplicate(bucket: string, sig: string): boolean {
  return readStore()[bucket]?.some((e) => e.sig === sig) ?? false;
}

/** Lista de enunțuri de evitat (cele mai recente din bucket, plafonate). */
export function avoidList(bucket: string, max = 20): string[] {
  const entries = readStore()[bucket] || [];
  const stems = entries.flatMap((e) => e.stems);
  // cele mai recente primele
  return stems.slice(-max);
}

/** Salvează semnătura + enunțurile în istoric (FIFO cap). */
export function record(bucket: string, sig: string, stems: string[]): void {
  const store = readStore();
  const arr = store[bucket] || [];
  arr.push({ sig, stems });
  while (arr.length > FIFO_CAP) arr.shift();
  store[bucket] = arr;
  writeStore(store);
}

/** Șterge istoricul (pt teste / reset). */
export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
