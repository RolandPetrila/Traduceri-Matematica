/**
 * G3 — Notificare de browser la finalizarea unui import lung (OCR multi-pagină
 * poate dura minute; utilizatorul comută pe alt tab). Totul e best-effort și
 * guard-at: pe medii fără `Notification` (SSR/jsdom/iOS Safari fără PWA) devine
 * no-op. Pe iPhone cere PWA instalat (iOS 16.4+) — limită onestă documentată.
 */

function supported(): boolean {
  return typeof window !== "undefined" && typeof Notification !== "undefined";
}

/** Cere permisiunea de notificare (fire-and-forget). A se apela dintr-un gest al
 *  utilizatorului (click/drop) — browserul cere prompt DOAR dacă e `default`. */
export function requestNotifyPermission(): void {
  if (!supported() || Notification.permission !== "default") return;
  try {
    void Notification.requestPermission();
  } catch {
    /* unele browsere aruncă dacă nu e apelat dintr-un gest — ignorăm */
  }
}

/** Afișează o notificare DOAR dacă tabul e ascuns (utilizatorul a comutat) și
 *  permisiunea e acordată. Când tabul e vizibil, bannerul in-app e suficient. */
export function notifyIfHidden(title: string, body: string): void {
  if (!supported() || Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && !document.hidden) return;
  try {
    new Notification(title, { body, tag: "editor-import" });
  } catch {
    /* construcția poate cere ServiceWorkerRegistration pe unele platforme */
  }
}
