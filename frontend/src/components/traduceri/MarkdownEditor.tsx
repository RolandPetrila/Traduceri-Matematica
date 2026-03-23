"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { markdown } from "@codemirror/lang-markdown";
import { sanitizeHtml } from "@/lib/sanitize";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-white/10 rounded-lg flex items-center justify-center opacity-40">
      Se incarca editorul...
    </div>
  ),
});

interface MarkdownEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
}

function mdToHtml(md: string): string {
  let html = md;
  // Protect LaTeX blocks
  const latexBlocks: string[] = [];
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    latexBlocks.push(tex);
    return `%%LATEX_BLOCK_${latexBlocks.length - 1}%%`;
  });
  html = html.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
    latexBlocks.push(tex);
    return `%%LATEX_INLINE_${latexBlocks.length - 1}%%`;
  });

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
  // Paragraphs
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;

  // Restore LaTeX
  html = html.replace(/%%LATEX_BLOCK_(\d+)%%/g, (_, i) => `\\[${latexBlocks[Number(i)]}\\]`);
  html = html.replace(/%%LATEX_INLINE_(\d+)%%/g, (_, i) => `\\(${latexBlocks[Number(i)]}\\)`);

  return html;
}

export default function MarkdownEditor({ initialContent, onContentChange }: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [previewHtml, setPreviewHtml] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const mathjaxLoaded = useRef(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Load MathJax once
  useEffect(() => {
    if (mathjaxLoaded.current || typeof window === "undefined") return;

    // Configure MathJax
    (window as unknown as Record<string, unknown>).MathJax = {
      tex: { inlineMath: [["\\(", "\\)"]], displayMath: [["\\[", "\\]"]] },
      options: { skipHtmlTags: ["script", "noscript", "style", "textarea", "pre"] },
    };

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    script.async = true;
    document.head.appendChild(script);
    mathjaxLoaded.current = true;
  }, []);

  // Render preview + typeset MathJax
  useEffect(() => {
    const html = mdToHtml(content);
    setPreviewHtml(html);
    onContentChange(content);

    // Typeset MathJax after DOM update
    const timer = setTimeout(() => {
      const MJ = (window as unknown as Record<string, unknown>).MathJax as {
        typesetPromise?: (el: Element[]) => Promise<void>;
      } | undefined;
      if (MJ?.typesetPromise && previewRef.current) {
        MJ.typesetPromise([previewRef.current]).catch(() => {});
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [content, onContentChange]);

  const handleChange = useCallback((val: string) => {
    setContent(val);
  }, []);

  // Theme is "dark" — custom styling via CSS class below

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Editor CodeMirror */}
      <div>
        <h4 className="text-sm opacity-60 mb-2">Markdown (cu LaTeX)</h4>
        <div className="rounded-lg overflow-hidden border border-chalk-white/20">
          <CodeMirror
            value={content}
            onChange={handleChange}
            extensions={[markdown()]}
            theme="dark"
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true,
              bracketMatching: true,
            }}
          />
        </div>
      </div>

      {/* Live preview with MathJax */}
      <div>
        <h4 className="text-sm opacity-60 mb-2">Preview live (MathJax)</h4>
        <div
          ref={previewRef}
          className="w-full h-80 overflow-auto bg-white rounded-lg p-3 text-gray-900 prose max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }}
        />
      </div>
    </div>
  );
}
