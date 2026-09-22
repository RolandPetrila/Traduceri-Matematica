import { createHash, timingSafeEqual } from "crypto";

/**
 * Citirea logurilor cross-device (`GET /api/logs`) cere un cod de acces
 * (audit 2026-09-23: logurile erau citibile de oricine știa URL-ul). Scrierea
 * (`POST`, telemetria) rămâne publică — aplicația nu are autentificare.
 *
 * Fail-closed: fără `TRADUCERI_DIAG_TOKEN` pe server, citirea e refuzată.
 */
export const DIAG_TOKEN_HEADER = "x-diag-token";

export type DiagAuthResult = "ok" | "not_configured" | "denied";

export function checkDiagToken(
  provided: string | null | undefined,
  expected: string | undefined = process.env.TRADUCERI_DIAG_TOKEN,
): DiagAuthResult {
  const exp = (expected || "").trim();
  if (!exp) return "not_configured";
  const got = (provided || "").trim();
  if (!got) return "denied";
  // Comparăm hash-uri de lungime fixă: timingSafeEqual cere buffere egale și
  // nu vrem ca lungimea diferită să iasă mai repede (scurgere de lungime).
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(exp).digest();
  return timingSafeEqual(a, b) ? "ok" : "denied";
}
