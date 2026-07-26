"use client";

import { useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import katex from "katex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEditor } from "./editor-telemetry";

/**
 * Constructor de structuri academice (M2) — fracție / limită / radical → generează
 * LaTeX și îl inserează ca nod KaTeX (`insertInlineMath`). Cristina completează
 * câmpuri prietenoase (NU tastează LaTeX) și vede previzualizarea live.
 */

const SUP: Record<string, string> = {
  "⁰": "^0",
  "¹": "^1",
  "²": "^2",
  "³": "^3",
  "⁴": "^4",
  "⁵": "^5",
  "⁶": "^6",
  "⁷": "^7",
  "⁸": "^8",
  "⁹": "^9",
  ⁿ: "^n",
};
const SUB: Record<string, string> = {
  "₀": "_0",
  "₁": "_1",
  "₂": "_2",
  "₃": "_3",
  "₄": "_4",
  "₅": "_5",
  "₆": "_6",
  "₇": "_7",
  "₈": "_8",
  "₉": "_9",
  ₙ: "_n",
};

/** Intrare prietenoasă → LaTeX: x²→x^2, a₁→a_1, √(…)/sqrt(…)→\sqrt{…}, ∞·×≤≥. */
function norm(s: string): string {
  let out = s;
  out = out.replace(/√\(([^()]*)\)/g, "\\sqrt{$1}");
  out = out.replace(/sqrt\(([^()]*)\)/gi, "\\sqrt{$1}");
  for (const [k, v] of Object.entries(SUP)) out = out.split(k).join(v);
  for (const [k, v] of Object.entries(SUB)) out = out.split(k).join(v);
  out = out
    .replace(/∞/g, "\\infty")
    .replace(/·/g, "\\cdot")
    .replace(/×/g, "\\times")
    .replace(/≤/g, "\\le")
    .replace(/≥/g, "\\ge")
    .replace(/π/g, "\\pi");
  return out;
}

type Kind = "frac" | "lim" | "root";

export function EditorMathBuilder({ editor }: { editor: Editor | null }) {
  const [kind, setKind] = useState<Kind>("frac");
  const [num, setNum] = useState("");
  const [den, setDen] = useState("");
  const [lvar, setLvar] = useState("x");
  const [lto, setLto] = useState("∞");
  const [lnum, setLnum] = useState("");
  const [lden, setLden] = useState("");
  const [rorder, setRorder] = useState("2");
  const [rrad, setRrad] = useState("");

  const latex = useMemo(() => {
    if (kind === "frac") {
      return `\\dfrac{${norm(num) || "\\square"}}{${norm(den) || "\\square"}}`;
    }
    if (kind === "lim") {
      const head = `\\lim\\limits_{${norm(lvar) || "x"}\\to ${norm(lto) || "\\infty"}}`;
      const body = lden
        ? `\\dfrac{${norm(lnum) || "\\square"}}{${norm(lden)}}`
        : norm(lnum) || "\\square";
      return `${head} ${body}`;
    }
    const n = rorder.trim();
    const rad = norm(rrad) || "\\square";
    return n && n !== "2" ? `\\sqrt[${n}]{${rad}}` : `\\sqrt{${rad}}`;
  }, [kind, num, den, lvar, lto, lnum, lden, rorder, rrad]);

  const preview = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        strict: false,
        displayMode: false,
      });
    } catch {
      return "";
    }
  }, [latex]);

  if (!editor) return null;

  const insert = () => {
    editor.chain().focus().insertInlineMath({ latex }).run();
    trackEditor("math_insert", { kind: `build_${kind}` });
  };

  const seg = (k: Kind, label: string) => (
    <button
      type="button"
      onClick={() => setKind(k)}
      className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
        kind === k
          ? "bg-chalk-yellow/20 text-foreground"
          : "opacity-60 hover:opacity-90"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 rounded-md border border-border p-0.5">
        {seg("frac", "Fracție")}
        {seg("lim", "Limită")}
        {seg("root", "Radical")}
      </div>

      {kind === "frac" && (
        <div className="flex flex-col gap-1.5">
          <Input
            value={num}
            onChange={(e) => setNum(e.target.value)}
            placeholder="Numărător (ex: 1+2x+x^2)"
            className="h-8 text-sm"
          />
          <Input
            value={den}
            onChange={(e) => setDen(e.target.value)}
            placeholder="Numitor (ex: 1+3x+x^2)"
            className="h-8 text-sm"
          />
        </div>
      )}

      {kind === "lim" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              value={lvar}
              onChange={(e) => setLvar(e.target.value)}
              placeholder="x"
              className="h-8 w-14 text-sm"
              aria-label="Variabilă"
            />
            <span className="text-sm opacity-70">→</span>
            <Input
              value={lto}
              onChange={(e) => setLto(e.target.value)}
              placeholder="∞"
              className="h-8 flex-1 text-sm"
              aria-label="Tinde la"
            />
          </div>
          <Input
            value={lnum}
            onChange={(e) => setLnum(e.target.value)}
            placeholder="Numărător (sau toată expresia)"
            className="h-8 text-sm"
          />
          <Input
            value={lden}
            onChange={(e) => setLden(e.target.value)}
            placeholder="Numitor (lasă gol dacă nu e fracție)"
            className="h-8 text-sm"
          />
        </div>
      )}

      {kind === "root" && (
        <div className="flex flex-col gap-1.5">
          <Input
            value={rorder}
            onChange={(e) => setRorder(e.target.value)}
            placeholder="Ordin (2, 3, n…)"
            className="h-8 w-24 text-sm"
            aria-label="Ordinul radicalului"
          />
          <Input
            value={rrad}
            onChange={(e) => setRrad(e.target.value)}
            placeholder="Sub radical (ex: 6x+3)"
            className="h-8 text-sm"
          />
        </div>
      )}

      {/* Previzualizare live KaTeX (sursa de adevăr vizuală) */}
      <div
        className="flex min-h-[44px] items-center justify-center overflow-x-auto rounded-md border border-dashed border-border bg-white px-2 py-1 text-lg text-black"
        aria-label="Previzualizare"
        dangerouslySetInnerHTML={{ __html: preview }}
      />

      <Button size="sm" className="h-8" onClick={insert}>
        Inserează
      </Button>
      <p className="text-[11px] leading-tight text-muted-foreground">
        Scrii normal: <code>^</code> = putere (x^2), <code>_</code> = indice
        (a_1); poți lipi ² ³ √ ∞ π. Fără LaTeX — vezi rezultatul sus.
      </p>
    </div>
  );
}
