import { logAction } from "@/lib/monitoring";

/**
 * Telemetrie editor (F6+) — un eveniment SEMANTIC → `logAction` (level "action")
 * → `/api/logs` → Supabase `logs`. Prefix `editor:` în mesaj ca să filtrăm ușor
 * (`message like 'editor:%'`).
 *
 * Decizie Roland (2026-07-25): MEREU PORNIT (nu mod-verificare). Evenimente
 * SEMANTICE (export/dictare/find/…), NU „fiecare click" — clickul brut = zgomot
 * + consumă cotă + nu ajută la verificare.
 *
 * Scop: o sesiune viitoare citește aceste evenimente și confirmă automat partea
 * MECANICĂ a verificărilor (vezi docs/GHID_VERIFICARE_EDITOR_F6.md). Partea
 * perceptuală (cum arată/sună) rămâne la ochiul utilizatorului.
 *
 * Fail-safe: telemetria nu trebuie NICIODATĂ să arunce în fluxul editorului.
 */
export function trackEditor(
  event: string,
  context?: Record<string, unknown>,
): void {
  try {
    logAction(`editor:${event}`, context);
  } catch {
    /* nu propagăm nimic — un log ratat nu strică editarea */
  }
}

/** Steaguri de conținut dintr-un HTML (pentru evenimentele de export). */
export function contentFlags(html: string): Record<string, unknown> {
  return {
    htmlLen: html.length,
    pageBreaks: (html.match(/class="page-break"/g) || []).length,
    hasSup: /<sup[>\s]/.test(html),
    hasSub: /<sub[>\s]/.test(html),
    hasTable: /<table[>\s]/.test(html),
    hasBold: /<strong[>\s]|<b[>\s]/.test(html),
    hasZebra: /data-zebra="true"/.test(html),
  };
}
