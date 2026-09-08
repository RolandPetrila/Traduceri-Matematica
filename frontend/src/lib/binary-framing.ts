/**
 * Curățarea framing-ului Vercel din răspunsurile BINARE.
 *
 * R9 (audit 2026-09-07): runtime-ul Vercel Python prepend-ează framing în CORPUL
 * răspunsului — `\r\n` la cald, blocul „x-vercel-internal-timing:…\r\n\r\n" la
 * rece. Fișierele descărcate (png/jpg/pdf/docx/zip) ies corupte fiindcă semnătura
 * nu mai e la byte 0.
 *
 * Extras din `convertor/page.tsx` pe 2026-09 (auditorul de dovezi): Istoricul
 * descărca DOCX-ul prin `res.blob()` **fără** curățare, deși Convertorul o făcea —
 * aceeași clasă de bug, un singur modul acoperit. Un helper folosit de amândouă
 * nu mai poate rămâne aplicat pe jumătate.
 *
 * Junk-ul dinainte e întotdeauna TEXT (`\r\n`, antete), deci nu conține octeții
 * non-ASCII ai semnăturilor. Fail-open: dacă nu găsim semnătura, lăsăm blob-ul
 * neatins — mai bine un fișier nemodificat decât unul tăiat greșit.
 */

const BIN_SIGNATURES: number[][] = [
  [0x89, 0x50, 0x4e, 0x47], // PNG
  [0xff, 0xd8, 0xff], // JPG
  [0x25, 0x50, 0x44, 0x46], // PDF (%PDF)
  [0x50, 0x4b, 0x03, 0x04], // ZIP / DOCX (PK..)
];

/** Extensii text: framing-ul de dinainte e spațiu inofensiv, nu-l atingem. */
const TEXT_EXT = ["html", "md", "txt", "csv", "json"];

export async function stripVercelFraming(
  blob: Blob,
  ext: string,
): Promise<Blob> {
  if (TEXT_EXT.includes(ext)) return blob;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const limit = Math.min(bytes.length, 1024);
  for (let i = 0; i < limit; i++) {
    for (const sig of BIN_SIGNATURES) {
      let hit = true;
      for (let j = 0; j < sig.length; j++) {
        if (bytes[i + j] !== sig[j]) {
          hit = false;
          break;
        }
      }
      if (hit) {
        return i === 0 ? blob : new Blob([bytes.slice(i)], { type: blob.type });
      }
    }
  }
  return blob;
}
