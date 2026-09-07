/**
 * FAZA 1 — „Repară orbirea diagnostică" (2026-09-08).
 *
 * Pâlnia UNICĂ prin care trece orice eșec de flux (traducere, import/OCR, export,
 * generare, conversie, dictare, planșă, istoric). Rezolvă exact problema care a
 * produs raportul fals-liniștitor din 2026-09-07:
 *
 *   Înainte:  catch (e) { setError("Traducerea a eșuat. Verifică internetul.");
 *                         trackEditor("translate_error", { to }) }
 *             → nivel `action`, error_code `null`, obiectul erorii aruncat la gunoi,
 *               mesaj hardcodat care dă vina pe internet chiar când nicio cerere
 *               n-a plecat. Invizibil pe /diagnostics ȘI la verificarea automată.
 *
 *   Acum:     const f = reportFailure({ code, flow, error, sample })
 *             → nivel `error` + cod + CAUZA REALĂ + tipul + fragmentul care a picat
 *               + locul + stack, iar `f.userMessage` conține codul, ca Cristina
 *               să-l poată citi la telefon.
 *
 * Reguli de proiectare (stabilite cu Roland):
 *  - (1a) toate fluxurile din toate modulele;
 *  - (1b) utilizatorul vede mesaj clar + COD vizibil;
 *  - (1c) în log intră cod + cauză + un FRAGMENT SCURT din conținutul care a picat.
 *         Excepție deliberată: fluxurile care ating lucrarea unui elev (Teste —
 *         corectare/OCR lucrare) trimit `sample: undefined` și doar mărimi
 *         structurale. Vezi E-TEST-002 / E-TEST-003.
 *  - catalogul (`error_codes.json`) descrie CATEGORIA; rândul de log descrie
 *    INCIDENTUL. Nu scriem ipoteze în catalog.
 */

import { getRecentApiFailure, logError, logWarn } from "./monitoring";

/** Cum a eșuat, mecanic — determinat din eroare, nu ghicit. */
export type FailureKind =
  | "network" // cererea n-a ajuns la server (offline, DNS, CORS, conexiune tăiată)
  | "http" // serverul a răspuns, dar cu 4xx/5xx
  | "badResponse" // serverul a răspuns 200, dar CORPUL e corupt (nu se poate parsa)
  | "timeout" // a expirat (abort pe timeout propriu)
  | "abort" // anulat de utilizator sau de o nouă acțiune
  | "logic" // a crăpat în browser (fără nicio cerere eșuată) → bug de aplicație
  | "unknown";

export interface FailureOptions {
  /** Cod din `config/error_codes.json`, ex. "E-TRANS-005". */
  code: string;
  /** Locul: `modul.functie`, ex. "editor.translate". Ajunge în `source`. */
  flow: string;
  /** Obiectul erorii, așa cum a venit. NU îl transforma înainte. */
  error: unknown;
  /** Date structurate suplimentare (status, format, nod curricular…). */
  context?: Record<string, unknown>;
  /** (1c) Fragment scurt din conținutul care a picat. Omite-l la date personale. */
  sample?: string;
  /** Frază pentru utilizator, dacă cea derivată din `kind` nu e potrivită. */
  userHint?: string;
  /** Implicit "error". "warn" pentru eșecuri recuperate automat. */
  severity?: "error" | "warn";
}

export interface FailureReport {
  code: string;
  kind: FailureKind;
  /** Cauza REALĂ, în clar (mesajul erorii), nu un text hardcodat. */
  cause: string;
  /** Ce se arată utilizatorului — include codul (1b). */
  userMessage: string;
  /** Prezent doar dacă eșecul a fost precedat de un apel /api/* căzut. */
  traceId?: string;
}

/** Lungimea maximă a fragmentului salvat în log (1c). */
export const SAMPLE_MAX = 180;

/**
 * Fereastră anti-dublură. Deliberat MICĂ: singurul lucru pe care vrem să-l
 * suprimăm e re-declanșarea aceluiași eșec în același tick (React StrictMode,
 * dublu-eveniment). Trei click-uri ale lui Roland pe SK TREBUIE să producă trei
 * rânduri — altfel /diagnostics minte din nou, în cealaltă direcție.
 */
const DEDUP_MS = 2000;
const lastSeen = new Map<string, number>();

/** Doar pentru teste — golește memoria anti-dublură. */
export function __resetFailureDedup(): void {
  lastSeen.clear();
}

/** Taie un fragment de conținut la o lungime sigură pentru log. */
export function toSample(input: unknown, max = SAMPLE_MAX): string | undefined {
  if (input == null) return undefined;
  let text: string;
  if (typeof input === "string") text = input;
  else {
    try {
      text = JSON.stringify(input);
    } catch {
      return undefined;
    }
  }
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

/** Extrage mesajul real al erorii, oricare i-ar fi forma. */
function causeOf(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const o = error as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.error === "string" && o.error) return o.error;
    try {
      return JSON.stringify(error);
    } catch {
      /* obiect neserializabil */
    }
  }
  return String(error);
}

/** Clasifică mecanic eșecul. `netSeen` = a căzut un /api/* chiar înainte? */
export function classify(error: unknown, netSeen: boolean): FailureKind {
  const name = error instanceof Error ? error.name : "";
  const msg = causeOf(error).toLowerCase();

  if (name === "AbortError" || msg.includes("aborted")) {
    return msg.includes("timeout") || msg.includes("timed out")
      ? "timeout"
      : "abort";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) return "timeout";
  // Serverul a răspuns 200, dar corpul nu se poate parsa. Clasă REALĂ, observată
  // live pe 08.09.2026: runtime-ul Vercel Python scurge framing intern
  // („x-vercel-internal-timing…") în corpul răspunsului la cold start, iar
  // `res.json()` crapă. Fără această categorie, un răspuns corupt de la server
  // arăta ca un bug de cod în browser — diagnostic greșit, trimis în direcția greșită.
  if (
    (error instanceof SyntaxError || name === "SyntaxError") &&
    (msg.includes("json") || msg.includes("unexpected token"))
  ) {
    return "badResponse";
  }
  // Serverul A răspuns (doar prost). Două forme întâlnite în cod:
  //  - "OCR HTTP 413", "status 429"        → prefix explicit;
  //  - "Eroare conversie (500): ..."       → statusul între paranteze (Convertor).
  // Fără a doua formă, o eroare REALĂ de server era catalogată drept bug de
  // aplicație — adică exact tipul de diagnostic mincinos pe care îl reparăm.
  if (/\b(?:http|status)\s*[:=]?\s*[45]\d{2}\b/.test(msg)) return "http";
  if (/\(\s*[45]\d{2}\s*\)/.test(msg)) return "http";
  // Semnătura clasică de rețea căzută (Chrome/Firefox/Safari).
  if (
    name === "TypeError" &&
    (msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("load failed"))
  ) {
    return "network";
  }
  if (msg.includes("networkerror") || msg.includes("failed to fetch")) {
    return "network";
  }
  // Dacă un apel API tocmai a căzut, eșecul e cel mai probabil consecința lui.
  if (netSeen) return "http";
  // Altfel: a crăpat în browser, fără să fi ieșit pe rețea. ASTA e cazul care
  // era raportat mincinos ca „verifică internetul".
  return "logic";
}

/**
 * Clasifică o eroare ținând cont și de starea rețelei (ultimul /api/* căzut).
 *
 * Folosit de fluxurile care au DOUĂ coduri, după cum eșecul a fost local sau
 * cauzat de server — ex. traducerea: E-TRANS-005 (local, nicio cerere n-a plecat)
 * vs. E-TRANS-001 (providerul a răspuns cu eroare).
 */
export function classifyFailure(error: unknown): FailureKind {
  try {
    return classify(error, Boolean(getRecentApiFailure()));
  } catch {
    return "unknown";
  }
}

/** Mesajul pentru utilizator, derivat din mecanism — nu hardcodat. */
function messageFor(kind: FailureKind): string {
  switch (kind) {
    case "network":
      return "Nu am putut contacta serverul. Verifică internetul și încearcă din nou.";
    case "http":
      return "Serverul a răspuns cu eroare. Încearcă din nou peste câteva momente.";
    case "badResponse":
      // Observat live: la a doua încercare merge (prima trezește serverul).
      return "Serverul a trimis un răspuns deteriorat. Apasă din nou — de obicei a doua încercare reușește.";
    case "timeout":
      return "Operația a durat prea mult și a fost oprită. Încearcă din nou.";
    case "abort":
      return "Operația a fost anulată.";
    case "logic":
      return "Operația a eșuat în aplicație, înainte de a trimite ceva la server — nu e o problemă de internet.";
    default:
      return "Operația a eșuat.";
  }
}

/**
 * Înregistrează un eșec de flux și întoarce ce trebuie arătat utilizatorului.
 *
 * Nu aruncă niciodată: un log ratat nu are voie să strice fluxul (fail-open).
 */
export function reportFailure(o: FailureOptions): FailureReport {
  const cause = causeOf(o.error);
  let kind: FailureKind = "unknown";
  let traceId: string | undefined;

  try {
    const net = getRecentApiFailure();
    traceId = net?.traceId;
    kind = classify(o.error, Boolean(net));

    const key = `${o.code}|${o.flow}|${cause}`;
    const now = Date.now();
    const prev = lastSeen.get(key);
    const duplicate = prev !== undefined && now - prev < DEDUP_MS;
    lastSeen.set(key, now);

    if (!duplicate) {
      const context: Record<string, unknown> = {
        ...o.context,
        flow: o.flow,
        kind,
        cause,
      };
      if (o.sample) context.sample = toSample(o.sample);
      if (net) {
        context.traceId = net.traceId;
        context.netStatus = net.status;
        context.netUrl = net.url;
      } else {
        // Dovada explicită că NU a plecat nicio cerere — exact întrebarea la
        // care nimeni n-a putut răspunde pe bug-ul SK.
        context.netCallSeen = false;
      }

      const opts = {
        errorCode: o.code,
        source: o.flow,
        stack: o.error instanceof Error ? o.error.stack : undefined,
        context,
      };
      const line = `${o.flow} | ${cause}`;
      if (o.severity === "warn") logWarn(line, opts);
      else logError(line, opts);
    }
  } catch {
    /* fail-open: diagnosticul nu are voie să rupă fluxul */
  }

  const base = o.userHint || messageFor(kind);
  return {
    code: o.code,
    kind,
    cause,
    // (1b) codul rămâne vizibil pe ecran — Cristina îl citește la telefon.
    userMessage: kind === "abort" ? base : `${base} (cod ${o.code})`,
    traceId,
  };
}
