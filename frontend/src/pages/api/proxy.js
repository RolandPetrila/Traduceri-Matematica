// Proxy serverless multi-provider — Vercel Node function.
// Cheile stau DOAR server-side (env vars Vercel), niciodata in browser.
// Client: fetch('/api/proxy?provider=<groq|gemini|mistral|cerebras|openrouter|gemini2|mistral2|deepl|deepl2|tavily|brave>', {method:'POST', body: <payload upstream>})
// Proxy injecteaza cheia + forwardeaza la upstream + intoarce raspunsul brut.

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

const PROVIDERS = {
  // --- LLM text (primari) ---
  gemini: { url: GEMINI_URL, env: "GOOGLE_API_KEY", auth: "query" },
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    env: "GROQ_API_KEY",
    auth: "bearer",
  },
  mistral: { url: MISTRAL_URL, env: "MISTRAL_API_KEY", auth: "bearer" },
  // --- LLM text (provideri gratuiti adaugati pt reziliență) ---
  cerebras: {
    url: "https://api.cerebras.ai/v1/chat/completions",
    env: "CEREBRAS_API_KEY",
    auth: "bearer",
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    env: "OPENROUTER_API_KEY",
    auth: "bearer",
    extraHeaders: {
      "HTTP-Referer": "https://asistent-text-ai.vercel.app",
      "X-Title": "Asistent Text AI",
    },
  },
  // --- Chei secundare = failover automat la rate-limit/429 (acopera si OCR via gemini2) ---
  gemini2: { url: GEMINI_URL, env: "GOOGLE_API_KEY_2", auth: "query" },
  mistral2: { url: MISTRAL_URL, env: "MISTRAL_API_KEY_2", auth: "bearer" },
  // --- Traducere ---
  deepl: { url: DEEPL_URL, env: "DEEPL_API_KEY", auth: "deepl" },
  deepl2: { url: DEEPL_URL, env: "DEEPL_API_KEY_2", auth: "deepl" },
  // --- Cautare web (Deep Research) ---
  tavily: {
    url: "https://api.tavily.com/search",
    env: "TAVILY_API_KEY",
    auth: "body",
  },
  brave: {
    url: "https://api.search.brave.com/res/v1/web/search",
    env: "BRAVE_SEARCH_API_KEY",
    auth: "header",
    headerName: "X-Subscription-Token",
    method: "GET",
    query: ["q", "count", "country", "search_lang"],
  },
};

// --- Protectie abuz: origin allowlist + rate-limit best-effort in-memory ---
// Integrat in Traduceri: doar same-origin (host-ul propriu, adaugat mai jos).
// Domeniul standalone al proiectului sursa a fost eliminat (nu mai e o origine
// de incredere aici -> ar fi o suprafata de abuz a cotei AI).
const ALLOWED_HOSTS = [];
function hostOf(u) {
  try {
    return new URL(u).host.toLowerCase();
  } catch (e) {
    return "";
  }
}
const RL_WINDOW_MS = 60 * 1000;
const RL_WINDOW_S = 60;
// 60 cereri / minut / IP. Ridicat de la 30 (2026-08-05): lanțul Chat are acum 6
// provideri, iar un mesaj cu fallback poate face pana la 6 apeluri; 30 se atingea
// prematur. 60 => ~10 mesaje complet-cascadate/min (60/6), mult peste ritmul uman,
// pastrand premisa S7 (endpoint rate-limited, fara auth/cookies). In-memory
// per-instanta (Upstash comentat) + single-user. NU ridica orbeste: e singura
// frana contra epuizarii cotei free (origin allowlist e doar host-match, spoofabil).
const RL_MAX = 60;
const RL_PREFIX = "asistent-text-ai:rl:"; // namespacing — DB Upstash poate fi partajat cu alte proiecte

// Fallback best-effort in-memory (per instanta serverless) — folosit cand Upstash lipseste/cade.
const rlBuckets = new Map();
const RL_MAX_IPS = 10000; // plafon de siguranta per instanta warm
function rateLimitedMemory(ip) {
  const now = Date.now();
  const arr = (rlBuckets.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  arr.push(now);
  rlBuckets.set(ip, arr);
  // Evictie oportunista: cand Map-ul creste, scoate IP-urile cu fereastra expirata
  // (altfel Map-ul ar creste nemarginit pe o instanta warm cu multe IP-uri distincte).
  if (rlBuckets.size > RL_MAX_IPS) {
    for (const [k, ts] of rlBuckets) {
      if (!ts.length || now - ts[ts.length - 1] >= RL_WINDOW_MS)
        rlBuckets.delete(k);
    }
  }
  return arr.length > RL_MAX;
}

// Rate-limit PERSISTENT via Upstash Redis REST (fereastra fixa, namespaced per-proiect).
// Daca env vars lipsesc SAU Upstash nu raspunde la timp -> fallback in-memory (zero regresie).
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
async function rateLimited(ip) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return rateLimitedMemory(ip);
  const key = RL_PREFIX + ip;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 800);
  try {
    // Pipeline atomic: INCR contorul + seteaza TTL DOAR la prima cerere din fereastra (NX).
    const r = await fetch(UPSTASH_URL + "/pipeline", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + UPSTASH_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(RL_WINDOW_S), "NX"],
      ]),
      signal: ctrl.signal,
    });
    if (!r.ok) return rateLimitedMemory(ip);
    const data = await r.json();
    const count =
      Array.isArray(data) && data[0] && typeof data[0].result === "number"
        ? data[0].result
        : 0;
    return count > RL_MAX;
  } catch (e) {
    return rateLimitedMemory(ip); // Upstash down/timeout -> nu bloca app-ul
  } finally {
    clearTimeout(timer);
  }
}

// --- Cost-cap anti-abuz: clientul NU poate alege modelul scump sau limite mari ---
// Modele permise per provider (orice altceva e fortat la primul). Plafoane aplicate
// DOAR daca clientul trimite explicit campul (traficul legit al app-ului nu-l trimite).
const MODEL_ALLOW = {
  // 70b = default pt Chat AI matematică (calitate); 8b păstrat pt compat Asistent. Ambele free pe Groq.
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  mistral: ["mistral-large-latest"],
  mistral2: ["mistral-large-latest"],
  cerebras: ["gpt-oss-120b"],
  openrouter: ["meta-llama/llama-3.3-70b-instruct:free"],
};
const MAX_TOKENS_CAP = 8192;
const MAX_RESULTS_CAP = 10;

// Next.js Pages API route config: allow large OCR image payloads through the
// body parser, relay large upstream responses (OCR JSON / search results can
// exceed the 4MB default), and give Deep Research up to 60s on Vercel.
export const config = {
  maxDuration: 60,
  api: { bodyParser: { sizeLimit: "10mb" }, responseLimit: "10mb" },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed — POST only" });
    return;
  }

  // Origin allowlist — blocheaza cererile browser cross-origin (nivel CSRF).
  // NU e o protectie completa anti-script: un client non-browser poate trimite
  // Host+Origin potrivite. Aparatul real contra epuizarii cotei = cost-cap
  // (model allowlist, mai jos) + rate-limit per-IP + limitele free-tier ale
  // providerilor. Vezi si get_client_ip mai jos.
  const host = String(req.headers.host || "").toLowerCase();
  const allowed = new Set([host, ...ALLOWED_HOSTS]);
  const oh = hostOf(req.headers.origin);
  const rh = hostOf(req.headers.referer);
  const fromBrowser = oh || rh;
  if (!fromBrowser || (!allowed.has(oh) && !allowed.has(rh))) {
    res.status(403).json({ error: "Forbidden — cerere neautorizata" });
    return;
  }

  // Rate-limit best-effort (per IP). Foloseste `x-real-ip` (setat de platforma
  // Vercel la IP-ul real al clientului) inainte de `x-forwarded-for`, al
  // carui prim element e controlabil de client (spoof -> bucket nou/cerere).
  const ip =
    String(req.headers["x-real-ip"] || "").trim() ||
    String(req.headers["x-forwarded-for"] || "")
      .split(",")
      .pop()
      .trim() ||
    "unknown";
  if (await rateLimited(ip)) {
    res
      .status(429)
      .json({ error: "Prea multe cereri — incearca din nou intr-un minut" });
    return;
  }

  const provider = String(
    (req.query && req.query.provider) || "",
  ).toLowerCase();
  const cfg = PROVIDERS[provider];
  if (!cfg) {
    res.status(400).json({ error: "Unknown provider: " + provider });
    return;
  }

  const key = process.env[cfg.env];
  if (!key) {
    res.status(500).json({
      error: "Server key missing (" + cfg.env + ") — seteaza env var in Vercel",
    });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  // Cost-cap: forteaza modelul permis + plafoneaza limitele daca-s trimise (audit #1).
  if (MODEL_ALLOW[provider]) {
    const allow = MODEL_ALLOW[provider];
    if (!allow.includes(body.model)) body.model = allow[0];
    if (body.max_tokens != null) {
      body.max_tokens = Math.min(
        Number(body.max_tokens) || 2048,
        MAX_TOKENS_CAP,
      );
    }
  }
  if (provider === "tavily" && body.max_results != null) {
    body.max_results = Math.min(Number(body.max_results) || 5, MAX_RESULTS_CAP);
  } else if (provider === "brave" && body.count != null) {
    body.count = Math.min(Number(body.count) || 5, MAX_RESULTS_CAP);
  }

  let url = cfg.url;
  const method = cfg.method || "POST";
  const headers = { "Content-Type": "application/json" };
  if (cfg.extraHeaders) Object.assign(headers, cfg.extraHeaders);
  if (cfg.auth === "query") url += "?key=" + encodeURIComponent(key);
  else if (cfg.auth === "bearer") headers["Authorization"] = "Bearer " + key;
  else if (cfg.auth === "deepl")
    headers["Authorization"] = "DeepL-Auth-Key " + key;
  else if (cfg.auth === "body") body.api_key = key;
  else if (cfg.auth === "header") headers[cfg.headerName] = key;

  // Provideri GET (ex: Brave): parametrii relevanti din body -> query string, fara corp.
  let fetchOpts;
  if (method === "GET") {
    const params = new URLSearchParams();
    (cfg.query || []).forEach((k) => {
      if (body[k] != null && body[k] !== "") params.set(k, String(body[k]));
    });
    const qs = params.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
    headers["Accept"] = "application/json";
    fetchOpts = { method: "GET", headers };
  } else {
    fetchOpts = { method: "POST", headers, body: JSON.stringify(body) };
  }

  try {
    const upstream = await fetch(url, fetchOpts);
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json",
    );
    res.send(text);
  } catch (e) {
    res.status(502).json({
      error: "Proxy upstream failed",
      detail: String((e && e.message) || e),
    });
  }
}
