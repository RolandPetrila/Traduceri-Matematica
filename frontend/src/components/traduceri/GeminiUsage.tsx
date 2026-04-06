"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api-url";

interface GeminiUsageData {
  count: number;
  limit: number;
  remaining: number;
  percent: number;
  level: "ok" | "warning" | "critical";
  warning?: string;
  note?: string;
}

export default function GeminiUsage() {
  const [usage, setUsage] = useState<GeminiUsageData | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch(`${API_URL}/api/gemini-usage`, {
          cache: "no-store",
        });
        if (res.ok) {
          setUsage(await res.json());
        }
      } catch {
        // silently fail — usage display is not critical
      }
    };

    fetchUsage();
    const interval = setInterval(fetchUsage, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (!usage || !usage.limit) return null;

  const barColor =
    usage.level === "critical"
      ? "bg-red-500"
      : usage.level === "warning"
      ? "bg-yellow-500"
      : "bg-blue-400";

  return (
    <div className="mt-2 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between text-xs mb-1.5 opacity-70">
        <span>Cota Gemini azi</span>
        <span>
          {usage.count} / {usage.limit} apeluri ({usage.percent}%)
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(usage.percent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1 opacity-50">
        <span>{usage.remaining} apeluri ramase</span>
        {usage.warning && (
          <span className={usage.level === "critical" ? "text-red-400" : "text-yellow-400"}>
            {usage.warning}
          </span>
        )}
      </div>
    </div>
  );
}
