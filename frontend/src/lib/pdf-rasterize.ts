// Client-side PDF rasterization.
//
// Why: on Vercel serverless (60s function limit), OCR must run one page per
// invocation. We rasterize the PDF in the browser into one PNG Blob per page,
// then POST each page image separately to /api/ocr. This keeps every request
// small (well under the 4MB body cap) and lets us show real per-page progress
// instead of a faked timer.
//
// pdf.js worker is bundled as a same-origin asset (see CSP `worker-src 'self' blob:`).

/** Rasterize a PDF File into one PNG Blob per page. scale 2.0 ≈ 144 DPI. */
export async function rasterizePdf(file: File, scale = 2.0): Promise<Blob[]> {
  const pdfjs = await import("pdfjs-dist");

  // Worker is copied to public/ at build time (scripts/copy-pdf-worker.mjs) and
  // served same-origin, satisfying the CSP worker-src 'self' (no CDN).
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const blobs: Blob[] = [];

  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context indisponibil");

      await page.render({ canvasContext: ctx, viewport }).promise;

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob a esuat"))),
          "image/png"
        )
      );
      blobs.push(blob);
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }

  return blobs;
}

/**
 * Expand a list of uploaded files into per-page image tasks.
 * PDFs are rasterized to one PNG/page; images pass through as-is.
 * DOCX (and anything non-PDF/non-image) passes through unchanged so the
 * backend can still handle it on a single call.
 */
export interface PageTask {
  blob: Blob;
  filename: string;
  /** 1-based index of this page within its source file. */
  pageInFile: number;
  sourceName: string;
}

export async function expandFilesToPages(files: File[]): Promise<PageTask[]> {
  const tasks: PageTask[] = [];
  for (const file of files) {
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      const pages = await rasterizePdf(file);
      const base = file.name.replace(/\.[^.]+$/, "");
      pages.forEach((blob, idx) =>
        tasks.push({
          blob,
          filename: `${base}_p${idx + 1}.png`,
          pageInFile: idx + 1,
          sourceName: file.name,
        })
      );
    } else {
      // Image or DOCX — send as a single unit.
      tasks.push({ blob: file, filename: file.name, pageInFile: 1, sourceName: file.name });
    }
  }
  return tasks;
}
