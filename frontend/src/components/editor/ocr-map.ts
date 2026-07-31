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
  // table (R7.1 — Azure prebuilt-layout: grilă dreptunghiulară de celule-text)
  rows?: string[][];
  /** Câte rânduri de la început sunt antet (tableHeader). Default 0. */
  headerRows?: number;
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
 * Repară literele matematice TRUNCHIATE dintr-un strat-text de PDF stricat.
 * Unele exportatoare Word→PDF trunchiază caracterele din planul suplimentar
 * (Mathematical Alphanumeric Symbols, U+1D400–U+1D7FF) la 16 biți → devin silabe
 * Hangul (U+D400–U+D7FF), care apoi se randează ca garbaj CJK în export/PDF
 * (ex. `∢푀푂푃` în loc de `∢MOP`). Reconstrucție: +0x10000 → NFKC → literă ASCII.
 * Aplicat DOAR când rezultatul e o literă/cifră ASCII (altfel păstrăm caracterul).
 * (Coreeana reală ar fi afectată, dar e imposibilă într-o aplicație RO/SK/EN/DE.)
 */
export function fixTruncatedMathAlnum(text: string): string {
  return text.replace(/[퐀-퟿]/g, (ch) => {
    const cp = ch.codePointAt(0);
    if (cp === undefined) return ch;
    const restored = String.fromCodePoint(cp + 0x10000).normalize("NFKC");
    return /^[A-Za-z0-9]$/.test(restored) ? restored : ch;
  });
}

/**
 * Conținut inline (text cu `$latex$`/`$$latex$$` + `**bold**`) → noduri inline TipTap.
 * `$$…$$` prioritar (display-math); `latex` golit → text literal; `$` neîmperecheat → text.
 * Repară întâi literele-math trunchiate (PDF-uri stricate) — vezi `fixTruncatedMathAlnum`.
 */
export function parseInlineToNodes(text: string): JSONContent[] {
  if (!text) return [];
  text = fixTruncatedMathAlnum(text);
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
  return (
    text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      // Elimină cifrele-zgomot izolate (o singură cifră pe rând) — OCR-ul le produce
      // uneori din marcaje de rând/coloană (ex. limite: 9 rânduri „1" fantomă înainte
      // de limitele reale a)–i)). Un paragraf care e DOAR o cifră nu e conținut real.
      .filter((line) => !/^\d$/.test(line))
      .map(makeParagraph)
  );
}

function clampLevel(level: unknown): number {
  const n = typeof level === "number" ? level : 2;
  return Math.min(6, Math.max(1, Math.round(n)));
}

/**
 * O secțiune `table` (grilă dreptunghiulară de celule-text, R7.1) → nod TipTap
 * `table` > `tableRow` > `tableHeader|tableCell` > `paragraph`. Fiecare celulă e
 * un paragraf (schema TipTap cere block+ în celulă; paragraf gol e valid).
 * Textul celulei trece prin `parseInlineToNodes` (Azure dă text simplu, dar
 * păstrează `$latex$`/bold dacă apar). Grila e făcută dreptunghiulară aici
 * (defensiv) — rânduri mai scurte se completează cu celule goale.
 */
function tableToBlocks(section: OcrSection): JSONContent[] {
  const rows = section.rows || [];
  const cols = rows.reduce((mx, r) => Math.max(mx, r.length), 0);
  if (rows.length === 0 || cols === 0) {
    // Tabel fără celule → marcaj onest, nu nod de tabel invalid (l-ar respinge schema).
    return [makeParagraph("[Tabel gol]")];
  }
  const headerRows = Math.min(
    Math.max(0, Math.round(section.headerRows ?? 0)),
    rows.length,
  );
  const tableRows: JSONContent[] = rows.map((row, r) => {
    const cells: JSONContent[] = [];
    for (let c = 0; c < cols; c++) {
      const cellType = r < headerRows ? "tableHeader" : "tableCell";
      cells.push({ type: cellType, content: [makeParagraph(row[c] ?? "")] });
    }
    return { type: "tableRow", content: cells };
  });
  return [{ type: "table", content: tableRows }];
}

/**
 * R7.3 — eticheta de item a unei secțiuni: `a)`/`b)`/… (alfabetic) sau `1.`/`2.`/…
 * (numeric). `null` dacă nu începe cu o etichetă (pas `$P_1$…`, figură, proză).
 */
function itemLabelKey(
  section: OcrSection,
): { kind: "alpha" | "num"; key: number } | null {
  const c = (section.content || "").replace(/^[\s*]+/, "");
  const alpha = /^([a-zA-Z])[)\.]/.exec(c);
  if (alpha)
    return { kind: "alpha", key: alpha[1].toLowerCase().charCodeAt(0) };
  const num = /^(\d{1,3})[)\.]/.exec(c);
  if (num) return { kind: "num", key: parseInt(num[1], 10) };
  return null;
}

/**
 * R7.3 — reordonează în ordine naturală de citire itemii etichetați dintr-un
 * `two_column`. OCR-ul îi așează pe coloane vizuale (ex. `a,d` stânga; `b,c,e,f`
 * dreapta) → aplatizarea stânga-apoi-dreapta ar da `a,d,b,c,e,f`. Reordonăm DOAR
 * dacă TOȚI copiii sunt itemi etichetați de ACELAȘI fel; altfel păstrăm ordinea
 * vizuală (pași de construcție, figuri, proză — unde etichetele lipsesc).
 */
function orderReadingSequence(sections: OcrSection[]): OcrSection[] {
  if (sections.length < 2) return sections;
  const keys = sections.map(itemLabelKey);
  if (keys.some((k) => k === null)) return sections;
  const kind = keys[0]!.kind;
  if (keys.some((k) => k!.kind !== kind)) return sections;
  return sections
    .map((s, i) => ({ s, key: keys[i]!.key, i }))
    .sort((a, b) => a.key - b.key || a.i - b.i)
    .map((x) => x.s);
}

/** O secțiune OCR → 0..N noduri-bloc TipTap. Recursiv pentru `two_column`. */
export function sectionToBlocks(section: OcrSection): JSONContent[] {
  const type = section.type || "paragraph";
  const content = section.content || "";

  if (type === "table") {
    return tableToBlocks(section);
  }

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
        // Caption-ul poate conține `$latex$` (dovadă: „Unghi MNY cu $m(\angle…)$")
        // → îl trecem prin parseInlineToNodes ca formulele să se randeze, nu să apară
        // ca text brut cu `$`. Porțiunile de text rămân italice.
        const capNodes = parseInlineToNodes(caption).map((n) =>
          n.type === "text" && !n.marks
            ? { ...n, marks: [{ type: "italic" }] }
            : n,
        );
        blocks.push({ type: "paragraph", content: capNodes });
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
    // Fără extensie de coloane în editor → aplatizăm. Itemii etichetați (a) b) c)…)
    // se reordonează în ordine naturală de citire (R7.3); pașii/figurile/proza rămân
    // în ordinea vizuală. Figurile REALE stau aici (dovedit pe fixture) → recursăm.
    const combined = [...(section.left || []), ...(section.right || [])];
    return orderReadingSequence(combined).flatMap(sectionToBlocks);
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
