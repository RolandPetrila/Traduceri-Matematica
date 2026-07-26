"use client";

import { useMemo, useState } from "react";
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

/**
 * G2 Matematică (fidel) — 103 simboluri (insert Unicode) + biblioteca de 214
 * formule pe clase V–XII (insert HTML, sup/sub parsat nativ de TipTap) + căutare
 * integrată (filtrează simboluri + formule din toate clasele). Structurile
 * interactive (fracție/radical cu găuri) = F3b (custom node).
 */
export function EditorMathMenu({ editor }: { editor: Editor | null }) {
  const [q, setQ] = useState("");
  const [clasa, setClasa] = useState("5");
  // Care formulă are explicația deschisă (chevron). Cheie stabilă (grup|nume) ca
  // să nu „sară" la filtrare/căutare. #3: explicația NU se inserează pe foaie.
  const [expanded, setExpanded] = useState<string | null>(null);
  const ql = q.trim().toLowerCase();

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
        : FORMULE[clasa] || [],
    [ql, clasa],
  );

  if (!editor) return null;
  const insert = (content: string) =>
    editor.chain().focus().insertContent(content).run();

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
      <PopoverContent className="w-[340px] p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 opacity-60" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Caută: limită, fracție, √, putere…"
            className="h-9 pl-8"
          />
        </div>
        <Tabs defaultValue="construieste">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="construieste">Construiește</TabsTrigger>
            <TabsTrigger value="formule">Formule</TabsTrigger>
            <TabsTrigger value="simboluri">Simboluri</TabsTrigger>
          </TabsList>

          <TabsContent value="construieste" className="mt-2">
            <div className="max-h-[420px] overflow-y-auto pr-1">
              <EditorMathBuilder editor={editor} />
            </div>
          </TabsContent>

          <TabsContent value="formule" className="mt-2">
            {!ql && (
              <Select value={clasa} onValueChange={setClasa}>
                <SelectTrigger className="mb-2 h-8 text-sm">
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
            <ScrollArea className="h-64">
              <div className="flex flex-col gap-0.5 pr-2">
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

          <TabsContent value="simboluri" className="mt-2">
            <ScrollArea className="h-64">
              <div className="grid grid-cols-6 gap-1 pr-2">
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
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
