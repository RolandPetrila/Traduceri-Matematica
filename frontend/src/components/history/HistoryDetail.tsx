"use client";

import { useState } from "react";
import type { HistoryEntry } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { logAction } from "@/lib/monitoring";
import { reportFailure, UserFacingError } from "@/lib/failure";
import { API_URL } from "@/lib/api-url";
import { readJson } from "@/lib/json-response";
import { stripVercelFraming } from "@/lib/binary-framing";

interface HistoryDetailProps {
  entry: HistoryEntry;
  onBack: () => void;
}

// H3 (audit 2026-08-10): fostul fallback ("catch { descarcă HTML brut cu
// extensia .docx }") mascase orice eroare de server — userul primea un fișier
// stricat, deschis greșit de Word, fără nicio explicație. Acum propagă eroarea
// reală (mesajul din corpul JSON, dacă serverul îl trimite) — apelantul decide
// ce arată userului, nu mai există fallback silențios.
async function downloadAsDocx(html: string, filename: string) {
  const formData = new FormData();
  const htmlBlob = new Blob([html], { type: "text/html" });
  formData.append("files", htmlBlob, "source.html");
  formData.append("operation", "convert");
  formData.append("target_format", "docx");

  const res = await fetch(`${API_URL}/api/convert`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    let message = "";
    try {
      // Și corpul de EROARE poate veni cu framing Vercel scurs peste el — fără
      // curățare, mesajul real al serverului se pierdea și rămânea doar statusul.
      const data = await readJson<{ error?: string }>(res, "istoric.docx");
      if (data?.error) message = data.error;
    } catch {
      /* corpul nu era JSON — păstrează mesajul generic de mai sus */
    }
    // Mesajul serverului, dacă l-a dat, e mai util decât „Serverul a răspuns cu
    // eroare" — și supraviețuiește pâlniei doar dacă e purtat de eroare.
    if (message) throw new UserFacingError(message);
    throw new Error(`Eroare server: ${res.status}`);
  }
  // Aceeași curățare ca la Convertor (R9): la cold start, runtime-ul Vercel Python
  // scurge framing ÎNAINTEA octeților fișierului, iar DOCX-ul descărcat iese corupt.
  // Istoricul o făcea fără curățare — același bug, un singur modul acoperit
  // (semnalat de auditorul de dovezi).
  const blob = await stripVercelFraming(await res.blob(), "docx");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryDetail({ entry, onBack }: HistoryDetailProps) {
  const [docxError, setDocxError] = useState<string | null>(null);

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

  const handleDownloadDocx = async () => {
    if (!entry.html) return;
    setDocxError(null);
    try {
      await downloadAsDocx(entry.html, `traducere_${entry.id}.docx`);
      logAction("Re-download DOCX din istoric", { entryId: entry.id });
    } catch (err) {
      // FAZA 1: logul exista, dar fără cod → nu apărea la gruparea pe cod și nu
      // avea nici cauză clasificată (rețea vs. date corupte).
      setDocxError(
        reportFailure({
          code: "E-HIST-001",
          flow: "istoric.redownload.docx",
          error: err,
          context: {
            entryId: entry.id,
            htmlLen: entry.html?.length ?? 0,
          },
        }).userMessage,
      );
    }
  };

  const handlePrintPdf = () => {
    if (!entry.html) return;
    const win = window.open("", "_blank");
    if (win) {
      // S2: NU scrie HTML nesanitizat în fereastra nouă (XSS). Același
      // `sanitizeHtml` folosit la preview (linia ~136) — DOMPurify scoate
      // <script>/on*/javascript:, păstrează conținutul + SVG figurilor.
      win.document.write(sanitizeHtml(entry.html));
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

      {docxError && (
        <div
          role="alert"
          className="rounded-md border border-red-400/60 bg-red-500/10 p-2 text-sm text-red-200"
        >
          ⚠ Export DOCX esuat: {docxError}
        </div>
      )}

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
            {entry.source_lang.toUpperCase()} &rarr;{" "}
            {entry.target_lang.toUpperCase()}
          </div>
          <div>
            <span className="opacity-50">Pagini:</span> {entry.pages}
          </div>
          <div>
            <span className="opacity-50">Status:</span>{" "}
            <span
              className={
                entry.status === "success"
                  ? "text-chalk-green"
                  : entry.status === "partial"
                    ? "text-chalk-yellow"
                    : "text-chalk-red"
              }
            >
              {entry.status === "success"
                ? "Succes"
                : entry.status === "partial"
                  ? "Partial"
                  : "Eroare"}
            </span>
          </div>
        </div>
        <div className="text-sm">
          <span className="opacity-50">Fisiere:</span> {entry.files.join(", ")}
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
