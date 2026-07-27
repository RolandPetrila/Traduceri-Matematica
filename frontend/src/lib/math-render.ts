/**
 * Randare a nodurilor de matematică pentru EXPORT (M3).
 *
 * `editor.getHTML()` serializează nodurile math DOAR ca `<span data-type="inline-math"
 * data-latex="…">` (GOL) — KaTeX rulează doar în NodeView-ul viu, nu în HTML-ul serializat.
 * Deci în export trebuie să re-randăm din `data-latex`:
 *   • PDF + HTML → KaTeX HTML (stilizat de `KATEX_INLINE_CSS`, fonturi base64 inline);
 *   • Word (.docx) → IMAGINE PNG (turbodocx nu știe KaTeX; calea imaginilor, ca figurile).
 *
 * Self-contained: rasterizarea folosește un SVG `<foreignObject>` cu fonturile KaTeX
 * base64 INLINE → canvas ne-tainted → PNG. Fără CDN, fără MathJax.
 */

import katex from "katex";
import { KATEX_INLINE_CSS } from "./katex-inline-css";

/** Escape pentru atribut/HTML minimal. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** true dacă bodyHtml conține noduri math (evită munca inutilă). */
export function hasMath(bodyHtml: string): boolean {
  return /data-latex=/.test(bodyHtml);
}

/**
 * PDF/HTML: înlocuiește fiecare nod math cu KaTeX HTML randat (sincron).
 * `KATEX_INLINE_CSS` (inclus în documentul exportat) îi dă stilurile + fonturile.
 */
export function renderMathToKatexHtml(bodyHtml: string): string {
  if (typeof document === "undefined" || !hasMath(bodyHtml)) return bodyHtml;
  const host = document.createElement("div");
  host.innerHTML = bodyHtml;
  host.querySelectorAll("[data-latex]").forEach((node) => {
    const latex = node.getAttribute("data-latex") || "";
    const isBlock = (node.getAttribute("data-type") || "").includes("block");
    let html = "";
    try {
      html = katex.renderToString(latex, {
        throwOnError: false,
        strict: false,
        displayMode: isBlock,
        output: "html",
      });
    } catch {
      return; // LaTeX invalid → lăsăm nodul gol, nu dărâmăm exportul
    }
    const wrap = document.createElement(isBlock ? "div" : "span");
    wrap.innerHTML = html;
    if (isBlock) wrap.style.textAlign = "center";
    node.replaceWith(wrap);
  });
  return host.innerHTML;
}

/** Randează un fragment KaTeX HTML → PNG data URL (self-contained, ne-tainted). */
async function katexHtmlToPng(
  katexHtml: string,
  scale = 3,
): Promise<{ url: string; w: number; h: number } | null> {
  // 1. Măsurăm dimensiunea reală (CSS KaTeX e încărcat în app).
  const meas = document.createElement("div");
  meas.style.cssText =
    "position:fixed;left:-9999px;top:0;visibility:hidden;display:inline-block;font-size:16px;line-height:normal;";
  meas.innerHTML = katexHtml;
  document.body.appendChild(meas);
  const el = (meas.firstElementChild as HTMLElement) || meas;
  const w = Math.max(1, Math.ceil(el.getBoundingClientRect().width));
  const h = Math.max(1, Math.ceil(el.getBoundingClientRect().height));
  document.body.removeChild(meas);

  // 2. SVG cu foreignObject + fonturi base64 inline → complet self-contained.
  const xhtml =
    `<div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block;font-size:16px;line-height:normal;color:#000;">` +
    `<style>${KATEX_INLINE_CSS}</style>${katexHtml}</div>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<foreignObject x="0" y="0" width="100%" height="100%">${xhtml}</foreignObject></svg>`;
  const svgUrl =
    "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

  // 3. Încarcă în Image → desenează pe canvas la scală mare → PNG.
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = svgUrl;
  });
  if (!img) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(scale, scale);
  try {
    ctx.drawImage(img, 0, 0);
    return { url: canvas.toDataURL("image/png"), w, h };
  } catch {
    return null; // tainted (n-ar trebui — totul e data URI)
  }
}

/**
 * Word (.docx): înlocuiește fiecare nod math cu `<img>` PNG. turbodocx embed-uiește
 * imaginile (ca figurile). Async — rasterizare per nod.
 */
export async function renderMathToImages(bodyHtml: string): Promise<string> {
  if (typeof document === "undefined" || !hasMath(bodyHtml)) return bodyHtml;
  const host = document.createElement("div");
  host.innerHTML = bodyHtml;
  const nodes = Array.from(host.querySelectorAll("[data-latex]"));
  for (const node of nodes) {
    const latex = node.getAttribute("data-latex") || "";
    if (!latex) continue;
    const isBlock = (node.getAttribute("data-type") || "").includes("block");
    let katexHtml = "";
    try {
      katexHtml = katex.renderToString(latex, {
        throwOnError: false,
        strict: false,
        displayMode: isBlock,
        output: "html",
      });
    } catch {
      continue;
    }
    const png = await katexHtmlToPng(katexHtml);
    if (!png) continue;
    // #2: cap lățimea la lățimea conținutului A4 (174mm = 210−2×18mm, @96dpi ≈ 658px)
    // → o formulă lată (matrice, sistem) nu depășește pagina Word; scalăm proporțional.
    // Aceeași lățime ca foaia (ProseMirror clientWidth) și PDF-ul (.doc clientWidth),
    // deci aceeași formulă iese comparabil în editor / PDF / Word.
    const MAX_W = 658;
    let dw = png.w;
    let dh = png.h;
    if (dw > MAX_W) {
      dh = Math.round(dh * (MAX_W / dw));
      dw = MAX_W;
    }
    const imgHtml =
      `<img src="${png.url}" width="${dw}" height="${dh}" alt="${esc(latex)}" ` +
      `style="vertical-align:middle;${isBlock ? "display:block;margin:0.4em auto;" : ""}" />`;
    const holder = document.createElement(isBlock ? "div" : "span");
    if (isBlock) holder.style.textAlign = "center";
    holder.innerHTML = imgHtml;
    node.replaceWith(holder);
  }
  return host.innerHTML;
}

/** true dacă bodyHtml conține figuri SVG inserate (B: `<img src="data:image/svg+xml…">`). */
export function hasSvgFigures(bodyHtml: string): boolean {
  return /<img[^>]+src="data:image\/svg\+xml/.test(bodyHtml);
}

/** Încarcă un data-URI SVG într-un <img> și îl rasterizează pe canvas → PNG (fundal alb). */
async function svgDataUriToPng(
  svgDataUri: string,
  scale = 3,
): Promise<{ url: string; w: number; h: number } | null> {
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = svgDataUri;
  });
  if (!img) return null;
  const w = Math.max(1, img.naturalWidth || 120);
  const h = Math.max(1, img.naturalHeight || 112);
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff"; // Word: fundal alb (SVG e transparent) ca pe foaie
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  try {
    ctx.drawImage(img, 0, 0, w, h);
    return { url: canvas.toDataURL("image/png"), w, h };
  } catch {
    return null;
  }
}

/**
 * Word (.docx): rasterizează figurile SVG (B) → PNG. turbodocx/Word NU embed-uiesc
 * SVG data-URI (suport SVG limitat) → altfel figura ar apărea goală în Word. PDF/HTML
 * le lasă SVG (browserul le randează). Async — o conversie per figură.
 */
export async function renderFiguresToPng(bodyHtml: string): Promise<string> {
  if (typeof document === "undefined" || !hasSvgFigures(bodyHtml))
    return bodyHtml;
  const host = document.createElement("div");
  host.innerHTML = bodyHtml;
  const imgs = Array.from(
    host.querySelectorAll('img[src^="data:image/svg+xml"]'),
  ) as HTMLImageElement[];
  for (const node of imgs) {
    const png = await svgDataUriToPng(node.getAttribute("src") || "");
    if (!png) continue;
    node.setAttribute("src", png.url);
    if (!node.getAttribute("width")) node.setAttribute("width", String(png.w));
    if (!node.getAttribute("height"))
      node.setAttribute("height", String(png.h));
  }
  return host.innerHTML;
}
