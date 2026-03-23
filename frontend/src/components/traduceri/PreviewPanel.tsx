"use client";

import { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

interface PreviewPanelProps {
  originalFiles: File[];
  translatedHtml: string;
}

export default function PreviewPanel({ originalFiles, translatedHtml }: PreviewPanelProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [editedHtml, setEditedHtml] = useState(translatedHtml);

  const previewUrl = originalFiles.length > 0
    ? URL.createObjectURL(originalFiles[0])
    : null;

  const handleDownload = () => {
    const blob = new Blob([editedHtml || translatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "traducere.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-chalk-yellow">Rezultat</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="chalk-btn text-sm"
          >
            {showEditor ? "Ascunde editor" : "Editeaza"}
          </button>
          <button onClick={handleDownload} className="chalk-btn text-sm">
            &#x2B07; Download HTML
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

        {/* Translated */}
        <div className="bg-white rounded-lg p-4 text-gray-900">
          <h4 className="text-sm text-gray-500 mb-2">Traducere</h4>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(editedHtml || translatedHtml) }}
          />
        </div>
      </div>

      {/* Inline Markdown editor */}
      {showEditor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm opacity-60 mb-2">Editor Markdown</h4>
            <textarea
              value={editedHtml}
              onChange={(e) => setEditedHtml(e.target.value)}
              className="w-full h-96 bg-white/10 border border-chalk-white/20 rounded-lg p-3 text-chalk-white font-mono text-sm resize-none"
              spellCheck={false}
            />
          </div>
          <div>
            <h4 className="text-sm opacity-60 mb-2">Preview live</h4>
            <div
              className="w-full h-96 overflow-auto bg-white rounded-lg p-3 text-gray-900 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(editedHtml) }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
