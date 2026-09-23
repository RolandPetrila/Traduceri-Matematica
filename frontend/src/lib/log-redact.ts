/**
 * Redactare nume de documente/fișiere din `context` înainte ca un log să ajungă
 * în Supabase (audit 2026-09-23, = M4 din 2026-08-08). Numele le dă utilizatoarea
 * („Lucrare Popescu.pdf"), deci pot conține date personale — iar diagnosticul
 * nu are nevoie de ele: tipul fișierului și dimensiunea sunt suficiente.
 *
 * Rulează pe SERVER (ruta /api/logs), nu doar la sursă: acoperă și PWA-urile
 * deja instalate care încă rulează un bundle vechi și trimit nume.
 */

/** Chei care poartă MEREU un nume de document/fișier → eliminate. */
const NAME_KEYS = new Set([
  "docName",
  "filename",
  "fileName",
  "fileNames",
  "outputFile",
]);

/**
 * `name` e ambiguu: la `editor:export` e titlul documentului (de eliminat), dar
 * în contextele de eroare e clasa erorii („TypeError") — utilă, fără date
 * personale. Păstrăm doar forma de nume de clasă de eroare.
 */
const ERROR_CLASS_NAME = /^[A-Za-z]*(Error|Exception)$/;

/**
 * Fluxuri al căror `sample` e lista fișierelor („nume (tip), nume2 (tip2)") —
 * găsit de `auditor-regresie` 2026-09-23. În restul fluxurilor `sample` e un
 * fragment de răspuns/conținut util diagnosticului și rămâne neatins.
 */
const FILE_LIST_SAMPLE_FLOWS = new Set(["editor.import", "convertor.convert"]);

/**
 * Doar extensii de fișier cunoscute: altfel „Maria.Popescu" ar lăsa „.popescu"
 * (semnalat de `auditor-regresie`). Tipul MIME rămâne oricum în eșantion.
 */
const KNOWN_EXTS = new Set([
  "pdf",
  "doc",
  "docx",
  "odt",
  "rtf",
  "txt",
  "md",
  "html",
  "htm",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "heic",
  "heif",
  "bmp",
  "tif",
  "tiff",
  "svg",
  "zip",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "csv",
  "json",
]);

/** „.pdf" pentru un nume de fișier, „?" dacă extensia lipsește sau e necunoscută. */
export function fileExtToken(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  const ext = i >= 0 ? fileName.slice(i + 1).toLowerCase() : "";
  return KNOWN_EXTS.has(ext) ? `.${ext}` : "?";
}

/**
 * `message` e text liber, deci nu-l redactăm generic — doar formele cunoscute
 * care conțin un nume de fișier: mesajele VALIDATE ale Convertorului
 * (`lib/validator.ts`, până la 2026-09-23 scriau numele fișierului rezultat).
 */
export function redactLogMessage(message: unknown): unknown {
  if (typeof message !== "string") return message;
  let m = /^(VALIDATE \| Conversie \S+: )(.+?)( \| \d+ KB \| OK)$/.exec(
    message,
  );
  if (m) return `${m[1]}${fileExtToken(m[2])}${m[3]}`;
  m = /^(VALIDATE \| Conversie \S+: fisier gol \(0 bytes\) — )(.+)$/.exec(
    message,
  );
  if (m) return `${m[1]}${fileExtToken(m[2])}`;
  return message;
}

/** La sursă: lista fișierelor fără nume — „.pdf (application/pdf), .jpg (image/jpeg)". */
export function fileListSample(
  files: ReadonlyArray<{ name: string; type: string }>,
): string {
  return files
    .map((f) => `${fileExtToken(f.name)} (${f.type || "?"})`)
    .join(", ");
}

/**
 * Pe server: aceeași formă, aplicată și eșantioanelor vechi cu nume.
 * Idempotentă — „.pdf (x)" rămâne „.pdf (x)".
 */
export function redactFileListSample(sample: string): string {
  return sample
    .split(", ")
    .map((part) => {
      const m = /^(.*) \(([^()]*)\)$/.exec(part);
      return m ? `${fileExtToken(m[1])} (${m[2]})` : "?";
    })
    .join(", ");
}

/**
 * Câmpuri de log care poartă o extensie (`ext`, `outputExt`, `fileExts`). Bundle-urile
 * deployate 2026-09-23 între 02:40 și 03:22 le calculau fără filtru („Maria.Popescu" →
 * „popescu") — găsit de `auditor-regresie`. Normalizăm pe server la aceeași formă.
 */
const EXT_KEYS = new Set(["ext", "outputExt"]);

function extValueToken(v: unknown): unknown {
  if (typeof v !== "string") return v;
  if (v === "?") return v;
  const ext = v.replace(/^\./, "").toLowerCase();
  return KNOWN_EXTS.has(ext) ? `.${ext}` : "?";
}

export function redactLogContext(context: unknown): unknown {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return context;
  }
  const src = context as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(src)) {
    if (NAME_KEYS.has(k)) continue;
    if (k === "name" && !(typeof v === "string" && ERROR_CLASS_NAME.test(v))) {
      continue;
    }
    if (
      k === "sample" &&
      typeof v === "string" &&
      FILE_LIST_SAMPLE_FLOWS.has(String(src.flow))
    ) {
      out[k] = redactFileListSample(v);
      continue;
    }
    if (EXT_KEYS.has(k)) {
      out[k] = extValueToken(v);
      continue;
    }
    if (k === "fileExts" && Array.isArray(v)) {
      out[k] = v.map(extValueToken);
      continue;
    }
    out[k] = v;
  }
  return out;
}
