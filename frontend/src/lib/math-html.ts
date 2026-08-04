/**
 * Randare text-cu-formule → HTML cu KaTeX (partajat de Chat + Teste). Textul cu
 * $...$ (inline), $$...$$ (bloc), plus delimitatorii LaTeX `\(...\)` / `\[...\]`
 * (folosiți de unii provideri AI, ex. Cerebras/Groq/Mistral) devine KaTeX; markdown
 * minim (bold/cod/titluri/liste) e randat; restul e escape-uit (\n → <br>).
 * Funcție PURĂ (dar folosește katex, care rulează în browser + jsdom la test).
 */
import katex from "katex";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Normalizează delimitatorii LaTeX la stil `$`: unele modele (Cerebras/Groq/
 * Mistral) scriu `\(...\)` (inline) și `\[...\]` (bloc) în loc de `$...$`. Fără
 * asta, math-ul lor apare BRUT. `\[...\]` → `$$...$$`, `\(...\)` → `$...$`;
 * whitespace-ul intern al blocului e compactat (ca să nu spargă parserele pe linii).
 */
export function normalizeMathDelimiters(text: string): string {
  return text
    .replace(
      /\\\[([\s\S]+?)\\\]/g,
      (_m, tex) => `$$${String(tex).replace(/\s+/g, " ").trim()}$$`,
    )
    .replace(
      /\\\(([\s\S]+?)\\\)/g,
      (_m, tex) => `$${String(tex).replace(/\s+/g, " ").trim()}$`,
    );
}

/** Markdown inline pe text DEJA escape-uit: **bold** + `cod`. */
function inlineMd(s: string): string {
  return s
    .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+?)`/g, "<code>$1</code>");
}

/** O linie de text (deja escape-uit): titlu markdown → bold, listă → bullet. */
function markdownLine(escapedLine: string): string {
  const h = escapedLine.match(/^\s*#{1,6}\s+(.*)$/);
  if (h) return `<strong>${inlineMd(h[1])}</strong>`;
  const li = escapedLine.match(/^\s*[*-]\s+(.*)$/);
  if (li) return `• ${inlineMd(li[1])}`;
  return inlineMd(escapedLine);
}

export function renderMathText(text: string): string {
  const src = normalizeMathDelimiters(text);
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  const out: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const plain = (t: string) =>
    escapeHtml(t).split("\n").map(markdownLine).join("<br>");
  while ((m = re.exec(src)) !== null) {
    out.push(plain(src.slice(last, m.index)));
    const tex = m[1] ?? m[2] ?? "";
    try {
      out.push(
        katex.renderToString(tex, {
          throwOnError: false,
          strict: false,
          displayMode: m[1] != null,
        }),
      );
    } catch {
      out.push(escapeHtml(m[0]));
    }
    last = re.lastIndex;
  }
  out.push(plain(src.slice(last)));
  return out.join("");
}
