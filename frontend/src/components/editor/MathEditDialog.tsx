"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import katex from "katex";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { trackEditor } from "./editor-telemetry";
import { norm } from "./math-input";
import { MathSymbolPalette, useActiveField } from "./MathSymbolPalette";

/**
 * Editarea unei formule DEJA inserate pe foaie (M-edit, 2026-07-26).
 *
 * Înainte: click pe formulă nu făcea nimic → puteai doar s-o ștergi întreagă.
 * Acum: `Mathematics` e configurat (extensions.ts) să emită evenimentul
 * `math:edit` la click pe orice nod inline/block, cu `latex` + `pos` exact.
 * Aici deschidem un mic dialog cu formula editabilă (câmp + paletă + previzualizare
 * live) → salvarea o rescrie prin `updateInlineMath` / `updateBlockMath` la ACEA
 * poziție. Merge la 100% din formule (bibliotecă, constructor, cele 214).
 *
 * `pos` vine din click și rămâne valid cât dialogul e deschis (documentul nu se
 * editează între timp) → îl trimitem explicit comenzii de update.
 */
type MathEditDetail = { latex: string; pos: number; kind: "inline" | "block" };

export function MathEditDialog({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false);
  const [latex, setLatex] = useState("");
  const posRef = useRef<number | null>(null);
  const kindRef = useRef<"inline" | "block">("inline");
  const { elRef, setActive, insert } = useActiveField();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<MathEditDetail>).detail;
      if (!d) return;
      setLatex(d.latex ?? "");
      posRef.current = typeof d.pos === "number" ? d.pos : null;
      kindRef.current = d.kind === "block" ? "block" : "inline";
      setOpen(true);
    };
    window.addEventListener("math:edit", handler as EventListener);
    return () =>
      window.removeEventListener("math:edit", handler as EventListener);
  }, []);

  const preview = useMemo(() => {
    try {
      return katex.renderToString(norm(latex) || "\\square", {
        throwOnError: false,
        strict: false,
        displayMode: kindRef.current === "block",
      });
    } catch {
      return "";
    }
    // `latex` se schimbă la fiecare formulă deschisă (setLatex în handler) → e
    // suficient ca dependență; `kindRef.current` e citit la momentul calculului.
  }, [latex]);

  const onPalette = (sym: string) => {
    if (!elRef.current) elRef.current = inputRef.current;
    insert(sym);
  };

  const save = () => {
    if (!editor) return;
    const finalLatex = norm(latex).trim();
    if (!finalLatex) return;
    const pos = posRef.current ?? undefined;
    if (kindRef.current === "block") {
      editor.chain().focus().updateBlockMath({ latex: finalLatex, pos }).run();
    } else {
      editor.chain().focus().updateInlineMath({ latex: finalLatex, pos }).run();
    }
    trackEditor("math_edit", { kind: kindRef.current });
    setOpen(false);
  };

  const remove = () => {
    if (!editor) return;
    const pos = posRef.current ?? undefined;
    if (kindRef.current === "block") {
      editor.chain().focus().deleteBlockMath({ pos }).run();
    } else {
      editor.chain().focus().deleteInlineMath({ pos }).run();
    }
    trackEditor("math_edit", { kind: kindRef.current, action: "delete" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editează formula</DialogTitle>
          <DialogDescription>
            Modifică formula și apasă Salvează. Folosește butoanele de simboluri
            pentru ² ³ √ ∞ π … — vezi rezultatul jos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Textarea
            ref={inputRef}
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            onFocus={(e) => setActive(e.currentTarget)}
            placeholder="ex: \dfrac{x²+1}{x-3}  sau  √(6x+3)"
            className="min-h-[64px] resize-y font-mono text-sm"
            aria-label="Formula"
            autoFocus
          />
          <MathSymbolPalette onInsert={onPalette} />
          <div
            className="flex max-h-[40vh] min-h-[52px] items-center justify-center overflow-auto rounded-md border border-dashed border-border bg-white px-2 py-1 text-lg text-black"
            aria-label="Previzualizare"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="destructive" size="sm" onClick={remove}>
            Șterge formula
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button size="sm" onClick={save}>
              Salvează
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
