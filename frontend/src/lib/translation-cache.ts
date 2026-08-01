/**
 * Translation cache — persistent localStorage with versioning (D13, S11).
 *
 * - Saves translations so Cristina doesn't re-consume DeepL quota
 * - Version number: when pipeline changes (e.g. Sprint 2.2 bbox crop), old cache is ignored
 * - Max ~5 MB, auto-cleanup of oldest entries when full
 */

const CACHE_KEY = "translation_cache";
const CACHE_VERSION = "v3"; // Increment on major pipeline changes (v3: SHA-256 content-hash keys)
const MAX_ENTRIES = 50; // ~5 MB limit (100KB avg per entry)

interface CacheEntry {
  html: string;
  targetLang: string;
  timestamp: number;
  version: string;
}

interface CacheStore {
  version: string;
  entries: Record<string, CacheEntry>;
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Cache key = SHA-256 of each file's first 64KB (content-addressed) + name + size
 * + language pair. Content hashing avoids collisions between two DIFFERENT files
 * that happen to share name + size (the old key used name:size:lastModified,
 * which could alias distinct documents).
 */
async function generateKey(
  files: File[],
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  const signatures = await Promise.all(
    files.map(async (f) => {
      const head = await f.slice(0, 65536).arrayBuffer();
      const hash = await sha256Hex(head);
      return `${f.name}:${f.size}:${hash}`;
    }),
  );
  return `${signatures.sort().join("|")}::${sourceLang}::${targetLang}`;
}

function loadStore(): CacheStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { version: CACHE_VERSION, entries: {} };
    const store: CacheStore = JSON.parse(raw);
    // Invalidate if version changed (S11)
    if (store.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return { version: CACHE_VERSION, entries: {} };
    }
    return store;
  } catch {
    return { version: CACHE_VERSION, entries: {} };
  }
}

function saveStore(store: CacheStore): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full — evict oldest entries and retry
    evictOldest(store, 10);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(store));
    } catch {
      // still full — clear cache
      localStorage.removeItem(CACHE_KEY);
    }
  }
}

function evictOldest(store: CacheStore, count: number): void {
  const entries = Object.entries(store.entries);
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  for (let i = 0; i < Math.min(count, entries.length); i++) {
    delete store.entries[entries[i][0]];
  }
}

/**
 * Get cached translation HTML, or null if not cached.
 */
export async function getCachedTranslation(
  files: File[],
  sourceLang: string,
  targetLang: string,
): Promise<string | null> {
  const store = loadStore();
  const key = await generateKey(files, sourceLang, targetLang);
  const entry = store.entries[key];
  if (entry && entry.version === CACHE_VERSION) {
    return entry.html;
  }
  return null;
}

/**
 * Save a translation to cache.
 */
export async function cacheTranslation(
  files: File[],
  sourceLang: string,
  targetLang: string,
  html: string,
): Promise<void> {
  const store = loadStore();

  // Enforce max entries
  const entryCount = Object.keys(store.entries).length;
  if (entryCount >= MAX_ENTRIES) {
    evictOldest(store, entryCount - MAX_ENTRIES + 5);
  }

  const key = await generateKey(files, sourceLang, targetLang);
  store.entries[key] = {
    html,
    targetLang,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  };

  saveStore(store);
}

/**
 * G2 — Cache CONTENT-based pentru traducerea din editor (F8). Spre deosebire de
 * API-ul File-based de mai sus (import Traduceri, retras), editorul traduce
 * CONȚINUTUL HTML/JSON al documentului, nu un fișier. Cheia = SHA-256 pe
 * conținutul-SURSĂ (auto-invalidare la editarea sursei) + perechea de limbi.
 * Refolosește loadStore/saveStore/evictOldest (versionare + evicție identice).
 */
/** UTF-8 encode fără a depinde de `TextEncoder` (lipsește în jsdom/jest). Întoarce
 *  `Uint8Array<ArrayBuffer>` CONCRET (copie) ca să fie `BufferSource` valid (TS 5.7:
 *  `Uint8Array<ArrayBufferLike>` de la `TextEncoder` nu se potrivește la `digest`). */
function utf8Bytes(str: string): Uint8Array<ArrayBuffer> {
  if (typeof TextEncoder !== "undefined")
    return new Uint8Array(new TextEncoder().encode(str));
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      const c2 = str.charCodeAt(++i);
      c = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
      out.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 0x3f),
        0x80 | ((c >> 6) & 0x3f),
        0x80 | (c & 0x3f),
      );
    } else
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return new Uint8Array(out);
}

async function sha256Text(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", utf8Bytes(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function docKey(hash: string, sourceLang: string, targetLang: string): string {
  return `doc:${hash}::${sourceLang}::${targetLang}`;
}

/** Traducerea persistată (JSON serializat al documentului tradus) sau null. */
export async function getCachedDocTranslation(
  sourceContent: string,
  sourceLang: string,
  targetLang: string,
): Promise<string | null> {
  try {
    const store = loadStore();
    const key = docKey(await sha256Text(sourceContent), sourceLang, targetLang);
    const entry = store.entries[key];
    return entry && entry.version === CACHE_VERSION ? entry.html : null;
  } catch {
    return null; // crypto/localStorage indisponibil → fail-open (re-traduce)
  }
}

/** Salvează traducerea documentului (JSON serializat), cheiată pe conținutul-sursă. */
export async function cacheDocTranslation(
  sourceContent: string,
  sourceLang: string,
  targetLang: string,
  translatedJson: string,
): Promise<void> {
  try {
    const store = loadStore();
    const entryCount = Object.keys(store.entries).length;
    if (entryCount >= MAX_ENTRIES) {
      evictOldest(store, entryCount - MAX_ENTRIES + 5);
    }
    const key = docKey(await sha256Text(sourceContent), sourceLang, targetLang);
    store.entries[key] = {
      html: translatedJson,
      targetLang,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    saveStore(store);
  } catch {
    /* fail-open: cache-ul e o optimizare, nu blocăm traducerea */
  }
}

/**
 * Clear all cached translations.
 */
export function clearTranslationCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Get cache stats for display.
 */
export function getCacheStats(): { entries: number; sizeKB: number } {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { entries: 0, sizeKB: 0 };
    const store: CacheStore = JSON.parse(raw);
    return {
      entries: Object.keys(store.entries).length,
      sizeKB: Math.round(raw.length / 1024),
    };
  } catch {
    return { entries: 0, sizeKB: 0 };
  }
}
