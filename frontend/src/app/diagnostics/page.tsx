"use client";

import { useEffect, useState } from "react";
import type { ErrorLog, LogLevel } from "@/lib/monitoring";
import { getLocalLogs } from "@/lib/monitoring";

type FilterLevel = "all" | LogLevel;

export default function DiagnosticsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterLevel>("all");

  useEffect(() => {
    const allLogs = getLocalLogs();
    setLogs(allLogs);
    setLoading(false);
  }, []);

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.level === filter);

  const counts = {
    all: logs.length,
    error: logs.filter((l) => l.level === "error").length,
    warn: logs.filter((l) => l.level === "warn").length,
    info: logs.filter((l) => l.level === "info").length,
    action: logs.filter((l) => l.level === "action").length,
  };

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
    if (confirm("Stergi toate logurile de pe acest dispozitiv?")) {
      localStorage.removeItem("sistem_traduceri_logs");
      setLogs([]);
    }
  };

  const handleRefresh = () => {
    setLogs(getLocalLogs());
  };

  return (
    <div className="min-h-screen chalkboard-bg p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-chalk-yellow mb-2">
          Diagnosticare Sistem
        </h1>
        <p className="text-chalk-white/60 mb-4 text-sm">
          Loguri complete: traduceri, conversii, erori, actiuni utilizator — pe acest dispozitiv
        </p>

        {loading ? (
          <p className="text-chalk-white">Se incarca...</p>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              {(["all", "action", "info", "warn", "error"] as FilterLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`chalk-card text-center py-2 cursor-pointer transition-all ${
                    filter === level ? "!border-chalk-yellow" : ""
                  }`}
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

            {/* Action buttons */}
            <div className="flex gap-2 mb-4">
              <button onClick={handleRefresh} className="chalk-btn text-sm">
                Reincarca
              </button>
              {logs.length > 0 && (
                <button onClick={handleClearLogs} className="chalk-btn text-sm !text-chalk-red">
                  Sterge loguri
                </button>
              )}
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
                      <span className={`font-bold uppercase text-xs ${levelColor(log.level)}`}>
                        {log.level}
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
                      <span>{log.device.type} / {log.device.os} / {log.device.browser}</span>
                      <span>|</span>
                      <span>{log.device.screenWidth}x{log.device.screenHeight}</span>
                      {log.device.pwa && (
                        <>
                          <span>|</span>
                          <span className="text-chalk-yellow">PWA</span>
                        </>
                      )}
                    </div>
                    {log.stack && (
                      <details className="mt-1">
                        <summary className="text-chalk-white/40 text-xs cursor-pointer">
                          Stack trace
                        </summary>
                        <pre className="text-xs text-chalk-white/30 mt-1 overflow-x-auto whitespace-pre-wrap">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <a href="/" className="text-chalk-yellow hover:underline text-sm">
                Inapoi la aplicatie
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
