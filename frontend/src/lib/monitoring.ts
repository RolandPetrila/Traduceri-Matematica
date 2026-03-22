// Client-side error monitoring service with device detection

export interface ErrorLog {
  id: string;
  timestamp: string;
  level: "error" | "warn" | "info";
  message: string;
  stack?: string;
  source?: string;
  device: DeviceInfo;
  page: string;
  userAgent: string;
  context?: Record<string, unknown>;
}

export interface DeviceInfo {
  type: "desktop" | "tablet" | "mobile";
  os: string;
  browser: string;
  screenWidth: number;
  screenHeight: number;
  pwa: boolean;
}

function detectDevice(): DeviceInfo {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const width = typeof window !== "undefined" ? window.screen.width : 0;
  const height = typeof window !== "undefined" ? window.screen.height : 0;

  let type: DeviceInfo["type"] = "desktop";
  if (/Mobi|Android/i.test(ua)) type = "mobile";
  else if (/iPad|Tablet/i.test(ua) || (width >= 600 && width <= 1024)) type = "tablet";

  let os = "Unknown";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Mac/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Unknown";
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edge/i.test(ua)) browser = "Edge";

  const pwa =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

  return { type, os, browser, screenWidth: width, screenHeight: height, pwa };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function sendLog(log: ErrorLog): Promise<void> {
  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    });
  } catch {
    // If API fails, store in localStorage as fallback
    const stored = JSON.parse(localStorage.getItem("pending_logs") || "[]");
    stored.push(log);
    // Keep max 50 pending logs
    if (stored.length > 50) stored.shift();
    localStorage.setItem("pending_logs", JSON.stringify(stored));
  }
}

export function logError(
  message: string,
  opts?: { stack?: string; source?: string; context?: Record<string, unknown> }
): void {
  const log: ErrorLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level: "error",
    message,
    stack: opts?.stack,
    source: opts?.source || "unknown",
    device: detectDevice(),
    page: typeof window !== "undefined" ? window.location.pathname : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    context: opts?.context,
  };
  sendLog(log);
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  const log: ErrorLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level: "warn",
    message,
    source: "app",
    device: detectDevice(),
    page: typeof window !== "undefined" ? window.location.pathname : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    context,
  };
  sendLog(log);
}

export function initGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    logError(event.message, {
      stack: event.error?.stack,
      source: `${event.filename}:${event.lineno}:${event.colno}`,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    logError(reason?.message || String(reason), {
      stack: reason?.stack,
      source: "unhandled-promise-rejection",
    });
  });

  // Flush pending logs from localStorage
  try {
    const pending = JSON.parse(localStorage.getItem("pending_logs") || "[]");
    if (pending.length > 0) {
      pending.forEach((log: ErrorLog) => sendLog(log));
      localStorage.removeItem("pending_logs");
    }
  } catch {
    // ignore
  }
}
