import {
  buildGeminiPayload,
  buildOpenAiPayload,
  parseReply,
  isTruncated,
  sendChat,
  GENERATION_CHAIN,
  GENERATION_OPTS,
  CORRECTION_CHAIN,
  CORRECTION_OPTS,
  type ProviderStep,
} from "./chat-providers";
import { buildSystemPrompt, buildLibraryIndex } from "./chat-context";

describe("chat-providers · payloads", () => {
  const msgs = [
    { role: "user" as const, content: "cât e 2+2?" },
    { role: "assistant" as const, content: "4" },
    { role: "user" as const, content: "și 3+3?" },
  ];

  it("Gemini: contents cu roluri user/model + systemInstruction", () => {
    const p = buildGeminiPayload("SYS", msgs);
    expect(p.systemInstruction.parts[0].text).toBe("SYS");
    expect(p.contents.map((c) => c.role)).toEqual(["user", "model", "user"]);
    expect(p.contents[0].parts[0].text).toBe("cât e 2+2?");
  });

  it("OpenAI (Groq/Cerebras/Mistral): system + messages, model setat", () => {
    const p = buildOpenAiPayload("openai/gpt-oss-20b", "SYS", msgs);
    expect(p.model).toBe("openai/gpt-oss-20b");
    expect(p.messages[0]).toEqual({ role: "system", content: "SYS" });
    expect(p.messages).toHaveLength(4);
  });

  it("parseReply extrage textul din ambele formate (gemini + gemini2 = Gemini)", () => {
    const gem = {
      candidates: [{ content: { parts: [{ text: "răspuns gemini" }] } }],
    };
    expect(parseReply("gemini", gem)).toBe("răspuns gemini");
    expect(parseReply("gemini2", gem)).toBe("răspuns gemini"); // a doua cheie = format Gemini
    const oai = { choices: [{ message: { content: "răspuns groq" } }] };
    expect(parseReply("groq", oai)).toBe("răspuns groq");
    expect(parseReply("gemini", {})).toBe("");
  });

  it("isTruncated detectează tăierea la limita de tokeni (ambele formate)", () => {
    // Gemini: finishReason MAX_TOKENS = tăiat; STOP = complet
    expect(
      isTruncated("gemini", { candidates: [{ finishReason: "MAX_TOKENS" }] }),
    ).toBe(true);
    expect(
      isTruncated("gemini2", { candidates: [{ finishReason: "MAX_TOKENS" }] }),
    ).toBe(true);
    expect(
      isTruncated("gemini", { candidates: [{ finishReason: "STOP" }] }),
    ).toBe(false);
    // OpenAI: finish_reason length = tăiat; stop = complet
    expect(
      isTruncated("groq", { choices: [{ finish_reason: "length" }] }),
    ).toBe(true);
    expect(isTruncated("groq", { choices: [{ finish_reason: "stop" }] })).toBe(
      false,
    );
    expect(isTruncated("groq", {})).toBe(false);
  });
});

describe("sendChat · fallback + instrumentare", () => {
  // Fixture local (Faza 4.5d: `chain` e obligatoriu, nu mai există un CHAIN
  // implicit de Chat) — testează mecanismul GENERIC de fallback al `sendChat`
  // (primul răspuns câștigă, sare peste eșec, colectează toate erorile), NU
  // conținutul exact al GENERATION_CHAIN/CORRECTION_CHAIN de producție.
  const TEST_CHAIN: ProviderStep[] = [
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
  const geminiOk = {
    candidates: [{ content: { parts: [{ text: "salut" }] } }],
  };
  const mkRes = (status: number, json: unknown) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => json,
  });
  const q = [{ role: "user" as const, content: "salut" }];

  afterEach(() => {
    (global.fetch as unknown as jest.Mock)?.mockReset?.();
  });

  it("întoarce primul provider care răspunde și NU mai încearcă restul", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(mkRes(200, geminiOk));
    const r = await sendChat(q, "SYS", { chain: TEST_CHAIN });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.provider).toBe("Gemini Flash");
    expect((global.fetch as unknown as jest.Mock).mock.calls).toHaveLength(1);
    if (r.ok) expect(r.truncated).toBe(false); // STOP implicit = complet
  });

  it("marchează truncated=true când răspunsul e tăiat (MAX_TOKENS)", async () => {
    const cut = {
      candidates: [
        {
          content: { parts: [{ text: "a) ..." }] },
          finishReason: "MAX_TOKENS",
        },
      ],
    };
    global.fetch = jest.fn().mockResolvedValueOnce(mkRes(200, cut));
    const r = await sendChat(q, "SYS", { chain: TEST_CHAIN });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.truncated).toBe(true);
  });

  it("sare peste un provider picat și reușește pe următorul", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(mkRes(500, { error: "x" })) // gemini
      .mockResolvedValueOnce(mkRes(200, geminiOk)); // gemini2
    const r = await sendChat(q, "SYS", { chain: TEST_CHAIN });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.provider).toBe(TEST_CHAIN[1].label);
  });

  it("la eșec total colectează TOATE erorile (nu doar ultima)", async () => {
    global.fetch = jest.fn().mockResolvedValue(mkRes(429, { error: "rate" }));
    const r = await sendChat(q, "SYS", { chain: TEST_CHAIN });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors).toHaveLength(TEST_CHAIN.length); // câte o eroare per provider
      expect(r.errors.every((e) => e.includes("HTTP 429"))).toBe(true);
      expect(r.error).toContain("Gemini Flash");
      expect(r.error).toContain("Mistral Small (2)");
    }
    expect((global.fetch as unknown as jest.Mock).mock.calls).toHaveLength(
      TEST_CHAIN.length,
    );
  });
});

describe("chat-context · system prompt", () => {
  it("prompt-ul e specializat matematică + știe aplicația", () => {
    const p = buildSystemPrompt();
    expect(p).toMatch(/MATEMATIC/i);
    expect(p).toMatch(/\$\.\.\.\$/); // instrucțiune formule
    expect(p).toMatch(/Calculator/); // cunoaște modulele
  });

  it("indexul bibliotecii listează clase cu grupuri", () => {
    const idx = buildLibraryIndex();
    expect(idx).toMatch(/clasa (V|VI|VII|VIII)/);
  });

  it("docContext se include când e dat", () => {
    const p = buildSystemPrompt("TEXT_DOCUMENT_CURENT");
    expect(p).toContain("TEXT_DOCUMENT_CURENT");
  });
});

/**
 * Faza 4.5c (2026-09-10, P2) — defectul era ARITMETIC, nu statistic: cu
 * timeoutMs=52000/budgetMs=58000 (flat), primul provider care atingea propriul
 * timeout lăsa doar 6000ms restului lanțului — insuficient matematic pt oricare
 * din ceilalți, INDIFERENT dacă rulările reușesc sau nu (verificat pe cifrele
 * reale din incidentul 2026-09-09). Testul de mai jos rulează pe CONSTANTELE
 * VII (nu pe copii hardcodate) — dacă cineva reintroduce vechiul raport
 * 52000/58000, testul PICĂ, fără să fie nevoie să reproducă vreun eșec de rețea.
 * Echivalentul contra-probei din Faza 4.5b (fix revenit temporar → testele pică).
 */
describe("GENERATION_CHAIN · realocarea bugetului (Faza 4.5c, P2)", () => {
  // Groq (gpt-oss-20b) măsurat 3.6-4.3s pe cazul cel mai greu folosit de Cristina
  // (scratchpad/p2_measure_fallback_providers.mjs, 2026-09-10) — 10s e o marjă
  // reală de siguranță, nu un fir de păr peste minimul observat.
  const MIN_FALLBACK_WINDOW_MS = 10000;
  const REALISTIC_ATTEMPT_IDS = ["gemini", "groq", "gemini2"];

  it("gemini, groq ȘI gemini2 primesc FIECARE timeout-ul lor nominal ÎNTREG din buget — nu un rest trunchiat", () => {
    let elapsed = 0;
    for (const step of GENERATION_CHAIN) {
      const remaining = (GENERATION_OPTS.budgetMs as number) - elapsed;
      const nominal = step.timeoutMs as number;
      const available = Math.min(nominal, remaining);
      if (REALISTIC_ATTEMPT_IDS.includes(step.id)) {
        // Dacă bugetul ar fi prea mic pt alocarea asta (cum era în raportul
        // vechi), `available` ar fi TRUNCHIAT sub `nominal` — testul pică aici.
        expect(available).toBe(nominal);
        expect(available).toBeGreaterThanOrEqual(MIN_FALLBACK_WINDOW_MS);
      }
      // Worst-case pt pasul URMĂTOR: acest pas își consumă TOT alocatul (timeout).
      elapsed += available;
    }
  });

  it("CONTRA-PROBA: raportul de dinainte de fix (timeoutMs 52000 / budgetMs 58000, flat) lăsa <10s celui de-al doilea provider — constantele live trebuie să rămână departe de acel raport", () => {
    const oldFlatStepTimeout = 52000;
    const oldFlatBudget = 58000;
    const secondProviderWouldGet = oldFlatBudget - oldFlatStepTimeout;
    expect(secondProviderWouldGet).toBeLessThan(MIN_FALLBACK_WINDOW_MS); // documentează defectul vechi

    // Gardă explicită: dacă cineva revine la exact aceste constante, testul pică.
    expect(GENERATION_OPTS.budgetMs).not.toBe(oldFlatBudget);
    expect(GENERATION_CHAIN[0].timeoutMs).not.toBe(oldFlatStepTimeout);
    expect(GENERATION_OPTS.budgetMs as number).toBeGreaterThanOrEqual(
      (GENERATION_CHAIN[0].timeoutMs as number) +
        (GENERATION_CHAIN[1].timeoutMs as number) +
        (GENERATION_CHAIN[2].timeoutMs as number),
    ); // budgetul acoperă ÎNTREG cele 3 încercări realiste, nu doar prima
  });

  // Faza 4.5d (2026-09-11): Chat (și CHAIN) au fost eliminate — garda de mai jos
  // înlocuiește testul „CHAIN rămâne neatins" cu ce contează acum: cele DOUĂ
  // lanțuri vii (GENERATION_CHAIN, CORRECTION_CHAIN — cheie plătită, corectarea
  // lucrărilor elevilor) nu se amestecă, ca o modificare la unul să nu „scurgă"
  // silențios în celălalt.
  it("GENERATION_CHAIN și CORRECTION_CHAIN sunt independente — niciun id comun, opțiuni separate", () => {
    expect(GENERATION_OPTS.chain).not.toBe(CORRECTION_OPTS.chain);
    const generationIds = new Set(GENERATION_CHAIN.map((c) => c.id));
    const correctionIds = CORRECTION_CHAIN.map((c) => c.id);
    correctionIds.forEach((id) => {
      expect(generationIds.has(id)).toBe(false);
    });
    // CORRECTION_CHAIN nu conține niciun provider free (Groq/Mistral) — vezi
    // motivul de confidențialitate din chat-providers.ts.
    expect(CORRECTION_CHAIN.every((c) => c.id === "gemini_paid")).toBe(true);
  });

  it("GENERATION_CHAIN reordonează Groq înaintea lui gemini2 (fallback rapid dovedit, nu o a doua încercare lentă)", () => {
    expect(GENERATION_CHAIN.map((c) => c.id)).toEqual([
      "gemini",
      "groq",
      "gemini2",
      "mistral",
      "mistral2",
    ]);
  });

  // Faza 4.5d (2026-09-11): Groq are plafon 8000 TPM — cerând 16384 (flat, ca
  // Gemini) garanta 429 la a treia încercare (măsurat în Faza 4.5c). Gardă
  // explicită: dacă cineva șterge `maxTokens` de pe pasul Groq, sau îl adaugă
  // din greșeală pe Gemini, testul pică.
  it("DOAR pasul Groq are maxTokens redus (6000) — Gemini rămâne pe flat (16384)", () => {
    expect(GENERATION_CHAIN.find((c) => c.id === "groq")?.maxTokens).toBe(6000);
    expect(
      GENERATION_CHAIN.find((c) => c.id === "gemini")?.maxTokens,
    ).toBeUndefined();
    expect(
      GENERATION_CHAIN.find((c) => c.id === "gemini2")?.maxTokens,
    ).toBeUndefined();
  });
});

describe("sendChat · cu GENERATION_OPTS (Faza 4.5c)", () => {
  const mkRes = (status: number, json: unknown) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => json,
  });
  const q = [{ role: "user" as const, content: "generează un test" }];

  afterEach(() => {
    (global.fetch as unknown as jest.Mock)?.mockReset?.();
  });

  it("o generare normală reușește pe primul provider fără să atingă bugetul", async () => {
    const geminiOk = {
      candidates: [{ content: { parts: [{ text: "test generat" }] } }],
    };
    global.fetch = jest.fn().mockResolvedValueOnce(mkRes(200, geminiOk));
    const r = await sendChat(q, "SYS", GENERATION_OPTS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.provider).toBe("Gemini Flash");
    expect((global.fetch as unknown as jest.Mock).mock.calls).toHaveLength(1);
  });

  it("dacă gemini pică, GENERATION_OPTS sare la Groq (NU la gemini2) — confirmă reordonarea live, nu doar datele", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(mkRes(500, { error: "x" })) // gemini
      .mockResolvedValueOnce(
        mkRes(200, { choices: [{ message: { content: "răspuns groq" } }] }),
      ); // groq — al DOILEA pas din GENERATION_CHAIN
    const r = await sendChat(q, "SYS", GENERATION_OPTS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.provider).toBe("Groq (gpt-oss-20b)");
    expect((global.fetch as unknown as jest.Mock).mock.calls).toHaveLength(2);
  });
});
