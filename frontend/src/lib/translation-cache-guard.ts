/**
 * FAZA 2 — cache-ul pe limbă nu are voie să servească o traducere ÎNVECHITĂ.
 *
 * DEFECT REAL, găsit live pe producție de auditorul de dovezi (08.09.2026) și
 * reprodus apoi în proba principală:
 *   Cristina traduce în SK → revine pe RO ca să repare o formulă → apasă din nou
 *   SK. Cache-ul în-sesiune (`cacheRef`) încă are versiunea SK de dinaintea
 *   reparației și o servește INSTANT, fără nicio cerere, fără niciun mesaj.
 *   Rezultat: documentul tradus fără corectură, iar ea nu are cum să afle.
 *
 * REGULA: traducerile din cache sunt valabile DOAR pentru sursa din care au fost
 * făcute. Dacă sursa s-a schimbat, toate limbile-țintă din cache sunt aruncate.
 * (Cache-ul persistent din `translation-cache.ts` e deja indexat după conținutul
 * sursei, deci el nu are această problemă — doar cel din memorie o avea.)
 *
 * Editările făcute ÎN limba-țintă (R-EDIT) rămân valabile cât timp sursa nu se
 * schimbă: sunt corecturi ale traducerii, nu ale originalului.
 */

import type { JSONContent } from "@tiptap/core";

/**
 * Aruncă din `cache` toate limbile-țintă dacă sursa s-a schimbat față de cea din
 * care au fost construite. Întoarce cheia sursei curente, de reținut pentru
 * următoarea verificare.
 *
 * @param cache        cache-ul pe limbă (mutat pe loc)
 * @param sourceLang   limba-sursă
 * @param sourceKey    cheia (conținutul serializat) sursei CURENTE
 * @param builtFromKey cheia sursei din care au fost făcute traducerile din cache
 *                     (`null` = cache-ul nu conține încă nicio traducere)
 * @returns numărul de traduceri aruncate
 */
export function pruneStaleTranslations<L extends string>(
  cache: Map<L, JSONContent>,
  sourceLang: L,
  sourceKey: string,
  builtFromKey: string | null,
): number {
  if (builtFromKey === null || builtFromKey === sourceKey) return 0;
  let dropped = 0;
  for (const lang of Array.from(cache.keys())) {
    if (lang !== sourceLang) {
      cache.delete(lang);
      dropped++;
    }
  }
  return dropped;
}
