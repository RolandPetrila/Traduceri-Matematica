import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LOGS_DIR = path.join(process.cwd(), "..", "data", "logs");

function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function getLogFilePath(): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOGS_DIR, `errors_${date}.jsonl`);
}

export async function POST(request: NextRequest) {
  try {
    const log = await request.json();
    ensureLogsDir();

    const logLine = JSON.stringify(log) + "\n";
    fs.appendFileSync(getLogFilePath(), logLine, "utf-8");

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Failed to save log:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    ensureLogsDir();
    const files = fs
      .readdirSync(LOGS_DIR)
      .filter((f) => f.endsWith(".jsonl"))
      .sort()
      .reverse();

    const logs: unknown[] = [];
    // Read last 3 days of logs, max 100 entries
    for (const file of files.slice(0, 3)) {
      const content = fs.readFileSync(path.join(LOGS_DIR, file), "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          logs.push(JSON.parse(line));
        } catch {
          // skip malformed lines
        }
      }
      if (logs.length >= 100) break;
    }

    return NextResponse.json({
      total: logs.length,
      files: files.length,
      logs: logs.slice(0, 100),
    });
  } catch (error) {
    console.error("Failed to read logs:", error);
    return NextResponse.json({ total: 0, files: 0, logs: [] });
  }
}
