import {
  buildGeminiPayload,
  buildOpenAiPayload,
  parseReply,
  isTruncated,
  sendChat,
  CHAIN,
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

  it("CHAIN = Gemini → Gemini2 → Groq → Mistral → Mistral2 (3 vendori independenți, revived 2026-09-07)", () => {
    expect(CHAIN.map((c) => c.id)).toEqual([
      "gemini",
      "gemini2",
      "groq",
      "mistral",
      "mistral2",
    ]);
    // Morți verificați live prin sondă directă (scratchpad/chat_providers_probe.mjs): scoși/neincluși.
    expect(CHAIN.some((c) => c.id === "cerebras")).toBe(false); // 402 Payment required (R-COST)
    expect(CHAIN.some((c) => c.id === "openrouter")).toBe(false); // slug :free = 404, scos anterior
    // Modele actualizate la cele VII pe free-tier (large=403 tier-locked, llama-uri Groq=404 retrase):
    expect(CHAIN.find((c) => c.id === "groq")?.model).toBe(
      "openai/gpt-oss-20b",
    );
    expect(CHAIN.find((c) => c.id === "mistral")?.model).toBe(
      "mistral-small-latest",
    );
    expect(CHAIN.find((c) => c.id === "mistral2")?.model).toBe(
      "mistral-small-latest",
    );
    // fiecare treaptă are format explicit (gemini vs openai)
    expect(
      CHAIN.every((c) => c.format === "gemini" || c.format === "openai"),
    ).toBe(true);
  });
});

describe("sendChat · fallback + instrumentare", () => {
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
    const r = await sendChat(q, "SYS");
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
    const r = await sendChat(q, "SYS");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.truncated).toBe(true);
  });

  it("sare peste un provider picat și reușește pe următorul", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(mkRes(500, { error: "x" })) // gemini
      .mockResolvedValueOnce(mkRes(200, geminiOk)); // gemini2
    const r = await sendChat(q, "SYS");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.provider).toBe(CHAIN[1].label);
  });

  it("la eșec total colectează TOATE erorile (nu doar ultima)", async () => {
    global.fetch = jest.fn().mockResolvedValue(mkRes(429, { error: "rate" }));
    const r = await sendChat(q, "SYS");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors).toHaveLength(CHAIN.length); // câte o eroare per provider
      expect(r.errors.every((e) => e.includes("HTTP 429"))).toBe(true);
      expect(r.error).toContain("Gemini Flash");
      expect(r.error).toContain("Mistral Small (2)");
    }
    expect((global.fetch as unknown as jest.Mock).mock.calls).toHaveLength(
      CHAIN.length,
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
