"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Editor } from "@tiptap/react";
import { Sigma, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import mathData from "./math-data.json";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackEditor } from "./editor-telemetry";
import { EditorMathBuilder } from "./EditorMathBuilder";
import { AutoFitKatex } from "./AutoFitKatex";
import { FIGURES, figureDataUri } from "./editor-figures";
import katex from "katex";

/** `latex` = randare academică KaTeX (M4); `html` = fallback vechi (sup/sub inline);
 *  `explicatie` = text pt profesor (chevron), NU se inserează pe foaie (#3). */
type Formula = {
  grup: string;
  nume: string;
  html: string;
  latex?: string;
  explicatie?: string;
};

/** Preview: KaTeX dacă există `latex`, altfel HTML-ul vechi. */
function formulaPreviewHtml(f: Formula): string {
  if (f.latex) {
    try {
      return katex.renderToString(f.latex, {
        throwOnError: false,
        strict: false,
        output: "html",
      });
    } catch {
      /* cade pe html */
    }
  }
  return f.html;
}
const FORMULE = mathData.formule as Record<string, Formula[]>;
const SYMBOLS = mathData.symbols as { s: string; label: string }[];

const CLASE = [
  { v: "5", l: "Clasa a V-a" },
  { v: "6", l: "Clasa a VI-a" },
  { v: "7", l: "Clasa a VII-a" },
  { v: "8", l: "Clasa a VIII-a" },
  { v: "9", l: "Clasa a IX-a" },
  { v: "10", l: "Clasa a X-a" },
  { v: "11", l: "Clasa a XI-a" },
  { v: "12", l: "Clasa a XII-a" },
];

// Cerința 1 (2026-07-28): chenarul „Matematică" e redimensionabil prin grip
// (margine dreaptă / margine jos / colț) + reflow auto pe coloane (grilele folosesc
// auto-fill/minmax). Dimensiunea aleasă se ține minte în localStorage.
const SIZE_KEY = "editor_math_menu_size_v1";
const MIN_W = 320;
const MAX_W = 760;
const MIN_H = 380;
const MAX_H = 900;
const DEFAULT_W = 380;
const DEFAULT_H = 540;
const clampSize = (w: number, h: number, maxH = MAX_H) => ({
  w: Math.min(MAX_W, Math.max(MIN_W, w)),
  h: Math.min(maxH, Math.max(MIN_H, h)),
});

/**
 * G2 Matematică (fidel) — 103 simboluri (insert Unicode) + biblioteca de 276
 * formule pe clase V–XII (insert KaTeX `latex`, fallback `html`), fiecare cu
 * `explicatie` (chevron, NU se inserează) + căutare integrată (toate clasele) +
 * A: filtrare pe DOMENIU (grup) prin chips în cadrul clasei.
 */
export function EditorMathMenu({ editor }: { editor: Editor | null }) {
  const [q, setQ] = useState("");
  const [clasa, setClasa] = useState("5");
  // A (2026-07-27): filtrare pe DOMENIU (grup) în cadrul clasei, prin chips.
  // null = „Toate". Se resetează la schimbarea clasei (un grup poate lipsi în altă clasă).
  const [domeniu, setDomeniu] = useState<string | null>(null);
  // Care formulă are explicația deschisă (chevron). Cheie stabilă (grup|nume) ca
  // să nu „sară" la filtrare/căutare. #3: explicația NU se inserează pe foaie.
  const [expanded, setExpanded] = useState<string | null>(null);
  const ql = q.trim().toLowerCase();

  // Cerința 1: dimensiune persistentă + redimensionare prin grip (margine/colț).
  // Init cu DEFAULT (SSR-safe) apoi încarcă din localStorage în useEffect (fără
  // hydration mismatch — vezi [[finding_hydration_tab_and_deploy_verify_2026_07_26]]).
  const [size, setSize] = useState<{ w: number; h: number }>({
    w: DEFAULT_W,
    h: DEFAULT_H,
  });
  const sizeRef = useRef(size);
  const dragRef = useRef<{
    dir: "e" | "s" | "se";
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIZE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as { w?: number; h?: number };
      if (typeof s.w === "number" && typeof s.h === "number") {
        const next = clampSize(s.w, s.h);
        sizeRef.current = next;
        setSize(next);
      }
    } catch {
      /* localStorage indisponibil — rămâne dimensiunea implicită */
    }
  }, []);

  // Drag prin listeneri pe `window` (nu `setPointerCapture` — mai robust: prinde
  // mișcarea și când cursorul iese din grip; nu depinde de particularitățile
  // pointer-capture). `dragRef` e citit din listeneri (ref → mereu la zi).
  const onGripDown =
    (dir: "e" | "s" | "se") => (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        dir,
        x: e.clientX,
        y: e.clientY,
        w: sizeRef.current.w,
        h: sizeRef.current.h,
      };
    };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const maxH = Math.min(MAX_H, window.innerHeight - 80);
      let { w, h } = sizeRef.current;
      if (d.dir === "e" || d.dir === "se") w = d.w + (e.clientX - d.x);
      if (d.dir === "s" || d.dir === "se") h = d.h + (e.clientY - d.y);
      const next = clampSize(w, h, maxH);
      sizeRef.current = next;
      setSize(next);
    };
    const up = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      try {
        localStorage.setItem(SIZE_KEY, JSON.stringify(sizeRef.current));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  // Domeniile (grupuri) distincte ale clasei curente, în ordinea din date.
  const grupuri = useMemo(
    () => Array.from(new Set((FORMULE[clasa] || []).map((f) => f.grup))),
    [clasa],
  );

  const symbolsShown = useMemo(
    () =>
      ql
        ? SYMBOLS.filter((s) =>
            (s.label + " " + s.s).toLowerCase().includes(ql),
          )
        : SYMBOLS,
    [ql],
  );
  const formuleShown = useMemo<Formula[]>(
    () =>
      ql
        ? (Object.values(FORMULE).flat() as Formula[]).filter((f) =>
            (f.nume + " " + f.grup).toLowerCase().includes(ql),
          )
        : (FORMULE[clasa] || []).filter((f) => !domeniu || f.grup === domeniu),
    [ql, clasa, domeniu],
  );
  // B: figuri geometrice (filtrate după titlu la căutare).
  const figuriShown = useMemo(
    () =>
      ql ? FIGURES.filter((f) => f.title.toLowerCase().includes(ql)) : FIGURES,
    [ql],
  );

  if (!editor) return null;
  const insert = (content: string) =>
    editor.chain().focus().insertContent(content).run();
  // B: inserează figura ca imagine (data-URI SVG) prin extensia Image.
  const insertFigure = (f: (typeof FIGURES)[number]) => {
    editor
      .chain()
      .focus()
      .setImage({ src: figureDataUri(f.svg), alt: f.title, title: f.title })
      .run();
    trackEditor("math_insert", { kind: "figure", figure: f.key });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2"
          title="Matematică"
        >
          <Sigma className="h-4 w-4" /> Matematică
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="relative flex flex-col overflow-hidden p-2"
        align="start"
        style={{ width: size.w, height: size.h }}
      >
        <div className="relative mb-2 shrink-0">
          <Search className="absolute left-2 top-2.5 h-4 w-4 opacity-60" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Caută: limită, fracție, √, putere…"
            className="h-9 pl-8"
          />
        </div>
        <Tabs
          defaultValue="construieste"
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="grid w-full shrink-0 grid-cols-4">
            <TabsTrigger value="construieste" className="px-1 text-xs">
              Construiește
            </TabsTrigger>
            <TabsTrigger value="formule" className="px-1 text-xs">
              Formule
            </TabsTrigger>
            <TabsTrigger value="simboluri" className="px-1 text-xs">
              Simboluri
            </TabsTrigger>
            <TabsTrigger value="figuri" className="px-1 text-xs">
              Figuri
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="construieste"
            className="mt-2 min-h-0 flex-1 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <EditorMathBuilder editor={editor} />
            </div>
          </TabsContent>

          <TabsContent
            value="formule"
            className="mt-2 min-h-0 flex-1 data-[state=active]:flex data-[state=active]:flex-col"
          >
            {!ql && (
              <Select
                value={clasa}
                onValueChange={(v) => {
                  setClasa(v);
                  setDomeniu(null); // grupul selectat poate lipsi în noua clasă
                }}
              >
                <SelectTrigger className="mb-2 h-8 shrink-0 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASE.map((c) => (
                    <SelectItem key={c.v} value={c.v}>
                      {c.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* A: chips de filtrare pe domeniu (grup). Doar când NU cauți și există
                mai multe grupuri. „Toate" = fără filtru. */}
            {!ql && grupuri.length > 1 && (
              <div className="mb-2 flex shrink-0 gap-1 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setDomeniu(null)}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                    !domeniu
                      ? "border-chalk-yellow bg-chalk-yellow/20 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  Toate
                </button>
                {grupuri.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setDomeniu(g)}
                    title={g}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                      domeniu === g
                        ? "border-chalk-yellow bg-chalk-yellow/20 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
            <ScrollArea className="min-h-0 flex-1">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-1 pr-2">
                {formuleShown.length === 0 && (
                  <p className="px-1 py-4 text-center text-sm text-muted-foreground">
                    Nicio formulă găsită.
                  </p>
                )}
                {formuleShown.map((f, i) => {
                  const key = `${f.grup}|${f.nume}`;
                  const isOpen = expanded === key;
                  return (
                    <div key={i} className="rounded-md hover:bg-accent">
                      <div className="flex items-stretch">
                        <button
                          type="button"
                          onClick={() => {
                            // Academic (KaTeX) dacă avem `latex`; altfel HTML vechi.
                            // Se inserează DOAR formula, NICIODATĂ explicația (#3).
                            if (f.latex) {
                              editor
                                .chain()
                                .focus()
                                .insertInlineMath({ latex: f.latex })
                                .run();
                            } else {
                              insert(f.html);
                            }
                            trackEditor("math_insert", {
                              kind: f.latex ? "formula_latex" : "formula_html",
                              grup: f.grup,
                              clasa: ql ? "cautare" : clasa,
                            });
                          }}
                          className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm"
                          title={f.grup}
                        >
                          <span className="block text-xs text-muted-foreground">
                            {f.grup} · {f.nume}
                          </span>
                          <AutoFitKatex
                            html={formulaPreviewHtml(f)}
                            className="text-foreground"
                            align="left"
                          />
                        </button>
                        {f.explicatie && (
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : key)}
                            className="flex shrink-0 items-center rounded-md px-2 text-muted-foreground hover:text-foreground"
                            title="Explicație (nu se inserează pe foaie)"
                            aria-label="Arată explicația"
                            aria-expanded={isOpen}
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isOpen && "rotate-180",
                              )}
                            />
                          </button>
                        )}
                      </div>
                      {f.explicatie && isOpen && (
                        <p className="px-2 pb-2 text-xs leading-snug text-muted-foreground">
                          {f.explicatie}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="simboluri"
            className="mt-2 min-h-0 flex-1 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <ScrollArea className="min-h-0 flex-1">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1 pr-2">
                {symbolsShown.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      insert(s.s);
                      trackEditor("math_insert", {
                        kind: "symbol",
                        symbol: s.s,
                        label: s.label,
                      });
                    }}
                    title={s.label}
                    className="flex h-9 items-center justify-center rounded-md border border-border text-base hover:bg-accent"
                  >
                    {s.s}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="figuri"
            className="mt-2 min-h-0 flex-1 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <ScrollArea className="min-h-0 flex-1">
              <div className="pr-2">
                {figuriShown.length === 0 && (
                  <p className="px-1 py-4 text-center text-sm text-muted-foreground">
                    Nicio figură găsită.
                  </p>
                )}
                {(["Plane", "Corpuri"] as const).map((g) => {
                  const items = figuriShown.filter((f) => f.grup === g);
                  if (items.length === 0) return null;
                  return (
                    <div key={g} className="mb-2">
                      <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                        {g === "Plane" ? "Figuri plane" : "Corpuri geometrice"}
                      </p>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-1">
                        {items.map((f) => (
                          <button
                            key={f.key}
                            type="button"
                            title={f.title}
                            aria-label={f.title}
                            onClick={() => insertFigure(f)}
                            className="flex h-16 items-center justify-center overflow-hidden rounded border border-border bg-white p-1 hover:ring-2 hover:ring-chalk-yellow [&>svg]:h-full [&>svg]:w-full"
                            dangerouslySetInnerHTML={{ __html: f.svg }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <p className="mt-1 shrink-0 px-1 text-[11px] leading-tight text-muted-foreground">
              Un click → figura se pune pe foaie ca imagine (cu notații A, B,
              C). Muchiile ascunse sunt punctate.
            </p>
          </TabsContent>
        </Tabs>

        {/* Cerința 1: grip-uri de redimensionare — margine dreaptă / margine jos /
            colț jos-dreapta. Prinzi ORICARE cu mouse-ul; dimensiunea se ține minte. */}
        <div
          onPointerDown={onGripDown("e")}
          className="absolute right-0 top-2 bottom-3 w-1.5 cursor-ew-resize rounded-full hover:bg-chalk-yellow/40"
          title="Trage marginea ca să lățești / îngustezi"
          aria-hidden
        />
        <div
          onPointerDown={onGripDown("s")}
          className="absolute bottom-0 left-2 right-3 h-1.5 cursor-ns-resize rounded-full hover:bg-chalk-yellow/40"
          title="Trage marginea ca să înalți / micșorezi"
          aria-hidden
        />
        <div
          onPointerDown={onGripDown("se")}
          className="absolute bottom-0 right-0 flex h-4 w-4 cursor-nwse-resize items-end justify-end text-muted-foreground hover:text-chalk-yellow"
          title="Trage colțul ca să redimensionezi"
          aria-hidden
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path
              d="M11 4 L4 11 M11 8 L8 11"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </PopoverContent>
    </Popover>
  );
}
