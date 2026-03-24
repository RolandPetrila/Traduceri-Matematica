"use client";

import { useEffect, useState } from "react";

// Vercel auto-sets VERCEL_GIT_COMMIT_SHA at build time
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
        const res = await fetch("/api/health", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const sv = data.build_version || data.version || "";
          setServerVersion(sv);
          if (sv && sv !== BUILD_VERSION && BUILD_VERSION !== "dev") {
            setStatus("stale");
          } else {
            setStatus("current");
          }
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

  const color = status === "current" ? "bg-green-500" : status === "updating" ? "bg-yellow-500" : "bg-red-500";
  const label = status === "current" ? BUILD_VERSION : status === "updating" ? "updating..." : "reincarca";

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
