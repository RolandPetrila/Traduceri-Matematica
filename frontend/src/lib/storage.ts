import type { HistoryEntry, ConversionHistoryEntry } from "./types";

// --- Translation History ---
const HISTORY_KEY = "sistem_traduceri_history";
const MAX_HISTORY = 20; // Keep low — each entry has full HTML (~10-20KB)

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(entry: HistoryEntry): void {
  const history = getHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // localStorage full — remove oldest entries and retry
    while (history.length > 5) {
      history.pop();
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        return;
      } catch {
        continue;
      }
    }
    // Still full — clear everything
    localStorage.removeItem(HISTORY_KEY);
  }
}

export function getHistoryEntry(id: string): HistoryEntry | undefined {
  return getHistory().find((e) => e.id === id);
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// --- Conversion History ---
const CONV_HISTORY_KEY = "sistem_traduceri_conversions";
const MAX_CONV_HISTORY = 20;

export function getConversionHistory(): ConversionHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONV_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addConversionToHistory(entry: ConversionHistoryEntry): void {
  const history = getConversionHistory();
  history.unshift(entry);
  if (history.length > MAX_CONV_HISTORY) history.length = MAX_CONV_HISTORY;
  try {
    localStorage.setItem(CONV_HISTORY_KEY, JSON.stringify(history));
  } catch {
    while (history.length > 5) {
      history.pop();
      try {
        localStorage.setItem(CONV_HISTORY_KEY, JSON.stringify(history));
        return;
      } catch {
        continue;
      }
    }
    localStorage.removeItem(CONV_HISTORY_KEY);
  }
}

export function clearConversionHistory(): void {
  localStorage.removeItem(CONV_HISTORY_KEY);
}
