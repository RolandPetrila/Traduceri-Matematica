import type { HistoryEntry, ConversionHistoryEntry } from "./types";

// P1 (Faza 4.5a): componentele de istoric (HistoryList) stau montate PERMANENT
// (display:none/block, nu unmount/remount la schimbare de tab) — citirea din
// localStorage la mount nu se mai repetă niciodată. Notificăm explicit orice
// listener interesat, ca lista să se actualizeze live fără reload.
function notifyHistoryUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("history-updated"));
  }
}

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
    let saved = false;
    while (history.length > 5) {
      history.pop();
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        saved = true;
        break;
      } catch {
        continue;
      }
    }
    // Still full — clear everything
    if (!saved) localStorage.removeItem(HISTORY_KEY);
  }
  notifyHistoryUpdated();
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
    let saved = false;
    while (history.length > 5) {
      history.pop();
      try {
        localStorage.setItem(CONV_HISTORY_KEY, JSON.stringify(history));
        saved = true;
        break;
      } catch {
        continue;
      }
    }
    if (!saved) localStorage.removeItem(CONV_HISTORY_KEY);
  }
  notifyHistoryUpdated();
}

export function clearConversionHistory(): void {
  localStorage.removeItem(CONV_HISTORY_KEY);
}
