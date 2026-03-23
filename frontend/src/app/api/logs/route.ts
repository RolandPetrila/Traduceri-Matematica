import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const isDev = process.env.NODE_ENV === "development";

function getLogFile(): string | null {
  if (!isDev) return null;
  // Next.js cwd may be frontend/ or project root depending on how dev is started
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
    // Ignore write errors (e.g. Vercel read-only fs)
  }
}

function formatLogEntry(log: Record<string, unknown>): string {
  const d = log.device as Record<string, unknown> | undefined;
  const ts = new Date(
    (log.timestamp as string) || Date.now()
  ).toLocaleTimeString("ro-RO", { hour12: false });
  const level = String(log.level || "info").toUpperCase().padEnd(6);
  const device = d ? `${d.type}/${d.os}/${d.browser}` : "unknown";
  let entry = `[${ts}] ${level} | ${log.message} | Device: ${device} | Page: ${log.page || "/"}`;
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
    const log = await request.json();

    // Vercel Log stream (always works, viewable in Vercel dashboard)
    console.log(
      `[CLIENT_LOG] ${log.level?.toUpperCase() || "INFO"} | ${log.device?.type || "unknown"} | ${log.device?.os || "unknown"} | ${log.message}`
    );
    if (log.context) {
      console.log(`[CLIENT_LOG_CTX]`, JSON.stringify(log.context));
    }

    // Local file logging (dev mode only)
    if (isDev) {
      // Session separator when app loads
      if (log.message === "App loaded") {
        const sep = "=".repeat(56);
        const now = new Date().toLocaleString("ro-RO", { hour12: false });
        const d = log.device || {};
        writeToFile(
          `\n${sep}\nSESSION START | ${now}\nDevice: ${d.type || "?"} | ${d.os || "?"} | ${d.browser || "?"} | ${d.screenWidth || "?"}x${d.screenHeight || "?"}\n${sep}`
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

export async function GET() {
  // Logs are now primarily stored in client localStorage
  // Server-side logs go to Vercel Log stream (console.log)
  // In dev mode, logs also go to data/logs/local_debug.log
  return NextResponse.json({
    total: 0,
    files: 0,
    logs: [],
    note: "Logurile sunt stocate local pe fiecare dispozitiv (localStorage). In dev mode, se scriu si in data/logs/local_debug.log.",
  });
}
