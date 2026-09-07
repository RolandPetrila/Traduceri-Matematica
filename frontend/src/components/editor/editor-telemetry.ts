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

/**
 * FAZA 1 — „forma" unui document TipTap, pentru rândurile de eroare.
 *
 * Când un flux de editor pică, prima întrebare de diagnostic e „ce avea documentul
 * în el?" (tabel? întrerupere de pagină? figură? formulă?). Fără asta, un eșec pe
 * un document cu tabel arată identic cu unul pe un paragraf simplu — exact
 * ambiguitatea care a ținut bug-ul de traducere nediagnosticat din 20.08.2026.
 *
 * Numără tipurile de noduri pe TOATĂ adâncimea, nu doar la nivelul de sus.
 */
export function docShape(doc: unknown): Record<string, unknown> {
  const counts: Record<string, number> = {};
  let depth = 0;
  let nodes = 0;
  const walk = (n: unknown, d: number): void => {
    if (!n || typeof n !== "object") return;
    const node = n as { type?: unknown; content?: unknown };
    if (typeof node.type === "string") {
      counts[node.type] = (counts[node.type] || 0) + 1;
      nodes++;
    }
    if (d > depth) depth = d;
    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child, d + 1);
    }
  };
  try {
    walk(doc, 0);
  } catch {
    /* document malformat — raportăm ce am apucat să numărăm */
  }
  return {
    nodeTypes: counts,
    nodeCount: nodes,
    maxDepth: depth,
    hasTable: Boolean(counts.table),
    hasPageBreak: Boolean(counts.pageBreak),
    hasImage: Boolean(counts.image),
    hasMath: Boolean(counts.inlineMath || counts.blockMath),
  };
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
