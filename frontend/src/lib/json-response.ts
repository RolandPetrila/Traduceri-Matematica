/**
 * FAZA 2 — citirea sigură a răspunsurilor JSON de la API-ul Python (2026-09-08).
 *
 * PROBLEMA REALĂ, dovedită live pe producție:
 *   Runtime-ul Vercel Python scurge antete interne în CORPUL răspunsului la cold
 *   start. Statusul e 200, conținutul e bun, dar corpul arată așa:
 *
 *     x-vercel-internal-timing: ...\r\n{"translated_sections":[...]}
 *
 *   `res.json()` crapă cu „Unexpected token 'x'", traducerea eșuează, iar Cristina
 *   vede o eroare. La a doua apăsare funcția e caldă și totul merge — de aici
 *   eșecul INTERMITENT (~1 din 5), pe orice limbă, din 20.08.2026.
 *
 * Aceeași clasă a fost reparată la R9 pentru descărcările BINARE din Convertor
 * (`stripVercelFraming`), dar atunci s-a curățat doar calea binară. Calea JSON —
 * adică traducerea, OCR-ul, testele — a rămas necurățată. Asta repară aici.
 *
 * De ce nu „prindem eroarea și reîncercăm": conținutul e DEJA în mână, corect.
 * A mai cere o dată aceeași traducere ar consuma încă o dată cota DeepL pentru un
 * răspuns pe care îl avem. Îl curățăm și mergem mai departe.
 *
 * Recuperarea NU e tăcută: se scrie `E-NET-003` la nivel `warn`, ca să știm cât de
 * des se întâmplă. `warn`, nu `error`, fiindcă utilizatorul n-a pățit nimic.
 */

import { reportFailure } from "./failure";

/** Cât păstrăm din corpul deteriorat pentru diagnostic (1c). */
const JUNK_SAMPLE = 160;

/**
 * Citește corpul unui răspuns ca JSON, tolerând framing scurs înaintea JSON-ului.
 *
 * @param res  răspunsul (statusul se verifică de apelant, ca până acum)
 * @param flow locul, pt log: ex. "editor.translate"
 * @throws SyntaxError cu CAUZA REALĂ (inclusiv un fragment din corp) dacă nici
 *         după curățare corpul nu e JSON valid — deci `classify()` îl încadrează
 *         corect la `badResponse`, nu la „bug de aplicație".
 */
export async function readJson<T>(res: Response, flow: string): Promise<T> {
  const text = await res.text();

  try {
    return JSON.parse(text) as T;
  } catch (first) {
    // Gunoi ÎNAINTEA JSON-ului: tăiem până la primul `{` sau `[` și reluăm.
    const start = text.search(/[[{]/);
    if (start > 0) {
      try {
        const parsed = JSON.parse(text.slice(start)) as T;
        reportFailure({
          code: "E-NET-003",
          flow,
          error: first,
          severity: "warn",
          context: {
            recuperat: true,
            octetiTaiati: start,
            status: res.status,
            corpLen: text.length,
          },
          sample: text.slice(0, JUNK_SAMPLE),
        });
        return parsed;
      } catch {
        /* nici după curățare — cade mai jos, cu cauza reală */
      }
    }

    // Corp nerecuperabil. Mesajul poartă un fragment REAL din ce a venit, ca
    // rândul de log să spună ce s-a primit, nu doar că „a eșuat".
    const bucata = text.slice(0, JUNK_SAMPLE).replace(/\s+/g, " ").trim();
    throw new SyntaxError(
      `Raspuns JSON deteriorat (status ${res.status}, ${text.length} octeti): ${bucata || "corp gol"}`,
    );
  }
}
