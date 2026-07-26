"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Randare KaTeX care se MICȘOREAZĂ ca să încapă pe lățimea containerului
 * (scale-to-fit) — cerință Roland 2026-07-26: o formulă lungă trebuie „să încapă
 * în casetă, calibrată corect", NU să iasă din chenar sau să fie tăiată.
 *
 * De ce scale (nu scroll): scroll-ul repară doar ecranul; la PRINT (PDF/Word)
 * formula tot ar fi tăiată. Micșorarea rămâne fidelă și pe hârtie. Aici e varianta
 * pentru previzualizări în UI (butoane construcții, bibliotecă, dialog); pe FOAIE
 * scale-ul se face în CSS pe nodurile math, iar la export în `math-render.ts`.
 *
 * Măsoară lățimea reală a formulei vs. container (ResizeObserver → se recalibrează
 * la redimensionare) și aplică `transform: scale(k)`, k ∈ [MIN_SCALE, 1].
 */
const MIN_SCALE = 0.4;

export function AutoFitKatex({
  html,
  className,
  align = "center",
}: {
  html: string;
  className?: string;
  align?: "center" | "left";
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const fit = () => {
      const avail = outer.clientWidth;
      // Lățimea naturală a formulei = scrollWidth-ul spanului la scale 1. Ca să
      // măsurăm corect indiferent de scale-ul curent, citim de pe elementul intern.
      const natural = inner.scrollWidth;
      if (!avail || !natural) return;
      const next = natural > avail ? Math.max(avail / natural, MIN_SCALE) : 1;
      setScale(next);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [html]);

  return (
    <div
      ref={outerRef}
      className={className}
      style={{
        overflow: "hidden",
        display: "flex",
        justifyContent: align === "center" ? "center" : "flex-start",
      }}
    >
      <span
        ref={innerRef}
        style={{
          display: "inline-block",
          transform: `scale(${scale})`,
          transformOrigin: align === "center" ? "center" : "left center",
          // La scale 1 măsurăm lățimea naturală corect (fără să limităm spanul).
          whiteSpace: "nowrap",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
