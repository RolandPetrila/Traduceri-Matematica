"use client";

import { useState, useEffect } from "react";
import { getHistory, clearHistory, getConversionHistory, clearConversionHistory } from "@/lib/storage";
import type { HistoryEntry, ConversionHistoryEntry } from "@/lib/types";
import HistoryDetail from "./HistoryDetail";

type ViewMode = "traduceri" | "conversii";

export default function HistoryList() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [convEntries, setConvEntries] = useState<ConversionHistoryEntry[]>([]);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("traduceri");

  useEffect(() => {
    setEntries(getHistory());
    setConvEntries(getConversionHistory());
  }, []);

  const handleClearTranslations = () => {
    if (confirm("Stergi tot istoricul de traduceri?")) {
      clearHistory();
      setEntries([]);
      setSelected(null);
    }
  };

  const handleClearConversions = () => {
    if (confirm("Stergi tot istoricul de conversii?")) {
      clearConversionHistory();
      setConvEntries([]);
    }
  };

  if (selected) {
    return <HistoryDetail entry={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-4">
      {/* View mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode("traduceri")}
          className={`chalk-btn text-sm ${viewMode === "traduceri" ? "!border-chalk-yellow !bg-white/10" : ""}`}
        >
          Traduceri ({entries.length})
        </button>
        <button
          onClick={() => setViewMode("conversii")}
          className={`chalk-btn text-sm ${viewMode === "conversii" ? "!border-chalk-yellow !bg-white/10" : ""}`}
        >
          Conversii ({convEntries.length})
        </button>
      </div>

      {/* Translations history */}
      {viewMode === "traduceri" && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-chalk-yellow">
              Istoric traduceri ({entries.length})
            </h3>
            {entries.length > 0 && (
              <button onClick={handleClearTranslations} className="chalk-btn text-sm !text-chalk-red">
                Sterge tot
              </button>
            )}
          </div>

          {entries.length === 0 ? (
            <p className="text-center opacity-40 py-8">
              Nicio traducere in istoric. Efectueaza prima traducere!
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="w-full text-left bg-white/5 hover:bg-white/8 rounded-lg px-4 py-3 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold">
                        {entry.source_lang.toUpperCase()} &rarr; {entry.target_lang.toUpperCase()}
                      </span>
                      <span className="ml-3 text-sm opacity-60">
                        {entry.pages} pagini &middot; {(entry.duration_ms / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        entry.status === "success"
                          ? "bg-green-900/30 text-chalk-green"
                          : entry.status === "partial"
                          ? "bg-yellow-900/30 text-chalk-yellow"
                          : "bg-red-900/30 text-chalk-red"
                      }`}>
                        {entry.status === "success" ? "Succes" : entry.status === "partial" ? "Partial" : "Eroare"}
                      </span>
                      <span className="text-xs opacity-40">
                        {new Date(entry.date).toLocaleDateString("ro-RO", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs opacity-40 truncate">
                    {entry.files.join(", ")}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Conversions history */}
      {viewMode === "conversii" && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-chalk-yellow">
              Istoric conversii ({convEntries.length})
            </h3>
            {convEntries.length > 0 && (
              <button onClick={handleClearConversions} className="chalk-btn text-sm !text-chalk-red">
                Sterge tot
              </button>
            )}
          </div>

          {convEntries.length === 0 ? (
            <p className="text-center opacity-40 py-8">
              Nicio conversie in istoric. Efectueaza prima conversie!
            </p>
          ) : (
            <div className="space-y-2">
              {convEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="w-full text-left bg-white/5 rounded-lg px-4 py-3"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold capitalize">{entry.operation}</span>
                      {entry.target_format && (
                        <span className="ml-2 text-sm opacity-60">
                          &rarr; {entry.target_format.toUpperCase()}
                        </span>
                      )}
                      <span className="ml-3 text-sm opacity-60">
                        {(entry.duration_ms / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        entry.status === "success"
                          ? "bg-green-900/30 text-chalk-green"
                          : "bg-red-900/30 text-chalk-red"
                      }`}>
                        {entry.status === "success" ? "Succes" : "Eroare"}
                      </span>
                      <span className="text-xs opacity-40">
                        {new Date(entry.date).toLocaleDateString("ro-RO", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs opacity-40 truncate">
                    {entry.files.join(", ")} &rarr; {entry.output_filename}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
