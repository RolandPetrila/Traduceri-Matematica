"use client";

import { useState } from "react";
import { logAction } from "@/lib/monitoring";
import { API_URL } from "@/lib/api-url";

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
    // Fallback: download as HTML with .docx extension (Word can open it)
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

/** Extract only the <main>...</main> body content from a full HTML document. */
function extractBodyContent(html: string): string {
  // Try to extract <main> content first
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) return mainMatch[1];
  // Fallback: extract <body> content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) return bodyMatch[1];
  return html;
}

export default function PreviewPanel({ originalFiles, translatedHtml, engineName }: PreviewPanelProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [editedHtml, setEditedHtml] = useState(translatedHtml);

  const previewUrl = originalFiles.length > 0
    ? URL.createObjectURL(originalFiles[0])
    : null;

  const currentHtml = editedHtml || translatedHtml;

  // Generate filename: originalName_engine.ext
  const baseName = originalFiles.length > 0
    ? originalFiles[0].name.replace(/\.[^.]+$/, "")
    : "traducere";
  const suffix = engineName ? `_${engineName}` : "";

  /** Save file with "Save As" dialog (if supported) or fallback to download. */
  async function saveWithDialog(blob: Blob, defaultName: string, mimeType: string) {
    // Try modern File System Access API (Chrome/Edge — shows "Save As" dialog)
    if ("showSaveFilePicker" in window) {
      try {
        const extMap: Record<string, string> = {
          "text/html": "html",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        };
        const ext = extMap[mimeType] || defaultName.split(".").pop() || "html";
        const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: defaultName,
          types: [{
            description: ext.toUpperCase(),
            accept: { [mimeType]: [`.${ext}`] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        logAction("Download (Save As)", { filename: defaultName });
        return;
      } catch (e) {
        // User cancelled or API not available — fall through to regular download
        if ((e as Error).name === "AbortError") return;
      }
    }
    // Fallback: regular download with auto-numbered filename
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
    logAction("Download", { filename: defaultName });
  }

  // Track download count for auto-numbering within same session
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
    const filename = getNumberedName("docx");
    await downloadAsDocx(currentHtml, filename);
    setDownloadCount((c) => c + 1);
  };

  const handlePrintPdf = () => {
    openPrintView(currentHtml);
    logAction("Print/PDF", { format: "pdf" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-xl font-bold text-chalk-yellow">Rezultat</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { logAction(showEditor ? "Editor HTML inchis" : "Editor HTML deschis"); setShowEditor(!showEditor); }}
            className="chalk-btn text-sm"
          >
            {showEditor ? "Ascunde editor" : "Editeaza"}
          </button>
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
      </div>

      {/* Side-by-side preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-sm opacity-60 mb-2">Original</h4>
          {previewUrl && originalFiles[0]?.type.startsWith("image/") ? (
            <img
              src={previewUrl}
              alt="Original"
              className="max-w-full rounded"
            />
          ) : (
            <p className="opacity-40 text-center py-8">
              Preview indisponibil pentru acest format
            </p>
          )}
        </div>

        {/* Translated — iframe for full HTML isolation */}
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

      {/* Inline editor */}
      {showEditor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm opacity-60 mb-2">Editor HTML</h4>
            <textarea
              value={editedHtml}
              onChange={(e) => setEditedHtml(e.target.value)}
              className="w-full h-96 bg-white/10 border border-chalk-white/20 rounded-lg p-3 text-chalk-white font-mono text-sm resize-none"
              spellCheck={false}
            />
          </div>
          <div>
            <h4 className="text-sm opacity-60 mb-2">Preview live</h4>
            <iframe
              srcDoc={editedHtml}
              title="Editor preview"
              className="w-full h-96 bg-white rounded-lg border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}
