"use client";

/**
 * G1 — Indicator DISCRET al cotei DeepL (500K caractere/lună). Reintrodus după ce
 * componenta veche a fost ștearsă odată cu tabul Traduceri (commit 2891d00) →
 * Cristina nu mai vedea cât a consumat. Stă lângă switch-ul de limbi (F8), fetch
 * `/api/deepl-usage` (GET simplu, fără preflight). Cache la nivel de modul ca cele
 * DOUĂ instanțe LanguageSwitch (toolbar desktop + rând mobil) să facă UN fetch.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api-url";

interface Usage {
  character_count: number;
  character_limit: number;
  remaining: number;
  percent: number;
  pages_remaining: number;
  level?: "ok" | "warning" | "critical";
  status?: string;
}

const TTL_MS = 60_000;
let cache: { at: number; data: Usage } | null = null;
let inflight: Promise<Usage> | null = null;

async function fetchUsage(force = false): Promise<Usage> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.data;
  if (!force && inflight) return inflight;
  inflight = fetch(`${API_URL}/api/deepl-usage`)
    .then((r) => r.json() as Promise<Usage>)
    .then((d) => {
      cache = { at: Date.now(), data: d };
      inflight = null;
      return d;
    })
    .catch((e) => {
      inflight = null;
      throw e;
    });
  return inflight;
}

/** `refreshSignal` = starea „traduc acum"; pe frontul true→false reîmprospătăm
 *  (o traducere tocmai a consumat din cotă). */
export function DeepLQuotaBadge({
  refreshSignal,
}: {
  refreshSignal?: boolean;
}) {
  const [usage, setUsage] = useState<Usage | null>(null);
  const prevSignal = useRef(refreshSignal);

  const load = useCallback((force = false) => {
    fetchUsage(force)
      .then(setUsage)
      .catch(() => {
        /* fail-open: indicator discret, nu blocăm editorul */
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (prevSignal.current && !refreshSignal) load(true); // traducere terminată
    prevSignal.current = refreshSignal;
  }, [refreshSignal, load]);

  if (!usage || usage.status === "error" || !usage.character_limit) return null;

  const color =
    usage.level === "critical"
      ? "text-destructive font-semibold"
      : usage.level === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "opacity-60";

  const k = (n: number) => `${Math.round(n / 1000)}K`;

  return (
    <button
      type="button"
      onClick={() => load(true)}
      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] tabular-nums hover:bg-muted ${color}`}
      title={`DeepL: ${usage.character_count.toLocaleString("ro-RO")}/${usage.character_limit.toLocaleString(
        "ro-RO",
      )} caractere · ~${usage.pages_remaining} pagini rămase (click = reîmprospătează)`}
      aria-label={`Cotă DeepL ${usage.percent}% folosită`}
    >
      DeepL {usage.percent}%
      <span className="ml-1 opacity-70">
        ({k(usage.character_count)}/{k(usage.character_limit)})
      </span>
    </button>
  );
}
