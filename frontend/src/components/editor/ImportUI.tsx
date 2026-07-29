"use client";

/**
 * F9 — UI-ul de import OCR (2026-07-29): dropzone cu overlay la drag, bară de progres
 * cu anulare, dialog înlocuiește/adaugă (editor cu conținut) și banner onest de rezultat.
 * Toată starea vine din `useEditorImport`. Formă §17 confirmată (Roland).
 */

import { useState, type ReactNode } from "react";
import { UploadCloud, Loader2, X, FileDown } from "lucide-react";
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
