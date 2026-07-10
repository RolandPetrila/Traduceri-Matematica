"use client";

/**
 * OverlayViewer — pixel-perfect, layout-faithful translation for TEXT PDFs.
 *
 * For a text PDF the backend (`/api/overlay`) returns, per page, the EXACT text
 * lines (bbox + size + bold/italic + color, no OCR imprecision) plus two page
 * backgrounds: the original render and one with every line whited out. This
 * component renders each page as a white sheet sized in PDF points, layers the
 * two backgrounds, and positions the TRANSLATED text as absolutely-placed
 * contentEditable spans over the redacted background. A single toggle swaps
 * Original ⇄ Translated by flipping a `data-view` class — no re-render, so edits
 * survive (R-EDIT).
 *
 * Design constraints honored here:
 *  - All pages are STACKED (vertical scroll), never paginated. Paginating would
 *    unmount span subtrees and drop edits.
 *  - The per-page span subtree is memoized so parent re-renders (spinner, toggle)
 *    never reconcile the contentEditable nodes.
 *  - Both exports (print + standalone HTML) read the LIVE DOM, so user edits are
 *    always included.
 *  - One target language per session; changing target re-renders fresh (accepted).
 */

import { useCallback, useEffect, useRef, useState, memo } from "react";
import { API_URL } from "@/lib/api-url";
import { fetchWithRetry } from "@/lib/fetch-retry";
import { logAction, logError, logCodedWarn } from "@/lib/monitoring";
import type { TranslateEngine } from "@/components/traduceri/EngineSelector";

// ---- Types (mirror the /api/overlay contract) ----
interface OverlayLine {
  id: string;
  text: string;
  bbox: [number, number, number, number]; // x0,y0,x1,y1 in PDF points
  size: number;
  bold: boolean;
  italic: boolean;
  color: number; // 0xRRGGBB
}

export interface OverlayPageData {
  is_text_pdf?: boolean;
  page_count: number;
  page: number;
  width: number; // PDF points
  height: number; // PDF points
  bg_original: string; // base64 PNG
  bg_redacted: string; // base64 PNG
  lines: OverlayLine[];
}

interface OverlayViewerProps {
  file: File; // the TEXT PDF
  firstPage?: OverlayPageData; // optional pre-fetched page 0 (avoids a double fetch)
  sourceLang: string;
  targetLang: string;
  translateEngine: TranslateEngine;
  filename: string;
  /** Called when the PDF turns out NOT to be a text PDF — parent falls back to OCR. */
  onFallback?: () => void;
}

type ViewMode = "original" | "translated";

const LANG_LABEL: Record<string, string> = {
  ro: "Romana",
  sk: "Slovaca",
  en: "Engleza",
  de: "Germana",
};

const CHUNK = 40; // texts per /api/translate-text request (batch stays well under 60s)

// ---- Helpers ----
function colorCss(c: number): string {
  if (!Number.isFinite(c) || c < 0) return "#000";
  return `#${(c & 0xffffff).toString(16).padStart(6, "0")}`;
}

/**
 * Shrink the font just enough that the translated line fits the original width
 * (translations are often longer than the source). Mirrors the proven POC.
 */
function fitSize(
  text: string,
  availW: number,
  orig: number,
  bold: boolean,
): number {
  const est = text.length * orig * (bold ? 0.58 : 0.52);
  if (est <= availW || availW <= 0) return orig;
  return Math.max(5, orig * (availW / est) * 0.97);
}

/** Skip pure numbers / codes / units from translation (DeepL would mangle them). */
function shouldTranslate(t: string): boolean {
  const s = t.trim();
  if (s.length < 2 || !/[a-zA-Zà-ÿÀ-ß]/.test(s)) return false;
  if (/^[\d\s.,:/%°()+\-]+$/.test(s)) return false;
  if (/^(DIN|EN|ISO|CAS|EINECS|Nr\.?|Charge)\b/.test(s)) return false;
  return true;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---- One rendered page (memoized so it mounts ONCE — edits stay in the DOM) ----
const OverlayPage = memo(function OverlayPage({
  page,
  translations,
}: {
  page: OverlayPageData;
  translations: Record<string, string>;
}) {
  return (
    <div
      className="ov-page"
      style={{ width: `${page.width}pt`, height: `${page.height}pt` }}
    >
      <img
        className="ov-bg ov-bg-original"
        src={`data:image/png;base64,${page.bg_original}`}
        alt=""
        draggable={false}
      />
      <img
        className="ov-bg ov-bg-redacted"
        src={`data:image/png;base64,${page.bg_redacted}`}
        alt=""
        draggable={false}
      />
      {page.lines.map((ln) => {
        const [x0, y0, x1] = ln.bbox;
        const translated = translations[ln.text] ?? ln.text;
        const fs = fitSize(translated, x1 - x0, ln.size, ln.bold);
        return (
          <span
            key={ln.id}
            data-id={ln.id}
            data-src={ln.text}
            className="ov-s"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            style={{
              left: `${x0}pt`,
              top: `${y0}pt`,
              width: `${x1 - x0 + 3}pt`,
              fontSize: `${fs}pt`,
              fontWeight: ln.bold ? "bold" : "normal",
              fontStyle: ln.italic ? "italic" : "normal",
              color: colorCss(ln.color),
            }}
          >
            {translated}
          </span>
        );
      })}
    </div>
  );
});

export default function OverlayViewer({
  file,
  firstPage,
  sourceLang,
  targetLang,
  translateEngine,
  filename,
  onFallback,
}: OverlayViewerProps) {
  const [pages, setPages] = useState<OverlayPageData[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    "loading" | "translating" | "ready" | "error"
  >("loading");
  const [statusMsg, setStatusMsg] = useState("Se extrage documentul...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("translated");
  const rootRef = useRef<HTMLDivElement>(null);

  // ---- Load: fetch every page from /api/overlay, then translate unique lines. ----
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let cancelled = false;

    async function fetchPage(idx: number): Promise<OverlayPageData> {
      const fd = new FormData();
      fd.append("files", file, file.name);
      fd.append("page", String(idx));
      const res = await fetchWithRetry(
        `${API_URL}/api/overlay`,
        { method: "POST", body: fd, signal },
        1,
      );
      if (!res.ok) throw new Error(`overlay ${res.status}`);
      return (await res.json()) as OverlayPageData;
    }

    async function run() {
      try {
        setStatus("loading");
        // Page 0 — reuse the parent's probe if it handed one down.
        const p0 = firstPage ?? (await fetchPage(0));
        if (p0.is_text_pdf === false) {
          // Not a text PDF after all — let the parent switch to the OCR pipeline.
          onFallback?.();
          return;
        }
        const total = p0.page_count || 1;
        const loaded: OverlayPageData[] = [p0];
        for (let i = 1; i < total; i++) {
          if (cancelled) return;
          setStatusMsg(`Se extrage pagina ${i + 1}/${total}...`);
          loaded.push(await fetchPage(i));
        }
        if (cancelled) return;

        // Collect unique translatable line texts across all pages (dedup → fewer calls).
        const uniq = Array.from(
          new Set(loaded.flatMap((p) => p.lines.map((l) => l.text))),
        ).filter(shouldTranslate);

        setStatus("translating");
        const map: Record<string, string> = {};
        const t0 = Date.now();
        for (let i = 0; i < uniq.length; i += CHUNK) {
          if (cancelled) return;
          const chunk = uniq.slice(i, i + CHUNK);
          setStatusMsg(
            `Se traduce ${Math.min(i + CHUNK, uniq.length)}/${uniq.length}...`,
          );
          try {
            const res = await fetchWithRetry(`${API_URL}/api/translate-text`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text_sections: chunk.map((t) => ({
                  type: "paragraph",
                  content: t,
                })),
                source_lang: sourceLang,
                target_lang: targetLang,
                translate_engine: translateEngine,
              }),
              signal,
            });
            if (!res.ok) throw new Error(`translate ${res.status}`);
            const data = await res.json();
            const ts: Array<{ content?: string }> =
              data.translated_sections || [];
            chunk.forEach((t, j) => {
              map[t] = ts[j]?.content ?? t;
            });
          } catch {
            if (signal.aborted) return;
            // Keep the source text for this chunk rather than dropping lines.
            chunk.forEach((t) => {
              map[t] = t;
            });
            logCodedWarn(
              "E-TRANS-001",
              `Overlay: chunk de traducere esuat (${chunk.length} linii) — pastrez originalul`,
              {
                source: "overlay",
                context: { from: sourceLang, to: targetLang },
              },
            );
          }
        }
        if (cancelled) return;

        setTranslations(map);
        setPages(loaded);
        setStatus("ready");
        logAction("Overlay gata", {
          pages: loaded.length,
          lines: loaded.reduce((n, p) => n + p.lines.length, 0),
          translated: uniq.length,
          duration_ms: Date.now() - t0,
          from: sourceLang,
          to: targetLang,
        });
      } catch (err) {
        if (cancelled || signal.aborted) return;
        const msg = err instanceof Error ? err.message : "Eroare overlay";
        setErrorMsg(msg);
        setStatus("error");
        logError(`Overlay esuat: ${msg}`, {
          source: "overlay",
          errorCode: "E-OVL-001",
          context: { file: file.name, from: sourceLang, to: targetLang },
        });
      }
    }

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // Re-run when the file or language pair changes (fresh render — one target/session).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, sourceLang, targetLang, translateEngine]);

  // ---- Export: print the translated document (vector text over raster bg). ----
  const handlePrint = useCallback(() => {
    logAction("Overlay print/PDF", { pages: pages.length });
    window.print();
  }, [pages.length]);

  // ---- Export: self-contained interactive HTML built from the LIVE DOM (edits included). ----
  const handleDownloadHtml = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    // Current (possibly edited) text per line id.
    const edited: Record<string, string> = {};
    root.querySelectorAll<HTMLElement>(".ov-s").forEach((el) => {
      const id = el.getAttribute("data-id");
      if (id) edited[id] = el.textContent ?? "";
    });

    const pageDivs = pages
      .map((pg) => {
        const spans = pg.lines
          .map((ln) => {
            const [x0, y0, x1] = ln.bbox;
            const t = edited[ln.id] ?? translations[ln.text] ?? ln.text;
            const fs = fitSize(t, x1 - x0, ln.size, ln.bold);
            const style =
              `left:${x0.toFixed(2)}pt;top:${y0.toFixed(2)}pt;` +
              `width:${(x1 - x0 + 3).toFixed(2)}pt;` +
              `font-family:Arial,Helvetica,sans-serif;font-size:${fs.toFixed(2)}pt;` +
              `font-weight:${ln.bold ? "bold" : "normal"};` +
              `font-style:${ln.italic ? "italic" : "normal"};color:${colorCss(ln.color)};`;
            return (
              `<span class="s" contenteditable="true" spellcheck="false" ` +
              `data-src="${escapeHtml(ln.text)}" style="${style}">${escapeHtml(t)}</span>`
            );
          })
          .join("");
        return (
          `<div class="page" style="width:${pg.width.toFixed(2)}pt;height:${pg.height.toFixed(2)}pt;">` +
          `<img class="bg bg-o" src="data:image/png;base64,${pg.bg_original}">` +
          `<img class="bg bg-t" src="data:image/png;base64,${pg.bg_redacted}">` +
          spans +
          `</div>`
        );
      })
      .join("");

    const srcLabel = LANG_LABEL[sourceLang] || sourceLang.toUpperCase();
    const tgtLabel = LANG_LABEL[targetLang] || targetLang.toUpperCase();
    const html =
      `<!doctype html><html lang="ro"><head><meta charset="utf-8">` +
      `<title>Traducere overlay — ${escapeHtml(filename)}</title><style>` +
      `*{box-sizing:border-box}body{margin:0;background:#3a3a3a;font-family:Arial,sans-serif}` +
      `.tb{position:sticky;top:0;z-index:100;background:#2d5016;color:#f0ebe3;padding:8px 14px;` +
      `display:flex;gap:8px;align-items:center;flex-wrap:wrap;box-shadow:0 2px 8px rgba(0,0,0,.4)}` +
      `.tb button{background:#3a6b1e;color:#f5d565;border:1px solid #f5d565;padding:6px 12px;` +
      `border-radius:6px;cursor:pointer;font-size:14px}.tb button.active{background:#f5d565;color:#2d5016;font-weight:bold}` +
      `.tb .sp{flex:1}.wrap{padding:20px;display:flex;flex-direction:column;align-items:center;gap:20px}` +
      `.page{position:relative;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,.5);overflow:hidden}` +
      `.bg{position:absolute;left:0;top:0;width:100%;height:100%;user-select:none;pointer-events:none}` +
      `.s{position:absolute;line-height:1.0;white-space:nowrap;outline:none}` +
      `body[data-view="original"] .s{display:none}body[data-view="original"] .bg-t{display:none}` +
      `body[data-view="translated"] .bg-o{display:none}` +
      `.s:focus{background:rgba(245,213,101,.35);box-shadow:0 0 0 1px #f5d565}` +
      `@media print{.tb{display:none!important}body{background:#fff}.wrap{padding:0;gap:0}` +
      `.page{box-shadow:none;page-break-after:always}body[data-view]{--x:0}` +
      `body .bg-o{display:none}body .s{display:block!important}body .bg-t{display:block!important}` +
      `-webkit-print-color-adjust:exact;print-color-adjust:exact}` +
      `</style></head><body data-view="translated">` +
      `<div class="tb"><button id="bo" onclick="sv('original')">${escapeHtml(srcLabel)} (original)</button>` +
      `<button id="bt" class="active" onclick="sv('translated')">${escapeHtml(tgtLabel)} (tradus)</button>` +
      `<span class="sp"></span><button onclick="window.print()">Printeaza / PDF</button></div>` +
      `<div class="wrap">${pageDivs}</div>` +
      `<script>function sv(v){document.body.setAttribute('data-view',v);` +
      `document.getElementById('bo').classList.toggle('active',v==='original');` +
      `document.getElementById('bt').classList.toggle('active',v==='translated');}<\/script>` +
      `</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_overlay.html`;
    a.click();
    URL.revokeObjectURL(url);
    logAction("Overlay download HTML", { pages: pages.length });
  }, [pages, translations, sourceLang, targetLang, filename]);

  const srcLabel = LANG_LABEL[sourceLang] || sourceLang.toUpperCase();
  const tgtLabel = LANG_LABEL[targetLang] || targetLang.toUpperCase();

  if (status === "error") {
    return (
      <div
        className="rounded-lg p-4 text-center"
        style={{
          background: "rgba(232, 131, 107, 0.15)",
          border: "1px solid var(--chalk-red)",
        }}
      >
        <p className="text-chalk-red text-lg">
          Nu am putut genera documentul fidel: {errorMsg}
        </p>
        {onFallback && (
          <button onClick={onFallback} className="chalk-btn mt-3">
            Incearca cu OCR clasic
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="ov-root" data-view={view} ref={rootRef}>
      <style>{OVERLAY_CSS}</style>

      <div className="ov-toolbar">
        <button
          onClick={() => setView("original")}
          className={`chalk-btn ${view === "original" ? "chalk-btn--active" : ""}`}
          disabled={status !== "ready"}
        >
          {srcLabel} (original)
        </button>
        <button
          onClick={() => setView("translated")}
          className={`chalk-btn ${view === "translated" ? "chalk-btn--active" : ""}`}
          disabled={status !== "ready"}
        >
          {tgtLabel} (tradus)
        </button>
        <span style={{ flex: 1 }} />
        {onFallback && (
          <button
            onClick={onFallback}
            className="chalk-btn"
            title="Foloseste OCR clasic (ex. daca e o fisa matematica cu formule)"
          >
            Reproceseaza (OCR)
          </button>
        )}
        <button
          onClick={handleDownloadHtml}
          className="chalk-btn"
          disabled={status !== "ready"}
        >
          Descarca HTML
        </button>
        <button
          onClick={handlePrint}
          className="chalk-btn chalk-btn--primary"
          disabled={status !== "ready"}
        >
          Printeaza / PDF
        </button>
      </div>

      {status !== "ready" ? (
        <div className="ov-loading" aria-live="polite">
          <div className="ov-spinner" />
          <p>{statusMsg}</p>
        </div>
      ) : (
        <div className="ov-wrap">
          {pages.map((pg, i) => (
            <OverlayPage key={i} page={pg} translations={translations} />
          ))}
        </div>
      )}
    </div>
  );
}

const OVERLAY_CSS = `
.ov-root { --view:translated; }
.ov-toolbar { position:sticky; top:0; z-index:30; display:flex; gap:8px; align-items:center;
  flex-wrap:wrap; padding:10px 12px; background:#24400f; border:1px solid rgba(245,213,101,.35);
  border-radius:10px; margin-bottom:14px; }
.ov-loading { display:flex; flex-direction:column; align-items:center; gap:14px; padding:48px 0;
  color:var(--chalk-white); }
.ov-spinner { width:42px; height:42px; border:4px solid rgba(245,213,101,.25);
  border-top-color:var(--chalk-yellow); border-radius:50%; animation:ov-spin .9s linear infinite; }
@keyframes ov-spin { to { transform:rotate(360deg); } }
.ov-wrap { display:flex; flex-direction:column; align-items:center; gap:20px; }
.ov-page { position:relative; background:#fff; box-shadow:0 4px 22px rgba(0,0,0,.5); overflow:hidden;
  max-width:100%; }
.ov-bg { position:absolute; left:0; top:0; width:100%; height:100%; user-select:none; pointer-events:none; }
.ov-s { position:absolute; line-height:1.0; white-space:nowrap; outline:none; cursor:text; }
.ov-s:focus { background:rgba(245,213,101,.35); box-shadow:0 0 0 1px var(--chalk-yellow); }
.ov-root[data-view="original"] .ov-s { display:none; }
.ov-root[data-view="original"] .ov-bg-redacted { display:none; }
.ov-root[data-view="translated"] .ov-bg-original { display:none; }
@media print {
  .ov-toolbar { display:none !important; }
  .ov-wrap { gap:0; }
  .ov-page { box-shadow:none; page-break-after:always; }
  /* Always print the TRANSLATED document regardless of the on-screen toggle. */
  .ov-root .ov-bg-original { display:none !important; }
  .ov-root .ov-bg-redacted { display:block !important; }
  .ov-root .ov-s { display:block !important; }
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}
`;
