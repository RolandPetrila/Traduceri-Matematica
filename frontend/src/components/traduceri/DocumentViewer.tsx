"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { logAction, logError } from "@/lib/monitoring";
import { API_URL } from "@/lib/api-url";
import { sanitizeHtml } from "@/lib/sanitize";

interface StructuredSection {
  type: string;
  content?: string;
  svg?: string | string[];
  img_b64?: string;
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
  const [translateMsg, setTranslateMsg] = useState("");
  const [currentPageIdx, setCurrentPageIdx] = useState(0);

  // Cache: source language pages are pre-loaded
  const cacheRef = useRef<TranslationCache>({
    [sourceLang]: structuredPages,
  });

  // AbortController for in-flight translate-text requests
  const translateAbortRef = useRef<AbortController | null>(null);

  // Cancel any pending translation on unmount
  useEffect(() => {
    return () => {
      translateAbortRef.current?.abort();
    };
  }, []);

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
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@4/tex-svg.js";
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
    setCurrentPageIdx(0);
    logAction("Vizualizare original", {});
  }, []);

  const switchLanguage = useCallback(async (targetLang: string) => {
    setShowOriginal(false);

    if (targetLang === activeLang) return;

    // Check cache first
    if (cacheRef.current[targetLang]) {
      setActiveLang(targetLang);
      setCurrentPageIdx(0);
      logAction("Limba schimbata (cache)", { from: activeLang, to: targetLang });
      return;
    }

    // Need to translate on-demand
    // Cancel any previous in-flight request
    translateAbortRef.current?.abort();
    translateAbortRef.current = new AbortController();
    const { signal } = translateAbortRef.current;

    setIsTranslating(true);
    setTranslateMsg("");
    logAction("Traducere on-demand pornita", { from: sourceLang, to: targetLang });

    try {
      // Always translate from the source-language pages (not the current view).
      const sourcePages = cacheRef.current[sourceLang] || structuredPages;

      // Translate ONE page per request so each call stays under the 60s serverless
      // limit (a whole document in one call would time out on large inputs).
      const newPages: StructuredPage[] = [];
      const t0 = Date.now();

      for (let p = 0; p < sourcePages.length; p++) {
        const page = sourcePages[p];
        setTranslateMsg(`Traducere pagina ${p + 1}/${sourcePages.length}...`);

        const sections = [
          ...(page.title ? [{ type: "heading", content: page.title, level: 1 }] : []),
          ...page.sections,
        ];

        const res = await fetch(`${API_URL}/api/translate-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text_sections: sections,
            source_lang: sourceLang,
            target_lang: targetLang,
            translate_engine: translateEngine,
          }),
          signal,
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        const translated = data.translated_sections || [];

        // translated mirrors `sections` 1:1 (figures kept in place, only text changed).
        const newPage: StructuredPage = { title: page.title, sections: [] };
        let idx = 0;
        if (page.title) {
          newPage.title = translated[idx]?.content || page.title;
          idx++;
        }
        for (const sec of page.sections) {
          newPage.sections.push(idx < translated.length ? translated[idx] : sec);
          idx++;
        }
        newPages.push(newPage);
      }

      cacheRef.current[targetLang] = newPages;
      setActiveLang(targetLang);
      setCurrentPageIdx(0);
      logAction("Traducere on-demand reusita", { to: targetLang, duration_ms: Date.now() - t0 });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return; // ignore cancelled requests
      const msg = err instanceof Error ? err.message : "Eroare traducere";
      logError(msg, { source: "translate", errorCode: "E-TRANS-001", context: { from: sourceLang, to: targetLang } });
    } finally {
      setIsTranslating(false);
      setTranslateMsg("");
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
    // Export PDF via the browser's Save-as-PDF: window.print() keeps MathJax
    // math as VECTOR SVG (crisp), unlike jsPDF/html2canvas which would rasterize
    // the formulas. We wait for MathJax to finish typesetting before printing.
    const html = buildHtmlFromPages(currentPages, activeLang);
    const win = window.open("", "_blank");
    if (!win) {
      logError("Fereastra de export a fost blocata (popup blocker)", {
        source: "export",
        errorCode: "E-CONV-001",
        context: { lang: activeLang },
      });
      return;
    }
    win.document.write(html);
    win.document.close();
    logAction("Export PDF (print)", { lang: activeLang, pages: currentPages.length });

    const start = Date.now();
    const tryPrint = () => {
      const mj = (win as unknown as { MathJax?: { startup?: { promise?: Promise<void> }; typesetPromise?: () => Promise<void> } }).MathJax;
      const ready = mj?.startup?.promise;
      if (ready) {
        ready
          .then(() => mj?.typesetPromise?.())
          .then(() => { win.focus(); win.print(); })
          .catch(() => { win.focus(); win.print(); });
      } else if (Date.now() - start < 8000) {
        win.setTimeout(tryPrint, 200);
      } else {
        win.focus();
        win.print(); // fallback: print even if MathJax never signalled ready
      }
    };
    win.setTimeout(tryPrint, 300);
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
        <div className="flex gap-1 flex-wrap items-center">
          {/* Original button */}
          {originalFiles && originalFiles.length > 0 && (
            <button
              onClick={handleOriginal}
              disabled={isTranslating}
              className={`chalk-btn text-sm px-4 py-2 ${showOriginal ? "chalk-btn--active" : ""}`}
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
              className={`chalk-btn text-sm px-4 py-2 ${
                !showOriginal && activeLang === lang.code ? "chalk-btn--active" : ""
              }`}
            >
              {lang.flag} {lang.label}
            </button>
          ))}
          {isTranslating && (
            <span className="text-white/70 text-sm flex items-center ml-2">
              {translateMsg || "Se traduce..."}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!showOriginal && (
            <>
              <button onClick={handleDownloadHtml} className="chalk-btn text-sm px-3 py-2">
                HTML
              </button>
              <button onClick={handlePrint} className="chalk-btn chalk-btn--primary text-sm px-3 py-2">
                Export PDF
              </button>
              <button onClick={handleDownloadDocx} className="chalk-btn text-sm px-3 py-2">
                DOCX
              </button>
            </>
          )}
        </div>
      </div>

      {/* Page navigation */}
      {(() => {
        const totalPages = showOriginal
          ? (originalUrls.length || 1)
          : (currentPages.length || 1);
        return totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 py-2 text-sm text-white/70">
            <button
              onClick={() => setCurrentPageIdx((i) => Math.max(0, i - 1))}
              disabled={currentPageIdx === 0}
              className="chalk-btn text-sm px-3 py-1"
            >
              &#8592;
            </button>
            <span>Pagina {currentPageIdx + 1} / {totalPages}</span>
            <button
              onClick={() => setCurrentPageIdx((i) => Math.min(totalPages - 1, i + 1))}
              disabled={currentPageIdx === totalPages - 1}
              className="chalk-btn text-sm px-3 py-1"
            >
              &#8594;
            </button>
          </div>
        ) : null;
      })()}

      {/* Content area */}
      <div className="bg-gray-200 p-6 rounded-lg">
        {showOriginal ? (
          /* STEP 1: Original — uploaded images in A4 frame */
          (() => {
            const url = originalUrls[currentPageIdx];
            if (!url) return null;
            return (
              <div
                className="bg-white mx-auto mb-4 shadow-lg flex items-center justify-center"
                style={{ width: "210mm", minHeight: "297mm", padding: "12mm" }}
              >
                <img
                  src={url}
                  alt={`Original pagina ${currentPageIdx + 1}`}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              </div>
            );
          })()
        ) : (
          /* STEP 2/3: HTML document (RO or translated) — editable */
          (() => {
            const page = currentPages[currentPageIdx];
            if (!page) return null;
            return (
              <div
                key={`${activeLang}-${currentPageIdx}`}
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
                  <EditableBlock
                    as="h1"
                    raw={page.title}
                    onSave={(v) => { page.title = v; }}
                    style={{ fontSize: "16pt", marginBottom: "0.5em", lineHeight: 1.22 }}
                  />
                )}
                {page.sections.map((sec, secIdx) => (
                  <RenderSection key={secIdx} section={sec} />
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

/** Render a single structured section — recursive for two_column */
function RenderSection({ section }: { section: StructuredSection }) {
  const { type, content, svg, img_b64, level, caption, left, right } = section;

  if (type === "figure" && img_b64) {
    return (
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", margin: "6px 0" }}>
        <img
          src={`data:image/png;base64,${img_b64}`}
          alt={caption || "figura"}
          style={{ maxWidth: "100%", height: "auto", background: "#fff" }}
        />
      </div>
    );
  }

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
        <div style={{ minWidth: 0 }}>
          {(left || []).map((s, i) => (
            <RenderSection key={`l${i}`} section={s} />
          ))}
        </div>
        <div style={{ minWidth: 0 }}>
          {(right || []).map((s, i) => (
            <RenderSection key={`r${i}`} section={s} />
          ))}
        </div>
      </div>
    );
  }

  const save = (v: string) => { section.content = v; };

  if (type === "heading") {
    // Downgrade very long "headings" to paragraphs (Gemini OCR misclassification)
    if ((content || "").length > 200) {
      return <EditableBlock as="p" raw={content || ""} onSave={save} style={{ marginBottom: "0.3em" }} />;
    }
    const tag = `h${Math.min(level || 2, 4)}` as keyof JSX.IntrinsicElements;
    return (
      <EditableBlock
        as={tag}
        raw={content || ""}
        onSave={save}
        style={{ marginTop: "1.1em", marginBottom: "0.42em", lineHeight: 1.22 }}
      />
    );
  }

  if (type === "step") {
    return <EditableBlock as="p" raw={content || ""} onSave={save} style={{ marginBottom: "0.3em" }} />;
  }

  if (type === "observation") {
    return <EditableBlock as="p" raw={content || ""} onSave={save} wrapStrong style={{ marginBottom: "0.3em" }} />;
  }

  if (type === "list") {
    // Split into items; edits rebuild the single \n-delimited content string.
    const items = (content || "").split("\n").filter((l) => l.trim()).map((l) => l.replace(/^\d+\.\s*/, ""));
    return (
      <ol style={{ marginTop: "0.45em", marginBottom: "0.6em" }}>
        {items.map((item, i) => (
          <EditableBlock
            key={i}
            as="li"
            raw={item}
            onSave={(v) => {
              items[i] = v;
              section.content = items.map((t, k) => `${k + 1}. ${t}`).join("\n");
            }}
            style={{ marginBottom: "0.2em" }}
          />
        ))}
      </ol>
    );
  }

  // paragraph or unknown
  return <EditableBlock as="p" raw={content || ""} onSave={save} style={{ marginBottom: "0.3em" }} />;
}

/** Rendered HTML for a text run (sanitized + **bold**). MathJax typesets $...$ later. */
function renderMathHtml(text: string): string {
  const safe = sanitizeHtml(text);
  return safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

/** Re-typeset a single element after an edit restores its rendered view. */
function typesetEl(el: HTMLElement): void {
  const MJ = (window as unknown as { MathJax?: { typesetPromise?: (els: HTMLElement[]) => Promise<void> } }).MathJax;
  MJ?.typesetPromise?.([el]).catch(() => {});
}

/**
 * Editable text block — persists edits losslessly.
 * View shows rendered math (SVG); on focus we swap to the RAW source ($...$ text)
 * so the user edits the true source, and on blur we save the raw text and
 * restore the rendered + typeset view. This keeps LaTeX/markdown intact across
 * language switches AND all exports (which read from the same page objects).
 */
function EditableBlock({
  as = "p",
  raw,
  onSave,
  style,
  wrapStrong = false,
}: {
  as?: keyof JSX.IntrinsicElements;
  raw: string;
  onSave: (value: string) => void;
  style?: React.CSSProperties;
  wrapStrong?: boolean;
}) {
  const render = (t: string) => (wrapStrong ? `<strong>${renderMathHtml(t)}</strong>` : renderMathHtml(t));
  const Tag = as as React.ElementType;
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      style={{ outline: "none", ...style }}
      onFocus={(e: React.FocusEvent<HTMLElement>) => {
        // Show raw source (math as $...$) for lossless editing.
        e.currentTarget.textContent = raw;
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = e.currentTarget.innerText.replace(/ /g, " ");
        if (next !== raw) onSave(next);
        e.currentTarget.innerHTML = render(next);
        typesetEl(e.currentTarget);
      }}
      dangerouslySetInnerHTML={{ __html: render(raw) }}
    />
  );
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
      --page-width:210mm; --page-padding-x:12mm; --page-padding-y:12mm; }
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
    .paper { width:var(--page-width); min-height:297mm; margin:0 auto 16px;
      padding:var(--page-padding-y) var(--page-padding-x); background:var(--paper-bg);
      box-shadow:0 2px 14px rgba(0,0,0,.12); }
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
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-svg.js"></script>
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
  if (sec.type === "figure" && sec.img_b64) {
    const cap = sec.caption ? `<p style="font-size:0.9em;color:#555;margin-top:4px;text-align:center;"><em>${sec.caption}</em></p>` : "";
    return `<div style="display:flex;gap:16px;justify-content:center;margin:6px 0"><img src="data:image/png;base64,${sec.img_b64}" style="max-width:100%;height:auto;background:#fff;" alt="${sec.caption || "figura"}"></div>\n${cap}`;
  }

  if (sec.type === "figure" && sec.svg) {
    const svgs = Array.isArray(sec.svg) ? sec.svg : [sec.svg];
    return `<div style="display:flex;gap:16px;justify-content:center;margin:6px 0">\n${svgs.join("\n")}\n</div>\n`;
  }

  if (sec.type === "figure") {
    const desc = sec.caption || "";
    return `<p><em>[Figura: ${desc || "indisponibila"}]</em></p>\n`;
  }

  if (sec.type === "two_column") {
    let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:10px 0;">';
    html += '<div style="min-width:0;">';
    for (const s of sec.left || []) html += buildSectionHtml(s);
    html += '</div><div style="min-width:0;">';
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
