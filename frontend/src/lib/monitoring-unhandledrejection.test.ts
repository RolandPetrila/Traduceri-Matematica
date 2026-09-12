import { initGlobalErrorHandlers, type ErrorLog } from "./monitoring";

const LOGS_KEY = "sistem_traduceri_logs";

function lastLog(): ErrorLog {
  const stored: ErrorLog[] = JSON.parse(localStorage.getItem(LOGS_KEY) || "[]");
  return stored[0];
}

function dispatchRejection(reason: unknown): void {
  const event = new Event("unhandledrejection") as Event & {
    reason?: unknown;
  };
  event.reason = reason;
  window.dispatchEvent(event);
}

describe("initGlobalErrorHandlers — unhandledrejection", () => {
  beforeAll(() => {
    // jsdom nu implementeaza matchMedia; detectDevice() (apelat de fiecare
    // log) il foloseste pt detectia PWA. Stub minim, doar pt acest test.
    if (!window.matchMedia) {
      window.matchMedia = ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      })) as unknown as typeof window.matchMedia;
    }
    initGlobalErrorHandlers();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  // Reproduce incidentul real din productie (Supabase logs, 2026-09-11, id
  // 244f7ac5): reason = string simplu "Internal error", fara Error wrapper.
  // Inainte de fix, context era intotdeauna undefined pt orice rejection —
  // acest caz ajungea in log fara nicio urma diagnostica (context:null,
  // stack:null), exact orbirea pe care R-DIAG-AUTO trebuie sa o evite.
  test("reason = string simplu — pastreaza tipul si valoarea in context (nu mai e orb)", () => {
    dispatchRejection("Internal error");
    const log = lastLog();
    expect(log.message).toBe("Internal error");
    expect(log.stack).toBeUndefined();
    expect(log.context?.reasonType).toBe("string");
    expect(log.context?.reasonString).toBe("Internal error");
  });

  test("reason = eroare cu name/code (ex. DOMException) — mesajul ramane cel real, plus name/code in context", () => {
    const reason = Object.assign(new Error("Boom"), {
      name: "AbortError",
      code: 20,
    });
    dispatchRejection(reason);
    const log = lastLog();
    expect(log.message).toBe("Boom");
    expect(log.stack).toBe(reason.stack);
    expect(log.context?.reasonType).toBe("object");
    expect(log.context?.reasonName).toBe("AbortError");
    expect(log.context?.reasonCode).toBe(20);
    expect(log.context?.reasonString).toBeUndefined();
  });
});
