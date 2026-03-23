import type { HistoryEntry, ConversionHistoryEntry } from "./types";

// --- Translation History ---
const HISTORY_KEY = "sistem_traduceri_history";
const MAX_HISTORY = 100;

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
  if (history.length > MAX_HISTORY) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getHistoryEntry(id: string): HistoryEntry | undefined {
  return getHistory().find((e) => e.id === id);
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// --- Conversion History ---
const CONV_HISTORY_KEY = "sistem_traduceri_conversions";
const MAX_CONV_HISTORY = 100;

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
  if (history.length > MAX_CONV_HISTORY) history.pop();
  localStorage.setItem(CONV_HISTORY_KEY, JSON.stringify(history));
}

export function clearConversionHistory(): void {
  localStorage.removeItem(CONV_HISTORY_KEY);
}
