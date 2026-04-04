"use client";

import { useState, useRef, useEffect } from "react";
import FileUpload from "@/components/traduceri/FileUpload";
import LanguageSelector from "@/components/traduceri/LanguageSelector";
import PreviewPanel from "@/components/traduceri/PreviewPanel";
import ProgressBar from "@/components/traduceri/ProgressBar";
import Dictionary from "@/components/traduceri/Dictionary";
import { addToHistory } from "@/lib/storage";
import { logError, logAction, logInfo } from "@/lib/monitoring";
import { validateTranslationOutput } from "@/lib/validator";
import EngineSelector, { type TranslateEngine } from "@/components/traduceri/EngineSelector";
import BatchPanel from "@/components/traduceri/BatchPanel";
import DocumentViewer from "@/components/traduceri/DocumentViewer";
import DeeplUsage from "@/components/traduceri/DeeplUsage";

import { API_URL } from "@/lib/api-url";

const STEPS = [
  { at: 5, label: "Se incarca fisierele..." },
  { at: 15, label: "Se trimite catre server..." },
  { at: 30, label: "OCR — se extrage textul din imagine..." },
  { at: 60, label: "Se genereaza figurile SVG..." },
  { at: 80, label: "Se construieste documentul..." },
  { at: 90, label: "Se finalizeaza..." },
];

export default function TraduceriPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [sourceLang, setSourceLang] = useState("ro");
  const [targetLang, setTargetLang] = useState("sk");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [structuredPages, setStructuredPages] = useState<unknown[] | null>(null);
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [translateEngine, setTranslateEngine] = useState<TranslateEngine>("deepl");
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setStepLabel(STEPS[0].label);
    setError(null);
    setResult(null);
    setStructuredPages(null);
    setOriginalFiles([...files]);

    // Simulated progress with step labels
    let currentStep = 0;
    progressTimer.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 3 + 0.5;
        if (next > 92) return prev;
        const step = STEPS.findIndex((s) => s.at > next);
        if (step > 0 && step - 1 !== currentStep) {
          currentStep = step - 1;
          setStepLabel(STEPS[currentStep].label);
        }
        return next;
      });
    }, 800);

    logAction("OCR pornit", {
      fileCount: files.length,
      fileNames: files.map(f => f.name),
      fileSizes: files.map(f => f.size),
      sourceLang,
    });

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("source_lang", sourceLang);

    try {
      const res = await fetch(`${API_URL}/api/ocr`, {
        method: "POST",
        body: formData,
      });

      let data;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (!res.ok) {
          throw new Error(`Server error ${res.status}: ${text.substring(0, 200)}`);
        }
        throw new Error("Raspuns neasteptat de la server (nu JSON)");
      }

      if (!res.ok) {
        throw new Error(data?.error || `Eroare server: ${res.status}`);
      }

      const htmlResult = data.html || null;
      if (!htmlResult) {
        throw new Error("Raspunsul nu contine HTML");
      }

      validateTranslationOutput(data);

      setResult(htmlResult);
      setStructuredPages(data.structured_pages || null);
      setProgress(100);
      setStepLabel("Complet!");

      logInfo("OCR reusit", {
        pages: data.pages || files.length,
        duration_ms: data.duration_ms || 0,
        sourceLang,
        fileNames: files.map(f => f.name),
      });

      // Save to history
      addToHistory({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        files: files.map((f) => f.name),
        source_lang: sourceLang,
        target_lang: sourceLang,
        status: data.status || "success",
        duration_ms: data.duration_ms || 0,
        pages: data.pages || files.length,
        html: htmlResult,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare necunoscuta";
      setError(message);
      logError(message, { source: "ocr", context: { sourceLang, fileCount: files.length } });
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

      {/* Engine selector + Process button */}
      <div className="flex flex-col items-center gap-3">
        <EngineSelector engine={translateEngine} onEngineChange={setTranslateEngine} />
        <button
          onClick={handleProcess}
          disabled={files.length === 0 || isProcessing}
          aria-label="Proceseaza fisierele selectate"
          aria-busy={isProcessing}
          className="chalk-btn text-xl px-8 py-3 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Se proceseaza..." : "Proceseaza"}
        </button>
      </div>

      {/* Progress */}
      <div aria-live="polite" aria-atomic="true">
        {isProcessing && <ProgressBar progress={progress} label={stepLabel} />}
      </div>

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

      {/* Success message */}
      {result && !isProcessing && !error && (
        <div className="rounded-lg p-4 text-center" style={{ background: "rgba(74, 222, 128, 0.15)", border: "1px solid #4ade80" }}>
          <p className="text-lg font-bold" style={{ color: "#4ade80" }}>
            Document procesat!
          </p>
          <p className="text-sm opacity-70 mt-1">
            Foloseste butoanele Original / RO / SK pentru a naviga intre variante.
          </p>
        </div>
      )}

      {/* Document Viewer with 3-step method (or fallback to PreviewPanel) */}
      {result && structuredPages ? (
        <DocumentViewer
          structuredPages={structuredPages as never[]}
          fullHtml={result}
          sourceLang={sourceLang}
          initialTargetLang={targetLang}
          translateEngine={translateEngine}
          filename={files[0]?.name?.replace(/\.[^.]+$/, "") || "traducere"}
          originalFiles={originalFiles}
        />
      ) : result ? (
        <PreviewPanel
          originalFiles={files}
          translatedHtml={result}
          engineName={translateEngine}
        />
      ) : null}

      {/* Batch processing */}
      <BatchPanel sourceLang={sourceLang} targetLang={targetLang} translateEngine={translateEngine} />

      {/* Dictionary panel */}
      <Dictionary sourceLang={sourceLang} targetLang={targetLang} />

      {/* DeepL usage counter */}
      <DeeplUsage />
    </div>
  );
}
