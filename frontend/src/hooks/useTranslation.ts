import { useState, useCallback } from "react";
import type { TranslationResult } from "@/lib/types";
import { addToHistory } from "@/lib/storage";

interface UseTranslationReturn {
  isProcessing: boolean;
  progress: number;
  result: TranslationResult | null;
  error: string | null;
  translate: (files: File[], sourceLang: string, targetLang: string) => Promise<void>;
  reset: () => void;
}

export function useTranslation(): UseTranslationReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (
    files: File[],
    sourceLang: string,
    targetLang: string
  ) => {
    setIsProcessing(true);
    setProgress(10);
    setError(null);
    setResult(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("source_lang", sourceLang);
    formData.append("target_lang", targetLang);

    try {
      setProgress(30);

      const res = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data: TranslationResult = await res.json();
      setResult(data);
      setProgress(100);

      // Save to history
      addToHistory({
        id: data.id,
        date: new Date().toISOString(),
        files: files.map((f) => f.name),
        source_lang: sourceLang,
        target_lang: targetLang,
        status: data.status,
        duration_ms: data.duration_ms,
        pages: data.pages,
        html: data.html,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return { isProcessing, progress, result, error, translate, reset };
}
