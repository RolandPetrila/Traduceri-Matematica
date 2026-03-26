"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api-url";

interface UsageData {
  character_count: number;
  character_limit: number;
  remaining: number;
  percent: number;
  pages_remaining: number;
  warning?: string;
  level: "ok" | "warning" | "critical";
}

export default function DeeplUsage() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch(`${API_URL}/api/deepl-usage`, {
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
    const interval = setInterval(fetchUsage, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  if (!usage || !usage.character_limit) return null;

  const barColor =
    usage.level === "critical"
      ? "bg-red-500"
      : usage.level === "warning"
      ? "bg-yellow-500"
      : "bg-green-500";

  const formatNumber = (n: number) =>
    n.toLocaleString("ro-RO");

  return (
    <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between text-xs mb-1.5 opacity-70">
        <span>Cota DeepL luna aceasta</span>
        <span>
          {formatNumber(usage.character_count)} / {formatNumber(usage.character_limit)} caractere ({usage.percent}%)
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(usage.percent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1 opacity-50">
        <span>~{formatNumber(usage.pages_remaining)} pagini disponibile</span>
        {usage.warning && (
          <span className={usage.level === "critical" ? "text-red-400" : "text-yellow-400"}>
            {usage.warning}
          </span>
        )}
      </div>
    </div>
  );
}
