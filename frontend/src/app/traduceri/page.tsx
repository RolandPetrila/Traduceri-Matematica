"use client";

import { useState } from "react";
import FileUpload from "@/components/traduceri/FileUpload";
import LanguageSelector from "@/components/traduceri/LanguageSelector";
import PreviewPanel from "@/components/traduceri/PreviewPanel";
import ProgressBar from "@/components/traduceri/ProgressBar";
import Dictionary from "@/components/traduceri/Dictionary";
import { addToHistory } from "@/lib/storage";
import { logError, logAction, logInfo } from "@/lib/monitoring";
import { validateTranslationOutput } from "@/lib/validator";
import EngineSelector, {
  type TranslateEngine,
} from "@/components/traduceri/EngineSelector";
import BatchPanel from "@/components/traduceri/BatchPanel";
import DocumentViewer from "@/components/traduceri/DocumentViewer";
import OverlayViewer, {
  type OverlayPageData,
} from "@/components/traduceri/OverlayViewer";
import DeeplUsage from "@/components/traduceri/DeeplUsage";
import GeminiUsage from "@/components/traduceri/GeminiUsage";

import { API_URL } from "@/lib/api-url";
import { expandFilesToPages } from "@/lib/pdf-rasterize";
import { fetchWithRetry } from "@/lib/fetch-retry";

export default function TraduceriPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [sourceLang, setSourceLang] = useState("ro");
  const [targetLang, setTargetLang] = useState("sk");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [structuredPages, setStructuredPages] = useState<unknown[] | null>(
    null,
  );
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [translateEngine, setTranslateEngine] =
    useState<TranslateEngine>("deepl");
  // Overlay mode (pixel-perfect, layout-faithful) for TEXT PDFs.
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [overlayFirstPage, setOverlayFirstPage] =
    useState<OverlayPageData | null>(null);

  const isPdf = (f: File) =>
    f.type === "application/pdf" || /\.pdf$/i.test(f.name);

  /**
   * Probe /api/overlay for page 0. Returns the page data if this is a real TEXT
   * PDF (→ overlay path), or null if it's scanned/image (→ OCR path) or the probe
   * fails (fail-open: overlay is an enhancement, never a blocker).
   */
  const probeOverlay = async (file: File): Promise<OverlayPageData | null> => {
    try {
      const fd = new FormData();
      fd.append("files", file, file.name);
      fd.append("page", "0");
      const res = await fetchWithRetry(
        `${API_URL}/api/overlay`,
        { method: "POST", body: fd },
        1,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as OverlayPageData;
      return data.is_text_pdf === false ? null : data;
    } catch {
      return null;
    }
  };

  const handleProcess = async (opts?: { forceOcr?: boolean }) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setStepLabel("Se pregatesc paginile...");
    setError(null);
    setResult(null);
    setStructuredPages(null);
    setOverlayFile(null);
    setOverlayFirstPage(null);
    setOriginalFiles([...files]);

    // Auto-detect: a single TEXT PDF (official docs, reports) is rendered
    // layout-faithful via overlay; scanned/image PDFs and everything else go
    // through OCR. Math worksheets arrive as photos/images → not a text PDF →
    // OCR reconstruction (unaffected). D3 verifies non-regression there.
    if (!opts?.forceOcr && files.length === 1 && isPdf(files[0])) {
      setStepLabel("Se analizeaza documentul...");
      const probe = await probeOverlay(files[0]);
      if (probe) {
        setOverlayFile(files[0]);
        setOverlayFirstPage(probe);
        setResult("overlay");
        setProgress(100);
        setStepLabel("Document fidel pregatit!");
        setIsProcessing(false);
        logInfo("Overlay activat (PDF text)", {
          file: files[0].name,
          pages: probe.page_count,
        });
        return;
      }
    }

    logAction("OCR pornit", {
      fileCount: files.length,
      fileNames: files.map((f) => f.name),
      fileSizes: files.map((f) => f.size),
      sourceLang,
    });

    const t0 = Date.now();
    try {
      // Rasterize PDFs in the browser → one image per page (Vercel 60s limit).
      const pages = await expandFilesToPages(files);
      if (pages.length === 0)
        throw new Error("Nu s-au putut extrage pagini din fisiere");

      const allPages: unknown[] = [];
      const htmlParts: string[] = [];

      // OCR one page per request — real progress, each call stays under 60s.
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        setStepLabel(`OCR pagina ${i + 1}/${pages.length}...`);

        const formData = new FormData();
        formData.append("files", page.blob, page.filename);
        formData.append("source_lang", sourceLang);

        const res = await fetchWithRetry(`${API_URL}/api/ocr`, {
          method: "POST",
          body: formData,
        });

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(
            !res.ok
              ? `Server error ${res.status}: ${text.substring(0, 200)}`
              : "Raspuns neasteptat de la server (nu JSON)",
          );
        }
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || `Eroare server: ${res.status}`);

        if (Array.isArray(data.structured_pages))
          allPages.push(...data.structured_pages);
        if (data.html) htmlParts.push(data.html as string);

        setProgress(Math.round(((i + 1) / pages.length) * 100));
      }

      if (allPages.length === 0) throw new Error("OCR nu a returnat continut");

      const combinedHtml = htmlParts.join("\n");
      const durationMs = Date.now() - t0;
      validateTranslationOutput({
        html: combinedHtml,
        structured_pages: allPages,
      });

      setResult(combinedHtml || "ok");
      setStructuredPages(allPages);
      setProgress(100);
      setStepLabel("Complet!");

      const pageCount = allPages.length;
      const durationSec = Math.round(durationMs / 1000);
      logInfo("OCR reusit", {
        pages: pageCount,
        duration_ms: durationMs,
        sourceLang,
        fileNames: files.map((f) => f.name),
      });

      // Browser notification (only when tab is in background)
      if ("Notification" in window && document.hidden) {
        if (Notification.permission === "default")
          Notification.requestPermission();
        if (Notification.permission === "granted") {
          new Notification("OCR complet!", {
            body: `${pageCount} ${pageCount === 1 ? "pagina procesata" : "pagini procesate"} in ${durationSec}s`,
            icon: "/icons/icon-192.png",
          });
        }
      }

      // Save to history
      addToHistory({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        files: files.map((f) => f.name),
        source_lang: sourceLang,
        target_lang: sourceLang,
        status: "success",
        duration_ms: durationMs,
        pages: pageCount,
        html: combinedHtml,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare necunoscuta";
      setError(message);
      logError(message, {
        source: "ocr",
        errorCode: "E-OCR-001",
        context: { sourceLang, fileCount: files.length },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Language selection */}
      <LanguageSelector
        sourceLang={sourceLang}
        targetLang={targetLang}
        onSourceChange={setSourceLang}
        onTargetChange={setTargetLang}
      />

      {/* File upload */}
      <FileUpload files={files} onFilesChange={setFiles} />

      {/* Engine selector + Process button */}
      <div className="flex flex-col items-center gap-3">
        <EngineSelector
          engine={translateEngine}
          onEngineChange={setTranslateEngine}
        />
        <button
          onClick={() => handleProcess()}
          disabled={files.length === 0 || isProcessing}
          aria-label="Proceseaza fisierele selectate"
          aria-busy={isProcessing}
          className="chalk-btn chalk-btn--primary text-xl px-8 py-3"
        >
          {isProcessing ? "Se proceseaza..." : "Proceseaza"}
        </button>
      </div>

      {/* Progress */}
      <div aria-live="polite" aria-atomic="true">
        {isProcessing && <ProgressBar progress={progress} label={stepLabel} />}
      </div>

      {/* Error message */}
      {error && (
        <div
          className="rounded-lg p-4 text-center"
          style={{
            background: "rgba(232, 131, 107, 0.15)",
            border: "1px solid var(--chalk-red)",
          }}
        >
          <p className="text-chalk-red text-lg">Eroare: {error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm opacity-70 hover:opacity-100"
          >
            Inchide
          </button>
        </div>
      )}

      {/* Success message */}
      {result && !isProcessing && !error && (
        <div
          className="rounded-lg p-4 text-center"
          style={{
            background: "rgba(74, 222, 128, 0.15)",
            border: "1px solid #4ade80",
          }}
        >
          <p className="text-lg font-bold" style={{ color: "#4ade80" }}>
            Document procesat!
          </p>
          <p className="text-sm opacity-70 mt-1">
            {overlayFile
              ? "Document fidel: comuta Original / Tradus, editeaza direct pe pagina, apoi Printeaza / PDF."
              : "Foloseste butoanele Original / RO / SK pentru a naviga intre variante."}
          </p>
        </div>
      )}

      {/* Overlay (pixel-perfect) for text PDFs, else 3-step Document Viewer, else preview */}
      {overlayFile ? (
        <OverlayViewer
          file={overlayFile}
          firstPage={overlayFirstPage ?? undefined}
          sourceLang={sourceLang}
          targetLang={targetLang}
          translateEngine={translateEngine}
          filename={files[0]?.name?.replace(/\.[^.]+$/, "") || "traducere"}
          onFallback={() => {
            setOverlayFile(null);
            setOverlayFirstPage(null);
            handleProcess({ forceOcr: true });
          }}
        />
      ) : result && structuredPages ? (
        <DocumentViewer
          structuredPages={structuredPages as never[]}
          fullHtml={result}
          sourceLang={sourceLang}
          initialTargetLang={targetLang}
          translateEngine={translateEngine}
          filename={files[0]?.name?.replace(/\.[^.]+$/, "") || "traducere"}
          originalFiles={originalFiles}
        />
      ) : result ? (
        <PreviewPanel
          originalFiles={files}
          translatedHtml={result}
          engineName={translateEngine}
        />
      ) : null}

      {/* Batch processing */}
      <BatchPanel
        sourceLang={sourceLang}
        targetLang={targetLang}
        translateEngine={translateEngine}
      />

      {/* Dictionary panel */}
      <Dictionary sourceLang={sourceLang} targetLang={targetLang} />

      {/* API usage counters */}
      <DeeplUsage />
      <GeminiUsage />
    </div>
  );
}
