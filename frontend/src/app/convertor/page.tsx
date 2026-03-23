"use client";

import { useState, useRef, useEffect } from "react";
import ProgressBar from "@/components/traduceri/ProgressBar";
import { logAction, logInfo, logError } from "@/lib/monitoring";
import { addConversionToHistory } from "@/lib/storage";

const CONVERSION_MAP: Record<string, string[]> = {
  "pdf": ["docx", "html", "jpg", "png"],
  "docx": ["pdf", "html"],
  "jpg": ["pdf", "png"],
  "png": ["pdf", "jpg"],
  "md": ["html", "pdf"],
  "html": ["pdf", "md"],
};

const OPERATIONS = [
  { id: "convert", label: "Conversie", icon: "\u{1F504}" },
  { id: "merge", label: "Merge", icon: "\u{1F4CE}" },
  { id: "split", label: "Split", icon: "\u{2702}" },
  { id: "compress", label: "Compress", icon: "\u{1F4E6}" },
  { id: "edit-pdf", label: "Editare PDF", icon: "\u{270F}" },
];

const PDF_EDIT_ACTIONS = [
  { id: "rotate", label: "Rotire pagini", icon: "\u{1F504}", description: "Roteste paginile selectate (90/180/270 grade)" },
  { id: "delete", label: "Stergere pagini", icon: "\u{1F5D1}", description: "Sterge paginile selectate din PDF" },
  { id: "reorder", label: "Reordonare", icon: "\u{2195}", description: "Schimba ordinea paginilor" },
  { id: "optimize", label: "Optimizare", icon: "\u{26A1}", description: "Reduce marimea fisierului" },
  { id: "watermark", label: "Watermark", icon: "\u{1F4A7}", description: "Adauga text watermark pe fiecare pagina" },
];

export default function ConvertorPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [operation, setOperation] = useState("convert");
  const [targetFormat, setTargetFormat] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
  }, []);

  // PDF edit state
  const [pdfAction, setPdfAction] = useState("");
  const [rotateAngle, setRotateAngle] = useState("90");
  const [pageRange, setPageRange] = useState("");
  const [watermarkText, setWatermarkText] = useState("");
  const [reorderSequence, setReorderSequence] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectedFormat = files.length > 0
    ? files[0].name.split(".").pop()?.toLowerCase() || ""
    : "";

  const availableTargets = CONVERSION_MAP[detectedFormat] || [];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(dropped);
    setTargetFormat("");
    setResult(null);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setResult(null);
    setProgress(0);
    setProgressLabel("Se pregatesc fisierele...");

    logAction("Conversie pornita", {
      operation,
      targetFormat,
      fileCount: files.length,
      fileNames: files.map(f => f.name),
      fileSizes: files.map(f => f.size),
      pdfAction: operation === "edit-pdf" ? pdfAction : undefined,
    });

    // Simulated progress
    let step = 0;
    const labels = ["Se pregatesc fisierele...", "Se trimite catre server...", "Se proceseaza...", "Se finalizeaza..."];
    progressTimer.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 6 + 2;
        if (next > 90) return prev;
        const idx = Math.min(Math.floor(next / 25), labels.length - 1);
        if (idx !== step) { step = idx; setProgressLabel(labels[idx]); }
        return next;
      });
    }, 400);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("operation", operation);
    formData.append("target_format", targetFormat);

    if (operation === "edit-pdf") {
      formData.append("pdf_action", pdfAction);
      if (pdfAction === "rotate") formData.append("rotate_angle", rotateAngle);
      if (pageRange) formData.append("page_range", pageRange);
      if (pdfAction === "watermark") formData.append("watermark_text", watermarkText);
      if (pdfAction === "reorder") formData.append("reorder_sequence", reorderSequence);
    }

    const t0 = Date.now();

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.error || `Eroare server: ${res.status}`);
        }
        const text = await res.text();
        throw new Error(`Eroare conversie: ${res.status} — ${text.substring(0, 200)}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Smart filename from Content-Disposition header or construct one
      const disposition = res.headers.get("content-disposition") || "";
      const serverFilename = disposition.match(/filename="?([^";\n]+)"?/)?.[1];
      const baseName = files[0].name.replace(/\.[^.]+$/, "");
      const ext = operation === "merge" ? "pdf"
        : operation === "compress" ? detectedFormat
        : operation === "split" ? "pdf"
        : operation === "edit-pdf" ? "pdf"
        : targetFormat || "bin";
      a.download = serverFilename || `${baseName}_${operation}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      const duration = Date.now() - t0;
      setProgress(100);
      setProgressLabel("Complet!");
      setResult({ success: true, message: `Fisier procesat cu succes! (${(duration / 1000).toFixed(1)}s)` });

      logInfo("Conversie reusita", {
        operation,
        targetFormat,
        duration_ms: duration,
        outputFile: a.download,
        fileNames: files.map(f => f.name),
      });

      // Save to conversion history
      addConversionToHistory({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        files: files.map(f => f.name),
        operation,
        target_format: targetFormat,
        status: "success",
        duration_ms: duration,
        output_filename: a.download,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare necunoscuta";
      setProgress(0);
      setResult({ success: false, message });
      logError(message, { source: "conversion", context: { operation, targetFormat, fileCount: files.length } });
    } finally {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setIsProcessing(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setTargetFormat("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Operations */}
      <div className="flex flex-wrap gap-2">
        {OPERATIONS.map((op) => (
          <button
            key={op.id}
            onClick={() => { setOperation(op.id); setPdfAction(""); }}
            className={`chalk-btn text-sm ${
              operation === op.id ? "!border-chalk-yellow !bg-white/10" : ""
            }`}
          >
            <span className="mr-1">{op.icon}</span> {op.label}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="drop-zone cursor-pointer relative"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            setFiles(Array.from(e.target.files || []));
            setTargetFormat("");
            setResult(null);
          }}
        />
        {files.length === 0 ? (
          <div>
            <p className="text-2xl mb-2 opacity-60">&#x1F4C1;</p>
            <p className="text-lg">Trage fisierele aici sau click pentru selectie</p>
            <p className="text-sm opacity-40 mt-1">
              Formate: PDF, DOCX, JPG, PNG, MD, HTML
            </p>
          </div>
        ) : (
          <div>
            <p className="text-chalk-yellow font-bold">
              {files.length} fisier(e) selectate
            </p>
            <p className="text-sm opacity-60 mt-1">
              Format detectat: <strong>{detectedFormat.toUpperCase()}</strong>
              {files.length > 1 && ` | ${files.map(f => f.name).join(", ")}`}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); clearFiles(); }}
              className="mt-2 text-xs text-chalk-red hover:opacity-80"
            >
              &#x2715; Sterge selectia
            </button>
          </div>
        )}
      </div>

      {/* Target format — conversie */}
      {operation === "convert" && availableTargets.length > 0 && (
        <div>
          <p className="mb-2 opacity-70">Converteste in:</p>
          <div className="flex gap-2">
            {availableTargets.map((fmt) => (
              <button
                key={fmt}
                onClick={() => setTargetFormat(fmt)}
                className={`chalk-btn ${
                  targetFormat === fmt ? "!border-chalk-yellow !bg-white/10" : ""
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PDF editing options — advanced */}
      {operation === "edit-pdf" && detectedFormat === "pdf" && (
        <div className="space-y-4">
          <p className="opacity-70">Alege operatia PDF:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PDF_EDIT_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => setPdfAction(action.id)}
                className={`chalk-btn text-sm text-left ${
                  pdfAction === action.id ? "!border-chalk-yellow !bg-white/10" : ""
                }`}
              >
                <span className="mr-1">{action.icon}</span> {action.label}
                <span className="block text-xs opacity-50 mt-1">{action.description}</span>
              </button>
            ))}
          </div>

          {/* Page range input */}
          {(pdfAction === "rotate" || pdfAction === "delete") && (
            <div>
              <label className="text-sm opacity-70">Pagini (ex: 1,3,5-8 sau &quot;all&quot;):</label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="all"
                className="w-full bg-white/10 border border-chalk-white/20 rounded px-3 py-2 text-sm mt-1"
              />
            </div>
          )}

          {/* Rotate angle */}
          {pdfAction === "rotate" && (
            <div>
              <label className="text-sm opacity-70">Unghi rotire:</label>
              <div className="flex gap-2 mt-1">
                {["90", "180", "270"].map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setRotateAngle(angle)}
                    className={`chalk-btn text-sm ${
                      rotateAngle === angle ? "!border-chalk-yellow !bg-white/10" : ""
                    }`}
                  >
                    {angle}&deg;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Watermark text */}
          {pdfAction === "watermark" && (
            <div>
              <label className="text-sm opacity-70">Text watermark:</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="CONFIDENTIAL"
                className="w-full bg-white/10 border border-chalk-white/20 rounded px-3 py-2 text-sm mt-1"
              />
            </div>
          )}

          {/* Reorder sequence */}
          {pdfAction === "reorder" && (
            <div>
              <label className="text-sm opacity-70">Ordine noua (ex: 3,1,2,5,4):</label>
              <input
                type="text"
                value={reorderSequence}
                onChange={(e) => setReorderSequence(e.target.value)}
                placeholder="3,1,2,5,4"
                className="w-full bg-white/10 border border-chalk-white/20 rounded px-3 py-2 text-sm mt-1"
              />
            </div>
          )}
        </div>
      )}

      {/* Info for merge */}
      {operation === "merge" && (
        <p className="text-sm opacity-50 text-center">
          Selecteaza mai multe fisiere PDF pentru a le uni intr-un singur document.
        </p>
      )}

      {/* Info for split */}
      {operation === "split" && (
        <div>
          <label className="text-sm opacity-70">Pagini de extras (ex: 1-3,5,7-10):</label>
          <input
            type="text"
            value={pageRange}
            onChange={(e) => setPageRange(e.target.value)}
            placeholder="1-3,5,7-10"
            className="w-full bg-white/10 border border-chalk-white/20 rounded px-3 py-2 text-sm mt-1"
          />
        </div>
      )}

      {/* Progress bar */}
      {isProcessing && <ProgressBar progress={progress} label={progressLabel} />}

      {/* Result message */}
      {result && (
        <div className={`rounded-lg p-4 text-center ${
          result.success
            ? "bg-green-900/20 border border-green-700/30"
            : "bg-red-900/20 border border-red-700/30"
        }`}>
          <p className={result.success ? "text-chalk-green" : "text-chalk-red"}>
            {result.message}
          </p>
        </div>
      )}

      {/* Process button */}
      <div className="text-center">
        <button
          onClick={handleProcess}
          disabled={files.length === 0 || isProcessing || (operation === "convert" && !targetFormat)}
          className="chalk-btn text-xl px-8 py-3 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Se proceseaza..." : "Proceseaza"}
        </button>
      </div>
    </div>
  );
}
