"use client";

import { useState, useRef } from "react";
import { logAction } from "@/lib/monitoring";
import { API_URL } from "@/lib/api-url";

type PreviewMode = "view" | "a4" | "edit";

interface PreviewPanelProps {
  originalFiles: File[];
  translatedHtml: string;
  engineName?: string;
}

async function downloadAsDocx(html: string, filename: string) {
  const formData = new FormData();
  const htmlBlob = new Blob([html], { type: "text/html" });
  formData.append("files", htmlBlob, "traducere.html");
  formData.append("operation", "convert");
  formData.append("target_format", "docx");

  try {
    const res = await fetch(`${API_URL}/api/convert`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function openPrintView(html: string) {
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 1500);
  }
}

export default function PreviewPanel({ originalFiles, translatedHtml, engineName }: PreviewPanelProps) {
  const [mode, setMode] = useState<PreviewMode>("view");
  const [editedHtml, setEditedHtml] = useState(translatedHtml);
  const editorRef = useRef<HTMLDivElement>(null);

  const previewUrl = originalFiles.length > 0
    ? URL.createObjectURL(originalFiles[0])
    : null;

  const currentHtml = editedHtml || translatedHtml;

  const baseName = originalFiles.length > 0
    ? originalFiles[0].name.replace(/\.[^.]+$/, "")
    : "traducere";
  const suffix = engineName ? `_${engineName}` : "";

  async function saveWithDialog(blob: Blob, defaultName: string, mimeType: string) {
    if ("showSaveFilePicker" in window) {
      try {
        const extMap: Record<string, string> = {
          "text/html": "html",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        };
        const ext = extMap[mimeType] || defaultName.split(".").pop() || "html";
        const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: defaultName,
          types: [{ description: ext.toUpperCase(), accept: { [mimeType]: [`.${ext}`] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        logAction("Download (Save As)", { filename: defaultName });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
    logAction("Download", { filename: defaultName });
  }

  const [downloadCount, setDownloadCount] = useState(0);
  const getNumberedName = (ext: string) => {
    const num = downloadCount > 0 ? `_(${downloadCount})` : "";
    return `${baseName}${suffix}${num}.${ext}`;
  };

  const handleDownloadHtml = async () => {
    const blob = new Blob([currentHtml], { type: "text/html" });
    await saveWithDialog(blob, getNumberedName("html"), "text/html");
    setDownloadCount((c) => c + 1);
  };

  const handleDownloadDocx = async () => {
    await downloadAsDocx(currentHtml, getNumberedName("docx"));
    setDownloadCount((c) => c + 1);
  };

  const handlePrintPdf = () => {
    openPrintView(currentHtml);
    logAction("Print/PDF", { format: "pdf" });
  };

  const MODE_LABELS: Record<PreviewMode, string> = {
    view: "Vizualizare",
    a4: "A4 Printabil",
    edit: "Editare",
  };

  return (
    <div className="space-y-4">
      {/* Header: mode toggle + download buttons */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-1">
          {(["view", "a4", "edit"] as PreviewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { logAction(`Preview mode: ${m}`); setMode(m); }}
              className={`px-3 py-1.5 text-sm rounded-lg font-semibold transition-all ${
                mode === m
                  ? "bg-chalk-yellow text-chalkboard-dark"
                  : "chalk-btn opacity-70"
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDownloadHtml} className="chalk-btn text-sm">HTML</button>
          <button onClick={handlePrintPdf} className="chalk-btn text-sm">PDF (Print)</button>
          <button onClick={handleDownloadDocx} className="chalk-btn text-sm">DOCX</button>
        </div>
      </div>

      {/* Mode: Vizualizare — side by side original + traducere */}
      {mode === "view" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm opacity-60 mb-2">Original</h4>
            {previewUrl && originalFiles[0]?.type.startsWith("image/") ? (
              <img src={previewUrl} alt="Original" className="max-w-full rounded" />
            ) : (
              <p className="opacity-40 text-center py-8">Preview indisponibil</p>
            )}
          </div>
          <div className="bg-white rounded-lg overflow-hidden">
            <h4 className="text-sm text-gray-500 p-4 pb-0 mb-0">Traducere</h4>
            <iframe
              srcDoc={currentHtml}
              title="Traducere preview"
              className="w-full border-0"
              style={{ height: "600px" }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}

      {/* Mode: A4 Printabil — full-width iframe, A4 paper simulation */}
      {mode === "a4" && (
        <div className="bg-gray-200 rounded-lg p-6 flex justify-center">
          <iframe
            srcDoc={currentHtml}
            title="A4 Preview"
            className="border-0 bg-white shadow-lg"
            style={{ width: "210mm", height: "297mm" }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}

      {/* Mode: Editare — contentEditable + live preview */}
      {mode === "edit" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm opacity-60 mb-2">Editor HTML</h4>
            <textarea
              value={editedHtml}
              onChange={(e) => setEditedHtml(e.target.value)}
              className="w-full h-[500px] bg-white/10 border border-chalk-white/20 rounded-lg p-3 text-chalk-white font-mono text-sm resize-none"
              spellCheck={false}
            />
          </div>
          <div>
            <h4 className="text-sm opacity-60 mb-2">Preview live</h4>
            <iframe
              srcDoc={editedHtml}
              title="Editor preview"
              className="w-full h-[500px] bg-white rounded-lg border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}
