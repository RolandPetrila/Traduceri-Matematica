"use client";

import { useState, useEffect } from "react";

interface MarkdownEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
}

export default function MarkdownEditor({ initialContent, onContentChange }: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    // Simple client-side markdown to HTML for preview
    // Full rendering happens server-side with MathJax
    let html = content;
    // Headers
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // Paragraphs
    html = html.replace(/\n\n/g, "</p><p>");
    html = `<p>${html}</p>`;

    setPreviewHtml(html);
    onContentChange(content);
  }, [content, onContentChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Editor */}
      <div>
        <h4 className="text-sm opacity-60 mb-2">Markdown</h4>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-80 bg-white/10 border border-chalk-white/20 rounded-lg p-3 text-chalk-white font-mono text-sm resize-none focus:outline-none focus:border-chalk-yellow/50"
          spellCheck={false}
          placeholder="Editeaza traducerea in format Markdown..."
        />
      </div>

      {/* Live preview */}
      <div>
        <h4 className="text-sm opacity-60 mb-2">Preview live</h4>
        <div
          className="w-full h-80 overflow-auto bg-white rounded-lg p-3 text-gray-900 prose max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </div>
  );
}
