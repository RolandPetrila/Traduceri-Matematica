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
export const CHAIN: ProviderStep[] = [
  { id: "gemini", label: "Gemini Flash", format: "gemini" },
  { id: "gemini2", label: "Gemini Flash (2)", format: "gemini" },
  {
    id: "cerebras",
    label: "Cerebras 120B",
    model: "gpt-oss-120b",
    format: "openai",
  },
  {
    id: "groq",
    label: "Groq 70B",
    model: "llama-3.3-70b-versatile",
    format: "openai",
  },
  {
    id: "mistral",
    label: "Mistral Large",
    model: "mistral-large-latest",
    format: "openai",
  },
  {
    id: "mistral2",
    label: "Mistral Large (2)",
    model: "mistral-large-latest",
    format: "openai",
  },
];

/** Timeout per provider — un provider blocat nu mai mănâncă bugetul întregului lanț. */
export const PROVIDER_TIMEOUT_MS = 20000;

/** Payload pentru Gemini (`contents` + `systemInstruction`, roluri user/model). */
export function buildGeminiPayload(system: string, messages: ChatMessage[]) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    // 8192 (plafonul proxy MAX_TOKENS_CAP) — raspunsuri lungi (ex. 9 limite
    // pas-cu-pas) nu se mai taie la ~2048. Backstop pt orice lungime = butonul
    // „Continua" (vezi isTruncated). Modelele suporta 8192 (Gemini 2.5 Flash 65k).
    generationConfig: { maxOutputTokens: 8192, temperature: 0.3 },
  };
}

/** Payload OpenAI-compatible (Groq / Cerebras / Mistral). */
export function buildOpenAiPayload(
  model: string,
  system: string,
  messages: ChatMessage[],
) {
  return {
    model,
    messages: [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 8192, // plafonul proxy; vezi nota din buildGeminiPayload
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
export async function sendChat(
  messages: ChatMessage[],
  system: string,
): Promise<ChatResult> {
  const errors: string[] = [];
  for (const step of CHAIN) {
    try {
      const body =
        step.format === "gemini"
          ? buildGeminiPayload(system, messages)
          : buildOpenAiPayload(step.model || "", system, messages);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), PROVIDER_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(`/api/proxy?provider=${step.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) {
        errors.push(`${step.label}: HTTP ${res.status}`);
        continue;
      }
      const json = await res.json();
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
