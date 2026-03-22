import type { HistoryEntry } from "./types";

const HISTORY_KEY = "sistem_traduceri_history";
const MAX_HISTORY = 100;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
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
