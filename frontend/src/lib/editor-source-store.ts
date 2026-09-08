/**
 * FAZA 2 — originalul nu se mai pierde (2026-09-08).
 *
 * RISCUL REAL, descoperit la verificarea Fazei 1 și confirmat prin măsurare:
 *   Autosalvarea (`editor-document`) scrie conținutul AFIȘAT, iar `editor_nou_lang_v1`
 *   reținea doar limba afișată. Deci: Cristina traduce o fișă RO→SK, închide, revine
 *   a doua zi → la restaurare conținutul e slovac, iar limba-sursă devine „sk".
 *   Varianta ROMÂNEASCĂ nu mai există nicăieri: cache-ul per limbă trăia doar în
 *   memorie (`cacheRef`), iar cache-ul persistent de traducere e indexat DUPĂ
 *   conținutul-sursă — pe care tocmai l-am pierdut. Pierdere de muncă, ireversibilă.
 *
 * SOLUȚIA: persistăm separat DOAR documentul-sursă + limba lui. E singurul lucru
 * irecuperabil; traducerile se pot reface (și de obicei vin instant din cache-ul
 * persistent, fără să reconsume cota DeepL).
 *
 * De ce nu salvăm toate cele 4 limbi: documentele cu figuri au imagini base64
 * înglobate. Patru copii ar înmulți cu 4 consumul de localStorage și ar declanșa
 * QuotaExceededError exact pe documentele mari — adică pe cele care contează.
 * Sursă + afișat = cel mult două copii.
 *
 * Eșecul de scriere NU e tăcut (lecția Fazei 1): se raportează o dată per sesiune,
 * cu `E-EDIT-003`, fiindcă un „am salvat" fals e mai periculos decât o eroare.
 */

import type { JSONContent } from "@tiptap/core";
import { reportFailure } from "./failure";

const SOURCE_KEY = "editor_nou_source_v1";

export type SourceSnapshot = {
  /** Limba în care e scris documentul-sursă. */
  lang: string;
  /** Documentul-sursă, ca JSON TipTap. */
  doc: JSONContent;
  savedAt: number;
};

/** Raportăm o singură dată per sesiune: cauza nu se schimbă între apeluri. */
let raportat = false;

/** Salvează documentul-sursă. Fail-open: nu rupe editarea, dar nu tace. */
export function saveSourceSnapshot(lang: string, doc: JSONContent): void {
  if (typeof window === "undefined") return;
  try {
    const payload: SourceSnapshot = { lang, doc, savedAt: Date.now() };
    localStorage.setItem(SOURCE_KEY, JSON.stringify(payload));
  } catch (e) {
    if (!raportat) {
      raportat = true;
      reportFailure({
        code: "E-EDIT-003",
        flow: "editor.source.persist",
        error: e,
        context: {
          lang,
          quotaLikely: (e as Error)?.name === "QuotaExceededError",
          scop: "salvarea originalului pentru a nu-l pierde la reload",
        },
      });
    }
  }
}

/** Citește documentul-sursă salvat, dacă există și e valid. */
export function readSourceSnapshot(): SourceSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SOURCE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d && typeof d.lang === "string" && d.doc && typeof d.doc === "object") {
      return {
        lang: d.lang,
        doc: d.doc as JSONContent,
        savedAt: d.savedAt || 0,
      };
    }
  } catch {
    /* indisponibil / corupt → pornim fără el, nu blocăm editorul */
  }
  return null;
}

/**
 * Șterge originalul salvat. Se apelează DOAR când documentul curent e înlocuit
 * complet („Document nou", aducerea documentului vechi) — altfel am păstra un
 * original care nu mai are legătură cu ce e pe ecran, iar butonul RO ar învia
 * un text străin.
 */
export function clearSourceSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SOURCE_KEY);
  } catch {
    /* ignore */
  }
}
