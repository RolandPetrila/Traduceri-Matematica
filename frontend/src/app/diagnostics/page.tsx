"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LogLevel } from "@/lib/monitoring";
import { getLocalLogs } from "@/lib/monitoring";

type FilterLevel = "all" | LogLevel;
type LogSource = "server" | "local";

/** Normalized log shape covering both Supabase rows and localStorage entries. */
interface DiagLog {
  id: string;
  timestamp: string;
  level: string;
  errorCode?: string;
  message: string;
  source?: string;
  page?: string;
  device?: { type?: string; os?: string; browser?: string; screenWidth?: number; screenHeight?: number; pwa?: boolean } | null;
  context?: Record<string, unknown> | null;
  stack?: string | null;
}

// Map a Supabase row (snake_case, created_at) to the display shape.
function fromSupabaseRow(r: Record<string, unknown>): DiagLog {
  return {
    id: String(r.id ?? Math.random()),
    timestamp: String(r.created_at ?? r.timestamp ?? new Date().toISOString()),
    level: String(r.level ?? "info"),
    errorCode: (r.error_code as string) || undefined,
    message: String(r.message ?? ""),
    source: (r.source as string) || undefined,
    page: (r.page as string) || undefined,
    device: (r.device as DiagLog["device"]) || null,
    context: (r.context as Record<string, unknown>) || null,
    stack: (r.stack as string) || null,
  };
}

function fromLocal(l: Record<string, unknown>): DiagLog {
  return {
    id: String(l.id ?? Math.random()),
    timestamp: String(l.timestamp ?? new Date().toISOString()),
    level: String(l.level ?? "info"),
    errorCode: (l.errorCode as string) || undefined,
    message: String(l.message ?? ""),
    source: (l.source as string) || undefined,
    page: (l.page as string) || undefined,
    device: (l.device as DiagLog["device"]) || null,
    context: (l.context as Record<string, unknown>) || null,
    stack: (l.stack as string) || null,
  };
}

export default function DiagnosticsPage() {
  const [logs, setLogs] = useState<DiagLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterLevel>("all");
  const [codeFilter, setCodeFilter] = useState<string>("");
  const [source, setSource] = useState<LogSource>("server");
  const [note, setNote] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNote("");
    if (source === "local") {
      setLogs((getLocalLogs() as unknown as Record<string, unknown>[]).map(fromLocal));
      setLoading(false);
      return;
    }
    // Server (Supabase, cross-device) with local fallback.
    try {
      const res = await fetch("/api/logs?limit=300", { cache: "no-store" });
      const data = await res.json();
      const rows = Array.isArray(data.logs) ? data.logs : [];
      if (rows.length > 0) {
        setLogs(rows.map(fromSupabaseRow));
      } else {
        setNote(data.note || "Niciun log pe server — se afiseaza logurile locale.");
        setLogs((getLocalLogs() as unknown as Record<string, unknown>[]).map(fromLocal));
      }
    } catch {
      setNote("Server indisponibil — se afiseaza logurile locale.");
      setLogs((getLocalLogs() as unknown as Record<string, unknown>[]).map(fromLocal));
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh (server source only).
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRefresh && source === "server") {
      timerRef.current = setInterval(load, 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, source, load]);

  const byLevel = filter === "all" ? logs : logs.filter((l) => l.level === filter);
  const filteredLogs = codeFilter
    ? byLevel.filter((l) => (l.errorCode || "").toLowerCase().includes(codeFilter.toLowerCase()))
    : byLevel;

  const counts = {
    all: logs.length,
    error: logs.filter((l) => l.level === "error").length,
    warn: logs.filter((l) => l.level === "warn").length,
    info: logs.filter((l) => l.level === "info").length,
    action: logs.filter((l) => l.level === "action").length,
  };

  // Distinct error codes present (for quick filtering).
  const codes = Array.from(new Set(logs.map((l) => l.errorCode).filter(Boolean))) as string[];

  const levelColor = (level: string) => {
    if (level === "error") return "text-red-400";
    if (level === "warn") return "text-yellow-400";
    if (level === "action") return "text-blue-400";
    return "text-green-400";
  };

  const levelBg = (level: string) => {
    if (level === "error") return "bg-red-900/20 border-red-700/30";
    if (level === "warn") return "bg-yellow-900/20 border-yellow-700/30";
    if (level === "action") return "bg-blue-900/20 border-blue-700/30";
    return "bg-green-900/20 border-green-700/30";
  };

  const handleClearLogs = () => {
    if (confirm("Stergi toate logurile LOCALE de pe acest dispozitiv? (Supabase nu e afectat)")) {
      localStorage.removeItem("sistem_traduceri_logs");
      if (source === "local") setLogs([]);
    }
  };

  const copyLogs = () => {
    const text = filteredLogs
      .map((l) => {
        const ts = new Date(l.timestamp).toLocaleTimeString("ro-RO", { hour12: false });
        const level = l.level.toUpperCase().padEnd(6);
        const code = l.errorCode ? `[${l.errorCode}] ` : "";
        const d = l.device;
        const device = d ? `${d.type}/${d.os}/${d.browser}` : "unknown";
        let line = `[${ts}] ${level} | ${code}${l.message} | ${device} | ${l.page || "/"}`;
        if (l.context && Object.keys(l.context).length > 0) {
          line += `\n                   | Context: ${JSON.stringify(l.context)}`;
        }
        if (l.stack) line += `\n                   | Stack: ${String(l.stack).split("\n")[0]}`;
        return line;
      })
      .join("\n");
    const header = `=== LOGURI EXPORT | ${new Date().toLocaleString("ro-RO")} | sursa: ${source} | ${filteredLogs.length} intrari ===\n\n`;
    navigator.clipboard.writeText(header + text).then(
      () => alert(`${filteredLogs.length} loguri copiate in clipboard!`),
      () => alert("Eroare la copiere. Incearca din nou.")
    );
  };

  return (
    <div className="min-h-screen chalkboard-bg p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-chalk-yellow">Diagnosticare Sistem</h1>
          <a href="/" className="chalk-btn text-sm">Inapoi la aplicatie</a>
        </div>
        <p className="text-chalk-white/60 mb-4 text-sm">
          Loguri live cu coduri de eroare — {source === "server" ? "toate dispozitivele (Supabase)" : "acest dispozitiv (local)"}
        </p>

        {/* Source + auto-refresh controls */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <div className="inline-flex rounded-lg overflow-hidden border border-chalk-white/20">
            <button
              onClick={() => setSource("server")}
              className={`px-3 py-2 text-sm ${source === "server" ? "chalk-btn--active" : "chalk-btn"}`}
            >
              Toate dispozitivele
            </button>
            <button
              onClick={() => setSource("local")}
              className={`px-3 py-2 text-sm ${source === "local" ? "chalk-btn--active" : "chalk-btn"}`}
            >
              Acest dispozitiv
            </button>
          </div>
          <button onClick={load} className="chalk-btn text-sm">Reincarca</button>
          <label className="flex items-center gap-2 text-sm text-chalk-white/70">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              disabled={source !== "server"}
            />
            Auto-refresh (5s)
          </label>
        </div>

        {note && <p className="text-chalk-yellow/80 text-xs mb-3">{note}</p>}

        {loading ? (
          <p className="text-chalk-white">Se incarca...</p>
        ) : (
          <>
            {/* Level filter cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              {(["all", "action", "info", "warn", "error"] as FilterLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`chalk-card text-center py-2 cursor-pointer transition-all ${filter === level ? "!border-chalk-yellow" : ""}`}
                >
                  <p className={`text-xl font-bold ${level === "all" ? "text-chalk-white" : levelColor(level)}`}>
                    {counts[level]}
                  </p>
                  <p className="text-chalk-white/60 text-xs capitalize">
                    {level === "all" ? "Total" : level === "action" ? "Actiuni" : level === "info" ? "Info" : level === "warn" ? "Avertismente" : "Erori"}
                  </p>
                </button>
              ))}
            </div>

            {/* Error-code filter chips */}
            {codes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <span className="text-chalk-white/50 text-xs">Cod eroare:</span>
                <button
                  onClick={() => setCodeFilter("")}
                  className={`text-xs px-2 py-1 rounded ${codeFilter === "" ? "chalk-btn--active" : "chalk-btn"}`}
                >
                  Toate
                </button>
                {codes.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCodeFilter(c)}
                    className={`text-xs px-2 py-1 rounded font-mono ${codeFilter === c ? "chalk-btn--active" : "chalk-btn"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {filteredLogs.length > 0 && (
                <button onClick={copyLogs} className="chalk-btn text-sm !text-chalk-yellow">Copiaza loguri</button>
              )}
              <button onClick={handleClearLogs} className="chalk-btn text-sm !text-chalk-red">Sterge loguri locale</button>
            </div>

            {/* Logs list */}
            {filteredLogs.length === 0 ? (
              <div className="chalk-card text-center py-8">
                <p className="text-chalk-white text-lg">Niciun log {filter !== "all" ? `de tip "${filter}"` : ""}</p>
                <p className="text-chalk-white/60 mt-2 text-sm">
                  Sistemul de monitorizare este activ. Logurile vor aparea aici automat.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div key={log.id} className={`rounded-lg border p-3 ${levelBg(log.level)}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="flex items-center gap-2">
                        <span className={`font-bold uppercase text-xs ${levelColor(log.level)}`}>{log.level}</span>
                        {log.errorCode && (
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-red-500/30 text-red-200 border border-red-400/40">
                            {log.errorCode}
                          </span>
                        )}
                      </span>
                      <span className="text-chalk-white/40 text-xs">
                        {new Date(log.timestamp).toLocaleString("ro-RO")}
                      </span>
                    </div>
                    <p className="text-chalk-white text-sm mb-1">{log.message}</p>
                    {log.context && Object.keys(log.context).length > 0 && (
                      <div className="text-xs text-chalk-white/50 mb-1">
                        {Object.entries(log.context).map(([k, v]) => (
                          <span key={k} className="mr-3">
                            {k}: <strong>{typeof v === "object" ? JSON.stringify(v) : String(v)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-chalk-white/40">
                      {log.device && (
                        <>
                          <span>{log.device.type} / {log.device.os} / {log.device.browser}</span>
                          {log.device.screenWidth ? (
                            <>
                              <span>|</span>
                              <span>{log.device.screenWidth}x{log.device.screenHeight}</span>
                            </>
                          ) : null}
                          {log.device.pwa && (
                            <>
                              <span>|</span>
                              <span className="text-chalk-yellow">PWA</span>
                            </>
                          )}
                        </>
                      )}
                      {log.source && <span className="text-chalk-white/30">· {log.source}</span>}
                    </div>
                    {log.stack && (
                      <details className="mt-1">
                        <summary className="text-chalk-white/40 text-xs cursor-pointer">Stack trace</summary>
                        <pre className="text-xs text-chalk-white/30 mt-1 overflow-x-auto whitespace-pre-wrap">{log.stack}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
