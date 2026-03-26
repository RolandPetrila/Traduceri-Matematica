"use client";

import { useState, useRef } from "react";
import { logAction, logError } from "@/lib/monitoring";
import { API_URL } from "@/lib/api-url";

interface BatchResult {
  filename: string;
  html: string;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
  duration?: number;
}

interface BatchPanelProps {
  sourceLang: string;
  targetLang: string;
  translateEngine: string;
}

export default function BatchPanel({ sourceLang, targetLang, translateEngine }: BatchPanelProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles(selected);
      setResults(selected.map((f) => ({ filename: f.name, html: "", status: "pending" })));
    }
  };

  const translateFile = async (file: File): Promise<{ html: string; duration: number }> => {
    const formData = new FormData();
    formData.append("files", file);
    formData.append("source_lang", sourceLang);
    formData.append("target_lang", targetLang);
    formData.append("translate_engine", translateEngine);

    const dictKey = `dict_${sourceLang}_${targetLang}`;
    const dictRaw = localStorage.getItem(dictKey);
    if (dictRaw) formData.append("dictionary", dictRaw);

    const t0 = Date.now();
    const res = await fetch(`${API_URL}/api/translate`, { method: "POST", body: formData });
    const duration = Date.now() - t0;

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status}: ${text.substring(0, 100)}`);
    }

    const data = await res.json();
    if (!data.html) throw new Error("Raspuns fara HTML");
    return { html: data.html, duration };
  };

  const handleBatch = async () => {
    if (files.length === 0) return;
    setIsRunning(true);
    abortRef.current = false;

    logAction("Batch pornit", { fileCount: files.length, engine: translateEngine });

    for (let i = 0; i < files.length; i++) {
      if (abortRef.current) break;

      setResults((prev) => prev.map((r, idx) =>
        idx === i ? { ...r, status: "processing" } : r
      ));

      try {
        const { html, duration } = await translateFile(files[i]);
        setResults((prev) => prev.map((r, idx) =>
          idx === i ? { ...r, html, status: "done", duration } : r
        ));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Eroare";
        logError(`Batch eroare: ${files[i].name}`, { context: { error: msg } });
        setResults((prev) => prev.map((r, idx) =>
          idx === i ? { ...r, status: "error", error: msg } : r
        ));
      }
    }

    setIsRunning(false);
    logAction("Batch finalizat", { total: files.length });
  };

  const downloadResult = (r: BatchResult) => {
    const blob = new Blob([r.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = r.filename.replace(/\.[^.]+$/, `_${translateEngine}.html`);
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    const done = results.filter((r) => r.status === "done");
    done.forEach((r, i) => setTimeout(() => downloadResult(r), i * 300));
    logAction("Batch download all", { count: done.length });
  };

  const doneCount = results.filter((r) => r.status === "done").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-chalk-white/10">
      <h3 className="text-lg font-bold text-chalk-yellow">Traducere Batch (multi-fisiere)</h3>

      <div className="flex gap-3 items-center flex-wrap">
        <label className="chalk-btn text-sm cursor-pointer">
          Selecteaza fisiere
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.docx"
            onChange={handleFiles}
            className="hidden"
          />
        </label>
        <span className="text-sm opacity-60">
          {files.length > 0 ? `${files.length} fisier(e) selectate` : "Niciun fisier"}
        </span>
      </div>

      {files.length > 0 && (
        <>
          <div className="flex gap-2">
            <button
              onClick={handleBatch}
              disabled={isRunning}
              className="chalk-btn px-6 py-2 disabled:opacity-30"
            >
              {isRunning ? `Se traduce... (${doneCount}/${files.length})` : `Traduce ${files.length} fisiere`}
            </button>
            {isRunning && (
              <button
                onClick={() => { abortRef.current = true; }}
                className="chalk-btn px-4 py-2 text-chalk-red border-chalk-red"
              >
                Stop
              </button>
            )}
            {doneCount > 0 && !isRunning && (
              <button onClick={downloadAll} className="chalk-btn px-4 py-2">
                Descarca toate ({doneCount})
              </button>
            )}
          </div>

          {/* Progress list */}
          <div className="space-y-1">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-1">
                <span className="w-5 text-center">
                  {r.status === "pending" && <span className="opacity-30">-</span>}
                  {r.status === "processing" && <span className="animate-spin inline-block">&#9696;</span>}
                  {r.status === "done" && <span className="text-green-400">&#10003;</span>}
                  {r.status === "error" && <span className="text-chalk-red">&#10007;</span>}
                </span>
                <span className={`flex-1 truncate ${r.status === "processing" ? "text-chalk-yellow" : ""}`}>
                  {r.filename}
                </span>
                {r.duration && (
                  <span className="opacity-40 text-xs">{(r.duration / 1000).toFixed(1)}s</span>
                )}
                {r.status === "done" && (
                  <button onClick={() => downloadResult(r)} className="text-xs text-chalk-yellow hover:underline">
                    Descarca
                  </button>
                )}
                {r.status === "error" && (
                  <span className="text-xs text-chalk-red truncate max-w-[200px]">{r.error}</span>
                )}
              </div>
            ))}
          </div>

          {!isRunning && doneCount > 0 && (
            <div className="text-sm opacity-60 pt-2">
              Rezultat: {doneCount} reusit(e){errorCount > 0 ? `, ${errorCount} eroare(i)` : ""}
            </div>
          )}
        </>
      )}
    </div>
  );
}
