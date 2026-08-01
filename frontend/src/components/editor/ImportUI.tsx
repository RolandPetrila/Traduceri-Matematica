"use client";

/**
 * F9 — UI-ul de import OCR (2026-07-29): dropzone cu overlay la drag, bară de progres
 * cu anulare, dialog înlocuiește/adaugă (editor cu conținut) și banner onest de rezultat.
 * Toată starea vine din `useEditorImport`. Formă §17 confirmată (Roland).
 */

import { useState, type ReactNode } from "react";
import {
  UploadCloud,
  Loader2,
  X,
  FileDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEditorImport } from "./editor-import";

/**
 * G4 — verificare vizuală original↔rezultat (R-MATH). Thumbnail al paginii-sursă
 * + „Vezi originalul" → lightbox cu poza la mărime (navigare între pagini). Fără
 * previzualizări (DOCX/TXT) → nu randează nimic.
 */
function SourcePreview({ previews }: { previews: string[] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  if (!previews.length) return null;
  const n = previews.length;
  const cur = previews[Math.min(idx, n - 1)];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIdx(0);
          setOpen(true);
        }}
        className="flex shrink-0 items-center gap-1.5 rounded border border-border bg-background/60 px-1.5 py-1 hover:bg-muted"
        title="Vezi imaginea-sursă pentru a compara cu rezultatul (R-MATH)"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previews[0]}
          alt="Miniatură sursă"
          className="h-8 w-8 rounded object-cover"
        />
        <span className="whitespace-nowrap text-[11px] font-medium text-primary">
          Vezi originalul{n > 1 ? ` (${n})` : ""}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Original
              {n > 1 ? ` — pagina ${Math.min(idx, n - 1) + 1}/${n}` : ""}
            </DialogTitle>
            <DialogDescription>
              Compară cu rezultatul din editor — dacă o formulă sau o figură
              lipsește, editeaz-o direct sau reimportă.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2">
            {n > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 p-0"
                onClick={() => setIdx((i) => (i - 1 + n) % n)}
                aria-label="Pagina anterioară"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cur}
              alt={`Pagina sursă ${Math.min(idx, n - 1) + 1}`}
              className="max-h-[70vh] w-auto max-w-full rounded border border-border object-contain"
            />
            {n > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 p-0"
                onClick={() => setIdx((i) => (i + 1) % n)}
                aria-label="Pagina următoare"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function hasFiles(e: React.DragEvent): boolean {
  return !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");
}

/**
 * Învelește foaia: la drag&drop cu fișiere arată un overlay care ESTE ținta drop-ului
 * (topmost, z mare) → prinde fișierul ÎNAINTEA ProseMirror (care altfel ar încerca să-l
 * insereze ca imagine/text). Fără fișiere trase → transparent, editarea e normală.
 */
export function ImportDropZone({ children }: { children: ReactNode }) {
  const { importFiles, isImporting } = useEditorImport();
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragEnter={(e) => {
        if (hasFiles(e) && !isImporting) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragOver={(e) => {
        if (hasFiles(e) && !isImporting) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
    >
      {children}

      {dragging && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-primary/15 backdrop-blur-[1px]"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(e) => {
            // Doar când chiar ieșim din overlay (nu la trecerea peste vreun copil).
            if (e.currentTarget === e.target) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) importFiles(e.dataTransfer.files);
          }}
        >
          <div className="pointer-events-none flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary bg-card/90 px-6 py-5 text-center shadow-lg">
            <UploadCloud className="h-8 w-8 text-primary" />
            <div className="text-sm font-semibold">Trage fișierul aici</div>
            <div className="text-xs text-muted-foreground">
              PDF · imagine · DOCX · TXT/MD
              <br />
              matematica → OCR; DOCX/TXT = text brut
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Banner rezultat + eroare + bară progres + dialog destinație. Montat în shell. */
export function ImportStatus() {
  const {
    isImporting,
    progress,
    error,
    notice,
    pending,
    cancelImport,
    applyPending,
    cancelPending,
    clearError,
    dismissNotice,
    sourcePreviews,
  } = useEditorImport();

  return (
    <>
      {/* Bară de progres (import în curs) — sticky sus, cu anulare */}
      {isImporting && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-primary/10 px-3 py-1.5 text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span className="flex-1">
            {progress?.label || "Import în curs…"}
            {progress && progress.total > 1
              ? ` (${progress.current}/${progress.total})`
              : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={cancelImport}
          >
            Anulează
          </Button>
        </div>
      )}

      {/* Eroare */}
      {error && (
        <div className="flex shrink-0 items-start gap-2 border-b border-border bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <span className="flex-1">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 shrink-0 p-0 text-destructive"
            onClick={clearError}
            aria-label="Închide"
            title="Închide"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Banner rezultat (onest R3) */}
      {notice && (
        <div className="flex shrink-0 items-start gap-2 border-b border-border bg-primary/10 px-3 py-2 text-xs">
          <FileDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="flex-1">{notice}</span>
          {/* G4 — miniatură + lightbox al sursei pt comparație vizuală (R-MATH) */}
          <SourcePreview previews={sourcePreviews} />
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 shrink-0 p-0"
            onClick={dismissNotice}
            aria-label="Închide anunțul"
            title="Închide anunțul"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Dialog destinație (editorul avea deja conținut) */}
      <Dialog open={!!pending} onOpenChange={(o) => !o && cancelPending()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unde pun conținutul importat?</DialogTitle>
            <DialogDescription>
              Am extras <strong>„{pending?.meta.filename}"</strong>
              {pending && pending.meta.count > 1
                ? ` + încă ${pending.meta.count - 1} fișier(e)`
                : ""}
              . Editorul are deja conținut — alege ce fac cu el.
            </DialogDescription>
          </DialogHeader>
          {sourcePreviews.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <SourcePreview previews={sourcePreviews} />
              <span className="text-muted-foreground">
                Poți verifica sursa înainte de a alege.
              </span>
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={cancelPending}>
              Anulează
            </Button>
            <Button variant="outline" onClick={() => applyPending("append")}>
              Adaugă la sfârșit
            </Button>
            <Button onClick={() => applyPending("replace")}>
              Înlocuiește documentul
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
