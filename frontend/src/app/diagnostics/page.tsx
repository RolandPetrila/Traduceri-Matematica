"use client";

import { useEffect, useState } from "react";
import type { ErrorLog } from "@/lib/monitoring";

interface LogsResponse {
  total: number;
  files: number;
  logs: ErrorLog[];
}

export default function DiagnosticsPage() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/logs")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ total: 0, files: 0, logs: [] }))
      .finally(() => setLoading(false));
  }, []);

  const levelColor = (level: string) => {
    if (level === "error") return "text-red-400";
    if (level === "warn") return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="min-h-screen chalkboard-bg p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-chalk-yellow mb-2">
          Diagnosticare Sistem
        </h1>
        <p className="text-chalk-white/60 mb-6">
          Loguri erori de pe toate dispozitivele — laptop, Android, iPhone
        </p>

        {loading ? (
          <p className="text-chalk-white">Se incarca...</p>
        ) : !data || data.total === 0 ? (
          <div className="chalk-card text-center py-8">
            <p className="text-chalk-white text-lg">Niciun log inregistrat</p>
            <p className="text-chalk-white/60 mt-2">
              Sistemul de monitorizare este activ. Erorile vor aparea aici automat.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="chalk-card text-center">
                <p className="text-2xl font-bold text-chalk-yellow">
                  {data.total}
                </p>
                <p className="text-chalk-white/60 text-sm">Total loguri</p>
              </div>
              <div className="chalk-card text-center">
                <p className="text-2xl font-bold text-red-400">
                  {data.logs.filter((l) => l.level === "error").length}
                </p>
                <p className="text-chalk-white/60 text-sm">Erori</p>
              </div>
              <div className="chalk-card text-center">
                <p className="text-2xl font-bold text-chalk-white">
                  {data.files}
                </p>
                <p className="text-chalk-white/60 text-sm">Fisiere log</p>
              </div>
            </div>

            <div className="space-y-3">
              {data.logs.map((log) => (
                <div key={log.id} className="chalk-card">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-bold uppercase text-sm ${levelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-chalk-white/40 text-xs">
                      {new Date(log.timestamp).toLocaleString("ro-RO")}
                    </span>
                  </div>
                  <p className="text-chalk-white mb-2">{log.message}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-chalk-white/50">
                    <span>
                      {log.device.type} / {log.device.os} / {log.device.browser}
                    </span>
                    <span>|</span>
                    <span>{log.device.screenWidth}x{log.device.screenHeight}</span>
                    <span>|</span>
                    <span>{log.page || "/"}</span>
                    {log.device.pwa && (
                      <>
                        <span>|</span>
                        <span className="text-chalk-yellow">PWA</span>
                      </>
                    )}
                  </div>
                  {log.stack && (
                    <details className="mt-2">
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
          </>
        )}

        <div className="mt-8 text-center">
          <a href="/" className="text-chalk-yellow hover:underline">
            Inapoi la aplicatie
          </a>
        </div>
      </div>
    </div>
  );
}
