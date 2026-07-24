/**
 * Export editor nativ (F4a) — PDF (print vectorial) · Word (.docx) · HTML.
 *
 * Sursa = `editor.getHTML()` (conținut EDITAT). Matematica e Unicode+HTML (fidel,
 * NU LaTeX) → la print rămâne text real, selectabil, fără MathJax.
 * Livrabilul e un DOCUMENT ALB CLASIC (hârtie A4, text negru), nu tema cretă a
 * ecranului — tema verde e doar pentru editare.
 */

import { ZEBRA_COLOR } from "@/components/editor/table-extensions";

/**
 * Dungile de tabel sunt un selector CSS (`nth-child`) — nu supraviețuiesc
 * conversiei în .docx, unde contează doar stilul inline. Înainte de livrare
 * scriem fundalul direct pe celulele rândurilor pare, ca documentul exportat să
 * arate ca cel de pe ecran în TOATE formatele (R-EXPORT).
 */
function inlineZebra(bodyHtml: string): string {
  if (typeof document === "undefined" || !bodyHtml.includes("data-zebra")) {
    return bodyHtml;
  }
  const host = document.createElement("div");
  host.innerHTML = bodyHtml;
  host.querySelectorAll('table[data-zebra="true"]').forEach((table) => {
    Array.from(table.querySelectorAll("tr")).forEach((row, index) => {
      if (index % 2 !== 1) return;
      row.querySelectorAll("td, th").forEach((cell) => {
        const el = cell as HTMLElement;
        // Culoarea aleasă manual pe celulă are prioritate.
        if (!el.style.backgroundColor) el.style.backgroundColor = ZEBRA_COLOR;
      });
    });
  });
  return host.innerHTML;
}

/** Nume de fișier sigur (fără caractere interzise pe Windows/mac/linux). */
function safeName(title: string): string {
  const t = (title || "Document").trim().replace(/[\\/:*?"<>|]+/g, "_");
  return t.length ? t : "Document";
}

/** Escape minimal pentru a insera titlul în markup. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * CSS-ul documentului exportat — oglindește `.editor-content` din globals.css,
 * dar pe hârtie A4 albă (self-contained, ca fișierul HTML să fie portabil).
 */
const DOCUMENT_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  body {
    color: #111827;
    font-family: "Times New Roman", Georgia, serif;
    font-size: 12pt;
    line-height: 1.5;
  }
  .page {
    max-width: 210mm;
    margin: 0 auto;
    padding: 20mm 18mm;
  }
  .doc > * + * { margin-top: 0.6em; }
  .doc h1 { font-size: 1.8em; font-weight: 700; }
  .doc h2 { font-size: 1.4em; font-weight: 700; }
  .doc h3 { font-size: 1.2em; font-weight: 700; }
  .doc ul { list-style: disc; padding-left: 1.4em; }
  .doc ol { list-style: decimal; padding-left: 1.4em; }
  .doc blockquote {
    border-left: 3px solid #cbd5e1;
    padding-left: 1em;
    color: #475569;
    font-style: italic;
  }
  .doc a { color: #2563eb; text-decoration: underline; }
  .doc table {
    border-collapse: collapse;
    width: 100%;
    margin: 0.5em 0;
    table-layout: fixed;
  }
  .doc th, .doc td {
    border: 1px solid #cbd5e1;
    padding: 6px 8px;
    vertical-align: top;
  }
  .doc th { background: #f1f5f9; font-weight: 700; }
  .doc img { max-width: 100%; height: auto; }
  .doc hr { border: none; border-top: 2px solid #cbd5e1; margin: 1em 0; }
  .doc table[data-zebra="true"] tr:nth-child(even) td { background: ${ZEBRA_COLOR}; }
  /* Întrerupere de pagină: invizibilă pe hârtie, dar rupe pagina. */
  .doc .page-break {
    break-after: page;
    page-break-after: always;
    height: 0;
    border: none;
  }
  @page { size: A4; margin: 20mm 18mm; }
  @media print {
    html, body { background: #ffffff; }
    .page { max-width: none; margin: 0; padding: 0; }
  }
`;

/** Construiește un document HTML standalone (alb A4) din conținutul editorului. */
function buildDocumentHtml(rawBodyHtml: string, title: string): string {
  const bodyHtml = inlineZebra(rawBodyHtml);
  return `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${DOCUMENT_CSS}</style>
</head>
<body>
<div class="page"><div class="doc">${bodyHtml}</div></div>
</body>
</html>`;
}

/** Descarcă un Blob ca fișier (creează + revocă un URL temporar). */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revocarea imediată poate întrerupe descărcarea pe unele browsere → mic delay.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * PDF prin print vectorial: deschide fereastră cu documentul alb A4 și cheamă
 * print(). Textul rămâne vectorial/selectabil, formulele Unicode intacte.
 * Fallback (pop-up blocat): iframe ascuns → print, apoi curățare.
 */
export function exportPdf(bodyHtml: string, title: string): void {
  const html = buildDocumentHtml(bodyHtml, safeName(title));
  const win = window.open("", "_blank");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    // Așteaptă randarea înainte de print (imagini/tabele).
    win.onload = () => {
      win.focus();
      win.print();
    };
    // Safety: dacă onload nu se declanșează (doc deja complet).
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        /* fereastra poate fi deja închisă de user */
      }
    }, 400);
    return;
  }
  // Fallback iframe (pop-up blocat).
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const cw = iframe.contentWindow!;
  const doPrint = () => {
    cw.focus();
    cw.print();
    setTimeout(() => iframe.remove(), 1000);
  };
  if (doc.readyState === "complete") setTimeout(doPrint, 300);
  else cw.onload = () => setTimeout(doPrint, 300);
}

/** HTML standalone descărcabil (deschizabil oriunde, stiluri inline). */
export function exportHtml(bodyHtml: string, title: string): void {
  const name = safeName(title);
  const html = buildDocumentHtml(bodyHtml, name);
  downloadBlob(
    new Blob([html], { type: "text/html;charset=utf-8" }),
    `${name}.html`,
  );
}

/**
 * Word (.docx) real din conținutul editat, via @turbodocx/html-to-docx (client,
 * gratuit — aceeași bibliotecă dovedită în Mösslein). Import dinamic ca să nu
 * intre în bundle-ul inițial (se încarcă doar la primul export DOCX).
 */
export async function exportDocx(
  bodyHtml: string,
  title: string,
): Promise<void> {
  const name = safeName(title);
  const mod = await import("@turbodocx/html-to-docx");
  const HTMLtoDOCX = (mod.default ?? mod) as (
    html: string,
    headerHTML: string | null,
    options: Record<string, unknown>,
    footerHTML?: string | null,
  ) => Promise<Blob | ArrayBuffer | Uint8Array>;

  // Wrap minim: turbodocx mapează stilurile inline/tag-uri → Word.
  // `<div class="page-break">` (clasă EXACTĂ) devine `<w:br w:type="page"/>`.
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${inlineZebra(bodyHtml)}</body></html>`;

  const result = await HTMLtoDOCX(html, null, {
    orientation: "portrait",
    margins: { top: 1134, right: 1020, bottom: 1134, left: 1020 }, // ~20mm/18mm în twips
    font: "Times New Roman",
    fontSize: 24, // half-points → 12pt
    table: { row: { cantSplit: true } },
    footer: false,
    pageNumber: false,
  });

  const blob =
    result instanceof Blob
      ? result
      : new Blob([result as BlobPart], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
  downloadBlob(blob, `${name}.docx`);
}
