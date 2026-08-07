"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  evaluateExpr,
  plotToSvg,
  svgDataUri,
  type EvalResult,
} from "@/lib/calculator-eval";

/**
 * Modul CALCULATOR (2026-08-04, mock §17 aprobat de Roland). 3 sub-taburi:
 * Științific (evaluare + tastatură), Grafic (f/g + preview SVG + inserare în
 * editor ca figură), Matrice/Sisteme (det/inv/produs/lusolve). Motor: math.js,
 * 100% în browser (R-COST). Temă verde (tablă+cretă), ca restul aplicației.
 */
export function CalculatorPanel({
  onInsertToEditor,
  onInsertTextToEditor,
}: {
  onInsertToEditor?: (src: string, alt?: string) => void;
  /** #13 (/improve) — Științific/Matrice trimit TEXT (rezultat), nu imagine ca Grafic. */
  onInsertTextToEditor?: (text: string) => void;
}) {
  return (
    <div className="w-full rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">
      <Tabs defaultValue="stiintific" className="w-full">
        <TabsList className="mb-3 grid w-full grid-cols-3">
          <TabsTrigger value="stiintific">Științific</TabsTrigger>
          <TabsTrigger value="grafic">Grafic</TabsTrigger>
          <TabsTrigger value="matrice">Matrice / Sisteme</TabsTrigger>
        </TabsList>

        <TabsContent value="stiintific">
          <ScientificTab onInsertTextToEditor={onInsertTextToEditor} />
        </TabsContent>
        <TabsContent value="grafic">
          <GraphTab onInsertToEditor={onInsertToEditor} />
        </TabsContent>
        <TabsContent value="matrice">
          <MatrixTab onInsertTextToEditor={onInsertTextToEditor} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─────────────────────────────── Științific ─────────────────────────────── */

const SCI_KEYS: string[][] = [
  ["7", "8", "9", "/", "sqrt(", "^"],
  ["4", "5", "6", "*", "(", ")"],
  ["1", "2", "3", "-", "sin(", "cos("],
  ["0", ".", "π", "+", "tan(", "ln("],
];
const SCI_FN = ["log(", "abs(", "e", "!", "%"];

function ScientificTab({
  onInsertTextToEditor,
}: {
  onInsertTextToEditor?: (text: string) => void;
}) {
  const [expr, setExpr] = useState("");
  const [res, setRes] = useState<EvalResult | null>(null);
  const [ans, setAns] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const insert = (tok: string) => {
    const el = inputRef.current;
    if (!el) {
      setExpr((e) => e + tok);
      return;
    }
    const s = el.selectionStart ?? expr.length;
    const e2 = el.selectionEnd ?? expr.length;
    const next = expr.slice(0, s) + tok + expr.slice(e2);
    setExpr(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = s + tok.length;
      try {
        el.setSelectionRange(caret, caret);
      } catch {
        /* demontat */
      }
    });
  };

  const compute = () => {
    const r = evaluateExpr(expr);
    setRes(r);
    if (r.ok) setAns(r.value);
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        ref={inputRef}
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && compute()}
        placeholder="ex: 2^10 + √16 + sin(π/6)"
        className="h-11 font-mono text-base"
        aria-label="Expresie"
      />
      <div
        className="min-h-[40px] rounded-md border border-dashed border-border bg-white px-3 py-2 text-right font-mono text-lg text-black"
        aria-live="polite"
      >
        {res == null ? (
          <span className="text-muted-foreground">= …</span>
        ) : res.ok ? (
          `= ${res.value}`
        ) : (
          <span className="text-sm text-destructive">{res.error || "…"}</span>
        )}
      </div>

      <div className="grid grid-cols-6 gap-1">
        {SCI_KEYS.flat().map((k) => (
          <Button
            key={k}
            type="button"
            variant="outline"
            size="sm"
            className="h-10 font-mono"
            onClick={() => insert(k === "π" ? "π" : k)}
          >
            {k.replace("(", "")}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-1">
        {SCI_FN.map((k) => (
          <Button
            key={k}
            type="button"
            variant="outline"
            size="sm"
            className="h-9 font-mono text-xs"
            onClick={() => insert(k)}
          >
            {k.replace("(", "")}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 text-xs"
          onClick={() => ans && insert(ans)}
          title="Ultimul rezultat"
        >
          ans
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => {
            setExpr("");
            setRes(null);
          }}
        >
          C
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => setExpr((e) => e.slice(0, -1))}
        >
          ⌫
        </Button>
        <Button type="button" size="sm" className="h-9" onClick={compute}>
          =
        </Button>
      </div>
      {onInsertTextToEditor && res?.ok && (
        <Button
          type="button"
          size="sm"
          className="h-9"
          onClick={() => onInsertTextToEditor(`${expr} = ${res.value}`)}
        >
          + Inserează rezultatul în editor
        </Button>
      )}
    </div>
  );
}

/* ─────────────────────────────────── Grafic ─────────────────────────────────── */

function GraphTab({
  onInsertToEditor,
}: {
  onInsertToEditor?: (src: string, alt?: string) => void;
}) {
  const [f, setF] = useState("x^2 - 3");
  const [g, setG] = useState("");
  const [xmin, setXmin] = useState("-10");
  const [xmax, setXmax] = useState("10");

  const svg = useMemo(() => {
    const fns = [
      { expr: f, color: "#2563eb", label: "f" },
      { expr: g, color: "#dc2626", label: "g" },
    ].filter((fn) => fn.expr.trim());
    const lo = parseFloat(xmin);
    const hi = parseFloat(xmax);
    return plotToSvg(fns, {
      xmin: Number.isFinite(lo) ? lo : -10,
      xmax: Number.isFinite(hi) && hi > lo ? hi : 10,
    });
  }, [f, g, xmin, xmax]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-1 text-sm">
          <span className="w-8 font-mono text-blue-600">f(x)=</span>
          <Input
            value={f}
            onChange={(e) => setF(e.target.value)}
            placeholder="x^2 - 3"
            className="h-9 font-mono text-sm"
          />
        </label>
        <label className="flex items-center gap-1 text-sm">
          <span className="w-8 font-mono text-red-600">g(x)=</span>
          <Input
            value={g}
            onChange={(e) => setG(e.target.value)}
            placeholder="sin(x)"
            className="h-9 font-mono text-sm"
          />
        </label>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">x de la</span>
        <Input
          value={xmin}
          onChange={(e) => setXmin(e.target.value)}
          className="h-8 w-16 text-center text-sm"
          aria-label="x minim"
        />
        <span className="text-muted-foreground">la</span>
        <Input
          value={xmax}
          onChange={(e) => setXmax(e.target.value)}
          className="h-8 w-16 text-center text-sm"
          aria-label="x maxim"
        />
      </div>
      <div
        className="w-full overflow-x-auto rounded-md border border-border bg-white p-1 [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-w-full"
        aria-label="Grafic"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {onInsertToEditor && (
        <Button
          type="button"
          size="sm"
          className="h-9"
          onClick={() => onInsertToEditor(svgDataUri(svg), `Grafic f(x)=${f}`)}
        >
          + Inserează graficul în editor
        </Button>
      )}
    </div>
  );
}

/* ─────────────────────────────── Matrice / Sisteme ─────────────────────────────── */

const MATRIX_TEMPLATES: { label: string; tpl: string }[] = [
  { label: "Determinant", tpl: "det([[1, 2], [3, 4]])" },
  { label: "Produs", tpl: "[[1, 2], [3, 4]] * [[5, 6], [7, 8]]" },
  { label: "Inversă", tpl: "inv([[1, 2], [3, 4]])" },
  { label: "Rezolvă sistem", tpl: "lusolve([[2, 1], [1, 3]], [5, 10])" },
];

function MatrixTab({
  onInsertTextToEditor,
}: {
  onInsertTextToEditor?: (text: string) => void;
}) {
  const [expr, setExpr] = useState("");
  const [res, setRes] = useState<EvalResult | null>(null);

  const compute = () => setRes(evaluateExpr(expr));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-muted-foreground">
        Scrie matricele ca <code>[[1, 2], [3, 4]]</code>. Butoanele pun un
        exemplu — modifică numerele, apoi „=".
      </p>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
        {MATRIX_TEMPLATES.map((m) => (
          <Button
            key={m.label}
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => setExpr(m.tpl)}
          >
            {m.label}
          </Button>
        ))}
      </div>
      <Input
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && compute()}
        placeholder="det([[1, 2], [3, 4]])"
        className="h-10 font-mono text-sm"
        aria-label="Expresie matrice"
      />
      <div className="flex justify-end">
        <Button type="button" size="sm" className="h-9" onClick={compute}>
          = Calculează
        </Button>
      </div>
      <div
        className="min-h-[44px] whitespace-pre-wrap rounded-md border border-dashed border-border bg-white px-3 py-2 font-mono text-sm text-black"
        aria-live="polite"
      >
        {res == null ? (
          <span className="text-muted-foreground">rezultatul apare aici</span>
        ) : res.ok ? (
          res.value
        ) : (
          <span className="text-destructive">{res.error || "…"}</span>
        )}
      </div>
      {onInsertTextToEditor && res?.ok && (
        <Button
          type="button"
          size="sm"
          className="h-9"
          onClick={() => onInsertTextToEditor(`${expr} = ${res.value}`)}
        >
          + Inserează rezultatul în editor
        </Button>
      )}
    </div>
  );
}
