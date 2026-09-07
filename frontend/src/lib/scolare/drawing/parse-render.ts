/**
 * Randare Școlare cu markere de desen. Text-ul AI poate conține markere
 * `[[DESEN tip=... cheie=valoare ...]]` (vezi `drawing-rule.ts` pt instrucțiunea din
 * prompt). Compoziția e STRICTĂ: textul din jurul markerelor trece prin
 * `renderMathText` (escape + KaTeX, neschimbat — Chat/Teste rămân neatinse), SVG-ul
 * generat de noi NU trece niciodată prin escape. Marker necunoscut/invalid → tratat
 * ca text simplu (fallback, fără crash) — și fișele FĂRĂ niciun marker se randează
 * byte-identic cu `renderMathText` (regresie=0 pe cele 112 noduri existente).
 */
import { renderMathText } from "@/lib/math-html";
import { coloreaza, traseu, uneste, simetrie, baloane } from "./primitives";

const MARKER_RE = /\[\[DESEN\s+([^\]]*)\]\]/gi;

function parseParams(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Valoarea = fie "..." (cu spații), fie tot până la următorul ` cheie=` sau final.
  // Vechiul `[^"\s]+` se oprea la primul spațiu → `culori=rosu, albastru` se trunchia
  // tăcut la „rosu," (pierdea celelalte culori la markerul `baloane`). Audit 2026-09-07.
  const re = /(\w+)\s*=\s*(?:"([^"]*)"|([^=]*?))(?=\s+\w+\s*=|\s*$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const val = (m[2] !== undefined ? m[2] : m[3] || "").trim();
    out[m[1].toLowerCase()] = val.toLowerCase();
  }
  return out;
}

function renderMarker(raw: string): string | null {
  const p = parseParams(raw);
  switch (p.tip) {
    case "coloreaza":
      return coloreaza(p.obiect, p.culoare, p.model !== "nu");
    case "traseu":
      return traseu(p.start, p.final);
    case "uneste":
      return uneste(p.forma);
    case "simetrie":
      return simetrie(p.obiect);
    case "baloane":
      return baloane(
        (p.culori || "")
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      );
    default:
      return null;
  }
}

export function renderScolareContent(text: string): string {
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  MARKER_RE.lastIndex = 0;
  while ((m = MARKER_RE.exec(text)) !== null) {
    out += renderMathText(text.slice(last, m.index));
    out += renderMarker(m[1]) ?? renderMathText(m[0]);
    last = MARKER_RE.lastIndex;
  }
  out += renderMathText(text.slice(last));
  return out;
}

/** Segment pt inserarea în Editor: text brut SAU un desen ca SVG. */
export type ScolareSegment =
  { kind: "text"; text: string } | { kind: "svg"; svg: string };

/**
 * R5 (audit 2026-09-07): „➕ În editor" trimitea textul BRUT → markerele `[[DESEN]]`
 * ajungeau ca text literal în document (Print/PDF le randa, editorul nu). Împărțim în
 * segmente: text (→ inserat ca text/KaTeX) și desene (→ SVG, inserat ca imagine în editor).
 * Marker invalid = rămâne text (fallback, ca la randarea de print).
 */
export function scolareToSegments(text: string): ScolareSegment[] {
  const segs: ScolareSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  MARKER_RE.lastIndex = 0;
  while ((m = MARKER_RE.exec(text)) !== null) {
    if (m.index > last)
      segs.push({ kind: "text", text: text.slice(last, m.index) });
    const svg = renderMarker(m[1]);
    if (svg) segs.push({ kind: "svg", svg });
    else segs.push({ kind: "text", text: m[0] }); // marker invalid → text (fallback)
    last = MARKER_RE.lastIndex;
  }
  if (last < text.length) segs.push({ kind: "text", text: text.slice(last) });
  return segs;
}
