"use client";

import { useState } from "react";

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

export default function ConvertorPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [operation, setOperation] = useState("convert");
  const [targetFormat, setTargetFormat] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const detectedFormat = files.length > 0
    ? files[0].name.split(".").pop()?.toLowerCase() || ""
    : "";

  const availableTargets = CONVERSION_MAP[detectedFormat] || [];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(dropped);
    setTargetFormat("");
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("operation", operation);
    formData.append("target_format", targetFormat);

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Conversion failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted.${targetFormat || "zip"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Conversion error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Operations */}
      <div className="flex flex-wrap gap-2">
        {OPERATIONS.map((op) => (
          <button
            key={op.id}
            onClick={() => setOperation(op.id)}
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
        className="drop-zone cursor-pointer"
        onClick={() => document.getElementById("conv-input")?.click()}
      >
        <input
          id="conv-input"
          type="file"
          multiple
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
        {files.length === 0 ? (
          <div>
            <p className="text-2xl mb-2 opacity-60">&#x1F4C1;</p>
            <p className="text-lg">Trage fisierele aici sau click pentru selectie</p>
          </div>
        ) : (
          <div>
            <p className="text-chalk-yellow font-bold">
              {files.length} fisier(e) selectate
            </p>
            <p className="text-sm opacity-60 mt-1">
              Format detectat: <strong>{detectedFormat.toUpperCase()}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Target format — smart selection */}
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

      {/* PDF editing options */}
      {operation === "edit-pdf" && detectedFormat === "pdf" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {["Rotire pagini", "Stergere pagini", "Reordonare", "Optimizare", "Watermark"].map(
            (action) => (
              <button key={action} className="chalk-btn text-sm">
                {action}
              </button>
            )
          )}
        </div>
      )}

      {/* Process button */}
      <div className="text-center">
        <button
          onClick={handleProcess}
          disabled={files.length === 0 || isProcessing}
          className="chalk-btn text-xl px-8 py-3 disabled:opacity-30"
        >
          {isProcessing ? "Se proceseaza..." : "Proceseaza"}
        </button>
      </div>
    </div>
  );
}
