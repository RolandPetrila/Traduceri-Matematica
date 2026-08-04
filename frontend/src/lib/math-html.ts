/**
 * Randare text-cu-formule → HTML cu KaTeX (partajat de Chat + Teste). Textul cu
 * $...$ (inline) și $$...$$ (bloc) devine KaTeX; restul e escape-uit (\n → <br>).
 * Funcție PURĂ (dar folosește katex, care rulează în browser + jsdom la test).
 */
import katex from "katex";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderMathText(text: string): string {
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  const out: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const plain = (t: string) => escapeHtml(t).replace(/\n/g, "<br>");
  while ((m = re.exec(text)) !== null) {
    out.push(plain(text.slice(last, m.index)));
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
  out.push(plain(text.slice(last)));
  return out.join("");
}
