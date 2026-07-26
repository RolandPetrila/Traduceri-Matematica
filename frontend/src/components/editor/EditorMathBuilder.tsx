"use client";

import { useEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import type { Editor } from "@tiptap/react";
import katex from "katex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEditor } from "./editor-telemetry";
import { norm } from "./math-input";
import { MathSymbolPalette, useActiveField } from "./MathSymbolPalette";

/**
 * Constructor de structuri academice (M2) — fracție / limită / radical → generează
 * LaTeX și îl inserează ca nod KaTeX (`insertInlineMath`). Cristina completează
 * câmpuri prietenoase (NU tastează LaTeX), inserează semne cu UN CLICK din paletă
 * și vede previzualizarea live.
 *
 * Persistență (2026-07-26): schița (tipul + toate câmpurile) se salvează în
 * localStorage → dacă închizi meniul / comuți funcția înainte s-o aplici pe foaie,
 * la redeschidere o regăsești (nu mai construiești de la zero).
 */

type Kind = "frac" | "lim" | "root";

const DRAFT_KEY = "editor_math_builder_draft_v1";
type Draft = {
  kind?: Kind;
  num?: string;
  den?: string;
  lvar?: string;
  lto?: string;
  lnum?: string;
  lden?: string;
  rorder?: string;
  rrad?: string;
};

function readDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : {};
  } catch {
    return {};
  }
}

export function EditorMathBuilder({ editor }: { editor: Editor | null }) {
  // Init din schița salvată (componentă client-only → fără hydration mismatch).
  const draft = useMemo(readDraft, []);
  const [kind, setKind] = useState<Kind>(draft.kind ?? "frac");
  const [num, setNum] = useState(draft.num ?? "");
  const [den, setDen] = useState(draft.den ?? "");
  const [lvar, setLvar] = useState(draft.lvar ?? "x");
  const [lto, setLto] = useState(draft.lto ?? "∞");
  const [lnum, setLnum] = useState(draft.lnum ?? "");
  const [lden, setLden] = useState(draft.lden ?? "");
  const [rorder, setRorder] = useState(draft.rorder ?? "2");
  const [rrad, setRrad] = useState(draft.rrad ?? "");

  // Paletă → inserare în câmpul activ (ultimul focusat). Primul câmp al fiecărui
  // tip e „primar": dacă apeși pe paletă fără să fi focusat vreun câmp, acolo intră.
  const { elRef, setActive, insert } = useActiveField();
  const primaryRef = useRef<HTMLInputElement | null>(null);
  const onPalette = (sym: string) => {
    if (!elRef.current) elRef.current = primaryRef.current;
    insert(sym);
  };
  const focusProps = {
    onFocus: (e: FocusEvent<HTMLInputElement>) => setActive(e.currentTarget),
  };

  // Persistăm schița la fiecare schimbare.
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ kind, num, den, lvar, lto, lnum, lden, rorder, rrad }),
      );
    } catch {
      /* localStorage indisponibil — schița nu persistă, dar UI-ul merge */
    }
  }, [kind, num, den, lvar, lto, lnum, lden, rorder, rrad]);

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

  const insertToSheet = () => {
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
            ref={primaryRef}
            value={num}
            onChange={(e) => setNum(e.target.value)}
            placeholder="Numărător (ex: 1+2x)"
            className="h-8 text-sm"
            {...focusProps}
          />
          <Input
            value={den}
            onChange={(e) => setDen(e.target.value)}
            placeholder="Numitor (ex: 1+3x)"
            className="h-8 text-sm"
            {...focusProps}
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
              {...focusProps}
            />
            <span className="text-sm opacity-70">→</span>
            <Input
              value={lto}
              onChange={(e) => setLto(e.target.value)}
              placeholder="∞"
              className="h-8 flex-1 text-sm"
              aria-label="Tinde la"
              {...focusProps}
            />
          </div>
          <Input
            ref={primaryRef}
            value={lnum}
            onChange={(e) => setLnum(e.target.value)}
            placeholder="Numărător (sau toată expresia, ex: √5)"
            className="h-8 text-sm"
            {...focusProps}
          />
          <Input
            value={lden}
            onChange={(e) => setLden(e.target.value)}
            placeholder="Numitor (lasă gol dacă nu e fracție)"
            className="h-8 text-sm"
            {...focusProps}
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
            {...focusProps}
          />
          <Input
            ref={primaryRef}
            value={rrad}
            onChange={(e) => setRrad(e.target.value)}
            placeholder="Sub radical (ex: 6x+3)"
            className="h-8 text-sm"
            {...focusProps}
          />
        </div>
      )}

      {/* Paletă de simboluri — un click → în câmpul activ (înlocuiește textul-ajutor
          „Scrii normal: ^ = putere…"). */}
      <MathSymbolPalette onInsert={onPalette} />

      {/* Previzualizare live KaTeX (sursa de adevăr vizuală) */}
      <div
        className="flex min-h-[44px] items-center justify-center overflow-x-auto rounded-md border border-dashed border-border bg-white px-2 py-1 text-lg text-black"
        aria-label="Previzualizare"
        dangerouslySetInnerHTML={{ __html: preview }}
      />

      <Button size="sm" className="h-8" onClick={insertToSheet}>
        Inserează pe foaie
      </Button>
      <p className="text-[11px] leading-tight text-muted-foreground">
        Apasă simbolurile de mai sus (² ³ √ ∞ π …) ca să le pui în câmpul activ.
        Pentru radical scrie <code>√5</code> sau <code>√(6x+3)</code>.
      </p>
    </div>
  );
}
