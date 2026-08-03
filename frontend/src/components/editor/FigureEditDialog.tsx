"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { trackEditor } from "./editor-telemetry";
import {
  figureByKey,
  renderFigure,
  figureDataUri,
  defaultLabels,
  emptySides,
  type Figure,
} from "./editor-figures";

/**
 * Editarea unei FIGURI deja inserate pe foaie (M5, 2026-08-04). Oglindește
 * `MathEditDialog`: nodul Image (cu `figKey`) emite `figure:edit` la click (vezi
 * image-resize.ts); aici deschidem un dialog cu etichetele vârfurilor + lungimile
 * laturilor, previzualizare live, iar Salvează reconstruiește SVG-ul și rescrie
 * `src` + `figParams` la ACEA poziție. Export NEATINS (rămâne <img> cu SVG).
 */
type FigureEditDetail = {
  figKey: string;
  figParams: string | null;
  pos: number;
};

export function FigureEditDialog({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false);
  const [fig, setFig] = useState<Figure | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [sides, setSides] = useState<string[]>([]);
  const posRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<FigureEditDetail>).detail;
      if (!d) return;
      const f = figureByKey(d.figKey);
      if (!f) return;
      let lbls = defaultLabels(f);
      let sds = emptySides(f);
      if (d.figParams) {
        try {
          const p = JSON.parse(d.figParams) as {
            labels?: string[];
            sides?: string[];
          };
          if (Array.isArray(p.labels))
            lbls = f.labels.map((l, i) => p.labels?.[i] ?? l.default);
          if (Array.isArray(p.sides))
            sds = f.sides.map((_, i) => p.sides?.[i] ?? "");
        } catch {
          /* params corupți → cad pe defaults */
        }
      }
      setFig(f);
      setLabels(lbls);
      setSides(sds);
      posRef.current = typeof d.pos === "number" ? d.pos : null;
      setOpen(true);
    };
    window.addEventListener("figure:edit", handler as EventListener);
    return () =>
      window.removeEventListener("figure:edit", handler as EventListener);
  }, []);

  const previewSvg = useMemo(
    () => (fig ? renderFigure(fig, labels, sides) : ""),
    [fig, labels, sides],
  );

  const save = () => {
    if (!editor || !fig) return;
    const pos = posRef.current;
    if (pos == null) return;
    const src = figureDataUri(renderFigure(fig, labels, sides));
    const figParams = JSON.stringify({ labels, sides });
    editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        const node = state.doc.nodeAt(pos);
        if (!node) return false;
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, src, figParams });
        return true;
      })
      .run();
    trackEditor("figure_edit", { figure: fig.key });
    setOpen(false);
  };

  const remove = () => {
    if (!editor) return;
    const pos = posRef.current;
    if (pos == null) return;
    editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        const node = state.doc.nodeAt(pos);
        if (!node) return false;
        tr.delete(pos, pos + node.nodeSize);
        return true;
      })
      .run();
    trackEditor("figure_edit", { action: "delete" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Editează figura{fig ? ` — ${fig.title}` : ""}
          </DialogTitle>
          <DialogDescription>
            Schimbă etichetele vârfurilor și, opțional, lungimile laturilor.
            Vezi rezultatul jos.
          </DialogDescription>
        </DialogHeader>

        {fig && (
          <div className="flex flex-col gap-3">
            {fig.labels.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                  Etichete vârfuri
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {fig.labels.map((L, i) => (
                    <Input
                      key={i}
                      value={labels[i] ?? ""}
                      onChange={(e) =>
                        setLabels((v) => {
                          const n = [...v];
                          n[i] = e.target.value;
                          return n;
                        })
                      }
                      placeholder={L.default}
                      aria-label={`Vârf ${L.default}`}
                      className="h-8 text-center text-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {fig.sides.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                  Lungimi laturi (opțional)
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {fig.sides.map((S, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="w-8 shrink-0 text-[11px] text-muted-foreground">
                        {S.name}
                      </span>
                      <Input
                        value={sides[i] ?? ""}
                        onChange={(e) =>
                          setSides((v) => {
                            const n = [...v];
                            n[i] = e.target.value;
                            return n;
                          })
                        }
                        placeholder="—"
                        aria-label={`Latura ${S.name}`}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fig.labels.length === 0 && fig.sides.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Această figură nu are parametri editabili.
              </p>
            )}

            <div
              className="flex items-center justify-center rounded-md border border-dashed border-border bg-white p-2"
              aria-label="Previzualizare"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="destructive" size="sm" onClick={remove}>
            Șterge figura
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
