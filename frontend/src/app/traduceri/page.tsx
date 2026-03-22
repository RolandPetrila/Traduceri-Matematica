"use client";

import { useState } from "react";
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

  const handleTranslate = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("source_lang", sourceLang);
    formData.append("target_lang", targetLang);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Translation failed");

      const data = await res.json();
      setResult(data.html);
      setProgress(100);
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
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
