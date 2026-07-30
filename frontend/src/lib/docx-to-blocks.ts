/**
 * R3 — `.docx` → noduri-bloc TipTap (2026-07-30). Parcurge `word/document.xml` ÎN ORDINE
 * și produce noduri EDITABILE: text (cu bold/italic), formule `inlineMath` (din OMML via
 * `omml-to-latex`), imagini `image`/ResizableImage (din `word/media`). Înlocuiește calea
 * veche `mammoth.extractRawText` (care IGNORA complet OMML → matematica dispărea din export).
 *
 * PUR (fără fetch/React): primește XML-ul + un `resolveImage(rId)` (dat de `editor-import`,
 * care despachetează zip-ul cu `fflate`). Unit-testabil în jsdom (DOMParser).
 *
 * Fidelitate ETAPA A (Roland, „math + ordine întâi, apoi vizual"): formule la locul lor +
 * text în ordine + bold + imagini inline. ETAPA B (iterativ): liste numerotate, tabele,
 * spațiere fină. Nodurile `inlineMath`/`image` supraviețuiesc în `editor.getHTML()` →
 * export PDF/HTML/Word (R-MATH, R-EXPORT).
 */

import type { JSONContent } from "@tiptap/core";
import { unzipSync, strFromU8 } from "fflate";
import { ommlElementToLatex } from "./omml-to-latex";

/** Rezultatul conversiei + semnale pt bannerul onest (R3.5). */
export interface DocxResult {
  blocks: JSONContent[];
  /** Câte `<m:oMath>` s-au întâlnit (ținta invariantului de numărare din test). */
  ommlCount: number;
  /** Câte formule au produs efectiv un nod `inlineMath` (gol → literal, NU nod invizibil). */
  emittedMathCount: number;
  /** Câte imagini din `word/media` s-au inserat ca noduri `image`. */
  imageCount: number;
  /** Câte imagini nu s-au putut rezolva (media lipsă / format nesuportat). */
  unresolvedImages: number;
  /** Elemente OMML necunoscute întâlnite (o dată fiecare) — pt banner + follow-up. */
  unknown: string[];
}

const INLINE_MATH = "inlineMath";

/** Primul copil-element cu `localName` dat. */
function child(el: Element, local: string): Element | null {
  for (let i = 0; i < el.children.length; i++) {
    if (el.children[i].localName === local) return el.children[i];
  }
  return null;
}

/** `m:val`/`w:val` de pe primul copil `local` din `pr`. */
function propVal(pr: Element | null, local: string): string | null {
  if (!pr) return null;
  const c = child(pr, local);
  if (!c) return null;
  for (let i = 0; i < c.attributes.length; i++) {
    const a = c.attributes[i];
    if (a.localName === "val" || a.name.endsWith(":val")) return a.value;
  }
  // Prezent fără `val` (ex. `<w:b/>`) = activ.
  return c ? "" : null;
}

/** Un flag boolean OMML/OOXML: prezent și != false/0/off → true. */
function boolProp(pr: Element | null, local: string): boolean {
  if (!pr) return false;
  const c = child(pr, local);
  if (!c) return false;
  const v = propVal(pr, local);
  return v === null || v === "" || (v !== "false" && v !== "0" && v !== "off");
}

/** Atribut după `localName` (robust la prefix). */
function attrLocal(el: Element, local: string): string | null {
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    if (
      a.localName === local ||
      a.name === local ||
      a.name.endsWith(":" + local)
    ) {
      return a.value;
    }
  }
  return null;
}

/** Primul descendent (recursiv) cu `localName` dat. */
function descendant(el: Element, local: string): Element | null {
  if (el.localName === local) return el;
  for (let i = 0; i < el.children.length; i++) {
    const found = descendant(el.children[i], local);
    if (found) return found;
  }
  return null;
}

/** Acumulator mutabil per-document (contoare + noduri). */
interface Ctx {
  blocks: JSONContent[];
  ommlCount: number;
  emittedMathCount: number;
  imageCount: number;
  unresolvedImages: number;
  unknown: string[];
  resolveImage: (rId: string) => string | null;
}

/** Adaugă un `localName` necunoscut o singură dată. */
function noteUnknown(ctx: Ctx, names: string[]) {
  for (const n of names) if (!ctx.unknown.includes(n)) ctx.unknown.push(n);
}

/** Un nod-text cu marcaje (bold/italic) sau null dacă textul e gol. */
function textNode(
  text: string,
  bold: boolean,
  italic: boolean,
): JSONContent | null {
  if (!text) return null;
  const marks: JSONContent["marks"] = [];
  if (bold) marks.push({ type: "bold" });
  if (italic) marks.push({ type: "italic" });
  const node: JSONContent = { type: "text", text };
  if (marks.length) node.marks = marks;
  return node;
}

/** Rezolvă un `<w:drawing>`/`<w:pict>` → data-URI prin `r:embed`/`r:id`. */
function resolveDrawing(el: Element, ctx: Ctx): string | null {
  const blip = descendant(el, "blip"); // <a:blip r:embed="rId5">
  const rId =
    (blip && (attrLocal(blip, "embed") || attrLocal(blip, "link"))) ||
    // VML fallback: <v:imagedata r:id="rId5">
    (() => {
      const imagedata = descendant(el, "imagedata");
      return imagedata ? attrLocal(imagedata, "id") : null;
    })();
  return rId ? ctx.resolveImage(rId) : null;
}

/** Un `<w:p>` → 0..N blocuri (paragraf(e) + eventuale imagini block-level intercalate). */
function renderParagraph(p: Element, ctx: Ctx) {
  let inline: JSONContent[] = [];
  const flush = () => {
    const node: JSONContent = { type: "paragraph" };
    if (inline.length) node.content = inline;
    ctx.blocks.push(node);
    inline = [];
  };

  const pushImage = (src: string) => {
    // Imaginea e block-level (Image/ResizableImage, group "block") → închide paragraful.
    flush();
    ctx.blocks.push({ type: "image", attrs: { src, alt: null } });
    ctx.imageCount++;
  };

  const handleMath = (mathEl: Element) => {
    ctx.ommlCount++;
    const { latex, unknown } = ommlElementToLatex(mathEl);
    noteUnknown(ctx, unknown);
    if (latex.trim()) {
      inline.push({ type: INLINE_MATH, attrs: { latex } });
      ctx.emittedMathCount++;
    }
    // Gol → NU emitem nod math invizibil (garda R3.4); pierdere raportată prin delta count.
  };

  const walkRun = (r: Element) => {
    const rPr = child(r, "rPr");
    const bold = boolProp(rPr, "b");
    const italic = boolProp(rPr, "i");
    for (let i = 0; i < r.children.length; i++) {
      const c = r.children[i];
      switch (c.localName) {
        case "t": {
          const tn = textNode(c.textContent ?? "", bold, italic);
          if (tn) inline.push(tn);
          break;
        }
        case "tab":
          inline.push({ type: "text", text: "\t" });
          break;
        case "br":
          flush(); // rupere de linie → paragraf nou (aproximare ETAPA A)
          break;
        case "drawing":
        case "pict":
        case "object": {
          const src = resolveDrawing(c, ctx);
          if (src) pushImage(src);
          else {
            ctx.unresolvedImages++;
            const ph = textNode("[Figură indisponibilă]", false, true);
            if (ph) inline.push(ph);
          }
          break;
        }
        default:
          break; // rPr, sym, fldChar… ignorate în ETAPA A
      }
    }
  };

  for (let i = 0; i < p.children.length; i++) {
    const c = p.children[i];
    switch (c.localName) {
      case "r":
        walkRun(c);
        break;
      case "oMath":
        handleMath(c);
        break;
      case "oMathPara":
        for (let j = 0; j < c.children.length; j++) {
          if (c.children[j].localName === "oMath") handleMath(c.children[j]);
        }
        break;
      case "hyperlink":
      case "smartTag":
      case "ins":
        // Containere care înfășoară runuri → coboară.
        for (let j = 0; j < c.children.length; j++) {
          if (c.children[j].localName === "r") walkRun(c.children[j]);
        }
        break;
      default:
        break; // pPr, proofErr, bookmark*, commentRange* … ignorate
    }
  }
  flush();
}

/** Aplatizează un tabel la paragrafele celulelor (ETAPA A: nu pierdem conținut). */
function renderTable(tbl: Element, ctx: Ctx) {
  for (let i = 0; i < tbl.children.length; i++) {
    const row = tbl.children[i];
    if (row.localName !== "tr") continue;
    for (let j = 0; j < row.children.length; j++) {
      const cell = row.children[j];
      if (cell.localName !== "tc") continue;
      for (let k = 0; k < cell.children.length; k++) {
        const el = cell.children[k];
        if (el.localName === "p") renderParagraph(el, ctx);
        else if (el.localName === "tbl") renderTable(el, ctx);
      }
    }
  }
}

/**
 * `word/document.xml` → blocuri TipTap. `resolveImage(rId)` întoarce un data-URI sau null
 * (media lipsă/nesuportată → placeholder onest + contorizat separat).
 */
export function docxXmlToBlocks(
  documentXml: string,
  resolveImage: (rId: string) => string | null,
): DocxResult {
  const ctx: Ctx = {
    blocks: [],
    ommlCount: 0,
    emittedMathCount: 0,
    imageCount: 0,
    unresolvedImages: 0,
    unknown: [],
    resolveImage,
  };

  const doc = new DOMParser().parseFromString(documentXml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    noteUnknown(ctx, ["parsererror"]);
    return finalize(ctx);
  }

  const body = descendant(doc.documentElement, "body");
  if (!body) return finalize(ctx);

  for (let i = 0; i < body.children.length; i++) {
    const el = body.children[i];
    switch (el.localName) {
      case "p":
        renderParagraph(el, ctx);
        break;
      case "tbl":
        renderTable(el, ctx);
        break;
      case "oMathPara":
        // Math block-level direct în body.
        for (let j = 0; j < el.children.length; j++) {
          if (el.children[j].localName === "oMath") {
            ctx.ommlCount++;
            const { latex, unknown } = ommlElementToLatex(el.children[j]);
            noteUnknown(ctx, unknown);
            if (latex.trim()) {
              ctx.blocks.push({
                type: "paragraph",
                content: [{ type: INLINE_MATH, attrs: { latex } }],
              });
              ctx.emittedMathCount++;
            }
          }
        }
        break;
      default:
        break; // sectPr etc.
    }
  }
  return finalize(ctx);
}

function finalize(ctx: Ctx): DocxResult {
  if (ctx.blocks.length === 0) {
    ctx.blocks.push({ type: "paragraph" });
  }
  return {
    blocks: ctx.blocks,
    ommlCount: ctx.ommlCount,
    emittedMathCount: ctx.emittedMathCount,
    imageCount: ctx.imageCount,
    unresolvedImages: ctx.unresolvedImages,
    unknown: ctx.unknown,
  };
}

// ---------------------------------------------------------------------------
// Intrare de nivel-fișier: `.docx` (ArrayBuffer) → blocuri. Despachetează zip-ul
// (fflate), citește `word/document.xml`, mapează `word/media` prin relații. Unit-testabil
// pe binarul REAL (jsdom oferă DOMParser + btoa) — vezi omml-to-latex.test.ts.
// ---------------------------------------------------------------------------

/** Formate raster randabile în browser (EMF/WMF/TIFF → null = placeholder onest). */
const IMG_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/** Extensia din nume de fișier (lowercase, fără punct). */
function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** Uint8Array → base64 (chunked; `.apply` nu spread — spread pe TA cere downlevelIteration). */
function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return btoa(bin);
}

/**
 * `.docx` (ArrayBuffer) → blocuri TipTap (R3). Înlocuiește `mammoth.extractRawText`
 * (care ignora complet OMML). Aruncă dacă zip-ul nu conține `word/document.xml`.
 */
export function docxArrayBufferToBlocks(buf: ArrayBuffer): DocxResult {
  const files = unzipSync(new Uint8Array(buf));
  const docXml = files["word/document.xml"];
  if (!docXml) throw new Error("DOCX invalid (lipsește word/document.xml).");

  // Relații rId → țintă (media/imageN.ext), relativ la word/.
  const relsRaw = files["word/_rels/document.xml.rels"];
  const relMap = new Map<string, string>();
  if (relsRaw) {
    const relsDoc = new DOMParser().parseFromString(
      strFromU8(relsRaw),
      "application/xml",
    );
    const rels = relsDoc.getElementsByTagName("Relationship");
    for (let i = 0; i < rels.length; i++) {
      const id = rels[i].getAttribute("Id");
      const target = rels[i].getAttribute("Target");
      if (id && target) relMap.set(id, target.replace(/^\/?word\//, ""));
    }
  }

  const resolveImage = (rId: string): string | null => {
    const target = relMap.get(rId);
    if (!target) return null;
    const bytes = files[`word/${target}`];
    if (!bytes) return null;
    const mime = IMG_MIME[extOf(target)];
    if (!mime) return null; // EMF/WMF/TIFF → placeholder onest (nu <img> gol)
    return `data:${mime};base64,${bytesToBase64(bytes)}`;
  };

  return docxXmlToBlocks(strFromU8(docXml), resolveImage);
}
