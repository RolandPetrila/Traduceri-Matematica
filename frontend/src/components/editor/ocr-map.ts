/**
 * F9 — Mapare OCR → noduri TipTap (2026-07-29). PUR (fără DOM/fetch) ca să fie
 * unit-testabil. Consumă `structured_pages` de la `POST /api/ocr` (schema din
 * `api/lib/ocr_structured.py` + `html_builder.py`) și produce noduri TipTap
 * EDITABILE — NU HTML — ca formulele (`inlineMath`) și figurile (`ResizableImage`)
 * să supraviețuiască în `editor.getHTML()` → export PDF/HTML/Word (R-MATH, R-EXPORT).
 *
 * De ce noduri, nu HTML: exportul re-randează din noduri; dacă mapăm în HTML,
 * o figură/formulă s-ar putea pierde tăcut la un pas de sanitizare. (Vezi F3c.)
 *
 * Capcane acoperite (advisor 2026-07-29):
 *  - `$$…$$` tratat ÎNAINTE de `$…$` (altfel regexul inline sparge display-math
 *    în două noduri cu `latex:""` = formulă INVIZIBILĂ → pierdere silențioasă R-MATH);
 *  - orice `latex` golit → text literal, NICIODATĂ nod math gol;
 *  - `figure` fără `img_b64` → paragraf `[Figura: …]` (nu `<img>` rupt);
 *  - `figure` în `two_column` → recursăm (figurile REALE stau acolo, dovedit pe fixture);
 *  - `level` clamp 1..6 + „heading" > 200 caractere → paragraf (ca `html_builder`);
 *  - `\n` în conținut → paragrafe separate (list are `\n`; fallback Mistral = o pagină/paragraf).
 */

import type { JSONContent } from "@tiptap/core";

/** O secțiune din `structured_pages[i].sections` (schema Gemini JSON). */
export interface OcrSection {
  type?: string;
  content?: string;
  level?: number;
  // figure
  img_b64?: string;
  caption?: string;
  description?: string;
  // two_column
  left?: OcrSection[];
  right?: OcrSection[];
}

export interface OcrPage {
  title?: string;
  sections?: OcrSection[];
  /** Flag din server: „mistral-ocr" = fallback fără figuri/LaTeX (doar text brut). */
  source?: string;
}

/** Numele nodurilor (vezi extensions.ts): matematica = @tiptap/extension-mathematics. */
const INLINE_MATH = "inlineMath";

/** `**b**`/`*i*`/`***bi***` → noduri text cu marcaje. Ordinea: bold-italic, bold, italic. */
function parseMarkdownMarks(text: string): JSONContent[] {
  if (!text) return [];
  const nodes: JSONContent[] = [];
  const re = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const pushPlain = (t: string) => {
    if (t) nodes.push({ type: "text", text: t });
  };
  while ((m = re.exec(text)) !== null) {
    pushPlain(text.slice(last, m.index));
    if (m[1] != null) {
      nodes.push({
        type: "text",
        text: m[1],
        marks: [{ type: "bold" }, { type: "italic" }],
      });
    } else if (m[2] != null) {
      nodes.push({ type: "text", text: m[2], marks: [{ type: "bold" }] });
    } else if (m[3] != null) {
      nodes.push({ type: "text", text: m[3], marks: [{ type: "italic" }] });
    }
    last = re.lastIndex;
  }
  pushPlain(text.slice(last));
  return nodes;
}

/**
 * Conținut inline (text cu `$latex$`/`$$latex$$` + `**bold**`) → noduri inline TipTap.
 * `$$…$$` prioritar (display-math); `latex` golit → text literal; `$` neîmperecheat → text.
 */
export function parseInlineToNodes(text: string): JSONContent[] {
  if (!text) return [];
  const out: JSONContent[] = [];
  // Grupa 1 = display `$$…$$`; grupa 2 = inline `$…$` (fără `$`/newline înăuntru).
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(...parseMarkdownMarks(text.slice(last, m.index)));
    const latex = (m[1] ?? m[2] ?? "").trim();
    if (latex) {
      out.push({ type: INLINE_MATH, attrs: { latex } });
    } else {
      // `$$$$` / `$ $` → nu emitem nod invizibil; păstrăm literal.
      out.push(...parseMarkdownMarks(m[0]));
    }
    last = re.lastIndex;
  }
  out.push(...parseMarkdownMarks(text.slice(last)));
  return out;
}

/** Un bloc de text (paragraf/titlu). Content gol → nod fără `content` (paragraf valid, gol). */
function makeParagraph(text: string): JSONContent {
  const inline = parseInlineToNodes(text);
  const node: JSONContent = { type: "paragraph" };
  if (inline.length) node.content = inline;
  return node;
}

/** Text cu `\n` → mai multe paragrafe (list are `\n`; Mistral = o pagină/paragraf). */
function textToParagraphs(text: string): JSONContent[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(makeParagraph);
}

function clampLevel(level: unknown): number {
  const n = typeof level === "number" ? level : 2;
  return Math.min(6, Math.max(1, Math.round(n)));
}

/** O secțiune OCR → 0..N noduri-bloc TipTap. Recursiv pentru `two_column`. */
export function sectionToBlocks(section: OcrSection): JSONContent[] {
  const type = section.type || "paragraph";
  const content = section.content || "";

  if (type === "heading") {
    // OCR clasifică uneori un paragraf lung drept „heading" → îl retrogradăm (ca html_builder).
    if (content.length > 200) return textToParagraphs(content);
    const inline = parseInlineToNodes(content);
    const node: JSONContent = {
      type: "heading",
      attrs: { level: clampLevel(section.level) },
    };
    if (inline.length) node.content = inline;
    return [node];
  }

  if (type === "figure") {
    const blocks: JSONContent[] = [];
    const caption = section.caption || section.description || "";
    if (section.img_b64) {
      // Crop PNG din imaginea originală → nod ResizableImage (redimensionabil, F3c).
      blocks.push({
        type: "image",
        attrs: {
          src: `data:image/png;base64,${section.img_b64}`,
          alt: caption || null,
        },
      });
      if (caption) {
        blocks.push({
          type: "paragraph",
          content: [
            { type: "text", text: caption, marks: [{ type: "italic" }] },
          ],
        });
      }
    } else {
      // Fără crop (bbox invalid/prea mic) → marcaj onest, nu <img> rupt.
      blocks.push({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: `[Figură: ${caption || "indisponibilă"}]`,
            marks: [{ type: "italic" }],
          },
        ],
      });
    }
    return blocks;
  }

  if (type === "two_column") {
    // Fără extensie de coloane în editor → aplatizăm (stânga apoi dreapta).
    // Figurile REALE stau aici (dovedit pe fixture) → recursăm obligatoriu.
    return [
      ...(section.left || []).flatMap(sectionToBlocks),
      ...(section.right || []).flatMap(sectionToBlocks),
    ];
  }

  // paragraph / step / observation / list / necunoscut → paragraf(e).
  // Marcajele `**Observație.**` din conținut asigură bold-ul (nu-l forțăm pe tot).
  return textToParagraphs(content);
}

/** Rezultatul mapării: nodurile + semnale pt bannerul onest (R3). */
export interface MappedContent {
  blocks: JSONContent[];
  /** Vreo pagină a venit prin fallback Mistral (fără figuri/LaTeX). */
  mistralFallback: boolean;
}

/** `structured_pages` → noduri-bloc TipTap. `pageBreak` între pagini (paginare la print). */
export function structuredPagesToBlocks(pages: OcrPage[]): MappedContent {
  const blocks: JSONContent[] = [];
  let mistralFallback = false;

  pages.forEach((page, i) => {
    if (page.source === "mistral-ocr") mistralFallback = true;
    if (i > 0) blocks.push({ type: "pageBreak" });
    const title = (page.title || "").trim();
    if (title) {
      const inline = parseInlineToNodes(title);
      const node: JSONContent = { type: "heading", attrs: { level: 1 } };
      if (inline.length) node.content = inline;
      blocks.push(node);
    }
    for (const section of page.sections || []) {
      blocks.push(...sectionToBlocks(section));
    }
  });

  if (blocks.length === 0) {
    blocks.push(makeParagraph("[Documentul importat nu conține text.]"));
  }
  return { blocks, mistralFallback };
}

/** Text brut (docx/txt/md/pdf-cu-text) → paragrafe. Onest: FĂRĂ matematică transcrisă. */
export function rawTextToBlocks(text: string): JSONContent[] {
  const blocks = textToParagraphs(text);
  return blocks.length
    ? blocks
    : [makeParagraph("[Fișierul nu conține text.]")];
}
