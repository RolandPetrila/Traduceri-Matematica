"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { MATH_PALETTE } from "./math-input";

type Field = HTMLInputElement | HTMLTextAreaElement;

/**
 * Inserare cu UN CLICK în câmpul activ (input/textarea controlat de React).
 *
 * Trucul: scriem valoarea prin setter-ul nativ + dispatch `input` → onChange-ul
 * React se declanșează normal, deci starea rămâne sursa de adevăr (nu forțăm
 * DOM-ul „pe lângă" React). Butonul paletei folosește `onMouseDown` +
 * `preventDefault` ca să NU fure focusul din câmp → caret-ul rămâne unde era.
 */
export function useActiveField() {
  const elRef = useRef<Field | null>(null);

  const setActive = useCallback((el: Field | null) => {
    elRef.current = el;
  }, []);

  const insert = useCallback((sym: string) => {
    const el = elRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + sym + el.value.slice(end);
    const proto =
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, next);
    else el.value = next;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    const caret = start + sym.length;
    // Re-poziționăm caret-ul DUPĂ ce React a re-randat cu noua valoare.
    requestAnimationFrame(() => {
      try {
        el.focus();
        el.setSelectionRange(caret, caret);
      } catch {
        /* câmp demontat între timp — ignorăm */
      }
    });
  }, []);

  return { elRef, setActive, insert };
}

/**
 * Rândul de simboluri clickabile. `onInsert` primește glif-ul; apelantul decide
 * unde-l pune (câmpul activ, prin `useActiveField`).
 */
export function MathSymbolPalette({
  onInsert,
  className,
}: {
  onInsert: (sym: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-wrap gap-1", className)}
      role="group"
      aria-label="Simboluri matematice — inserare cu un click"
    >
      {MATH_PALETTE.map((p) => (
        <button
          key={p.ins}
          type="button"
          // mousedown + preventDefault → câmpul nu-și pierde focusul/caret-ul.
          onMouseDown={(e) => {
            e.preventDefault();
            onInsert(p.ins);
          }}
          title={p.title}
          aria-label={p.title}
          className="flex h-7 min-w-[1.75rem] items-center justify-center rounded border border-border px-1 text-sm hover:bg-accent hover:text-accent-foreground"
        >
          {p.glyph ?? p.ins}
        </button>
      ))}
    </div>
  );
}
