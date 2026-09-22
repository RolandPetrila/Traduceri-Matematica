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

export function redactLogContext(context: unknown): unknown {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return context;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(context as Record<string, unknown>)) {
    if (NAME_KEYS.has(k)) continue;
    if (k === "name" && !(typeof v === "string" && ERROR_CLASS_NAME.test(v))) {
      continue;
    }
    out[k] = v;
  }
  return out;
}
