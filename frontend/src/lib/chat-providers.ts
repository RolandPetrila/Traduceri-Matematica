/**
 * Lanț AI cu fallback pentru Chat (2026-08-05, extins pe dovadă). Reutilizează
 * ruta same-origin securizată `/api/proxy` (chei server-side, rate-limit, cost-cap).
 * Încearcă providerii ÎN ORDINE; primul care răspunde câștigă; `provider` (eticheta)
 * alimentează indicatorul de stare.
 *
 * Ordine (toate GRATIS, toate dovedite 200 pe prod 2026-08-05):
 *   Gemini Flash → Gemini Flash (2) → Cerebras 120B → Groq 70B → Mistral Large → Mistral Large (2)
 * OpenRouter a fost SCOS din lanț: modelul `:free` a fost retras de OpenRouter
 * (404 „unavailable for free") — era un fallback mort care nu putea salva mesajul.
 * Cerebras (1M tokeni/zi) + Mistral (1 mld/lună) + a doua cheie Gemini acoperă
 * „durata maximă" complet gratis, fără slug volatil de întreținut.
 *
 * `buildGeminiPayload`/`buildOpenAiPayload`/`parseReply` sunt PURE (testabile);
 * `sendChat` face fetch-ul (chain, cu timeout per provider + colectare erori).
 */

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatResult =
  | { ok: true; reply: string; provider: string; truncated: boolean }
  | { ok: false; error: string; errors: string[] };

/** Formatul payload-ului upstream: Gemini (contents/parts) vs OpenAI (messages). */
export type ProviderFormat = "gemini" | "openai";
export type ProviderStep = {
  id: string;
  label: string;
  model?: string;
  format: ProviderFormat;
};

/**
 * Lanțul confirmat de Roland (2026-08-05). Toți providerii sunt free-tier și au
 * cheile deja setate pe `traduceri-frontend` (verificat: 200 pe prod). Modelele
 * OpenAI-compatibile trebuie să fie în `MODEL_ALLOW` din `app/api/proxy/route.ts`
 * (migrat din `pages/api/proxy.js` la App Router, 2026-08-07, prerequisit Next 16).
 */
// Lanț rescris (2026-09-07) pe baza unei sonde DIRECTE cu cheile reale
// (scratchpad/chat_providers_probe.mjs) — cauza „se ating limitele": lanțul vechi
// era efectiv RUPT, doar Gemini rămăsese viu:
//   gemini/gemini2 200 ✓ · groq gpt-oss-20b 200 ✓ · mistral-small/ministral-8b 200 ✓
//   mistral-large-latest = 403 "not available in your subscription tier" (tier-locked, NU 429) → SCOS model
//   groq llama-3.3-70b / llama-3.1-8b = 404 (retrase de Groq); gemma2 = 400 (decomisionat) → model schimbat
//   cerebras 402 (plată) · sambanova 410/402 · fireworks 404 · nvidia 410 EOL · scaleway 403 → toate moarte
// Rezultat: 3 VENDORI independenți (Google ×2 chei, Groq, Mistral ×2 chei) = reziliență reală, free-tier.
// Cohere (command-r) e VIU ca rezervă suplimentară (necablat încă — quota 1000/lună, vezi inventar).
export const CHAIN: ProviderStep[] = [
  { id: "gemini", label: "Gemini Flash", format: "gemini" },
  { id: "gemini2", label: "Gemini Flash (2)", format: "gemini" },
  {
    id: "groq",
    label: "Groq (gpt-oss-20b)",
    model: "openai/gpt-oss-20b",
    format: "openai",
  },
  {
    id: "mistral",
    label: "Mistral Small",
    model: "mistral-small-latest",
    format: "openai",
  },
  {
    id: "mistral2",
    label: "Mistral Small (2)",
    model: "mistral-small-latest",
    format: "openai",
  },
];

/** Timeout per provider — un provider blocat nu mai mănâncă bugetul întregului lanț.
 * Ridicat 20s→40s (2026-08-20): log-urile de prod arătau Gemini terminând răspunsuri
 * LUNGI (ex. 9 limite pas-cu-pas) la 18–21s, iar plafonul de 20s le tăia fix pe linie
 * („signal is aborted"), forțând o a doua încercare gemini2 (încă 20s) = ~40s pierduți
 * degeaba. La 40s prima încercare se termină → răspuns în ~15–25s, o singură dată.
 * Sub maxDuration=60 al proxy-ului. Interogările normale rămân rapide (1–3s). */
export const PROVIDER_TIMEOUT_MS = 40000;

/** Buget TOTAL pt întregul lanț (2026-08-20). Fără el, un lanț complet epuizat
 * (ex. mobil pe rețea proastă: toți cei 4 provideri ating timeout-ul) ar aștepta
 * 4×40s = ~160s de mort. Cu buget de 50s, per-pas = min(40s, rămas): prima
 * încercare (Gemini) încă are 40s pt un răspuns lung, dar worst-case-ul întregului
 * lanț e mărginit la ~50s, nu 160s. */
export const CHAIN_BUDGET_MS = 50000;

/** Plafon implicit de tokeni de ieșire (Chat). Teste/Școlare cer explicit mai mult
 * (16384) pt fișe lungi — vezi DEFAULT_MAX_TOKENS vs override-ul din opts. Măsurat
 * 2026-08-20 (scratchpad/token_probe.mjs): o fișă de 20 exerciții cu barem = ~4000
 * tokeni (finish=STOP), deci 8192 nu truncase deja; 16384 = headroom pt conținut
 * rar-verbos. Constrângerea reală e TIMPUL (~35s/20 ex.), nu tokenii — vezi opts.timeoutMs. */
export const DEFAULT_MAX_TOKENS = 8192;

/** Payload pentru Gemini (`contents` + `systemInstruction`, roluri user/model). */
export function buildGeminiPayload(
  system: string,
  messages: ChatMessage[],
  maxTokens: number = DEFAULT_MAX_TOKENS,
) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
  };
}

/** Payload OpenAI-compatible (Groq / Cerebras / Mistral). */
export function buildOpenAiPayload(
  model: string,
  system: string,
  messages: ChatMessage[],
  maxTokens: number = DEFAULT_MAX_TOKENS,
) {
  return {
    model,
    messages: [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    // Notă: pt providerii OpenAI-compatibili (Mistral) proxy-ul clampează la
    // MAX_TOKENS_CAP (8192) în MODEL_ALLOW — un maxTokens mai mare aici e onorat
    // doar de Gemini (care NU e în MODEL_ALLOW). Vezi route.ts.
    max_tokens: maxTokens,
    temperature: 0.3,
  };
}

/** Extrage textul răspunsului din JSON-ul provider-ului (Gemini vs OpenAI). */
export function parseReply(providerId: string, json: unknown): string {
  const j = json as Record<string, unknown>;
  if (providerId === "gemini" || providerId === "gemini2") {
    const cand = (
      j?.candidates as { content?: { parts?: { text?: string }[] } }[]
    )?.[0];
    return (cand?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .trim();
  }
  const choice = (j?.choices as { message?: { content?: string } }[])?.[0];
  return (choice?.message?.content || "").trim();
}

/**
 * True dacă providerul a TĂIAT răspunsul la limita de tokeni (nu a terminat).
 * Gemini: `finishReason:"MAX_TOKENS"`. OpenAI-compatibili: `finish_reason:"length"`.
 * UI-ul arată atunci butonul „Continuă răspunsul".
 */
export function isTruncated(providerId: string, json: unknown): boolean {
  const j = json as Record<string, unknown>;
  if (providerId === "gemini" || providerId === "gemini2") {
    const fr = (j?.candidates as { finishReason?: string }[])?.[0]
      ?.finishReason;
    return fr === "MAX_TOKENS";
  }
  const fr = (j?.choices as { finish_reason?: string }[])?.[0]?.finish_reason;
  return fr === "length";
}

/**
 * Trimite conversația prin lanț. Se oprește la primul provider care întoarce un
 * răspuns nevid. Colectează TOATE erorile (nu doar ultima) — la eșec total,
 * mesajul le enumeră pe toate, ca următoarea pică să fie auto-diagnosticabilă.
 * Fiecare apel are timeout propriu (AbortController): un provider care atârnă nu
 * blochează restul lanțului.
 */
/** Opțiuni per-apel. Chat = default-uri; Teste/Școlare cer mai mult (fișe lungi):
 * maxTokens 16384 + timeout/buget mai mari (sub plafonul hard 60s al proxy-ului). */
export interface SendChatOptions {
  maxTokens?: number;
  /** Timeout per provider (ms). Default PROVIDER_TIMEOUT_MS (40s). */
  timeoutMs?: number;
  /** Buget total pe lanț (ms). Default CHAIN_BUDGET_MS (50s). TREBUIE ≥ timeoutMs. */
  budgetMs?: number;
}

/** Opțiuni pt GENERAREA de fișe/teste (Școlare, Teste): mai mulți tokeni + mai mult
 * timp decât la Chat, sub plafonul hard de 60s al proxy-ului (maxDuration). Măsurat:
 * o fișă de 20 exerciții+barem ~35s. Beyond ~20-25 exerciții → auto-continuare (baremul
 * ajunge mereu — fișă validă pt elevi). */
export const GENERATION_OPTS: SendChatOptions = {
  maxTokens: 16384,
  timeoutMs: 52000,
  budgetMs: 58000,
};

export async function sendChat(
  messages: ChatMessage[],
  system: string,
  opts: SendChatOptions = {},
): Promise<ChatResult> {
  const maxTokens = opts.maxTokens ?? DEFAULT_MAX_TOKENS;
  const stepTimeout = opts.timeoutMs ?? PROVIDER_TIMEOUT_MS;
  // Bugetul nu poate fi sub timeout-ul unui pas (altfel garda l-ar ucide înainte
  // să apuce să ruleze) — vezi capcana prinsă de advisor 2026-08-20.
  const budget = Math.max(opts.budgetMs ?? CHAIN_BUDGET_MS, stepTimeout + 3000);
  const errors: string[] = [];
  const chainStart = Date.now();
  for (const step of CHAIN) {
    // Buget total pe lanț: dacă timpul rămas e prea mic pt o încercare utilă,
    // oprim în loc să lăsăm worst-case-ul să crească nemărginit (mobil epuizat).
    const remaining = budget - (Date.now() - chainStart);
    if (remaining <= 1000) {
      errors.push("buget lanț depășit");
      break;
    }
    try {
      const body =
        step.format === "gemini"
          ? buildGeminiPayload(system, messages, maxTokens)
          : buildOpenAiPayload(step.model || "", system, messages, maxTokens);
      const ctrl = new AbortController();
      // Per-pas = min(timeout provider, timp rămas din bugetul total).
      const timer = setTimeout(
        () => ctrl.abort(),
        Math.min(stepTimeout, remaining),
      );
      let res: Response;
      let json: unknown;
      // `finally` acoperă fetch() ȘI res.json() — găsit la code review:
      // clearTimeout rula imediat după ce soseau header-ele (fetch() rezolvat),
      // ÎNAINTE de citirea corpului. Un provider care trimite header-e și apoi
      // îngheață la mijlocul corpului lăsa res.json() fără NICIUN timeout —
      // sendChat rămânea agățat la infinit, blocând tot tab-ul (Teste/Școlare
      // au un singur `status` comun, deci butonul principal rămânea dezactivat
      // permanent). ctrl.signal rămâne legat de fetch pe toată durata (spec-ul
      // fetch propagă abort-ul și la citirea streaming a corpului).
      try {
        res = await fetch(`/api/proxy?provider=${step.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          errors.push(`${step.label}: HTTP ${res.status}`);
          continue;
        }
        json = await res.json();
      } finally {
        clearTimeout(timer);
      }
      const reply = parseReply(step.id, json);
      if (reply)
        return {
          ok: true,
          reply,
          provider: step.label,
          truncated: isTruncated(step.id, json),
        };
      errors.push(`${step.label}: răspuns gol`);
    } catch (e) {
      const err = e as Error;
      const msg =
        err?.name === "AbortError" ? "timeout" : err?.message || "eroare rețea";
      errors.push(`${step.label}: ${msg}`);
    }
  }
  return {
    ok: false,
    error: `Niciun provider AI n-a răspuns. Detalii: ${errors.join(" · ")}`,
    errors,
  };
}
