"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { logAction, logError } from "@/lib/monitoring";
import { API_URL } from "@/lib/api-url";
import { sanitizeHtml } from "@/lib/sanitize";

interface StructuredSection {
  type: string;
  content?: string;
  svg?: string | string[];
  level?: number;
  caption?: string;
}

interface StructuredPage {
  title?: string;
  sections: StructuredSection[];
}

interface TranslationCache {
  [lang: string]: StructuredPage[];
}

interface DocumentViewerProps {
  /** Original structured pages from OCR */
  structuredPages: StructuredPage[];
  /** The full HTML for download/print */
  fullHtml: string;
  /** Source language of the document */
  sourceLang: string;
  /** Currently selected target language */
  initialTargetLang: string;
  /** Engine for translation */
  translateEngine: string;
  /** Original filename for downloads */
  filename?: string;
}

const LANGUAGES = [
  { code: "ro", label: "RO", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "sk", label: "SK", flag: "\u{1F1F8}\u{1F1F0}" },
  { code: "en", label: "EN", flag: "\u{1F1EC}\u{1F1E7}" },
];

/**
 * DocumentViewer — presents translated math documents with live language switching.
 *
 * Architecture (adapted from platform-predare):
 * - Stores structured pages per language in cache
 * - Language toggle translates ONLY text (SVG figures stay intact)
 * - A4 white paper presentation with MathJax
 */
export default function DocumentViewer({
  structuredPages,
  fullHtml,
  sourceLang,
  initialTargetLang,
  translateEngine,
  filename = "traducere",
}: DocumentViewerProps) {
  const [activeLang, setActiveLang] = useState(initialTargetLang);
  const [isTranslating, setIsTranslating] = useState(false);
  const cacheRef = useRef<TranslationCache>({
    [initialTargetLang]: structuredPages,
  });

  const currentPages = cacheRef.current[activeLang] || structuredPages;

  // Load MathJax into the page (once)
  useEffect(() => {
    // Load MathJax config if not present
    if (!document.getElementById("mathjax-config")) {
      const cfg = document.createElement("script");
      cfg.id = "mathjax-config";
      cfg.textContent = `window.MathJax = {
        tex: { inlineMath: [['$','$'],['\\\\(','\\\\)']], displayMath: [['$$','$$'],['\\\\[','\\\\]']] },
        svg: { fontCache: 'global' }
      };`;
      document.head.appendChild(cfg);
    }
    // Load MathJax script if not present
    if (!document.getElementById("mathjax-script")) {
      const script = document.createElement("script");
      script.id = "mathjax-script";
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Re-typeset math after render or language switch
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((window as any).MathJax?.typesetPromise) {
        (window as any).MathJax.typesetPromise().catch(() => {});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [activeLang, currentPages]);

  const switchLanguage = useCallback(async (targetLang: string) => {
    if (targetLang === activeLang) return;

    // Check cache first
    if (cacheRef.current[targetLang]) {
      setActiveLang(targetLang);
      logAction("Limba schimbata (cache)", { from: activeLang, to: targetLang });
      return;
    }

    // Need to translate
    setIsTranslating(true);
    logAction("Traducere live pornita", { from: activeLang, to: targetLang });

    try {
      // Flatten all sections for translation
      const allSections = currentPages.flatMap((p) => [
        ...(p.title ? [{ type: "heading", content: p.title, level: 1 }] : []),
        ...p.sections,
      ]);

      const res = await fetch(`${API_URL}/api/translate-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text_sections: allSections,
          source_lang: activeLang,
          target_lang: targetLang,
          translate_engine: translateEngine,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      // Rebuild pages from translated sections
      const translated = data.translated_sections || [];
      const newPages: StructuredPage[] = [];
      let secIdx = 0;

      for (const page of currentPages) {
        const newPage: StructuredPage = { title: page.title, sections: [] };
        if (page.title && secIdx < translated.length) {
          newPage.title = translated[secIdx]?.content || page.title;
          secIdx++;
        }
        for (const sec of page.sections) {
          if (secIdx < translated.length) {
            newPage.sections.push(translated[secIdx]);
            secIdx++;
          } else {
            newPage.sections.push(sec);
          }
        }
        newPages.push(newPage);
      }

      cacheRef.current[targetLang] = newPages;
      setActiveLang(targetLang);
      logAction("Traducere live reusita", { to: targetLang, duration: data.duration_ms });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare traducere";
      logError(msg, { context: { from: activeLang, to: targetLang } });
    } finally {
      setIsTranslating(false);
    }
  }, [activeLang, currentPages, translateEngine]);

  const handleDownloadHtml = () => {
    const html = buildHtmlFromPages(currentPages, activeLang);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${activeLang}.html`;
    a.click();
    URL.revokeObjectURL(url);
    logAction("Download HTML", { lang: activeLang });
  };

  const handlePrint = () => {
    const html = buildHtmlFromPages(currentPages, activeLang);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 1500);
    }
  };

  const handleDownloadDocx = async () => {
    const html = buildHtmlFromPages(currentPages, activeLang);
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
      a.download = `${filename}_${activeLang}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      logAction("Download DOCX", { lang: activeLang });
    } catch (err) {
      logError(err instanceof Error ? err.message : "DOCX download failed", { context: { lang: activeLang } });
      // Fallback: download as HTML
      handleDownloadHtml();
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: language toggle + actions */}
      <div className="flex justify-between items-center flex-wrap gap-3 p-3 bg-[#192031] rounded-lg">
        <div className="flex gap-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              disabled={isTranslating}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                activeLang === lang.code
                  ? "bg-white text-[#192031]"
                  : "bg-white/10 text-white hover:bg-white/20"
              } disabled:opacity-50`}
            >
              {lang.flag} {lang.label}
            </button>
          ))}
          {isTranslating && (
            <span className="text-white/60 text-sm flex items-center ml-2">
              Se traduce...
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadHtml} className="px-3 py-2 bg-[#dce8ff] text-[#121212] rounded-md text-sm font-semibold">
            HTML
          </button>
          <button onClick={handlePrint} className="px-3 py-2 bg-[#dce8ff] text-[#121212] rounded-md text-sm font-semibold">
            Print / PDF
          </button>
          <button onClick={handleDownloadDocx} className="px-3 py-2 bg-[#dce8ff] text-[#121212] rounded-md text-sm font-semibold">
            DOCX
          </button>
        </div>
      </div>

      {/* A4 Paper render — white background */}
      <div className="bg-gray-200 p-6 rounded-lg">
        {currentPages.map((page, pageIdx) => (
          <div
            key={pageIdx}
            className="bg-white mx-auto mb-4 shadow-lg overflow-hidden"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "12mm",
              fontFamily: '"Cambria", "Times New Roman", serif',
              fontSize: "12pt",
              lineHeight: 1.45,
              color: "#1b1b1b",
            }}
          >
            {page.title && (
              <h1 style={{ fontSize: "16pt", marginBottom: "0.5em", lineHeight: 1.22 }}>
                {page.title}
              </h1>
            )}
            {page.sections.map((sec, secIdx) => (
              <RenderSection key={secIdx} section={sec} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Render a single structured section */
function RenderSection({ section }: { section: StructuredSection }) {
  const { type, content, svg, level, caption } = section;

  if (type === "figure" && svg) {
    const svgs = Array.isArray(svg) ? svg : [svg];
    return (
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", margin: "6px 0" }}>
        {svgs.map((s, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(s) }} />
        ))}
      </div>
    );
  }

  if (type === "heading") {
    const Tag = `h${Math.min(level || 2, 4)}` as keyof JSX.IntrinsicElements;
    return <Tag style={{ marginTop: "1.1em", marginBottom: "0.42em", lineHeight: 1.22 }}>{renderMathText(content || "")}</Tag>;
  }

  if (type === "step") {
    return <p style={{ marginBottom: "0.3em" }}>{renderMathText(content || "")}</p>;
  }

  if (type === "observation") {
    return (
      <p style={{ marginBottom: "0.3em" }}>
        <strong>Poznámka. </strong>
        {renderMathText(content || "")}
      </p>
    );
  }

  // paragraph, list, etc
  return <p style={{ marginBottom: "0.3em" }}>{renderMathText(content || "")}</p>;
}

/** Render text with LaTeX — uses dangerouslySetInnerHTML for MathJax processing */
function renderMathText(text: string): JSX.Element {
  // Convert **bold** to <strong>
  const safe = sanitizeHtml(text);
  const processed = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return <span dangerouslySetInnerHTML={{ __html: processed }} />;
}

/** Build full HTML document from structured pages (for download/print) */
function buildHtmlFromPages(pages: StructuredPage[], lang: string): string {
  const langAttr = lang === "sk" ? "sk" : lang === "en" ? "en" : "ro";

  let body = "";
  for (const page of pages) {
    let content = "";
    if (page.title) {
      content += `<h1>${page.title}</h1>\n`;
    }
    for (const sec of page.sections) {
      if (sec.type === "figure" && sec.svg) {
        const svgs = Array.isArray(sec.svg) ? sec.svg : [sec.svg];
        content += `<div style="display:flex;gap:16px;justify-content:center;margin:6px 0">\n`;
        content += svgs.join("\n");
        content += `\n</div>\n`;
      } else if (sec.type === "heading") {
        const tag = `h${Math.min(sec.level || 2, 4)}`;
        content += `<${tag}>${sec.content || ""}</${tag}>\n`;
      } else {
        const text = (sec.content || "").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        content += `<p>${text}</p>\n`;
      }
    }
    body += `<section class="paper"><div class="paper-content">\n${content}</div></section>\n`;
  }

  return `<!doctype html>
<html lang="${langAttr}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Traducere Matematica</title>
  <style>
    :root { --text-color:#1b1b1b; --paper-bg:#ffffff; --font-size:12pt; --line-height:1.45;
      --page-width:210mm; --page-height:297mm; --page-padding-x:12mm; --page-padding-y:12mm; }
    @page { size:A4; margin:0; }
    * { box-sizing:border-box; }
    body { margin:0; padding:0; color:var(--text-color); background:#f2f2f2;
      font-family:"Cambria","Times New Roman",serif; font-size:var(--font-size); line-height:var(--line-height); }
    .toolbar { position:sticky; top:0; z-index:100; display:flex; gap:12px; align-items:center;
      justify-content:space-between; padding:10px 14px; background:#192031; color:#fff;
      font-family:"Segoe UI",Arial,sans-serif; font-size:13px; }
    .toolbar button { border:0; border-radius:6px; padding:8px 12px; background:#dce8ff;
      color:#121212; cursor:pointer; font-weight:600; }
    main { max-width:calc(var(--page-width) + 24px); margin:18px auto; padding:0 12px 24px; }
    .paper { --fit-scale:1; width:var(--page-width); min-height:var(--page-height); margin:0 auto 16px;
      padding:var(--page-padding-y) var(--page-padding-x); background:var(--paper-bg);
      box-shadow:0 2px 14px rgba(0,0,0,.12); overflow:hidden; }
    .paper-content { overflow-wrap:break-word; }
    h1,h2,h3,h4 { margin-top:1.1em; margin-bottom:.42em; line-height:1.22; page-break-after:avoid; }
    p,li { page-break-inside:avoid; }
    hr { border:none; border-top:1px solid #cfcfcf; margin:1em 0; }
    ul,ol { margin-top:0.45em; margin-bottom:0.6em; }
    li { margin-bottom:0.2em; }
    img { max-width:100%; height:auto; }
    svg { max-width:100%; height:auto; }
    .MathJax { font-size:1em !important; }
    @media print {
      body { background:#fff; } .toolbar { display:none !important; }
      main { max-width:none; margin:0; padding:0; }
      .paper { margin:0; box-shadow:none; break-after:page; page-break-after:always; }
      .paper:last-child { break-after:auto; page-break-after:auto; }
    }
  </style>
  <script>
    window.MathJax = { tex: { inlineMath: [['$','$'],['\\\\(','\\\\)']], displayMath: [['$$','$$'],['\\\\[','\\\\]']] }, svg: { fontCache:'global' } };
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
</head>
<body>
  <div class="toolbar">
    <div>Traducere matematica — ${pages.length} pagina(e) | Print: Scale 100%, Margins None</div>
    <button onclick="window.print()">Tipareste</button>
  </div>
  <main>${body}</main>
</body>
</html>`;
}
