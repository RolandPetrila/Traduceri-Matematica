"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api-url";
import { readJson } from "@/lib/json-response";

// Vercel exposes the commit SHA as VERCEL_GIT_COMMIT_SHA; next.config.js maps it
// to NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA so it's readable client-side.
const BUILD_VERSION =
  process.env.NEXT_PUBLIC_BUILD_VERSION ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  "dev";

type Status = "current" | "updating" | "stale";

export default function VersionBadge() {
  const [status, setStatus] = useState<Status>("current");
  const [serverVersion, setServerVersion] = useState("");

  useEffect(() => {
    // Check server version every 30 seconds
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health`, { cache: "no-store" });
        if (res.ok) {
          // `report: false` — sonda asta rulează la fiecare 30 de secunde. Corpul se
          // curăță (deci insigna nu mai clipește degeaba la cold start), dar
          // recuperarea NU se scrie în jurnal: altfel un framing persistent ar
          // umple /diagnostics cu un rând la fiecare 30s, în fiecare filă.
          const data = await readJson<{
            build_version?: string;
            version?: string;
          }>(res, "layout.version", { report: false });
          // ALARMĂ FALSĂ, reparată 08.09.2026 (semnalată de auditorul de dovezi):
          // aici se compara sha-ul FRONTENDULUI cu `build_version` al
          // BACKENDULUI — două proiecte Vercel livrate independent, care diverg
          // în mod normal. Rezultatul: insignă roșie „reîncarcă", permanentă,
          // pulsând, pe care un reload NU o putea stinge. O alarmă care nu se
          // stinge o învață pe Cristina să ignore alarmele — exact opusul a ce
          // construiește Faza 1. Semnalul corect pentru „există o versiune nouă
          // de frontend" vine de la service worker (`SW_UPDATED`), mai jos.
          setServerVersion(data.build_version || data.version || "");
          // Serverul răspunde → nu suntem în timpul unei livrări. Dar dacă
          // service worker-ul a anunțat deja o versiune nouă, nu o ștergem.
          setStatus((s) => (s === "stale" ? s : "current"));
        }
      } catch {
        // Network error — probably deploying
        setStatus("updating");
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sursa ONESTĂ pentru „există o versiune nouă": service worker-ul din
  // `public/sw.js` trimite `SW_UPDATED` când un worker nou a preluat controlul —
  // adică exact atunci când reîncărcarea chiar aduce ceva nou. Asta se poate
  // rezolva printr-un reload, spre deosebire de comparația de dinainte.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
      return;
    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "SW_UPDATED") {
        setServerVersion(e.data.version || "");
        setStatus("stale");
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  const color =
    status === "current"
      ? "bg-green-500"
      : status === "updating"
        ? "bg-yellow-500"
        : "bg-red-500";
  const label =
    status === "current"
      ? BUILD_VERSION
      : status === "updating"
        ? "updating..."
        : "reincarca";

  return (
    <button
      onClick={() => {
        if (status === "stale") window.location.reload();
      }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
        status === "stale" ? "cursor-pointer animate-pulse" : "cursor-default"
      }`}
      title={
        status === "current"
          ? `Versiune: ${BUILD_VERSION}`
          : status === "updating"
            ? "Deploy in curs..."
            : `Versiune noua disponibila (${serverVersion}). Click pentru reincarca.`
      }
    >
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="opacity-60">{label}</span>
    </button>
  );
}
