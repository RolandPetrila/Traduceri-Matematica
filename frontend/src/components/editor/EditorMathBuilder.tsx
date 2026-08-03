"use client";

import { useEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import type { Editor } from "@tiptap/react";
import katex from "katex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEditor } from "./editor-telemetry";
import { MATH_CONSTRUCTIONS } from "./math-input";
import { MathSymbolPalette, useActiveField } from "./MathSymbolPalette";
import { AutoFitKatex } from "./AutoFitKatex";
import {
  type BNode,
  type BuilderKind,
  type MatrixNode,
  TOP_KINDS,
  KIND_LABEL,
  emptyOf,
  convertTo,
  textNode,
  nodeToLatex,
  resizeMatrix,
  resizeSystem,
  isValidNode,
} from "./math-builder-tree";

/** Construcțiile gata (grila one-click) — randate KaTeX o singură dată (statice). */
const CONSTRUCTIONS_RENDERED = MATH_CONSTRUCTIONS.map((c) => {
  let html = c.title;
  try {
    html = katex.renderToString(c.latex, {
      throwOnError: false,
      strict: false,
      output: "html",
    });
  } catch {
    /* cade pe titlu dacă randarea eșuează */
  }
  return { ...c, html };
});

/**
 * Constructor de structuri academice (M2, RECURSIV din 2026-08-04) — fracție /
 * radical / limită / sumă / integrală / matrice / sistem → generează LaTeX și îl
 * inserează ca nod KaTeX (`insertInlineMath`). Fiecare „slot de expresie" poate
 * conține la rândul lui o structură (radical în fracție, fracție în fracție, sumă
 * cu fracție la termen…), la ORICE adâncime — logica e în `math-builder-tree.ts`.
 *
 * Persistență: schița (arborele per tip) se salvează în localStorage → dacă închizi
 * meniul / comuți tipul înainte s-o aplici, la redeschidere o regăsești.
 */
type TopKind = Exclude<BuilderKind, "text">;
const DRAFT_KEY = "editor_math_builder_tree_v1";

/** Etichete scurte pt selectorul segmentat (grupate ca înainte). */
const SEG_LABEL: Record<TopKind, string> = {
  frac: "Fracție",
  lim: "Limită",
  root: "Radical",
  matrix: "Matrice",
  system: "Sistem",
  sum: "Σ",
  integral: "∫",
};

/** Structurile oferite ca „pune aici" într-un câmp text (nesting one-click). */
const NEST_OPTIONS: { k: BuilderKind; label: string }[] = [
  { k: "frac", label: "a/b" },
  { k: "root", label: "√" },
  { k: "sum", label: "Σ" },
  { k: "integral", label: "∫" },
  { k: "lim", label: "lim" },
];

/** Parsează un întreg dintr-un input și îl limitează la [lo, hi]. */
function clampInt(s: string, lo: number, hi: number): number {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
}

function readDraft(): { kind: TopKind; trees: Record<string, BNode> } {
  const trees: Record<string, BNode> = {};
  for (const k of TOP_KINDS) trees[k] = emptyOf(k);
  let kind: TopKind = "frac";
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        kind?: string;
        trees?: Record<string, unknown>;
      };
      if (parsed.kind && (TOP_KINDS as string[]).includes(parsed.kind)) {
        kind = parsed.kind as TopKind;
      }
      if (parsed.trees) {
        for (const k of TOP_KINDS) {
          const t = parsed.trees[k];
          if (isValidNode(t)) trees[k] = t;
        }
      }
    }
  } catch {
    /* draft corupt/indisponibil — pornim de la structuri goale */
  }
  return { kind, trees };
}

/* ─────────────────────────── Editor recursiv de slot ─────────────────────────── */

type FocusProps = { onFocus: (e: FocusEvent<HTMLInputElement>) => void };

/** Un slot de expresie: câmp text (cu butoane „pune structură aici") SAU o structură. */
function SlotEditor({
  node,
  onChange,
  focusProps,
  placeholder,
}: {
  node: BNode;
  onChange: (n: BNode) => void;
  focusProps: FocusProps;
  placeholder?: string;
}) {
  if (node.kind === "text") {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={node.value}
          onChange={(e) => onChange(textNode(e.target.value))}
          placeholder={placeholder ?? "…"}
          className="h-8 flex-1 text-sm"
          {...focusProps}
        />
        <div className="flex shrink-0 gap-0.5">
          {NEST_OPTIONS.map((o) => (
            <button
              key={o.k}
              type="button"
              title={`Pune ${KIND_LABEL[o.k]} aici`}
              aria-label={`Pune ${KIND_LABEL[o.k]} în acest câmp`}
              onClick={() => onChange(convertTo(node, o.k))}
              className="h-6 min-w-[1.4rem] rounded border border-border px-1 text-[11px] leading-none opacity-70 hover:bg-accent hover:opacity-100"
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-chalk-yellow/25 bg-black/10 p-1.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-chalk-yellow/70">
          {KIND_LABEL[node.kind]}
        </span>
        <button
          type="button"
          title="Înlocuiește cu text simplu"
          aria-label="Înlocuiește această structură cu text simplu"
          onClick={() => onChange(textNode())}
          className="flex h-5 w-5 items-center justify-center rounded text-xs opacity-60 hover:bg-destructive/20 hover:opacity-100"
        >
          ×
        </button>
      </div>
      <StructureFields
        node={node}
        onChange={onChange}
        focusProps={focusProps}
      />
    </div>
  );
}

/** Câmpurile unei structuri (scalari + slot-uri recursive). */
function StructureFields({
  node,
  onChange,
  focusProps,
}: {
  node: BNode;
  onChange: (n: BNode) => void;
  focusProps: FocusProps;
}) {
  const scalar = (
    value: string,
    set: (v: string) => void,
    ph: string,
    aria: string,
    extra = "flex-1",
  ) => (
    <Input
      value={value}
      onChange={(e) => set(e.target.value)}
      placeholder={ph}
      aria-label={aria}
      className={`h-8 text-sm ${extra}`}
      {...focusProps}
    />
  );

  switch (node.kind) {
    case "frac":
      return (
        <div className="flex flex-col gap-1">
          <SlotEditor
            node={node.num}
            onChange={(num) => onChange({ ...node, num })}
            focusProps={focusProps}
            placeholder="Numărător"
          />
          <div className="mx-1 border-t-2 border-foreground/40" />
          <SlotEditor
            node={node.den}
            onChange={(den) => onChange({ ...node, den })}
            focusProps={focusProps}
            placeholder="Numitor"
          />
        </div>
      );
    case "root":
      return (
        <div className="flex flex-col gap-1">
          {scalar(
            node.order,
            (order) => onChange({ ...node, order }),
            "Ordin (2, 3, n…)",
            "Ordinul radicalului",
            "w-24",
          )}
          <SlotEditor
            node={node.radicand}
            onChange={(radicand) => onChange({ ...node, radicand })}
            focusProps={focusProps}
            placeholder="Sub radical"
          />
        </div>
      );
    case "lim":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            {scalar(
              node.v,
              (v) => onChange({ ...node, v }),
              "x",
              "Variabilă",
              "w-14",
            )}
            <span className="text-sm opacity-70">→</span>
            {scalar(
              node.to,
              (to) => onChange({ ...node, to }),
              "∞",
              "Tinde la",
            )}
          </div>
          <SlotEditor
            node={node.body}
            onChange={(body) => onChange({ ...node, body })}
            focusProps={focusProps}
            placeholder="Expresie"
          />
        </div>
      );
    case "sum":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            {scalar(
              node.lo,
              (lo) => onChange({ ...node, lo }),
              "k=1",
              "Limita de jos",
            )}
            <span className="text-sm opacity-70">→</span>
            {scalar(
              node.hi,
              (hi) => onChange({ ...node, hi }),
              "n",
              "Limita de sus",
            )}
          </div>
          <SlotEditor
            node={node.body}
            onChange={(body) => onChange({ ...node, body })}
            focusProps={focusProps}
            placeholder="Termen"
          />
        </div>
      );
    case "integral":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            {scalar(
              node.lo,
              (lo) => onChange({ ...node, lo }),
              "a",
              "Limita de jos",
            )}
            <span className="text-sm opacity-70">→</span>
            {scalar(
              node.hi,
              (hi) => onChange({ ...node, hi }),
              "b",
              "Limita de sus",
            )}
            {scalar(
              node.dvar,
              (dvar) => onChange({ ...node, dvar }),
              "x",
              "Variabila (d…)",
              "w-14",
            )}
          </div>
          <SlotEditor
            node={node.body}
            onChange={(body) => onChange({ ...node, body })}
            focusProps={focusProps}
            placeholder="Funcția"
          />
        </div>
      );
    case "matrix": {
      const m = node as MatrixNode;
      const setDim = (rows: number, cols: number) =>
        onChange(resizeMatrix(m, rows, cols));
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="opacity-70">Rânduri</span>
            <Input
              value={String(m.rows)}
              inputMode="numeric"
              onChange={(e) => setDim(clampInt(e.target.value, 1, 5), m.cols)}
              className="h-8 w-12 text-center text-sm"
              aria-label="Rânduri (1–5)"
            />
            <span className="opacity-70">×</span>
            <span className="opacity-70">Coloane</span>
            <Input
              value={String(m.cols)}
              inputMode="numeric"
              onChange={(e) => setDim(m.rows, clampInt(e.target.value, 1, 5))}
              className="h-8 w-12 text-center text-sm"
              aria-label="Coloane (1–5)"
            />
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${m.cols}, minmax(0, 1fr))` }}
          >
            {m.cells.map((cell, idx) => (
              <Input
                key={idx}
                value={cell.kind === "text" ? cell.value : ""}
                onChange={(e) => {
                  const cells = [...m.cells];
                  cells[idx] = textNode(e.target.value);
                  onChange({ ...m, cells });
                }}
                placeholder="0"
                className="h-8 text-center text-sm"
                {...focusProps}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Celule text simple; goale rămân □. Maxim 5×5.
          </p>
        </div>
      );
    }
    case "system":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="opacity-70">Ecuații</span>
            <Input
              value={String(node.eqs.length)}
              inputMode="numeric"
              onChange={(e) =>
                onChange(resizeSystem(node, clampInt(e.target.value, 1, 6)))
              }
              className="h-8 w-12 text-center text-sm"
              aria-label="Număr de ecuații (1–6)"
            />
          </div>
          {node.eqs.map((eq, idx) => (
            <SlotEditor
              key={idx}
              node={eq}
              onChange={(x) => {
                const eqs = [...node.eqs];
                eqs[idx] = x;
                onChange({ ...node, eqs });
              }}
              focusProps={focusProps}
              placeholder={`Ecuația ${idx + 1}`}
            />
          ))}
        </div>
      );
    default:
      return null;
  }
}

/* ─────────────────────────────── Componentă ─────────────────────────────── */

export function EditorMathBuilder({ editor }: { editor: Editor | null }) {
  const initial = useMemo(readDraft, []);
  const [kind, setKind] = useState<TopKind>(initial.kind);
  const [trees, setTrees] = useState<Record<string, BNode>>(initial.trees);

  const current = trees[kind] ?? emptyOf(kind);
  const setCurrent = (next: BNode) =>
    setTrees((prev) => ({ ...prev, [kind]: next }));

  // Paletă → inserare în câmpul activ (ultimul focusat), fallback = primul input.
  const { elRef, setActive, insert } = useActiveField();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const focusProps: FocusProps = {
    onFocus: (e: FocusEvent<HTMLInputElement>) => setActive(e.currentTarget),
  };
  const onPalette = (sym: string) => {
    if (!elRef.current) {
      elRef.current = containerRef.current?.querySelector("input") ?? null;
    }
    insert(sym);
  };

  // Persistăm schița (arborele per tip + tipul activ) la fiecare schimbare.
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ kind, trees }));
    } catch {
      /* localStorage indisponibil — schița nu persistă, dar UI-ul merge */
    }
  }, [kind, trees]);

  const latex = useMemo(() => nodeToLatex(current), [current]);

  const preview = useMemo(() => {
    try {
      return katex.renderToString(latex || "\\square", {
        throwOnError: false,
        strict: false,
        displayMode: false,
      });
    } catch {
      return "";
    }
  }, [latex]);

  if (!editor) return null;

  const insertToSheet = () => {
    if (!latex) return;
    editor.chain().focus().insertInlineMath({ latex }).run();
    trackEditor("math_insert", { kind: `build_${kind}` });
  };

  const insertConstruction = (tpl: string) => {
    editor.chain().focus().insertInlineMath({ latex: tpl }).run();
    trackEditor("math_insert", { kind: "construction", latex: tpl });
  };

  const seg = (k: TopKind) => (
    <button
      type="button"
      onClick={() => setKind(k)}
      className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
        kind === k
          ? "bg-chalk-yellow/20 text-foreground"
          : "opacity-60 hover:opacity-90"
      }`}
    >
      {SEG_LABEL[k]}
    </button>
  );

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      {/* Construcții GATA-FĂCUTE: un click = pe foaie, apoi editabilă la click. */}
      <div>
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">
          Construcții gata — un click → pe foaie (apoi editabilă la click):
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-1">
          {CONSTRUCTIONS_RENDERED.map((c) => (
            <button
              key={c.latex}
              type="button"
              title={c.title}
              aria-label={c.title}
              onClick={() => insertConstruction(c.latex)}
              className="flex h-9 items-center justify-center overflow-hidden rounded border border-border bg-white px-1 text-black hover:ring-2 hover:ring-chalk-yellow"
            >
              <AutoFitKatex html={c.html} className="w-full" />
            </button>
          ))}
        </div>
      </div>

      <div className="my-0.5 border-t border-border" />
      <p className="text-[11px] font-medium text-muted-foreground">
        …sau construiește (poți pune o structură într-un câmp: √ în fracție
        etc.):
      </p>
      <div className="flex flex-col gap-1 rounded-md border border-border p-0.5">
        <div className="flex gap-1">
          {seg("frac")}
          {seg("lim")}
          {seg("root")}
        </div>
        <div className="flex gap-1">
          {seg("matrix")}
          {seg("system")}
          {seg("sum")}
          {seg("integral")}
        </div>
      </div>

      {/* Editorul recursiv al structurii curente. */}
      <StructureFields
        node={current}
        onChange={setCurrent}
        focusProps={focusProps}
      />

      {/* Paletă de simboluri — un click → în câmpul activ. */}
      <MathSymbolPalette onInsert={onPalette} />

      {/* Previzualizare live KaTeX (sursa de adevăr vizuală). */}
      <div
        className="flex min-h-[44px] items-center justify-center overflow-x-auto rounded-md border border-dashed border-border bg-white px-2 py-1 text-lg text-black"
        aria-label="Previzualizare"
        dangerouslySetInnerHTML={{ __html: preview }}
      />

      <Button size="sm" className="h-8" onClick={insertToSheet}>
        Inserează pe foaie
      </Button>
      <p className="text-[11px] leading-tight text-muted-foreground">
        Apasă butoanele mici din câmp (<code>a/b</code>, <code>√</code>,{" "}
        <code>Σ</code>…) ca să pui o structură ÎN acel câmp. Semnele (² ³ √ ∞ π
        …) intră în câmpul activ.
      </p>
    </div>
  );
}
