import {
  buildGeminiPayload,
  buildOpenAiPayload,
  parseReply,
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

  it("OpenAI (Groq/OpenRouter): system + messages, model setat", () => {
    const p = buildOpenAiPayload("llama-3.3-70b-versatile", "SYS", msgs);
    expect(p.model).toBe("llama-3.3-70b-versatile");
    expect(p.messages[0]).toEqual({ role: "system", content: "SYS" });
    expect(p.messages).toHaveLength(4);
  });

  it("parseReply extrage textul din ambele formate", () => {
    const gem = {
      candidates: [{ content: { parts: [{ text: "răspuns gemini" }] } }],
    };
    expect(parseReply("gemini", gem)).toBe("răspuns gemini");
    const oai = { choices: [{ message: { content: "răspuns groq" } }] };
    expect(parseReply("groq", oai)).toBe("răspuns groq");
    expect(parseReply("gemini", {})).toBe("");
  });

  it("CHAIN = Gemini → Groq → OpenRouter", () => {
    expect(CHAIN.map((c) => c.id)).toEqual(["gemini", "groq", "openrouter"]);
    expect(CHAIN[1].model).toBe("llama-3.3-70b-versatile");
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
