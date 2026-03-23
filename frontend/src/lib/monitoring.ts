// Client-side monitoring service with device detection
// Logs ALL user operations: translations, conversions, downloads, errors

export type LogLevel = "error" | "warn" | "info" | "action";

export interface ErrorLog {
  id: string;
  timestamp: string;
  level: LogLevel;
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

const LOGS_KEY = "sistem_traduceri_logs";
const MAX_LOGS = 200;

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

function saveLogLocally(log: ErrorLog): void {
  try {
    const stored: ErrorLog[] = JSON.parse(localStorage.getItem(LOGS_KEY) || "[]");
    stored.unshift(log);
    if (stored.length > MAX_LOGS) stored.length = MAX_LOGS;
    localStorage.setItem(LOGS_KEY, JSON.stringify(stored));
  } catch {
    // localStorage full or unavailable
  }
}

async function sendLogToServer(log: ErrorLog): Promise<void> {
  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    });
  } catch {
    // Server unavailable, log is already in localStorage
  }
}

function createLog(level: LogLevel, message: string, opts?: {
  stack?: string;
  source?: string;
  context?: Record<string, unknown>;
}): ErrorLog {
  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level,
    message,
    stack: opts?.stack,
    source: opts?.source || "app",
    device: detectDevice(),
    page: typeof window !== "undefined" ? window.location.pathname : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    context: opts?.context,
  };
}

export function logError(
  message: string,
  opts?: { stack?: string; source?: string; context?: Record<string, unknown> }
): void {
  const log = createLog("error", message, opts);
  saveLogLocally(log);
  sendLogToServer(log);
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  const log = createLog("warn", message, { source: "app", context });
  saveLogLocally(log);
  sendLogToServer(log);
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  const log = createLog("info", message, { source: "app", context });
  saveLogLocally(log);
  sendLogToServer(log);
}

export function logAction(message: string, context?: Record<string, unknown>): void {
  const log = createLog("action", message, { source: "user-action", context });
  saveLogLocally(log);
  sendLogToServer(log);
}

export function getLocalLogs(): ErrorLog[] {
  try {
    return JSON.parse(localStorage.getItem(LOGS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function initGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;

  // --- Error Capture: uncaught JS errors ---
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

  // --- Console Interception: React warnings, MathJax errors, library logs ---
  let _intercepting = false;
  const _origWarn = console.warn;
  const _origError = console.error;

  console.warn = (...args: unknown[]) => {
    _origWarn.apply(console, args);
    if (_intercepting) return;
    _intercepting = true;
    const msg = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
    // Skip dev noise: React DevTools, HMR, webpack
    if (!msg.includes("Download the React DevTools") && !msg.includes("[HMR]") && !msg.includes("webpack")) {
      logWarn(msg, { source: "console" });
    }
    _intercepting = false;
  };

  console.error = (...args: unknown[]) => {
    _origError.apply(console, args);
    if (_intercepting) return;
    _intercepting = true;
    const msg = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
    if (!msg.includes("[HMR]") && !msg.includes("webpack") && !msg.includes("Failed to process log")) {
      logError(msg, { source: "console" });
    }
    _intercepting = false;
  };

  // --- API Interceptor: log every /api/* call with status + duration ---
  const _origFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    // Skip internal log calls (prevents infinite loop)
    if (!url.startsWith("/api/") || url.includes("/api/logs")) {
      return _origFetch.apply(this, [input, init] as Parameters<typeof fetch>);
    }

    const method = init?.method || "GET";
    const t0 = Date.now();

    try {
      const response = await _origFetch.apply(this, [input, init] as Parameters<typeof fetch>);
      const duration = Date.now() - t0;

      if (response.ok) {
        logInfo(`API | ${method} ${url} | ${response.status} | ${duration}ms | OK`, { source: "api-interceptor" });
      } else {
        logWarn(`API | ${method} ${url} | ${response.status} | ${duration}ms | FAIL`, { source: "api-interceptor" });
      }
      return response;
    } catch (error) {
      const duration = Date.now() - t0;
      const msg = error instanceof Error ? error.message : String(error);
      logError(`API | ${method} ${url} | NETWORK | ${duration}ms | ${msg}`, { source: "api-interceptor" });
      throw error;
    }
  };

  // Log app load
  logInfo("App loaded", {
    url: window.location.href,
    referrer: document.referrer || "direct",
  });
}
