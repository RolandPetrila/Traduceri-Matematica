"use client";

/**
 * F9 — Import OCR drag&drop matematic (2026-07-29). Dispecer de fișiere + orchestrare:
 * imagine/PDF-scanat → `/api/ocr` (Gemini → text + `$LaTeX$` + figuri) → noduri TipTap
 * EDITABILE (ocr-map); DOCX/PDF-cu-text/TXT/MD → text brut (onest: fără matematică).
 *
 * Formă §17 CONFIRMATĂ (Roland): destinație = doc nou dacă editorul e pristine, altfel
 * întreb înlocuiește/adaugă; declanșare = drag&drop pe foaie + buton „Import (OCR)".
 *
 * Capcane (advisor 2026-07-29): downscale imagini/pagini < 4MB (413); `changeSource`
 * după import (altfel switch-ul de limbă șterge importul, R-EDIT); OCR 1 pagină/cerere
 * secvențial cu AbortController; pagină eșuată = marcaj vizibil, nu skip tăcut.
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { API_URL } from "@/lib/api-url";
import { fetchWithRetry } from "@/lib/fetch-retry";
import { ensureImageUnderCap } from "@/lib/image-downscale";
import { docxArrayBufferToBlocks } from "@/lib/docx-to-blocks";
import {
  structuredPagesToBlocks,
  rawTextToBlocks,
  type OcrPage,
} from "./ocr-map";
import { assessPdfText } from "./pdf-text-quality";
import { isPristineEditor } from "./editor-initial";
import { useEditorTranslate, type LangCode } from "./editor-translate-state";
import { useEditorDocument } from "./editor-document";
import { trackEditor } from "./editor-telemetry";

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp"]);
const TEXT_EXT = new Set(["txt", "md", "csv", "json"]);
/** Cap de pagini OCR per import (secvențial, ~5-15s/pagină pe Vercel 60s). */
const MAX_OCR_PAGES = 20;

export interface ImportProgress {
  current: number;
  total: number;
  label: string;
}

/** Semnalele pt bannerul onest (R3) — ce s-a întâmplat efectiv la import. */
interface ImportMeta {
  filename: string;
  count: number;
  usedOcr: boolean;
  mistralFallback: boolean;
  failedPages: number;
  pageCapped: number; // 0 = nu s-a plafonat; altfel = nr. total de pagini
  bruteNoMath: boolean;
  // R3 (DOCX OMML→LaTeX): semnale specifice căii .docx.
  ommlFound: number; // formule matematice native extrase din .docx
  imagesFound: number; // imagini din word/media inserate
  unresolvedImages: number; // imagini în format nesuportat (EMF/WMF…)
  unknownOmml: string[]; // construcții OMML rare aproximate (ETAPA B)
}

interface ProcessResult extends Omit<ImportMeta, "filename" | "count"> {
  blocks: JSONContent[];
}

interface PendingImport {
  blocks: JSONContent[];
  meta: ImportMeta;
}

type ImportCtx = {
  isImporting: boolean;
  progress: ImportProgress | null;
  error: string | null;
  notice: string | null;
  /** Import în așteptare de decizie (editorul avea deja conținut). */
  pending: PendingImport | null;
  /** „Forțează OCR": sare peste evaluarea stratului-text la PDF-uri (R7.2). */
  forceOcr: boolean;
  setForceOcr: (v: boolean) => void;
  /** Pornește importul (drag&drop sau buton). */
  importFiles: (files: FileList | File[]) => void;
  /** Anulează importul în curs (oprește lanțul OCR secvențial). */
  cancelImport: () => void;
  /** Aplică importul în așteptare (înlocuiește / adaugă la sfârșit). */
  applyPending: (mode: "replace" | "append") => void;
  /** Renunță la importul în așteptare. */
  cancelPending: () => void;
  clearError: () => void;
  dismissNotice: () => void;
};

const Ctx = createContext<ImportCtx | null>(null);

/** POST o pagină (imagine) la `/api/ocr` (multipart → FĂRĂ preflight CORS). */
async function ocrRequest(
  blob: Blob,
  filename: string,
  sourceLang: string,
  signal: AbortSignal,
  engine: "gemini" | "azure" = "gemini",
): Promise<OcrPage[]> {
  const fd = new FormData();
  fd.append("source_lang", sourceLang);
  // R7.5 — rutare pe tip: imagini (math, Cristina) → Gemini; PDF business (Mösslein,
  // tabele/layout) → Azure. Serverul are gardă R-MATH (0 tabele → revine la Gemini).
  fd.append("engine", engine);
  fd.append("files", blob, filename);
  // FĂRĂ header Content-Type: browserul pune `multipart/form-data; boundary=…`
  // (valoare safelisted → NU declanșează preflight-ul care dă 503 la edge Vercel).
  const res = await fetchWithRetry(`${API_URL}/api/ocr`, {
    method: "POST",
    body: fd,
    signal,
  });
  if (res.status === 413) throw new Error("Fișierul e prea mare (peste 4MB).");
  if (!res.ok) throw new Error(`OCR HTTP ${res.status}`);
  const data = (await res.json()) as {
    structured_pages?: OcrPage[];
    status?: string;
    error?: string;
  };
  if (data.status === "error") throw new Error(data.error || "OCR a eșuat");
  return data.structured_pages || [];
}

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** Randează o pagină pdf.js într-un PNG Blob (scale 2.0 ≈ 144 DPI). */
async function renderPdfPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  scale = 2.0,
): Promise<Blob> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponibil");
  await page.render({ canvasContext: ctx, viewport }).promise;
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob a eșuat"))),
      "image/png",
    ),
  );
  page.cleanup?.();
  return blob;
}

/** Un singur fișier → noduri-bloc + semnale. Rutare pe tip (onest R3). */
async function processFile(
  file: File,
  sourceLang: string,
  signal: AbortSignal,
  onProgress: (p: ImportProgress) => void,
  forceOcr = false,
): Promise<ProcessResult> {
  const e = ext(file.name);
  const isImage = IMAGE_EXT.has(e) || (file.type || "").startsWith("image/");

  const base: Omit<ProcessResult, "blocks"> = {
    usedOcr: false,
    mistralFallback: false,
    failedPages: 0,
    pageCapped: 0,
    bruteNoMath: false,
    ommlFound: 0,
    imagesFound: 0,
    unresolvedImages: 0,
    unknownOmml: [],
  };

  // --- Imagine → OCR (o singură pagină) ---
  if (isImage) {
    onProgress({ current: 1, total: 1, label: `OCR ${file.name}…` });
    const blob = await ensureImageUnderCap(file);
    const pages = await ocrRequest(blob, file.name, sourceLang, signal);
    const mapped = structuredPagesToBlocks(pages);
    return {
      ...base,
      blocks: mapped.blocks,
      usedOcr: true,
      mistralFallback: mapped.mistralFallback,
    };
  }

  // --- TXT/MD/CSV/JSON → text brut (utilizatorul știe că e text) ---
  if (TEXT_EXT.has(e)) {
    const text = await file.text();
    return { ...base, blocks: rawTextToBlocks(text) };
  }

  // --- DOCX → matematică nativă (OMML→LaTeX) + text + imagini, la locul lor (R3) ---
  if (e === "docx") {
    onProgress({ current: 1, total: 1, label: `Se citește ${file.name}…` });
    const r = docxArrayBufferToBlocks(await file.arrayBuffer());
    return {
      ...base,
      blocks: r.blocks,
      // bruteNoMath rămâne false: OMML-ul E transcris (nu mai e „text brut").
      ommlFound: r.ommlCount,
      imagesFound: r.imageCount,
      unresolvedImages: r.unresolvedImages,
      unknownOmml: r.unknown,
    };
  }

  // --- PDF → text dacă are strat-text; altfel scanat → OCR pe pagini ---
  if (e === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const doc = await pdfjs.getDocument({
      data: await file.arrayBuffer(),
      isEvalSupported: false, // anti CVE-2024-4367 (JS din PDF malițios)
    }).promise;
    try {
      // Extrage stratul-text (dacă există).
      let extracted = "";
      for (let i = 1; i <= doc.numPages; i++) {
        const content = await doc.getPage(i).then((p) => p.getTextContent());
        extracted +=
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content.items.map((it: any) => it.str || "").join(" ") + "\n\n";
      }
      // R7.2 — decid pe CALITATEA stratului-text, nu doar pe volum: un PDF cu
      // strat-text OCR-prost (Filtrasan) trecea pe calea text-brut și dădea garbaj.
      // `forceOcr` (butonul din UI) sare peste evaluare și forțează re-OCR pe pixeli.
      const quality = assessPdfText(extracted, doc.numPages);
      if (!forceOcr && quality.reliable) {
        // PDF cu strat-text FIABIL → extragere brută (onest: matematica-imagine
        // NU se transcrie; pentru asta forțează OCR).
        return {
          ...base,
          blocks: rawTextToBlocks(extracted),
          bruteNoMath: true,
        };
      }

      // Strat-text slab/absent SAU „Forțează OCR" → rasterizez fiecare pagină → OCR
      // (1 pagină/cerere, Vercel 60s). PDF business → Azure (R7.5, Slice 2).
      const total = Math.min(doc.numPages, MAX_OCR_PAGES);
      const pageCapped = doc.numPages > MAX_OCR_PAGES ? doc.numPages : 0;
      const pages: OcrPage[] = [];
      let failedPages = 0;
      for (let i = 1; i <= total; i++) {
        if (signal.aborted) break;
        onProgress({ current: i, total, label: `OCR pagina ${i}/${total}…` });
        try {
          const page = await doc.getPage(i);
          const png = await renderPdfPage(page);
          const blob = await ensureImageUnderCap(png);
          const pp = await ocrRequest(
            blob,
            `${file.name}_p${i}.png`,
            sourceLang,
            signal,
            "azure", // PDF → OCR = document business → Azure (tabele/layout/figuri, R7.5)
          );
          pages.push(...pp);
        } catch (err) {
          if ((err as Error)?.name === "AbortError") throw err;
          failedPages++;
          pages.push({
            sections: [
              { type: "paragraph", content: `[Pagina ${i}: OCR eșuat]` },
            ],
          });
        }
      }
      const mapped = structuredPagesToBlocks(pages);
      return {
        ...base,
        blocks: mapped.blocks,
        usedOcr: true,
        mistralFallback: mapped.mistralFallback,
        failedPages,
        pageCapped,
      };
    } finally {
      await doc.destroy();
    }
  }

  throw new Error(`Format nesuportat: .${e || "?"}`);
}

/** Procesează toate fișierele → un singur set de blocuri (pageBreak între fișiere). */
async function processFiles(
  files: File[],
  sourceLang: string,
  signal: AbortSignal,
  onProgress: (p: ImportProgress) => void,
  forceOcr = false,
): Promise<ProcessResult> {
  const blocks: JSONContent[] = [];
  const acc = {
    usedOcr: false,
    mistralFallback: false,
    failedPages: 0,
    pageCapped: 0,
    bruteNoMath: false,
    ommlFound: 0,
    imagesFound: 0,
    unresolvedImages: 0,
    unknownOmml: [] as string[],
  };
  for (const file of files) {
    if (signal.aborted) break;
    const r = await processFile(file, sourceLang, signal, onProgress, forceOcr);
    if (blocks.length && r.blocks.length) blocks.push({ type: "pageBreak" });
    blocks.push(...r.blocks);
    acc.usedOcr ||= r.usedOcr;
    acc.mistralFallback ||= r.mistralFallback;
    acc.failedPages += r.failedPages;
    acc.pageCapped = Math.max(acc.pageCapped, r.pageCapped);
    acc.bruteNoMath ||= r.bruteNoMath;
    acc.ommlFound += r.ommlFound;
    acc.imagesFound += r.imagesFound;
    acc.unresolvedImages += r.unresolvedImages;
    for (const u of r.unknownOmml)
      if (!acc.unknownOmml.includes(u)) acc.unknownOmml.push(u);
  }
  return { ...acc, blocks };
}

/** Text onest pt banner (ce s-a extras + degradări). */
function buildNotice(
  meta: ImportMeta,
  mode: "new" | "replace" | "append",
): string {
  const many = meta.count > 1 ? ` + încă ${meta.count - 1} fișier(e)` : "";
  const verb = mode === "append" ? "Am adăugat" : "Am importat";
  let msg = `${verb} „${meta.filename}"${many}.`;
  if (meta.usedOcr && meta.failedPages === 0)
    msg += " Verifică formulele și figurile — OCR-ul poate greși.";
  // DOCX (R3): matematica OMML A fost transcrisă → raport onest cu numere.
  if (meta.ommlFound > 0 || meta.imagesFound > 0) {
    const parts: string[] = [];
    if (meta.ommlFound > 0)
      parts.push(
        `${meta.ommlFound} ${meta.ommlFound === 1 ? "formulă" : "formule"}`,
      );
    if (meta.imagesFound > 0)
      parts.push(
        `${meta.imagesFound} ${meta.imagesFound === 1 ? "figură" : "figuri"}`,
      );
    msg += ` Am păstrat ${parts.join(" + ")} la locul lor. Verifică-le.`;
    if (meta.unresolvedImages > 0)
      msg += ` ${meta.unresolvedImages} figură(i) în format nesuportat (EMF/WMF) — needate.`;
    if (meta.unknownOmml.length > 0)
      msg += " Unele construcții rare pot fi aproximate.";
  }
  if (meta.bruteNoMath)
    msg +=
      " Text brut — matematica din imagini NU a fost transcrisă (doar OCR-ul pe poze/PDF-scanat extrage formule).";
  if (meta.mistralFallback)
    msg += " OCR de rezervă (Mistral) — fără figuri/LaTeX.";
  if (meta.failedPages > 0)
    msg += ` ${meta.failedPages} pagină(i) au eșuat la OCR (marcate în text).`;
  if (meta.pageCapped > 0)
    msg += ` Documentul are ${meta.pageCapped} pagini; am procesat primele ${MAX_OCR_PAGES}.`;
  return msg;
}

export function EditorImportProvider({
  editor,
  children,
}: {
  editor: Editor | null;
  children: ReactNode;
}) {
  const { sourceLang, changeSource } = useEditorTranslate();
  const { rename } = useEditorDocument();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [forceOcr, setForceOcr] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Ref sincron pt forceOcr → `importFiles` citește mereu valoarea curentă fără să
  // se re-creeze la fiecare toggle (la fel ca `langRef`).
  const forceOcrRef = useRef(false);
  forceOcrRef.current = forceOcr;
  // Guard SINCRON: `isImporting` (state) se citește stale în același tick → două
  // apeluri rapide ar porni două importuri. `importingRef` prinde apelurile care se
  // SUPRAPUN; `lastFireRef` (debounce) prinde și re-fire-ul rapid care ajunge DUPĂ ce
  // primul import s-a încheiat deja (ex. `change` emis de două ori pt același fișier).
  const importingRef = useRef(false);
  const lastFireRef = useRef(0);
  const langRef = useRef<LangCode>(sourceLang);
  langRef.current = sourceLang;

  /** Aplică blocurile + re-ancorează cache-ul de traducere (R-EDIT, advisor pct.4). */
  const applyBlocks = useCallback(
    (blocks: JSONContent[], mode: "new" | "replace" | "append") => {
      if (!editor) return;
      if (mode === "append") {
        // Adaugă la sfârșit. (Un `pageBreak` prim-element la `focus("end")` — poziție
        // inline — e ignorat de ProseMirror și rupe tăcut inserarea; verificat live →
        // scos. Separarea pe pagină o poate face utilizatorul din „Inserare".)
        editor.chain().focus("end").insertContent(blocks).run();
      } else {
        editor.commands.setContent({ type: "doc", content: blocks });
        editor.commands.focus("start");
      }
      // Conținutul nou = SURSĂ în limba curentă. changeSource resetează cache-ul pe
      // limbă la getJSON() actual → un switch de limbă ulterior nu-l mai șterge.
      changeSource(langRef.current);
    },
    [editor, changeSource],
  );

  const importFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (!files.length || !editor || importingRef.current) return;
      // Debounce re-fire rapid (același eveniment emis de două ori) — un import legitim
      // nou vine la secunde distanță (utilizatorul alege alt fișier), nu în <800ms.
      const now = Date.now();
      if (now - lastFireRef.current < 800) return;
      lastFireRef.current = now;
      importingRef.current = true;
      setError(null);
      setNotice(null);
      setIsImporting(true);
      setProgress({ current: 0, total: 0, label: "Se pregătește…" });
      const ac = new AbortController();
      abortRef.current = ac;
      const usedLang = langRef.current;
      try {
        const r = await processFiles(
          files,
          usedLang,
          ac.signal,
          setProgress,
          forceOcrRef.current,
        );
        if (ac.signal.aborted) return;
        if (!r.blocks.length) {
          setError("Nu am putut extrage conținut din fișier.");
          return;
        }
        const meta: ImportMeta = {
          filename: files[0].name,
          count: files.length,
          usedOcr: r.usedOcr,
          mistralFallback: r.mistralFallback,
          failedPages: r.failedPages,
          pageCapped: r.pageCapped,
          bruteNoMath: r.bruteNoMath,
          ommlFound: r.ommlFound,
          imagesFound: r.imagesFound,
          unresolvedImages: r.unresolvedImages,
          unknownOmml: r.unknownOmml,
        };
        trackEditor("ocr_import", {
          files: files.length,
          ocr: r.usedOcr,
          failed: r.failedPages,
        });
        if (isPristineEditor(editor)) {
          applyBlocks(r.blocks, "new");
          rename(meta.filename.replace(/\.[^.]+$/, ""));
          setNotice(buildNotice(meta, "new"));
        } else {
          setPending({ blocks: r.blocks, meta });
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setError((err as Error)?.message || "Importul a eșuat.");
          trackEditor("ocr_import_error", {});
        }
      } finally {
        importingRef.current = false;
        setIsImporting(false);
        setProgress(null);
        abortRef.current = null;
      }
    },
    [editor, applyBlocks, rename],
  );

  const cancelImport = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const applyPending = useCallback(
    (mode: "replace" | "append") => {
      if (!pending) return;
      applyBlocks(pending.blocks, mode);
      if (mode === "replace")
        rename(pending.meta.filename.replace(/\.[^.]+$/, ""));
      setNotice(buildNotice(pending.meta, mode));
      setPending(null);
    },
    [pending, applyBlocks, rename],
  );

  return (
    <Ctx.Provider
      value={{
        isImporting,
        progress,
        error,
        notice,
        pending,
        forceOcr,
        setForceOcr,
        importFiles,
        cancelImport,
        applyPending,
        cancelPending: () => setPending(null),
        clearError: () => setError(null),
        dismissNotice: () => setNotice(null),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useEditorImport(): ImportCtx {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useEditorImport trebuie folosit în EditorImportProvider");
  return ctx;
}
