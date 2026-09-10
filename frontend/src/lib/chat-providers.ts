/**
 * Lanț AI cu fallback (2026-08-05, extins pe dovadă; Chat eliminat Faza 4.5d,
 * 2026-09-11 — modulul deservește acum GENERARE Teste/Școlare + CORECTARE lucrări
 * elevi). Reutilizează ruta same-origin securizată `/api/proxy` (chei server-side,
 * rate-limit, cost-cap). Încearcă providerii dintr-un `chain` explicit, ÎN ORDINE;
 * primul care răspunde câștigă; `provider` (eticheta) alimentează indicatorul de stare.
 *
 * Două lanțuri VII, independente (nu se amestecă — vezi `chain.test.ts`):
 *   `GENERATION_CHAIN` — Gemini → Groq → Gemini(2) → Mistral → Mistral(2), free-tier.
 *   `CORRECTION_CHAIN` — Gemini (plătit) → retry, pt lucrări de elevi (confidențial).
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
  /** Plafon propriu de tokeni de ieșire al PASULUI, dacă diferă de `opts.maxTokens`
   * flat. Faza 4.5d (2026-09-11): Groq are plafon 8000 TPM — cerând `maxTokens`
   * identic cu Gemini (16384, de 2× peste) garanta aproape sigur 429 când Groq era
   * atins ca fallback. Doar pasul Groq îl suprascrie; Gemini rămâne pe flat. */
  maxTokens?: number;
};

/** Plafon implicit de tokeni de ieșire. Teste/Școlare cer explicit mai mult
 * (16384) pt fișe lungi — vezi DEFAULT_MAX_TOKENS vs override-ul din opts. Măsurat
 * 2026-08-20 (scratchpad/token_probe.mjs): o fișă de 20 exerciții cu barem = ~4000
 * tokeni (finish=STOP), deci 8192 nu truncase deja; 16384 = headroom pt conținut
 * rar-verbos. Constrângerea reală e TIMPUL (~35s/20 ex.), nu tokenii — vezi opts.timeoutMs. */
export const DEFAULT_MAX_TOKENS = 8192;

/**
 * Lanț dedicat căii de GENERARE (Teste/Școlare, `GENERATION_OPTS` mai jos) — Faza
 * 4.5c (2026-09-10, P2). Array SEPARAT, transmis explicit prin `SendChatOptions.chain`
 * (`chain` e obligatoriu — orice apel `sendChat` trebuie să-l trimită, vezi mai jos).
 *
 * De ce reordonat gemini→groq→gemini2 (nu gemini→gemini2 ca vechiul Chat): măsurat
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
 *
 * `maxTokens: 6000` pe pasul Groq (Faza 4.5d, 2026-09-11): Groq are plafon **8000
 * TPM** (confirmat din mesajul exact al providerului) — cerând 16384 (flat, la fel
 * ca Gemini) de 2× depășea plafonul, deci 429 aproape garantat la a treia încercare
 * din măsurătoarea Fazei 4.5c. 6000 + ~1200 tokeni de prompt tipic = ~7200, sub
 * 8000, într-o SINGURĂ cerere; acoperă confortabil fișele tipice (~4000 tokeni
 * măsurați, Faza 4.5c). Risc rezidual NEREZOLVAT aici, semnalat de Roland: dacă
 * generarea se continuă (butonul „Continuă", `teste.generate.continue`/
 * `scolare.generate.continua`) și lanțul cascadează la Groq DE DOUĂ ORI în aceeași
 * fereastră de 60s, cele două cereri însumate (6000+6000) tot depășesc 8000 TPM —
 * fiecare cerere individuală respectă plafonul, dar nu și perechea. Nu tratat încă.
 */
export const GENERATION_CHAIN: ProviderStep[] = [
  { id: "gemini", label: "Gemini Flash", format: "gemini", timeoutMs: 45000 },
  {
    id: "groq",
    label: "Groq (gpt-oss-20b)",
    model: "openai/gpt-oss-20b",
    format: "openai",
    timeoutMs: 15000,
    maxTokens: 6000,
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
  if (
    providerId === "gemini" ||
    providerId === "gemini2" ||
    providerId === "gemini_paid"
  ) {
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
  if (
    providerId === "gemini" ||
    providerId === "gemini2" ||
    providerId === "gemini_paid"
  ) {
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
/** Timeout implicit per provider (ms), folosit DOAR când apelantul omite `timeoutMs`
 * ȘI pasul curent n-are `timeoutMs` propriu — în practică GENERATION_OPTS/CORRECTION_OPTS
 * setează ambele, deci e o plasă de siguranță, nu o cale exercitată azi. */
const DEFAULT_STEP_TIMEOUT_MS = 40000;
/** Buget total implicit pe lanț (ms) — aceeași plasă de siguranță ca mai sus. */
const DEFAULT_CHAIN_BUDGET_MS = 50000;

/** Opțiuni per-apel — `chain` e OBLIGATORIU (Faza 4.5d, 2026-09-11: nu mai există un
 * lanț implicit de Chat; fiecare apelant trimite explicit `GENERATION_CHAIN` sau
 * `CORRECTION_CHAIN`, ca TypeScript să prindă orice apel viitor care-l omite). */
export interface SendChatOptions {
  maxTokens?: number;
  /** Timeout per provider (ms) — folosit ca fallback pt orice pas FĂRĂ `timeoutMs`
   * propriu (vezi `ProviderStep.timeoutMs`). Default `DEFAULT_STEP_TIMEOUT_MS`. */
  timeoutMs?: number;
  /** Buget total pe lanț (ms). Default `DEFAULT_CHAIN_BUDGET_MS`. TREBUIE ≥ timeout-ul
   * PRIMULUI pas din `chain` (altfel garda de mai jos îl ridică oricum). */
  budgetMs?: number;
  /** Lanțul de provideri de încercat, în ordine (Faza 4.5c/4.5d — `GENERATION_CHAIN`
   * pt Teste/Școlare, `CORRECTION_CHAIN` pt corectarea lucrărilor elevilor). */
  chain: ProviderStep[];
}

/** Opțiuni pt GENERAREA de fișe/teste (Școlare, Teste): mai mulți tokeni, `GENERATION_CHAIN`
 * și un buget mult mai mare.
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

/**
 * Lanț dedicat corectării lucrărilor elevilor (Teste → Corectare) — Faza 4.5d
 * (2026-09-11). Folosește cheia PLĂTITĂ (`gemini_paid`, proiect Google Cloud „Traduceri",
 * Tier 1 Postpay) — termenii free-tier Google permit explicit „human reviewers may
 * read, annotate, and process your API input and output"; lucrarea unui elev nu
 * trece prin acel tier. Deliberat FĂRĂ Groq/Mistral: ar trimite conținutul elevului
 * la alți procesatori free, aceeași problemă de confidențialitate. Al doilea pas
 * repetă `gemini_paid` (retry pe transitoriu), nu un provider diferit — singura
 * rezervă compatibilă cu scopul de confidențialitate. Dacă ambele încercări eșuează,
 * corectarea eșuează vizibil (mesaj de eroare), nu cade silențios pe un tier
 * neconfidențial.
 */
export const CORRECTION_CHAIN: ProviderStep[] = [
  {
    id: "gemini_paid",
    label: "Gemini Flash (plătit)",
    format: "gemini",
    timeoutMs: 45000,
  },
  {
    id: "gemini_paid",
    label: "Gemini Flash (plătit, retry)",
    format: "gemini",
    timeoutMs: 45000,
  },
];

/** Opțiuni pt CORECTAREA lucrărilor elevilor (Teste → Corectare) — cheie plătită,
 * `CORRECTION_CHAIN`. Aceleași plafoane de tokeni/timp ca `GENERATION_OPTS`, buget
 * mai mic (2 pași × 45s + marjă, nu 5). */
export const CORRECTION_OPTS: SendChatOptions = {
  maxTokens: 16384,
  timeoutMs: 45000,
  budgetMs: 95000,
  chain: CORRECTION_CHAIN,
};

export async function sendChat(
  messages: ChatMessage[],
  system: string,
  opts: SendChatOptions,
): Promise<ChatResult> {
  const maxTokens = opts.maxTokens ?? DEFAULT_MAX_TOKENS;
  const stepTimeout = opts.timeoutMs ?? DEFAULT_STEP_TIMEOUT_MS;
  const chain = opts.chain;
  // Bugetul nu poate fi sub timeout-ul PRIMULUI pas (altfel garda l-ar ucide înainte
  // să apuce să ruleze) — vezi capcana prinsă de advisor 2026-08-20.
  const firstStepTimeout = chain[0]?.timeoutMs ?? stepTimeout;
  const budget = Math.max(
    opts.budgetMs ?? DEFAULT_CHAIN_BUDGET_MS,
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
      // Per-pas: `step.maxTokens` suprascrie flat-ul din opts (vezi ProviderStep —
      // Faza 4.5d, plafonul TPM al Groq).
      const stepMaxTokens = step.maxTokens ?? maxTokens;
      const body =
        step.format === "gemini"
          ? buildGeminiPayload(system, messages, stepMaxTokens)
          : buildOpenAiPayload(
              step.model || "",
              system,
              messages,
              stepMaxTokens,
            );
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
 * apel `fetch` suplimentar care ar strica numărătorile din testele de fallback).
 * Scrie în Supabase (`logs`, nivel info/warn) cu `context.flow`,
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
