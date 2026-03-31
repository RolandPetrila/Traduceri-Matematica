"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/api-url";

const HEALTH_ENDPOINT = `${API_URL}/api/health`;
const TIMEOUT_MS = 120_000; // 120 seconds
const POLL_INTERVAL_MS = 3_000; // retry every 3 seconds

type Status = "checking" | "ready" | "failed";

export default function ServerWakeup({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>("checking");
  const [attempt, setAttempt] = useState(0);

  const startCheck = useCallback(() => {
    setStatus("checking");
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const check = async () => {
      timeoutId = setTimeout(() => {
        if (!cancelled) setStatus("failed");
      }, TIMEOUT_MS);

      while (!cancelled) {
        try {
          const res = await fetch(HEALTH_ENDPOINT, {
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok && !cancelled) {
            setStatus("ready");
            clearTimeout(timeoutId);
            return;
          }
        } catch {
          // server not ready yet
        }
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
    };

    check();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [attempt]);

  useEffect(() => {
    if (status !== "ready") return;

    // Keep backend alive every 4 minutes to prevent Render sleep
    const keepAlive = setInterval(async () => {
      try {
        await fetch(HEALTH_ENDPOINT, { signal: AbortSignal.timeout(5000) });
      } catch {
        // Ignore errors — this is just a keep-alive ping
      }
    }, 4 * 60 * 1000);

    return () => clearInterval(keepAlive);
  }, [status]);

  if (status === "ready") return <>{children}</>;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
      style={{
        background:
          "radial-gradient(ellipse at center, #2d5016 0%, #1a3009 100%)",
      }}
    >
      {status === "checking" ? (
        <>
          {/* Chalk-style animated dots */}
          <div className="flex gap-3 mb-8">
            <span className="chalk-dot chalk-dot-1" />
            <span className="chalk-dot chalk-dot-2" />
            <span className="chalk-dot chalk-dot-3" />
          </div>
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--chalk-yellow)" }}
          >
            Se pregateste aplicatia...
          </p>
          <p className="text-sm mt-3 opacity-60" style={{ color: "var(--chalk-white)" }}>
            Serverul se trezeste dupa pauza. Dureaza maxim 1-2 minute.
          </p>
        </>
      ) : (
        <>
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--chalk-red, #e8836b)" }}
          >
            Serverul nu raspunde momentan
          </p>
          <p className="text-sm mt-3 opacity-60" style={{ color: "var(--chalk-white)" }}>
            Verifica conexiunea la internet sau incearca din nou mai tarziu.
          </p>
          <button
            onClick={startCheck}
            className="chalk-btn mt-8 text-lg px-8 py-3"
          >
            Incearca din nou
          </button>
        </>
      )}
    </div>
  );
}
