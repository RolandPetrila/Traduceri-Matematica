"use client";

import type { HistoryEntry } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { logAction } from "@/lib/monitoring";

interface HistoryDetailProps {
  entry: HistoryEntry;
  onBack: () => void;
}

function downloadAsDocx(html: string, filename: string) {
  const docxContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8">
    <style>body{font-family:Cambria,serif;font-size:12pt}h1,h2,h3{margin-top:1em}svg{max-width:100%}</style>
    </head><body>${html}</body></html>`;
  const blob = new Blob([docxContent], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryDetail({ entry, onBack }: HistoryDetailProps) {
  const handleDownloadHtml = () => {
    if (!entry.html) return;
    const blob = new Blob([entry.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traducere_${entry.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    logAction("Re-download HTML din istoric", { entryId: entry.id });
  };

  const handleDownloadDocx = () => {
    if (!entry.html) return;
    downloadAsDocx(entry.html, `traducere_${entry.id}.docx`);
    logAction("Re-download DOCX din istoric", { entryId: entry.id });
  };

  const handlePrintPdf = () => {
    if (!entry.html) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(entry.html);
      win.document.close();
      setTimeout(() => win.print(), 1500);
    }
    logAction("Re-print PDF din istoric", { entryId: entry.id });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <button onClick={onBack} className="chalk-btn text-sm">
          &larr; Inapoi la istoric
        </button>
        {entry.html && (
          <div className="flex flex-wrap gap-2">
            <button onClick={handleDownloadHtml} className="chalk-btn text-sm">
              HTML
            </button>
            <button onClick={handlePrintPdf} className="chalk-btn text-sm">
              PDF (Print)
            </button>
            <button onClick={handleDownloadDocx} className="chalk-btn text-sm">
              DOCX
            </button>
          </div>
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
