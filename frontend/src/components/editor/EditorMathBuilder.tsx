"use client";

import { useEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import type { Editor } from "@tiptap/react";
import katex from "katex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEditor } from "./editor-telemetry";
import { norm, MATH_CONSTRUCTIONS } from "./math-input";
import { MathSymbolPalette, useActiveField } from "./MathSymbolPalette";
import { AutoFitKatex } from "./AutoFitKatex";

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
 * Constructor de structuri academice (M2) — fracție / limită / radical → generează
 * LaTeX și îl inserează ca nod KaTeX (`insertInlineMath`). Cristina completează
 * câmpuri prietenoase (NU tastează LaTeX), inserează semne cu UN CLICK din paletă
 * și vede previzualizarea live.
 *
 * Persistență (2026-07-26): schița (tipul + toate câmpurile) se salvează în
 * localStorage → dacă închizi meniul / comuți funcția înainte s-o aplici pe foaie,
 * la redeschidere o regăsești (nu mai construiești de la zero).
 */

type Kind = "frac" | "lim" | "root" | "matrix" | "system" | "sum" | "integral";

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
  // C (2026-07-27): structuri extinse
  mrows?: string;
  mcols?: string;
  mcells?: string[];
  seqn?: string;
  seqs?: string[];
  slo?: string;
  shi?: string;
  sbody?: string;
  ilo?: string;
  ihi?: string;
  ibody?: string;
};

/** Parsează un întreg dintr-un input și îl limitează la [lo, hi] (evită matrice uriașe). */
function clampInt(s: string, lo: number, hi: number): number {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
}

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
  // C: Matrice n×n
  const [mrows, setMrows] = useState(draft.mrows ?? "2");
  const [mcols, setMcols] = useState(draft.mcols ?? "2");
  const [mcells, setMcells] = useState<string[]>(draft.mcells ?? []);
  // C: Sistem de n ecuații
  const [seqn, setSeqn] = useState(draft.seqn ?? "2");
  const [seqs, setSeqs] = useState<string[]>(draft.seqs ?? []);
  // C: Sumă (Σ) cu limite editabile
  const [slo, setSlo] = useState(draft.slo ?? "k=1");
  const [shi, setShi] = useState(draft.shi ?? "n");
  const [sbody, setSbody] = useState(draft.sbody ?? "");
  // C: Integrală (∫) cu limite editabile
  const [ilo, setIlo] = useState(draft.ilo ?? "a");
  const [ihi, setIhi] = useState(draft.ihi ?? "b");
  const [ibody, setIbody] = useState(draft.ibody ?? "");

  const mR = clampInt(mrows, 1, 5);
  const mC = clampInt(mcols, 1, 5);
  const sysN = clampInt(seqn, 1, 6);
  const setCell = (idx: number, val: string) =>
    setMcells((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  const setEq = (idx: number, val: string) =>
    setSeqs((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });

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
        JSON.stringify({
          kind,
          num,
          den,
          lvar,
          lto,
          lnum,
          lden,
          rorder,
          rrad,
          mrows,
          mcols,
          mcells,
          seqn,
          seqs,
          slo,
          shi,
          sbody,
          ilo,
          ihi,
          ibody,
        }),
      );
    } catch {
      /* localStorage indisponibil — schița nu persistă, dar UI-ul merge */
    }
  }, [
    kind,
    num,
    den,
    lvar,
    lto,
    lnum,
    lden,
    rorder,
    rrad,
    mrows,
    mcols,
    mcells,
    seqn,
    seqs,
    slo,
    shi,
    sbody,
    ilo,
    ihi,
    ibody,
  ]);

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
    if (kind === "matrix") {
      const rows: string[] = [];
      for (let r = 0; r < mR; r++) {
        const cells: string[] = [];
        for (let c = 0; c < mC; c++) {
          cells.push(norm(mcells[r * mC + c] || "") || "\\square");
        }
        rows.push(cells.join(" & "));
      }
      return `\\begin{pmatrix} ${rows.join(" \\\\ ")} \\end{pmatrix}`;
    }
    if (kind === "system") {
      const lines: string[] = [];
      for (let i = 0; i < sysN; i++) {
        lines.push(norm(seqs[i] || "") || "\\square");
      }
      return `\\begin{cases} ${lines.join(" \\\\ ")} \\end{cases}`;
    }
    if (kind === "sum") {
      return `\\sum_{${norm(slo) || "k=1"}}^{${norm(shi) || "n"}} ${norm(sbody) || "\\square"}`;
    }
    if (kind === "integral") {
      return `\\int_{${norm(ilo) || "a"}}^{${norm(ihi) || "b"}} ${norm(ibody) || "\\square"}\\, dx`;
    }
    const n = rorder.trim();
    const rad = norm(rrad) || "\\square";
    return n && n !== "2" ? `\\sqrt[${n}]{${rad}}` : `\\sqrt{${rad}}`;
  }, [
    kind,
    num,
    den,
    lvar,
    lto,
    lnum,
    lden,
    rorder,
    rrad,
    mR,
    mC,
    mcells,
    sysN,
    seqs,
    slo,
    shi,
    sbody,
    ilo,
    ihi,
    ibody,
  ]);

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

  // Construcție gata din grilă → un click = pe foaie (apoi editabilă la click).
  const insertConstruction = (tpl: string) => {
    editor.chain().focus().insertInlineMath({ latex: tpl }).run();
    trackEditor("math_insert", { kind: "construction", latex: tpl });
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
      {/* Construcții GATA-FĂCUTE (cerință Roland): toate structurile vizibile, un
          click = pe foaie, apoi editabilă la click. NU trebuie scris LaTeX. */}
      <div>
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">
          Construcții gata — un click → pe foaie (apoi editabilă la click):
        </p>
        <div className="grid grid-cols-4 gap-1">
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
        …sau completează câmpuri:
      </p>
      <div className="flex flex-col gap-1 rounded-md border border-border p-0.5">
        <div className="flex gap-1">
          {seg("frac", "Fracție")}
          {seg("lim", "Limită")}
          {seg("root", "Radical")}
        </div>
        <div className="flex gap-1">
          {seg("matrix", "Matrice")}
          {seg("system", "Sistem")}
          {seg("sum", "Σ")}
          {seg("integral", "∫")}
        </div>
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

      {kind === "matrix" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="opacity-70">Rânduri</span>
            <Input
              value={mrows}
              onChange={(e) => setMrows(e.target.value)}
              inputMode="numeric"
              className="h-8 w-14 text-center text-sm"
              aria-label="Rânduri (1–5)"
            />
            <span className="opacity-70">×</span>
            <span className="opacity-70">Coloane</span>
            <Input
              value={mcols}
              onChange={(e) => setMcols(e.target.value)}
              inputMode="numeric"
              className="h-8 w-14 text-center text-sm"
              aria-label="Coloane (1–5)"
            />
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${mC}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: mR * mC }).map((_, idx) => (
              <Input
                key={idx}
                ref={idx === 0 ? primaryRef : undefined}
                value={mcells[idx] || ""}
                onChange={(e) => setCell(idx, e.target.value)}
                placeholder="0"
                className="h-8 text-center text-sm"
                {...focusProps}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Completează celulele; cele goale rămân □. Maxim 5×5.
          </p>
        </div>
      )}

      {kind === "system" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="opacity-70">Ecuații</span>
            <Input
              value={seqn}
              onChange={(e) => setSeqn(e.target.value)}
              inputMode="numeric"
              className="h-8 w-14 text-center text-sm"
              aria-label="Număr de ecuații (1–6)"
            />
          </div>
          {Array.from({ length: sysN }).map((_, i) => (
            <Input
              key={i}
              ref={i === 0 ? primaryRef : undefined}
              value={seqs[i] || ""}
              onChange={(e) => setEq(i, e.target.value)}
              placeholder={`Ecuația ${i + 1} (ex: 2x+3y=7)`}
              className="h-8 text-sm"
              {...focusProps}
            />
          ))}
        </div>
      )}

      {kind === "sum" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              value={slo}
              onChange={(e) => setSlo(e.target.value)}
              placeholder="k=1"
              className="h-8 flex-1 text-sm"
              aria-label="Limita de jos"
              {...focusProps}
            />
            <span className="text-sm opacity-70">→</span>
            <Input
              value={shi}
              onChange={(e) => setShi(e.target.value)}
              placeholder="n"
              className="h-8 flex-1 text-sm"
              aria-label="Limita de sus"
              {...focusProps}
            />
          </div>
          <Input
            ref={primaryRef}
            value={sbody}
            onChange={(e) => setSbody(e.target.value)}
            placeholder="Termen (ex: a_k sau 1/k^2)"
            className="h-8 text-sm"
            {...focusProps}
          />
        </div>
      )}

      {kind === "integral" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              value={ilo}
              onChange={(e) => setIlo(e.target.value)}
              placeholder="a"
              className="h-8 flex-1 text-sm"
              aria-label="Limita de jos"
              {...focusProps}
            />
            <span className="text-sm opacity-70">→</span>
            <Input
              value={ihi}
              onChange={(e) => setIhi(e.target.value)}
              placeholder="b"
              className="h-8 flex-1 text-sm"
              aria-label="Limita de sus"
              {...focusProps}
            />
          </div>
          <Input
            ref={primaryRef}
            value={ibody}
            onChange={(e) => setIbody(e.target.value)}
            placeholder="Funcția (ex: x^2 sau sin x)"
            className="h-8 text-sm"
            {...focusProps}
          />
          <p className="text-[11px] text-muted-foreground">
            Se adaugă automat „dx" la final.
          </p>
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
