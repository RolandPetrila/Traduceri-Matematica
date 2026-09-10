/**
 * P1 (Faza 4.5a) — Istoric: lista de conversii nu se actualiza live.
 *
 * HistoryList sta montata permanent (display:none/block la schimbare de tab), nu
 * mai citeste localStorage dupa mount. Fara evenimentul de mai jos, o conversie
 * reusita in alt tab nu ar mai aparea in Istoric pana la reload.
 */

import {
  addToHistory,
  addConversionToHistory,
  getHistory,
  getConversionHistory,
} from "./storage";
import type { HistoryEntry, ConversionHistoryEntry } from "./types";

const TRANSLATION_ENTRY: HistoryEntry = {
  id: "t1",
  date: "2026-09-10T10:00:00.000Z",
  source_lang: "ro",
  target_lang: "sk",
  pages: 1,
  duration_ms: 1000,
  status: "success",
  files: ["test.pdf"],
};

const CONVERSION_ENTRY: ConversionHistoryEntry = {
  id: "c1",
  date: "2026-09-10T10:00:00.000Z",
  operation: "convert",
  target_format: "docx",
  duration_ms: 500,
  status: "success",
  files: ["test.pdf"],
  output_filename: "test.docx",
};

describe("storage.ts — evenimentul history-updated", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("addToHistory notifica un listener 'history-updated'", () => {
    const listener = jest.fn();
    window.addEventListener("history-updated", listener);
    addToHistory(TRANSLATION_ENTRY);
    window.removeEventListener("history-updated", listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getHistory()).toHaveLength(1);
  });

  it("addConversionToHistory notifica un listener 'history-updated'", () => {
    const listener = jest.fn();
    window.addEventListener("history-updated", listener);
    addConversionToHistory(CONVERSION_ENTRY);
    window.removeEventListener("history-updated", listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getConversionHistory()).toHaveLength(1);
  });

  it("un listener inregistrat la 'mount' vede intrarea scrisa DUPA inregistrare (fara reload)", () => {
    // Simuleaza HistoryList: citeste o data, apoi asculta evenimentul.
    let seen: ConversionHistoryEntry[] = getConversionHistory();
    const refresh = () => {
      seen = getConversionHistory();
    };
    window.addEventListener("history-updated", refresh);

    expect(seen).toHaveLength(0);
    addConversionToHistory(CONVERSION_ENTRY);
    window.removeEventListener("history-updated", refresh);

    expect(seen).toHaveLength(1);
    expect(seen[0].id).toBe("c1");
  });
});
