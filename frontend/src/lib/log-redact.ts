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

function extToken(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  const ext = i >= 0 ? fileName.slice(i + 1).toLowerCase() : "";
  return /^[a-z0-9]{1,8}$/.test(ext) ? `.${ext}` : "?";
}

/** La sursă: lista fișierelor fără nume — „.pdf (application/pdf), .jpg (image/jpeg)". */
export function fileListSample(
  files: ReadonlyArray<{ name: string; type: string }>,
): string {
  return files.map((f) => `${extToken(f.name)} (${f.type || "?"})`).join(", ");
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
      return m ? `${extToken(m[1])} (${m[2]})` : "?";
    })
    .join(", ");
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
    out[k] = v;
  }
  return out;
}
