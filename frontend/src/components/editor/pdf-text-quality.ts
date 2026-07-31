/**
 * R7.2 — Calitatea stratului-text al unui PDF: decide dacă folosim textul
 * încorporat (rapid, offline, fidel) SAU forțăm re-OCR pe pixeli.
 *
 * De ce e nevoie (dovadă măsurată pe fișiere REALE, 2026-07-31):
 * euristica veche (`compact >= numPages*10`) privea DOAR cantitatea de text.
 * PDF-ul `1.1_Analyse Filtrasan` are 1499 caractere/pagină (trece lejer pragul),
 * DAR stratul-text e OCR-uit prost: „lnstitut" (I→l), „Nuss CmbH" (G→C),
 * „o971/78s6-0", plus clustere de garbaj din logo-uri/sigilii scanate
 * („?i^.i!' rl\"*,*-,."). App-ul dumpa acest garbaj ca text-brut în loc să
 * re-OCR-eze → scor 3/10. Deci avem nevoie de un semnal de CALITATE, nu de volum.
 *
 * Semnalul ales — `cleanWordRatio` (fracția de tokenuri care sunt cuvinte curate,
 * pur-alfabetice ≥2 litere) — măsurat pe cele 3 fișiere reale:
 *   Filtrasan (rău) 0.49 · CettaClear (rău) 0.49 · Unghiuri (bun) 0.61.
 * Prag 0.55 = la mijloc, cu ~0.06 margine de fiecare parte. Măsurat pe stratul-text
 * extras (pymupdf, proxy pentru pdf.js — garbaj-ul e o proprietate a stratului, nu a
 * cititorului); calibrarea fină se validează LIVE cu pdf.js. Butonul „Forțează OCR"
 * acoperă cazurile pe care euristica le-ar rata (un fals-pozitiv costă doar timp:
 * Azure reconstruiește bine oricum).
 */

/** Litere „de cuvânt" — RO + DE (celelalte alfabete latine sunt rare aici). */
const LETTERS = "A-Za-zĂÂÎȘȚăâîșțäöüßÄÖÜéèêçñ";
const CLEAN_WORD = new RegExp(`^[${LETTERS}]{2,}$`);

/** Sub acest raport de cuvinte curate → stratul-text e considerat OCR-prost. */
export const MIN_CLEAN_WORD_RATIO = 0.55;
/** Sub atâtea caractere (fără spații) pe pagină → PDF (aproape) scanat, fără text. */
const MIN_COMPACT_PER_PAGE = 40;
/** Sub atâtea tokenuri pe pagină → prea puțin text ca să judeci calitatea. */
const MIN_TOKENS_PER_PAGE = 20;

export interface PdfTextAssessment {
  /** true → stratul-text e fiabil (folosește-l ca text brut); false → forțează OCR. */
  reliable: boolean;
  /** Motiv onest (pentru log/telemetrie/banner). */
  reason: string;
  metrics: {
    compactPerPage: number;
    tokens: number;
    cleanWordRatio: number;
  };
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Evaluează stratul-text extras dintr-un PDF (pdf.js `getTextContent`, concatenat).
 * PUR (fără DOM/fetch) → unit-testabil pe fixture-uri de text REAL.
 */
export function assessPdfText(
  text: string,
  numPages: number,
): PdfTextAssessment {
  const n = Math.max(1, numPages);
  const compact = text.replace(/\s/g, "").length;
  const compactPerPage = compact / n;
  const tokens = text.split(/\s+/).filter(Boolean);
  const cleanCount = tokens.reduce(
    (acc, t) => acc + (CLEAN_WORD.test(t) ? 1 : 0),
    0,
  );
  const cleanWordRatio = tokens.length ? cleanCount / tokens.length : 0;
  const metrics = {
    compactPerPage: Math.round(compactPerPage),
    tokens: tokens.length,
    cleanWordRatio: round3(cleanWordRatio),
  };

  // (1) Strat-text (aproape) gol → PDF scanat → OCR.
  if (compactPerPage < MIN_COMPACT_PER_PAGE) {
    return {
      reliable: false,
      reason: `strat-text gol/subțire (${metrics.compactPerPage} caractere/pagină)`,
      metrics,
    };
  }
  // (2) Prea puține tokenuri ca să judeci calitatea → OCR (prudent).
  if (tokens.length < n * MIN_TOKENS_PER_PAGE) {
    return {
      reliable: false,
      reason: `prea puțin text pentru a evalua calitatea (${tokens.length} tokenuri)`,
      metrics,
    };
  }
  // (3) Strat-text de calitate slabă (multe „cuvinte" garbaj) → OCR.
  if (cleanWordRatio < MIN_CLEAN_WORD_RATIO) {
    return {
      reliable: false,
      reason: `strat-text de calitate slabă (${Math.round(cleanWordRatio * 100)}% cuvinte curate)`,
      metrics,
    };
  }
  return { reliable: true, reason: "strat-text fiabil", metrics };
}
