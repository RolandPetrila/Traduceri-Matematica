"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { logAction, logError } from "@/lib/monitoring";
import { API_URL } from "@/lib/api-url";
import { sanitizeHtml } from "@/lib/sanitize";

interface StructuredSection {
  type: string;
  content?: string;
  svg?: string | string[];
  level?: number;
  caption?: string;
  left?: StructuredSection[];
  right?: StructuredSection[];
}

interface StructuredPage {
  title?: string;
  sections: StructuredSection[];
}

interface TranslationCache {
  [lang: string]: StructuredPage[];
}

interface DocumentViewerProps {
  /** Original structured pages from OCR (source language) */
  structuredPages: StructuredPage[];
  /** The full HTML for download/print */
  fullHtml: string;
  /** Source language of the document */
  sourceLang: string;
  /** Default target language for translation */
  initialTargetLang: string;
  /** Engine for translation */
  translateEngine: string;
  /** Original filename for downloads */
  filename?: string;
  /** Original uploaded files (for "Original" view) */
  originalFiles?: File[];
}

const LANGUAGES = [
  { code: "ro", label: "RO", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "sk", label: "SK", flag: "\u{1F1F8}\u{1F1F0}" },
  { code: "en", label: "EN", flag: "\u{1F1EC}\u{1F1E7}" },
];

/**
 * DocumentViewer — 3-step method (D23):
 *   Original: uploaded image (read-only)
 *   RO: OCR result (editable)
 *   SK/EN: translated on-demand (editable)
 */
export default function DocumentViewer({
  structuredPages,
  fullHtml,
  sourceLang,
  initialTargetLang,
  translateEngine,
  filename = "traducere",
  originalFiles,
}: DocumentViewerProps) {
  // Start with source language (RO), not target (SK)
  const [activeLang, setActiveLang] = useState(sourceLang);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Cache: source language pages are pre-loaded
  const cacheRef = useRef<TranslationCache>({
    [sourceLang]: structuredPages,
  });

  // Object URLs for original image display
  const originalUrls = useMemo(() => {
    if (!originalFiles || originalFiles.length === 0) return [];
    return originalFiles.map((f) => URL.createObjectURL(f));
  }, [originalFiles]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      originalUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [originalUrls]);

  const currentPages = cacheRef.current[activeLang] || structuredPages;

  // Load MathJax into the page (once)
  useEffect(() => {
    if (!document.getElementById("mathjax-config")) {
      const cfg = document.createElement("script");
      cfg.id = "mathjax-config";
      cfg.textContent = `window.MathJax = {
        tex: { inlineMath: [['$','$'],['\\\\(','\\\\)']], displayMath: [['$$','$$'],['\\\\[','\\\\]']] },
        svg: { fontCache: 'global' }
      };`;
      document.head.appendChild(cfg);
    }
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
    if (showOriginal) return;
    const timer = setTimeout(() => {
      if ((window as any).MathJax?.typesetPromise) {
        (window as any).MathJax.typesetPromise().catch(() => {});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [activeLang, currentPages, showOriginal]);

  const handleOriginal = useCallback(() => {
    setShowOriginal(true);
    logAction("Vizualizare original", {});
  }, []);

  const switchLanguage = useCallback(async (targetLang: string) => {
    setShowOriginal(false);

    if (targetLang === activeLang) return;

    // Check cache first
    if (cacheRef.current[targetLang]) {
      setActiveLang(targetLang);
      logAction("Limba schimbata (cache)", { from: activeLang, to: targetLang });
      return;
    }

    // Need to translate on-demand
    setIsTranslating(true);
    logAction("Traducere on-demand pornita", { from: sourceLang, to: targetLang });

    try {
      // Use source language pages for translation (not current — always translate from original)
      const sourcePages = cacheRef.current[sourceLang] || structuredPages;

      // Flatten all sections for translation
      const allSections = sourcePages.flatMap((p) => [
        ...(p.title ? [{ type: "heading", content: p.title, level: 1 }] : []),
        ...p.sections,
      ]);

      const res = await fetch(`${API_URL}/api/translate-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text_sections: allSections,
          source_lang: sourceLang,
          target_lang: targetLang,
          translate_engine: translateEngine,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      // Rebuild pages from translated sections
      const translated = data.translated_sections || [];
      const newPages: StructuredPage[] = [];
      let secIdx = 0;

      for (const page of sourcePages) {
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
      logAction("Traducere on-demand reusita", { to: targetLang, duration: data.duration_ms });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare traducere";
      logError(msg, { context: { from: sourceLang, to: targetLang } });
    } finally {
      setIsTranslating(false);
    }
  }, [activeLang, sourceLang, structuredPages, translateEngine]);

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
      handleDownloadHtml();
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: Original + language toggle + actions */}
      <div className="flex justify-between items-center flex-wrap gap-3 p-3 bg-[#192031] rounded-lg">
        <div className="flex gap-1">
          {/* Original button */}
          {originalFiles && originalFiles.length > 0 && (
            <button
              onClick={handleOriginal}
              disabled={isTranslating}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                showOriginal
                  ? "bg-amber-400 text-[#192031]"
                  : "bg-white/10 text-white hover:bg-white/20"
              } disabled:opacity-50`}
            >
              Original
            </button>
          )}
          {/* Language buttons */}
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              disabled={isTranslating}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                !showOriginal && activeLang === lang.code
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
          {!showOriginal && (
            <>
              <button onClick={handleDownloadHtml} className="px-3 py-2 bg-[#dce8ff] text-[#121212] rounded-md text-sm font-semibold">
                HTML
              </button>
              <button onClick={handlePrint} className="px-3 py-2 bg-[#dce8ff] text-[#121212] rounded-md text-sm font-semibold">
                Print / PDF
              </button>
              <button onClick={handleDownloadDocx} className="px-3 py-2 bg-[#dce8ff] text-[#121212] rounded-md text-sm font-semibold">
                DOCX
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="bg-gray-200 p-6 rounded-lg">
        {showOriginal ? (
          /* STEP 1: Original — uploaded images in A4 frame */
          originalUrls.map((url, idx) => (
            <div
              key={idx}
              className="bg-white mx-auto mb-4 shadow-lg flex items-center justify-center"
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "12mm",
              }}
            >
              <img
                src={url}
                alt={`Original pagina ${idx + 1}`}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>
          ))
        ) : (
          /* STEP 2/3: HTML document (RO or translated) — editable */
          currentPages.map((page, pageIdx) => (
            <div
              key={`${activeLang}-${pageIdx}`}
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
                <h1
                  contentEditable
                  suppressContentEditableWarning
                  style={{ fontSize: "16pt", marginBottom: "0.5em", lineHeight: 1.22, outline: "none" }}
                >
                  {page.title}
                </h1>
              )}
              {page.sections.map((sec, secIdx) => (
                <RenderSection key={secIdx} section={sec} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** Render a single structured section — recursive for two_column */
function RenderSection({ section }: { section: StructuredSection }) {
  const { type, content, svg, level, caption, left, right } = section;

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

  if (type === "figure") {
    const desc = caption || "";
    return <p><em>[Figura: {desc || "indisponibila"}]</em></p>;
  }

  if (type === "two_column") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", margin: "10px 0" }}>
        <div>
          {(left || []).map((s, i) => (
            <RenderSection key={`l${i}`} section={s} />
          ))}
        </div>
        <div>
          {(right || []).map((s, i) => (
            <RenderSection key={`r${i}`} section={s} />
          ))}
        </div>
      </div>
    );
  }

  if (type === "heading") {
    // Downgrade very long "headings" to paragraphs (Gemini OCR misclassification)
    if ((content || "").length > 200) {
      return (
        <p contentEditable suppressContentEditableWarning style={{ marginBottom: "0.3em", outline: "none" }}>
          {renderMathText(content || "")}
        </p>
      );
    }
    const Tag = `h${Math.min(level || 2, 4)}` as keyof JSX.IntrinsicElements;
    return (
      <Tag
        contentEditable
        suppressContentEditableWarning
        style={{ marginTop: "1.1em", marginBottom: "0.42em", lineHeight: 1.22, outline: "none" }}
      >
        {renderMathText(content || "")}
      </Tag>
    );
  }

  if (type === "step") {
    return (
      <p
        contentEditable
        suppressContentEditableWarning
        style={{ marginBottom: "0.3em", outline: "none" }}
      >
        {renderMathText(content || "")}
      </p>
    );
  }

  if (type === "observation") {
    return (
      <p
        contentEditable
        suppressContentEditableWarning
        style={{ marginBottom: "0.3em", outline: "none" }}
      >
        <strong>{renderMathText(content || "")}</strong>
      </p>
    );
  }

  if (type === "list") {
    const items = (content || "").split("\n").filter((l) => l.trim());
    return (
      <ol style={{ marginTop: "0.45em", marginBottom: "0.6em" }}>
        {items.map((item, i) => {
          const clean = item.replace(/^\d+\.\s*/, "");
          return (
            <li
              key={i}
              contentEditable
              suppressContentEditableWarning
              style={{ marginBottom: "0.2em", outline: "none" }}
            >
              {renderMathText(clean)}
            </li>
          );
        })}
      </ol>
    );
  }

  // paragraph or unknown
  return (
    <p
      contentEditable
      suppressContentEditableWarning
      style={{ marginBottom: "0.3em", outline: "none" }}
    >
      {renderMathText(content || "")}
    </p>
  );
}

/** Render text with LaTeX — uses dangerouslySetInnerHTML for MathJax processing */
function renderMathText(text: string): JSX.Element {
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
      content += buildSectionHtml(sec);
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

/** Build HTML for a single section — recursive for two_column */
function buildSectionHtml(sec: StructuredSection): string {
  if (sec.type === "figure" && sec.svg) {
    const svgs = Array.isArray(sec.svg) ? sec.svg : [sec.svg];
    return `<div style="display:flex;gap:16px;justify-content:center;margin:6px 0">\n${svgs.join("\n")}\n</div>\n`;
  }

  if (sec.type === "two_column") {
    let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:10px 0;">';
    html += "<div>";
    for (const s of sec.left || []) html += buildSectionHtml(s);
    html += "</div><div>";
    for (const s of sec.right || []) html += buildSectionHtml(s);
    html += "</div></div>\n";
    return html;
  }

  if (sec.type === "heading") {
    // Downgrade very long "headings" to paragraphs (Gemini OCR misclassification)
    if ((sec.content || "").length > 200) {
      return `<p>${sec.content || ""}</p>\n`;
    }
    const tag = `h${Math.min(sec.level || 2, 4)}`;
    return `<${tag}>${sec.content || ""}</${tag}>\n`;
  }

  if (sec.type === "list") {
    const items = (sec.content || "").split("\n").filter((l) => l.trim());
    let html = "<ol>";
    for (const item of items) {
      const clean = item.replace(/^\d+\.\s*/, "");
      html += `<li>${clean}</li>`;
    }
    html += "</ol>\n";
    return html;
  }

  const text = (sec.content || "").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return `<p>${text}</p>\n`;
}
