/**
 * Lanț AI cu fallback pentru Chat (2026-08-04). Reutilizează ruta same-origin
 * securizată `/api/proxy` (chei server-side, rate-limit, cost-cap). Încearcă
 * providerii ÎN ORDINE: Gemini Flash → Groq 70B → OpenRouter (70B free). Primul
 * care răspunde câștigă; `provider` (eticheta) alimentează indicatorul de stare.
 *
 * `buildGeminiPayload`/`buildOpenAiPayload`/`parseReply` sunt PURE (testabile);
 * `sendChat` face fetch-ul (chain).
 */

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatResult =
  { ok: true; reply: string; provider: string } | { ok: false; error: string };

export type ProviderStep = { id: string; label: string; model?: string };

/** Lanțul confirmat de Roland. OpenRouter = modelul FREE 70B (0 cost; fallback rar). */
export const CHAIN: ProviderStep[] = [
  { id: "gemini", label: "Gemini Flash" },
  { id: "groq", label: "Groq 70B", model: "llama-3.3-70b-versatile" },
  {
    id: "openrouter",
    label: "OpenRouter",
    model: "meta-llama/llama-3.3-70b-instruct:free",
  },
];

/** Payload pentru Gemini (`contents` + `systemInstruction`, roluri user/model). */
export function buildGeminiPayload(system: string, messages: ChatMessage[]) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
  };
}

/** Payload OpenAI-compatible (Groq / OpenRouter). */
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
    max_tokens: 2048,
    temperature: 0.3,
  };
}

/** Extrage textul răspunsului din JSON-ul provider-ului. */
export function parseReply(providerId: string, json: unknown): string {
  const j = json as Record<string, unknown>;
  if (providerId === "gemini") {
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
 * Trimite conversația prin lanț. Se oprește la primul provider care întoarce un
 * răspuns nevid. Returnează eticheta provider-ului pentru indicator.
 */
export async function sendChat(
  messages: ChatMessage[],
  system: string,
): Promise<ChatResult> {
  let lastError = "necunoscut";
  for (const step of CHAIN) {
    try {
      const body =
        step.id === "gemini"
          ? buildGeminiPayload(system, messages)
          : buildOpenAiPayload(step.model || "", system, messages);
      const res = await fetch(`/api/proxy?provider=${step.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        lastError = `${step.label}: HTTP ${res.status}`;
        continue;
      }
      const json = await res.json();
      const reply = parseReply(step.id, json);
      if (reply) return { ok: true, reply, provider: step.label };
      lastError = `${step.label}: răspuns gol`;
    } catch (e) {
      lastError = `${step.label}: ${(e as Error).message || "eroare rețea"}`;
    }
  }
  return {
    ok: false,
    error: `Niciun provider AI n-a răspuns (${lastError}).`,
  };
}
