"use client";

import type { HistoryEntry } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";

interface HistoryDetailProps {
  entry: HistoryEntry;
  onBack: () => void;
}

export default function HistoryDetail({ entry, onBack }: HistoryDetailProps) {
  const handleDownload = () => {
    if (!entry.html) return;
    const blob = new Blob([entry.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traducere_${entry.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="chalk-btn text-sm">
          &larr; Inapoi la istoric
        </button>
        {entry.html && (
          <button onClick={handleDownload} className="chalk-btn text-sm">
            &#x2B07; Re-descarca HTML
          </button>
        )}
      </div>

      {/* Details card */}
      <div className="bg-white/5 rounded-lg p-4 space-y-2">
        <h3 className="text-lg font-bold text-chalk-yellow">
          Traducere #{entry.id}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="opacity-50">Data:</span>{" "}
            {new Date(entry.date).toLocaleString("ro-RO")}
          </div>
          <div>
            <span className="opacity-50">Durata:</span>{" "}
            {(entry.duration_ms / 1000).toFixed(1)} secunde
          </div>
          <div>
            <span className="opacity-50">Limbi:</span>{" "}
            {entry.source_lang.toUpperCase()} &rarr; {entry.target_lang.toUpperCase()}
          </div>
          <div>
            <span className="opacity-50">Pagini:</span> {entry.pages}
          </div>
          <div>
            <span className="opacity-50">Status:</span>{" "}
            <span className={
              entry.status === "success" ? "text-chalk-green" :
              entry.status === "partial" ? "text-chalk-yellow" : "text-chalk-red"
            }>
              {entry.status === "success" ? "Succes" : entry.status === "partial" ? "Partial" : "Eroare"}
            </span>
          </div>
        </div>
        <div className="text-sm">
          <span className="opacity-50">Fisiere:</span>{" "}
          {entry.files.join(", ")}
        </div>
      </div>

      {/* Preview */}
      {entry.html && (
        <div>
          <h4 className="text-sm opacity-60 mb-2">Preview rezultat</h4>
          <div
            className="bg-white rounded-lg p-4 text-gray-900 prose max-w-none max-h-[600px] overflow-auto"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.html) }}
          />
        </div>
      )}
    </div>
  );
}
