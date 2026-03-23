"use client";

import { useState, useRef, useEffect } from "react";
import FileUpload from "@/components/traduceri/FileUpload";
import LanguageSelector from "@/components/traduceri/LanguageSelector";
import PreviewPanel from "@/components/traduceri/PreviewPanel";
import ProgressBar from "@/components/traduceri/ProgressBar";
import Dictionary from "@/components/traduceri/Dictionary";

export default function TraduceriPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [sourceLang, setSourceLang] = useState("ro");
  const [targetLang, setTargetLang] = useState("sk");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const handleTranslate = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    // Simulated progress (OCR + translation takes time)
    progressTimer.current = setInterval(() => {
      setProgress((prev) => (prev < 85 ? prev + Math.random() * 8 : prev));
    }, 800);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("source_lang", sourceLang);
    formData.append("target_lang", targetLang);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Traducerea a esuat");
      }

      // Python serverless returns {results: [{html, markdown, ...}], pages, status}
      const htmlResult =
        data.results?.[0]?.html || data.html || null;

      if (!htmlResult) {
        throw new Error("Raspunsul nu contine HTML tradus");
      }

      // Combine all pages if multiple files
      const allHtml = data.results
        ? data.results.map((r: { html: string }) => r.html).join("\n<hr>\n")
        : htmlResult;

      setResult(allHtml);
      setProgress(100);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare necunoscuta";
      setError(message);
      console.error("Translation error:", err);
    } finally {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Language selection */}
      <LanguageSelector
        sourceLang={sourceLang}
        targetLang={targetLang}
        onSourceChange={setSourceLang}
        onTargetChange={setTargetLang}
      />

      {/* File upload */}
      <FileUpload files={files} onFilesChange={setFiles} />

      {/* Translate button */}
      <div className="text-center">
        <button
          onClick={handleTranslate}
          disabled={files.length === 0 || isProcessing}
          className="chalk-btn text-xl px-8 py-3 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Se traduce..." : "Traduce"}
        </button>
      </div>

      {/* Progress */}
      {isProcessing && <ProgressBar progress={progress} />}

      {/* Error message */}
      {error && (
        <div className="rounded-lg p-4 text-center" style={{ background: "rgba(232, 131, 107, 0.15)", border: "1px solid var(--chalk-red)" }}>
          <p className="text-chalk-red text-lg">Eroare: {error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm opacity-70 hover:opacity-100"
          >
            Inchide
          </button>
        </div>
      )}

      {/* Preview side-by-side */}
      {result && (
        <PreviewPanel
          originalFiles={files}
          translatedHtml={result}
        />
      )}

      {/* Dictionary panel */}
      <Dictionary sourceLang={sourceLang} targetLang={targetLang} />
    </div>
  );
}
