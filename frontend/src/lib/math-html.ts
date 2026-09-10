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

/**
 * O linie de text DEJA escape-uită ȘI cu markdown inline aplicat (bold/cod):
 * doar detectează titlu → bold, listă → bullet. NU mai apelează `inlineMd` —
 * ar proceda de două ori acelaşi text (vezi `renderMathText`).
 */
function formatLine(line: string): string {
  const h = line.match(/^\s*#{1,6}\s+(.*)$/);
  if (h) return `<strong>${h[1]}</strong>`;
  const li = line.match(/^\s*[*-]\s+(.*)$/);
  if (li) return `• ${li[1]}`;
  return line;
}

/**
 * P7 (Faza 4.5a, 2026-09-10): un `**bold**` care înconjoară o formulă, ex.
 * `**b) $6\sqrt{3}$**`, NU se randa — `renderMathText` tăia textul la
 * delimitatorii de matematică, iar cele două `**` ajungeau în bucăți de text
 * separate de KaTeX, deci regexul de bold din `inlineMd` nu vedea niciodată
 * perechea în aceeași invocare. Fix: protejează matematica cu placeholdere
 * OPACE înainte de trecerea de markdown (același tipar ca la traducere,
 * `api/lib/math_protect.py`), aplică markdown pe textul ÎNTREG dintr-o
 * bucată, apoi restaurează. Repară gratuit și bold-ul întins pe două linii
 * (al doilea bug real, diferit de cel din jurnal).
 */
const MARK_START = "";
const MARK_END = "";

export function renderMathText(text: string): string {
  const src = normalizeMathDelimiters(text);
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

  const tokens: string[] = [];
  let withPlaceholders = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    withPlaceholders += src.slice(last, m.index);
    const tex = m[1] ?? m[2] ?? "";
    let html: string;
    try {
      html = katex.renderToString(tex, {
        throwOnError: false,
        strict: false,
        displayMode: m[1] != null,
      });
    } catch {
      html = escapeHtml(m[0]);
    }
    tokens.push(html);
    withPlaceholders += MARK_START + (tokens.length - 1) + MARK_END;
    last = re.lastIndex;
  }
  withPlaceholders += src.slice(last);

  // Bold/cod pe tot textul, dintr-o bucată — placeholderele nu conțin `*`/`\n`,
  // deci nu pot rupe o pereche `**...**` și nici nu sunt atinse de escapeHtml
  // (care schimbă doar &, <, >).
  const withMarkdown = inlineMd(escapeHtml(withPlaceholders));
  const withLines = withMarkdown.split("\n").map(formatLine).join("<br>");

  const restoreRe = new RegExp(`${MARK_START}(\\d+)${MARK_END}`, "g");
  return withLines.replace(
    restoreRe,
    (_match, idx: string) => tokens[Number(idx)],
  );
}
