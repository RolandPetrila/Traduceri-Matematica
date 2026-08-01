import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const isDev = process.env.NODE_ENV === "development";

// Supabase (server-side only — service-role key never reaches the browser).
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_KEY);

function supabaseHeaders(): Record<string, string> {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

// S5 — protecție anti-abuz pt endpoint-ul PUBLIC de log (scrie în Supabase cu
// service-role key). Fără plafon → flood necontrolat al tabelei `logs`.
// Model: `pages/api/proxy.js:69-91` (best-effort in-memory, per instanță serverless).
const MAX_BODY_BYTES = 32 * 1024; // un rând de log legit e < ~4KB
const RL_WINDOW_MS = 60 * 1000;
const RL_MAX = 120; // 120 log-uri / minut / IP (2/s sustinut — larg pt telemetrie legit)
const RL_MAX_IPS = 10000; // plafon de siguranță per instanță warm
const rlBuckets = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (rlBuckets.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  arr.push(now);
  rlBuckets.set(ip, arr);
  if (rlBuckets.size > RL_MAX_IPS) {
    rlBuckets.forEach((ts, k) => {
      if (!ts.length || now - ts[ts.length - 1] >= RL_WINDOW_MS)
        rlBuckets.delete(k);
    });
  }
  return arr.length > RL_MAX;
}
function clientIp(request: NextRequest): string {
  // `x-real-ip` (setat de Vercel la IP-ul real) înainte de ultimul element din
  // `x-forwarded-for` (primul e controlabil de client → spoof = bucket nou).
  const real = (request.headers.get("x-real-ip") || "").trim();
  if (real) return real;
  const fwd = (request.headers.get("x-forwarded-for") || "").split(",");
  return (fwd.pop() || "").trim() || "unknown";
}
// Plafonează valorile JSON înainte de insert (device/context/stack necapate azi).
function capJson(v: unknown, max: number): unknown {
  if (v == null) return null;
  try {
    const s = JSON.stringify(v);
    if (s.length <= max) return v;
    return { _truncated: true, preview: s.slice(0, max) };
  } catch {
    return null;
  }
}

// Forward one log row to Supabase. Fail-open — never throws.
async function insertToSupabase(log: Record<string, unknown>): Promise<void> {
  if (!supabaseReady) return;
  try {
    const device = log.device as Record<string, unknown> | undefined;
    await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
      method: "POST",
      headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({
        level: log.level || "info",
        error_code: log.errorCode || null,
        message: String(log.message ?? "").slice(0, 4000),
        source: log.source ? String(log.source).slice(0, 200) : null,
        page: log.page ? String(log.page).slice(0, 500) : null,
        device: capJson(device || null, 2000),
        context: capJson(log.context || null, 8000),
        stack: log.stack ? String(log.stack).slice(0, 4000) : null,
      }),
    });
  } catch (e) {
    console.error("[SUPABASE] insert log failed (fail-open):", e);
  }
}

function getLogFile(): string | null {
  if (!isDev) return null;
  const candidates = [
    path.join(process.cwd(), "..", "data", "logs", "local_debug.log"),
    path.join(process.cwd(), "data", "logs", "local_debug.log"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.dirname(candidate))) return candidate;
  }
  return null;
}

function writeToFile(entry: string): void {
  const logFile = getLogFile();
  if (!logFile) return;
  try {
    fs.appendFileSync(logFile, entry + "\n", "utf-8");
  } catch {
    // Ignore write errors (e.g. read-only fs on some platforms)
  }
}

function formatLogEntry(log: Record<string, unknown>): string {
  const d = log.device as Record<string, unknown> | undefined;
  const ts = new Date(
    (log.timestamp as string) || Date.now(),
  ).toLocaleTimeString("ro-RO", { hour12: false });
  const level = String(log.level || "info")
    .toUpperCase()
    .padEnd(6);
  const code = log.errorCode ? `[${log.errorCode}] ` : "";
  const device = d ? `${d.type}/${d.os}/${d.browser}` : "unknown";
  let entry = `[${ts}] ${level} | ${code}${log.message} | Device: ${device} | Page: ${log.page || "/"}`;
  const ctx = log.context as Record<string, unknown> | undefined;
  if (ctx && Object.keys(ctx).length > 0) {
    entry += `\n                   | Context: ${JSON.stringify(ctx)}`;
  }
  if (log.stack) {
    entry += `\n                   | Stack: ${String(log.stack).split("\n")[0]}`;
  }
  return entry;
}

export async function POST(request: NextRequest) {
  try {
    // S5 — plafon dimensiune body (înainte de parse) + rate-limit per IP.
    const len = Number(request.headers.get("content-length") || 0);
    if (len > MAX_BODY_BYTES) {
      return NextResponse.json({ status: "too_large" }, { status: 413 });
    }
    if (rateLimited(clientIp(request))) {
      return NextResponse.json({ status: "rate_limited" }, { status: 429 });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ status: "too_large" }, { status: 413 });
    }
    const log = JSON.parse(raw);

    // Server log stream (viewable in the platform dashboard logs)
    const code = log.errorCode ? `${log.errorCode} ` : "";
    console.log(
      `[CLIENT_LOG] ${log.level?.toUpperCase() || "INFO"} | ${code}${log.device?.type || "unknown"} | ${log.device?.os || "unknown"} | ${log.message}`,
    );
    if (log.context) {
      console.log(`[CLIENT_LOG_CTX]`, JSON.stringify(log.context));
    }

    // Cross-device store (Supabase). Fail-open.
    await insertToSupabase(log);

    // Local file logging (dev mode only)
    if (isDev) {
      if (log.message === "App loaded") {
        const sep = "=".repeat(56);
        const now = new Date().toLocaleString("ro-RO", { hour12: false });
        const d = log.device || {};
        writeToFile(
          `\n${sep}\nSESSION START | ${now}\nDevice: ${d.type || "?"} | ${d.os || "?"} | ${d.browser || "?"} | ${d.screenWidth || "?"}x${d.screenHeight || "?"}\n${sep}`,
        );
      }
      writeToFile(formatLogEntry(log));
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Failed to process log:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

// Cross-device diagnostics: read recent logs from Supabase.
// Query params: level, error_code, limit.
export async function GET(request: NextRequest) {
  if (!supabaseReady) {
    return NextResponse.json({
      total: 0,
      logs: [],
      note: "Supabase neconfigurat — logurile sunt doar locale (localStorage).",
    });
  }

  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const errorCode = searchParams.get("error_code");
  const limit = Math.max(
    1,
    Math.min(Number(searchParams.get("limit")) || 200, 1000),
  );

  const params = [`select=*`, `order=created_at.desc`, `limit=${limit}`];
  if (level && level !== "all")
    params.push(`level=eq.${encodeURIComponent(level)}`);
  if (errorCode) params.push(`error_code=eq.${encodeURIComponent(errorCode)}`);

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/logs?${params.join("&")}`,
      {
        headers: supabaseHeaders(),
        cache: "no-store",
      },
    );
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const logs = await res.json();
    return NextResponse.json({
      total: Array.isArray(logs) ? logs.length : 0,
      logs,
    });
  } catch (e) {
    console.error("[SUPABASE] read logs failed:", e);
    return NextResponse.json(
      { total: 0, logs: [], note: "Eroare la citirea logurilor din Supabase." },
      { status: 200 },
    );
  }
}
