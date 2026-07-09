/**
 * Figure-payload helpers for the on-demand translation pipeline.
 *
 * The /translate-text endpoint translates only natural-language text and skips
 * figures entirely (api/translate_text.py:_collect_texts_recursive). Sending the
 * figure crops (base64 PNG `img_b64`, or inline `svg`) through it is pure waste:
 * it inflates the request body and can push a figure-heavy page past Vercel's
 * ~4.5MB edge cap → 413 FUNCTION_PAYLOAD_TOO_LARGE (the geometry pages are the
 * worst case). So we strip the payloads before POST and re-attach them from the
 * source afterwards. R-MATH: the translated view must keep every figure.
 */

export interface StructuredSection {
  type: string;
  content?: string;
  svg?: string | string[];
  img_b64?: string;
  level?: number;
  caption?: string;
  left?: StructuredSection[];
  right?: StructuredSection[];
}

/**
 * Strip figure image payloads (img_b64/svg) from a section tree before POSTing
 * to /translate-text. Recurses into two_column. Returns a new tree; the input is
 * never mutated. Non-figure sections are passed through by reference (their
 * content is translated, not the images).
 */
export function stripFigurePayloads(
  sections: StructuredSection[],
): StructuredSection[] {
  return sections.map((s) => {
    if (s.type === "figure") {
      const rest: StructuredSection = { ...s };
      delete rest.img_b64;
      delete rest.svg;
      return rest;
    }
    if (s.type === "two_column") {
      return {
        ...s,
        left: stripFigurePayloads(s.left || []),
        right: stripFigurePayloads(s.right || []),
      };
    }
    return s;
  });
}

/**
 * Re-attach figure image payloads from the ORIGINAL sections onto the translated
 * response (which came back stripped). The translated tree mirrors the request
 * 1:1 — the backend echoes figures and translates text in place — so a lockstep
 * walk by index is safe. Without this, the translated (SK/EN) view would lose
 * every figure.
 */
export function restoreFigurePayloads(
  translated: StructuredSection[],
  original: StructuredSection[],
): StructuredSection[] {
  return translated.map((t, k) => {
    const o = original[k];
    if (!o) return t;
    if (t.type === "figure") {
      return { ...t, img_b64: o.img_b64, svg: o.svg };
    }
    if (t.type === "two_column") {
      return {
        ...t,
        left: restoreFigurePayloads(t.left || [], o.left || []),
        right: restoreFigurePayloads(t.right || [], o.right || []),
      };
    }
    return t;
  });
}
