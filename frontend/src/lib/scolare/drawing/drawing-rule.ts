/**
 * Regulă de prompt pentru desenul determinist (grădiniță + primar cl.0-1, TOATE
 * materiile/domeniile — nu doar Educație Plastică). Înlocuiește `IMAGE_AUTONOMY_RULE`
 * (nu se adaugă peste ea — un model care primește simultan „nu te referi NICIODATĂ la
 * un vizual” și „emite un marcaj pentru un vizual” se contrazice). Enumurile sunt
 * derivate din catalogul real (`catalog.ts`), nu duplicate manual — anti-drift.
 * Vezi docs/PLAN_SCOLARE_DESEN_2026-08-09.md.
 */
import type { CurriculumCycle, CurriculumLevel } from "../types";
import { OBIECTE, PALETA, FORME_UNESTE } from "./catalog";

/** Grădiniță (toate grupele) + Primar Clasa 0/1 (nu tot Primar) — scope confirmat Roland. */
export function isDrawingEligible(
  cycle: CurriculumCycle,
  level: CurriculumLevel,
): boolean {
  if (cycle.id === "gradinita") return true;
  if (
    cycle.id === "primar" &&
    (level.id === "clasa-0" || level.id === "clasa-1")
  ) {
    return true;
  }
  return false;
}

const OBIECT_LIST = Object.keys(OBIECTE).join(", ");
const CULOARE_LIST = Object.keys(PALETA).join(", ");
const FORMA_LIST = Object.keys(FORME_UNESTE).join(", ");

export const DRAWING_RULE = [
  "REGULĂ ABSOLUTĂ — desenele se cer printr-un marcaj EXACT, NU prin descriere text (are PRIORITATE peste orice exemplu, formulare sau cerință de mai sus, inclusiv peste regulament):",
  "Aplicația desenează AUTOMAT doar dacă pui, pe rândul lui, imediat după enunțul exercițiului, EXACT un marcaj de forma [[DESEN tip=... cheie=valoare ...]]. NU descrie tu vizualul în text („iată un fluture”, „mai jos vezi un măr”) — ori pui marcajul, ori exercițiul rămâne text simplu (fără vizual).",
  "Marcaje permise, EXACT aceste chei și EXACT aceste valori (nimic altceva):",
  `[[DESEN tip=coloreaza obiect=OBIECT culoare=CULOARE model=da]] — obiectul de colorat, cu model mic alături.`,
  `[[DESEN tip=traseu start=OBIECT final=OBIECT]] — traseu punctat de trasat de la un reper la altul (start/final pot lipsi).`,
  `[[DESEN tip=uneste forma=FORMA]] — unește punctele numerotate care formează FORMA.`,
  `[[DESEN tip=simetrie obiect=fluture]] — desenează jumătatea simetrică lipsă (doar „fluture”).`,
  `[[DESEN tip=baloane culori=CULOARE,CULOARE,...]] — baloane de colorat, câte unul per culoare din listă.`,
  `OBIECT trebuie să fie exact una dintre: ${OBIECT_LIST}.`,
  `CULOARE trebuie să fie exact una dintre: ${CULOARE_LIST}.`,
  `FORMA trebuie să fie exact una dintre: ${FORMA_LIST}.`,
  "Nu inventa alte chei sau valori: un marcaj cu o valoare din afara listelor de mai sus NU va fi desenat (aplicația nu știe ce e), deci exercițiul rămâne incomplet — folosește DOAR valorile permise.",
  "Folosește desenul doar când exercițiul chiar are nevoie de un vizual (colorat, trasat, unit puncte, completat simetrie) — restul exercițiilor rămân text simplu, ca până acum.",
].join(" ");
