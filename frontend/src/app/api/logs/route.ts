import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const log = await request.json();
    // Log to Vercel Log stream (always works, viewable in Vercel dashboard)
    console.log(`[CLIENT_LOG] ${log.level?.toUpperCase() || "INFO"} | ${log.device?.type || "unknown"} | ${log.device?.os || "unknown"} | ${log.message}`);
    if (log.context) {
      console.log(`[CLIENT_LOG_CTX]`, JSON.stringify(log.context));
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
  return NextResponse.json({
    total: 0,
    files: 0,
    logs: [],
    note: "Logurile sunt stocate local pe fiecare dispozitiv (localStorage). Verificati pagina /diagnostics.",
  });
}
