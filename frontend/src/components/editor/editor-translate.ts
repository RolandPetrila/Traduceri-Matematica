/**
 * F8 — Traducere-în-editor (2026-07-29). Extrage textul din documentul TipTap,
 * îl trimite la `/api/translate-text` (backend Traduceri păstrat) și reconstruiește
 * documentul în limba țintă, cu STRUCTURA + FORMULELE + FIGURILE + TABELELE intacte.
 *
 * Cheia fidelității (R-MATH) + calității traducerii:
 *  - Segmentez conținutul inline pe GRANIȚE DE MARCAJ: o frază fără marcaje = O secțiune
 *    (context complet → traducere bună); „**bold** cuvânt" = segmente separate → marcajele
 *    se păstrează, fragmentare doar unde formatarea fragmenta deja fraza.
 *  - Formulele inline intră în textul secțiunii ca `$latex$` — protejate automat de
 *    `math_protect.py` pe server (DeepL <keep> / LLM __MATH_N__), deci NU se traduc.
 *  - Formulele-bloc, figurile (img), tabelele = păstrate ca noduri (nu intră la traducere).
 *
 * Contract server (verificat): POST text/plain (NU application/json — altfel preflight 503),
 * body `{ text_sections:[{type,content}], source_lang, target_lang, translate_engine }`,
 * răspuns `{ translated_sections:[{type,content}] }` 1:1 pe index.
 */

import type { JSONContent } from "@tiptap/core";
import { API_URL } from "@/lib/api-url";
import { fetchWithRetry } from "@/lib/fetch-retry";

/** Separatorul cu care serverul îmbină secțiunile la batch — dacă apare în conținutul
 *  nostru ar strica împărțirea. Îl detectăm și forțăm calea per-secțiune (o cerere/secțiune). */
const SERVER_SEP = "|||SEP|||";

type MarkList = JSONContent["marks"];

/** Cheie stabilă pt gruparea nodurilor text cu ACELAȘI set de marcaje. */
function marksKey(marks?: MarkList): string {
  if (!marks || marks.length === 0) return "";
  return JSON.stringify(marks);
}

/** Placeholder în „schelet" pt un segment traductibil: indexul + marcajele de re-aplicat. */
type SegPlaceholder = { __tseg: number; marks?: MarkList };

type ExtractResult = {
  sections: string[];
  skeleton: JSONContent;
  /** numele nodului de matematică inline (ex. "inlineMath") — pt reconstrucție. */
  mathInlineType: string;
};

function isInlineMath(node: JSONContent): boolean {
  return (
    !!node.attrs &&
    typeof node.attrs.latex === "string" &&
    /inline/i.test(node.type || "") // inlineMath / inline-math
  );
}

/** Un nod inline e „atom de trecere" (nu text, nu math inline): hardBreak etc. → păstrat ca atare. */
function isInlineText(node: JSONContent): boolean {
  return node.type === "text";
}

/**
 * Procesează conținutul inline al unui bloc → înlocuiește segmentele de text (grupate pe
 * marcaje, cu math inline pliat ca `$latex$`) cu placeholdere; păstrează atomii (hardBreak).
 */
function segmentInline(
  inline: JSONContent[],
  sections: string[],
  state: { mathInlineType: string },
): JSONContent[] {
  const out: JSONContent[] = [];
  let parts: string[] | null = null;
  let curKey: string | null = null;
  let curMarks: MarkList | undefined;

  const flush = () => {
    if (parts !== null) {
      const idx = sections.length;
      sections.push(parts.join(""));
      const ph: SegPlaceholder = { __tseg: idx };
      if (curMarks && curMarks.length) ph.marks = curMarks;
      out.push(ph as unknown as JSONContent);
      parts = null;
      curKey = null;
      curMarks = undefined;
    }
  };

  for (const node of inline) {
    if (isInlineText(node)) {
      const mk = marksKey(node.marks);
      if (parts === null || mk !== curKey) {
        flush();
        parts = [];
        curKey = mk;
        curMarks = node.marks;
      }
      parts.push(node.text || "");
    } else if (isInlineMath(node)) {
      // Math e neutru la marcaje: rămâne în segmentul curent (sau pornește unul fără marcaje).
      if (parts === null) {
        parts = [];
        curKey = "";
        curMarks = undefined;
      }
      parts.push(`$${node.attrs!.latex}$`);
      state.mathInlineType = node.type || state.mathInlineType;
    } else {
      // hardBreak / alt atom inline → graniță + păstrat ca atare.
      flush();
      out.push(node);
    }
  }
  flush();
  return out;
}

/** True dacă array-ul de content e INLINE (conține text / math inline / hardBreak). */
function isInlineContent(content?: JSONContent[]): boolean {
  if (!content || content.length === 0) return false;
  return content.some(
    (n) => n.type === "text" || isInlineMath(n) || n.type === "hardBreak",
  );
}

function walkExtract(
  node: JSONContent,
  sections: string[],
  state: { mathInlineType: string },
): JSONContent {
  if (!node.content) return node;
  if (isInlineContent(node.content)) {
    return { ...node, content: segmentInline(node.content, sections, state) };
  }
  return {
    ...node,
    content: node.content.map((child) => walkExtract(child, sections, state)),
  };
}

/** Extrage secțiunile traductibile + scheletul cu placeholdere. */
export function extractTranslatable(doc: JSONContent): ExtractResult {
  const sections: string[] = [];
  const state = { mathInlineType: "inlineMath" };
  const skeleton = walkExtract(doc, sections, state);
  return { sections, skeleton, mathInlineType: state.mathInlineType };
}

/** Reconstruiește nodurile inline dintr-un segment tradus: text(cu marcaje) + math (fără marcaje). */
function expandSegment(
  translated: string,
  marks: MarkList | undefined,
  mathInlineType: string,
): JSONContent[] {
  const nodes: JSONContent[] = [];
  const pushText = (t: string) => {
    if (!t) return;
    const n: JSONContent = { type: "text", text: t };
    if (marks && marks.length) n.marks = marks;
    nodes.push(n);
  };
  const re = /\$([^$]*)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(translated)) !== null) {
    pushText(translated.slice(last, m.index));
    nodes.push({ type: mathInlineType, attrs: { latex: m[1] } });
    last = re.lastIndex;
  }
  pushText(translated.slice(last));
  return nodes;
}

function walkRebuild(
  node: JSONContent,
  translated: string[],
  mathInlineType: string,
): JSONContent {
  if (!node.content) return node;
  const rebuilt: JSONContent[] = [];
  for (const child of node.content) {
    const ph = child as unknown as SegPlaceholder;
    if (typeof ph.__tseg === "number") {
      const str = translated[ph.__tseg] ?? "";
      rebuilt.push(...expandSegment(str, ph.marks, mathInlineType));
    } else {
      rebuilt.push(walkRebuild(child, translated, mathInlineType));
    }
  }
  return { ...node, content: rebuilt };
}

/** Reconstruiește documentul din schelet + textele traduse (1:1 pe index). */
export function rebuildTranslated(
  skeleton: JSONContent,
  translated: string[],
  mathInlineType: string,
): JSONContent {
  return walkRebuild(skeleton, translated, mathInlineType);
}

/** Trimite secțiunile la server. Gardă `|||SEP|||`: dacă apare, forțăm per-secțiune. */
async function postSections(
  sections: string[],
  sourceLang: string,
  targetLang: string,
  engine: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const send = async (batch: string[]): Promise<string[]> => {
    const res = await fetchWithRetry(`${API_URL}/api/translate-text`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" }, // NICIODATĂ application/json (preflight 503)
      body: JSON.stringify({
        text_sections: batch.map((content) => ({ type: "paragraph", content })),
        source_lang: sourceLang,
        target_lang: targetLang,
        translate_engine: engine,
      }),
      signal,
    });
    if (!res.ok) throw new Error(`translate HTTP ${res.status}`);
    const data = (await res.json()) as {
      translated_sections?: { content?: string }[];
    };
    const out = data.translated_sections || [];
    return batch.map((orig, i) => out[i]?.content ?? orig);
  };

  const hasSep = sections.some((s) => s.includes(SERVER_SEP));
  if (!hasSep) return send(sections);
  // Cale sigură: o cerere per secțiune → serverul nu mai îmbină cu |||SEP|||.
  const results: string[] = [];
  for (const s of sections) {
    const [r] = await send([s]);
    results.push(r);
  }
  return results;
}

/**
 * Traduce întreg documentul TipTap `source→target`, păstrând structura/formule/figuri.
 * Întoarce un doc JSON nou (nu mutează). `doc` = `editor.getJSON()`.
 */
export async function translateEditorDoc(params: {
  doc: JSONContent;
  sourceLang: string;
  targetLang: string;
  engine?: string;
  signal?: AbortSignal;
}): Promise<JSONContent> {
  const { doc, sourceLang, targetLang, engine = "deepl", signal } = params;
  const { sections, skeleton, mathInlineType } = extractTranslatable(doc);
  if (sections.length === 0) return doc; // nimic de tradus (doc gol / doar figuri)
  const translated = await postSections(
    sections,
    sourceLang,
    targetLang,
    engine,
    signal,
  );
  return rebuildTranslated(skeleton, translated, mathInlineType);
}
