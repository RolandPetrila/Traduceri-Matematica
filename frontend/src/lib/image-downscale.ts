/**
 * Downscale imagine în browser (canvas) pentru OCR (F9, 2026-07-29).
 *
 * DE CE: `/api/ocr` respinge la 4MB (`ocr.py` MAX_BODY_SIZE). O poză de telefon
 * (12MP) sau un scan A4 rasterizat la scale 2.0 poate depăși — 413 fără OCR, exact
 * cazul principal al Cristinei (fotografiază pagina din manual). Downscale + JPEG
 * aduce payload-ul sigur sub cap, cu pierdere de calitate neglijabilă pt OCR.
 *
 * Portat din dispecerul `Asistent_Text_AI` (fileToCanvas + toDataURL JPEG 0.9).
 */

/** Cap sigur sub 4MB serverul (lasă loc pt overhead-ul multipart). */
export const OCR_SIZE_CAP = 3.5 * 1024 * 1024;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Imagine invalidă"));
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob a eșuat"))),
      type,
      quality,
    ),
  );
}

/** Re-encodează o imagine (Blob/File) la `maxDim` px pe latura mare, JPEG `quality`. */
export async function encodeImage(
  source: Blob,
  maxDim: number,
  quality: number,
): Promise<Blob> {
  const url = URL.createObjectURL(source);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D indisponibil");
    // Fundal alb: JPEG nu are alfa; un PNG transparent (crop) ar deveni negru.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return await canvasToBlob(canvas, "image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Garantează un Blob de imagine sub `cap` bytes: dacă e deja JPEG mic → îl lasă;
 * altfel re-encodează scăzând progresiv calitatea, apoi dimensiunea, până încape.
 */
export async function ensureImageUnderCap(
  source: Blob,
  cap = OCR_SIZE_CAP,
): Promise<Blob> {
  if (source.size <= cap && source.type === "image/jpeg") return source;

  let maxDim = 2200;
  let quality = 0.9;
  let out = await encodeImage(source, maxDim, quality);
  // Coborâm întâi calitatea (păstrează detaliul), apoi rezoluția (ultima soluție).
  while (out.size > cap && (quality > 0.45 || maxDim > 1400)) {
    if (quality > 0.5) {
      quality -= 0.15;
    } else {
      maxDim = Math.round(maxDim * 0.8);
      quality = 0.7;
    }
    out = await encodeImage(source, maxDim, quality);
  }
  return out;
}
