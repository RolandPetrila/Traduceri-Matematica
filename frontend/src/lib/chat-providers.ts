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
  /** Plafon propriu al PASULUI (ms), dacă diferă de `opts.timeoutMs` flat.
   * Faza 4.5c (2026-09-10): pe calea de generare (vezi GENERATION_CHAIN), fiecare
   * provider are un plafon dimensionat pe distribuția LUI reală — un Gemini lent nu
   * mai poate mânca tot bugetul din fața unui fallback rapid dovedit (Groq). */
  timeoutMs?: number;
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

/**
 * Lanț dedicat căii de GENERARE (Teste/Școlare, `GENERATION_OPTS` mai jos) — Faza
 * 4.5c (2026-09-10, P2). NU e o reordonare a `CHAIN` de bază (ar fi atins și Chat,
 * R-EXT) — e un array SEPARAT, transmis explicit prin `SendChatOptions.chain`.
 * `CHAIN` (Chat) rămâne complet neatins.
 *
 * De ce reordonat gemini→groq→gemini2 (nu gemini→gemini2 ca la Chat): măsurat
 * 2026-09-10 (`scratchpad/p2_measure_fallback_providers.mjs`) — Groq (gpt-oss-20b)
 * răspunde la ACEST caz greu în 3.6-4.3s; gemini2 e aceeași infrastructură/model ca
 * gemini (probabil aceeași distribuție lentă) — un candidat slab pt o fereastră
 * scurtă. Punând Groq al doilea, fereastra rămasă (vezi budgetMs) merge la
 * fallback-ul cu șanse reale de succes RAPID, nu la o a doua încercare la fel de lentă.
 *
 * De ce timeoutMs per pas (nu un flat comun): măsurat pe cazul cel mai greu folosit
 * de Cristina (Radicali/VII/greu/10 itemi/barem, 10 rulări live +
 * istoric Supabase segmentat pe eră): Gemini succes p90=41237ms, max live=42961ms —
 * un plafon de 45000ms acoperă marea majoritate a succeselor legitime (nu doar
 * eșecurile agățate). Groq: 15000ms e generos față de cei 3.6-4.3s măsurați.
 * Gemini2: 40000ms — presupus similar cu gemini (n-am date curate, doar 2 mostre
 * istorice, ambele tăiate artificial la 6s de designul VECHI). Mistral/Mistral2:
 * 15000ms fiecare — la data măsurării erau indisponibile (429 „Rate limit exceeded"
 * pe AMBELE chei, persistent, nu vârf trecător — problemă separată, raportată în
 * `docs/PLAN_FAZA4.5C_TIMEOUT_LANT_AI_2026-09-10.md`), dar rămân în lanț pt când
 * își revin — un 429 eșuează aproape instant, nu consumă bugetul alocat.
 */
export const GENERATION_CHAIN: ProviderStep[] = [
  { id: "gemini", label: "Gemini Flash", format: "gemini", timeoutMs: 45000 },
  {
    id: "groq",
    label: "Groq (gpt-oss-20b)",
    model: "openai/gpt-oss-20b",
    format: "openai",
    timeoutMs: 15000,
  },
  {
    id: "gemini2",
    label: "Gemini Flash (2)",
    format: "gemini",
    timeoutMs: 40000,
  },
  {
    id: "mistral",
    label: "Mistral Small",
    model: "mistral-small-latest",
    format: "openai",
    timeoutMs: 15000,
  },
  {
    id: "mistral2",
    label: "Mistral Small (2)",
    model: "mistral-small-latest",
    format: "openai",
    timeoutMs: 15000,
  },
];

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
  /** Timeout per provider (ms) — folosit ca fallback pt orice pas FĂRĂ `timeoutMs`
   * propriu (vezi `ProviderStep.timeoutMs`). Default PROVIDER_TIMEOUT_MS (40s). */
  timeoutMs?: number;
  /** Buget total pe lanț (ms). Default CHAIN_BUDGET_MS (50s). TREBUIE ≥ timeout-ul
   * PRIMULUI pas din `chain` (altfel garda de mai jos îl ridică oricum). */
  budgetMs?: number;
  /** Lanț custom (Faza 4.5c, 2026-09-10) — implicit `CHAIN` (Chat, neatins).
   * Teste/Școlare trimit `GENERATION_CHAIN` (ordine + plafoane proprii pt calea grea). */
  chain?: ProviderStep[];
}

/** Opțiuni pt GENERAREA de fișe/teste (Școlare, Teste): mai mulți tokeni, `GENERATION_CHAIN`
 * (ordine + plafoane proprii, nu `CHAIN` de Chat) și un buget mult mai mare.
 *
 * Istoric: până la Faza 4.5c (2026-09-10), `timeoutMs: 52000, budgetMs: 58000` — defect
 * ARITMETIC găsit atunci: `58000 − 52000 = 6000ms` rămâneau restului lanțului de fiecare
 * dată când primul provider atingea propriul timeout — insuficient pt oricare din
 * ceilalți 4, INDIFERENT de reproducere (verificat pe incidentul din 2026-09-09: 4 din 5
 * provideri au 0 succese înregistrate de la introducerea acestor constante). Verificat
 * ATUNCI (nu presupus): `sendChat` rulează CLIENT-SIDE (browser, apelat din componente
 * "use client" — TestePanel.tsx/ScolarePanel.tsx), fiecare `fetch('/api/proxy?...')` e o
 * invocare serverless SEPARATĂ, deci `maxDuration=60` din `route.ts` mărginește FIECARE
 * PAS în parte, NU bugetul total orchestrat în browser — bugetul total NU are plafon de
 * platformă, doar de UX (cât așteaptă rezonabil Cristina).
 *
 * Fix (Faza 4.5c): `budgetMs` ridicat la 110000 (nu mai era plafonat de `maxDuration`),
 * `GENERATION_CHAIN` dă fiecărui pas plafonul lui NOMINAL (45s Gemini + 15s Groq + 40s
 * Gemini2 + 15s+15s Mistral/Mistral2 = 130000ms teoretic — bugetul de 110000ms acoperă
 * cele 3 încercări realiste, gemini+groq+gemini2, în ÎNTREGIME: 45000+15000+40000=100000).
 * Worst-case Cristina: ~100-110s și un test, în loc de ~58s și o eroare (compromis
 * confirmat explicit de Roland). Măsurat: o fișă de 20 exerciții+barem ~35s. */
export const GENERATION_OPTS: SendChatOptions = {
  maxTokens: 16384,
  timeoutMs: 40000,
  budgetMs: 110000,
  chain: GENERATION_CHAIN,
};

export async function sendChat(
  messages: ChatMessage[],
  system: string,
  opts: SendChatOptions = {},
): Promise<ChatResult> {
  const maxTokens = opts.maxTokens ?? DEFAULT_MAX_TOKENS;
  const stepTimeout = opts.timeoutMs ?? PROVIDER_TIMEOUT_MS;
  const chain = opts.chain ?? CHAIN;
  // Bugetul nu poate fi sub timeout-ul PRIMULUI pas (altfel garda l-ar ucide înainte
  // să apuce să ruleze) — vezi capcana prinsă de advisor 2026-08-20.
  const firstStepTimeout = chain[0]?.timeoutMs ?? stepTimeout;
  const budget = Math.max(
    opts.budgetMs ?? CHAIN_BUDGET_MS,
    firstStepTimeout + 3000,
  );
  const errors: string[] = [];
  const chainStart = Date.now();
  for (const step of chain) {
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
      // Per-pas = min(timeout PROPRIU al pasului (sau flat-ul din opts), timp rămas
      // din bugetul total).
      const timer = setTimeout(
        () => ctrl.abort(),
        Math.min(step.timeoutMs ?? stepTimeout, remaining),
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

/**
 * Monitorizare pe calea de GENERARE (Faza 4.5c, 2026-09-10, cerut de Roland): „ce
 * provider a servit + durata + rezultatul" — altfel „monitorizat" din închiderea 🟡
 * a P2 e o promisiune goală. Apelat EXPLICIT de la locurile de apel (TestePanel.tsx,
 * ScolarePanel.tsx) după fiecare `sendChat(..., GENERATION_OPTS)`, NU automat din
 * interiorul `sendChat` — `sendChat` rămâne neatins comportamental (nu adaugă un
 * apel `fetch` suplimentar care ar strica numărătorile din testele existente pe
 * `CHAIN`/Chat). Scrie în Supabase (`logs`, nivel info/warn) cu `context.flow`,
 * `context.provider`, `context.ms` — interogabil direct, nu mai trebuie reconstruit
 * din log-urile brute `/api/proxy` (cum a trebuit făcut manual la măsurarea P2).
 */
export function logGenerationResult(
  flow: string,
  ms: number,
  r: ChatResult,
  extraContext?: Record<string, unknown>,
): void {
  // Import dinamic (nu la nivel de modul): chat-providers.ts e testat des cu
  // `global.fetch` mockuit direct (chat.test.ts) — un import static de monitoring.ts
  // ar lega inutil acest fișier de `logInfo`/`logWarn` pt teste care nu le ating.
  import("./monitoring")
    .then(({ logInfo, logWarn }) => {
      if (r.ok) {
        logInfo(
          `${flow} | provider=${r.provider} | ${ms}ms | truncated=${r.truncated}`,
          {
            flow,
            provider: r.provider,
            ms,
            truncated: r.truncated,
            ...extraContext,
          },
        );
      } else {
        logWarn(`${flow} | eșec după ${ms}ms | ${r.errors.join(" · ")}`, {
          context: { flow, ms, errors: r.errors, ...extraContext },
        });
      }
    })
    .catch(() => {
      // Monitorizarea nu trebuie NICIODATĂ să rupă fluxul principal de generare.
    });
}
