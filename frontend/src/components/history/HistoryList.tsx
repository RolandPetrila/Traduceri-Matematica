"use client";

import { useState, useEffect } from "react";
import { getHistory, clearHistory } from "@/lib/storage";
import type { HistoryEntry } from "@/lib/types";
import HistoryDetail from "./HistoryDetail";

export default function HistoryList() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    setEntries(getHistory());
  }, []);

  const handleClear = () => {
    if (confirm("Stergi tot istoricul?")) {
      clearHistory();
      setEntries([]);
      setSelected(null);
    }
  };

  if (selected) {
    return (
      <HistoryDetail
        entry={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-chalk-yellow">
          Istoric traduceri ({entries.length})
        </h3>
        {entries.length > 0 && (
          <button onClick={handleClear} className="chalk-btn text-sm !text-chalk-red">
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
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
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
    </div>
  );
}
