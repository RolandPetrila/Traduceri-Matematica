/**
 * Translation cache — persistent localStorage with versioning (D13, S11).
 *
 * - Saves translations so Cristina doesn't re-consume DeepL quota
 * - Version number: when pipeline changes (e.g. Sprint 2.2 bbox crop), old cache is ignored
 * - Max ~5 MB, auto-cleanup of oldest entries when full
 */

const CACHE_KEY = "translation_cache";
const CACHE_VERSION = "v2"; // Increment on major pipeline changes
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

function generateKey(files: File[], sourceLang: string, targetLang: string): string {
  const fileSignature = files
    .map(f => `${f.name}:${f.size}:${f.lastModified}`)
    .sort()
    .join("|");
  return `${fileSignature}::${sourceLang}::${targetLang}`;
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
export function getCachedTranslation(
  files: File[],
  sourceLang: string,
  targetLang: string
): string | null {
  const store = loadStore();
  const key = generateKey(files, sourceLang, targetLang);
  const entry = store.entries[key];
  if (entry && entry.version === CACHE_VERSION) {
    return entry.html;
  }
  return null;
}

/**
 * Save a translation to cache.
 */
export function cacheTranslation(
  files: File[],
  sourceLang: string,
  targetLang: string,
  html: string
): void {
  const store = loadStore();

  // Enforce max entries
  const entryCount = Object.keys(store.entries).length;
  if (entryCount >= MAX_ENTRIES) {
    evictOldest(store, entryCount - MAX_ENTRIES + 5);
  }

  const key = generateKey(files, sourceLang, targetLang);
  store.entries[key] = {
    html,
    targetLang,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  };

  saveStore(store);
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
