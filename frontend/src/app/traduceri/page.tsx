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

import { API_URL } from "@/lib/api-url";

const STEPS = [
  { at: 5, label: "Se incarca fisierele..." },
  { at: 15, label: "Se trimite catre server..." },
  { at: 30, label: "OCR — se extrage textul din imagine..." },
  { at: 55, label: "Se traduce textul..." },
  { at: 75, label: "Se genereaza HTML..." },
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
  const [error, setError] = useState<string | null>(null);
  const [translateEngine, setTranslateEngine] = useState<TranslateEngine>("deepl");
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
    setStepLabel(STEPS[0].label);
    setError(null);
    setResult(null);

    // Simulated progress with step labels
    let currentStep = 0;
    progressTimer.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 4 + 1;
        if (next > 92) return prev; // cap at 92% until real response
        // Update step label
        const step = STEPS.findIndex((s) => s.at > next);
        if (step > 0 && step - 1 !== currentStep) {
          currentStep = step - 1;
          setStepLabel(STEPS[currentStep].label);
        }
        return next;
      });
    }, 600);

    logAction("Traducere pornita", {
      fileCount: files.length,
      fileNames: files.map(f => f.name),
      fileSizes: files.map(f => f.size),
      sourceLang,
      targetLang,
    });

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("source_lang", sourceLang);
    formData.append("target_lang", targetLang);
    formData.append("translate_engine", translateEngine);

    // Include dictionary terms if available
    const dictKey = `dict_${sourceLang}_${targetLang}`;
    const dictRaw = localStorage.getItem(dictKey);
    if (dictRaw) {
      formData.append("dictionary", dictRaw);
    }

    try {
      const res = await fetch(`${API_URL}/api/translate`, {
        method: "POST",
        body: formData,
      });

      // Handle non-JSON error responses (Vercel returns HTML on hard crashes)
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

      // Python serverless returns {html (unified), results: [{markdown, ...}], pages, status}
      const htmlResult = data.html || null;

      if (!htmlResult) {
        throw new Error("Raspunsul nu contine HTML tradus");
      }

      // Validate output quality
      validateTranslationOutput(data);

      setResult(htmlResult);
      setProgress(100);
      setStepLabel("Complet!");

      logInfo("Traducere reusita", {
        pages: data.pages || files.length,
        duration_ms: data.duration_ms || 0,
        sourceLang,
        targetLang,
        fileNames: files.map(f => f.name),
      });

      // Save to history
      addToHistory({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        files: files.map((f) => f.name),
        source_lang: sourceLang,
        target_lang: targetLang,
        status: data.status || "success",
        duration_ms: data.duration_ms || 0,
        pages: data.pages || files.length,
        html: htmlResult,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare necunoscuta";
      setError(message);
      logError(message, { source: "translation", context: { sourceLang, targetLang, fileCount: files.length } });
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

      {/* Engine selector + Translate button */}
      <div className="flex flex-col items-center gap-3">
        <EngineSelector engine={translateEngine} onEngineChange={setTranslateEngine} />
        <button
          onClick={handleTranslate}
          disabled={files.length === 0 || isProcessing}
          aria-label="Traduce fisierele selectate"
          aria-busy={isProcessing}
          className="chalk-btn text-xl px-8 py-3 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Se traduce..." : "Traduce"}
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
            Traducere reusita!
          </p>
          <p className="text-sm opacity-70 mt-1">
            Rezultatul e mai jos. Salvat automat in tab-ul Istoric.
          </p>
        </div>
      )}

      {/* Preview side-by-side */}
      {result && (
        <PreviewPanel
          originalFiles={files}
          translatedHtml={result}
          engineName={translateEngine}
        />
      )}

      {/* Dictionary panel */}
      <Dictionary sourceLang={sourceLang} targetLang={targetLang} />
    </div>
  );
}
