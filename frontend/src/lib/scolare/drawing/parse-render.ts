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
  const re = /(\w+)\s*=\s*"?([^"\s]+)"?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out[m[1].toLowerCase()] = m[2].toLowerCase();
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
