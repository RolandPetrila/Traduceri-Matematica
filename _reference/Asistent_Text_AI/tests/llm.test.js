// Teste pentru logica AI extrasa (pwa/lib/llm.js) — rutare multi-provider + fallback.
// Zona HIGH-risk din audit (chainLLM/rawLLM parse): aici testabila FARA DOM, cu fetch mock.

import { describe, it, expect, vi } from "vitest";
import * as llmNS from "../pwa/lib/llm.js";

// llm.js e UMD (module.exports = api). Cu interop Vite, default = api.
const LLM = llmNS.default ?? llmNS;

/** Raspuns fetch mock-uit. */
function mockRes(ok, jsonData, status = 200) {
  return { ok, status, json: vi.fn().mockResolvedValue(jsonData) };
}

const OPENAI_OK = { choices: [{ message: { content: "ok" } }] };
const GEMINI_OK = { candidates: [{ content: { parts: [{ text: "g" }] } }] };

// ---- escapeHtml -------------------------------------------------------------

describe("escapeHtml", () => {
  it("escapeaza & < >", () => {
    expect(LLM.escapeHtml("a & b < c > d")).toBe("a &amp; b &lt; c &gt; d");
  });

  it("escapeaza & inaintea < > (ordine corecta, fara dubla-escapare)", () => {
    expect(LLM.escapeHtml("<&>")).toBe("&lt;&amp;&gt;");
  });

  it("[comportament curent cunoscut] NU escapeaza ghilimele — vezi audit #25", () => {
    expect(LLM.escapeHtml("\"'")).toBe("\"'");
  });
});

// ---- buildLLMBody -----------------------------------------------------------

describe("buildLLMBody", () => {
  it("groq -> forma OpenAI cu modelul corect", () => {
    expect(LLM.buildLLMBody("groq", "salut")).toEqual({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "salut" }],
      temperature: 0.2,
    });
  });

  it("mistral -> mistral-large-latest", () => {
    expect(LLM.buildLLMBody("mistral", "x").model).toBe("mistral-large-latest");
  });

  it("gemini -> forma contents/generationConfig (fara model/messages)", () => {
    expect(LLM.buildLLMBody("gemini", "salut")).toEqual({
      contents: [{ parts: [{ text: "salut" }] }],
      generationConfig: { temperature: 0.2 },
    });
  });

  it("cerebras -> forma OpenAI cu modelul Cerebras", () => {
    expect(LLM.buildLLMBody("cerebras", "x").model).toBe("gpt-oss-120b");
  });

  it("openrouter -> forma OpenAI cu modelul free", () => {
    expect(LLM.buildLLMBody("openrouter", "x").model).toBe(
      "meta-llama/llama-3.3-70b-instruct:free",
    );
  });

  it("mistral2 -> acelasi model ca mistral (cheie secundara)", () => {
    expect(LLM.buildLLMBody("mistral2", "x").model).toBe(
      "mistral-large-latest",
    );
  });

  it("gemini2 -> forma contents (identic cu gemini), fara model", () => {
    const b = LLM.buildLLMBody("gemini2", "salut");
    expect(b).toEqual({
      contents: [{ parts: [{ text: "salut" }] }],
      generationConfig: { temperature: 0.2 },
    });
    expect(b.model).toBeUndefined();
  });
});

// ---- parseLLMResponse (guard-ul din audit #6) ------------------------------

describe("parseLLMResponse", () => {
  it("openai: intoarce choices[0].message.content", () => {
    expect(LLM.parseLLMResponse("groq", OPENAI_OK)).toBe("ok");
  });

  it("gemini: intoarce candidates[0].content.parts[0].text", () => {
    expect(LLM.parseLLMResponse("gemini", GEMINI_OK)).toBe("g");
  });

  it("gemini2: parsat identic cu gemini (aceeasi forma)", () => {
    expect(LLM.parseLLMResponse("gemini2", GEMINI_OK)).toBe("g");
  });

  it("cerebras/openrouter/mistral2: parsate ca OpenAI (choices)", () => {
    expect(LLM.parseLLMResponse("cerebras", OPENAI_OK)).toBe("ok");
    expect(LLM.parseLLMResponse("openrouter", OPENAI_OK)).toBe("ok");
    expect(LLM.parseLLMResponse("mistral2", OPENAI_OK)).toBe("ok");
  });

  it("content string gol e VALID (nu arunca)", () => {
    expect(
      LLM.parseLLMResponse("groq", { choices: [{ message: { content: "" } }] }),
    ).toBe("");
  });

  it("openai gol (choices []) -> arunca 'răspuns gol'", () => {
    expect(() => LLM.parseLLMResponse("groq", { choices: [] })).toThrow(/gol/i);
  });

  it("openai cu {error.message} -> arunca incluzand mesajul", () => {
    expect(() =>
      LLM.parseLLMResponse("mistral", { error: { message: "quota depasita" } }),
    ).toThrow(/quota depasita/);
  });

  it("gemini blocat de safety -> arunca incluzand finishReason", () => {
    expect(() =>
      LLM.parseLLMResponse("gemini", {
        candidates: [{ finishReason: "SAFETY" }],
      }),
    ).toThrow(/SAFETY/);
  });

  it("date null/undefined -> arunca controlat (nu TypeError)", () => {
    expect(() => LLM.parseLLMResponse("groq", null)).toThrow(/gol/i);
    expect(() => LLM.parseLLMResponse("gemini", undefined)).toThrow(/gol/i);
  });
});

// ---- chainLLM (lantul de fallback) -----------------------------------------

describe("chainLLM — lant de fallback", () => {
  const PROMPT = "test prompt";

  it("primul provider reuseste -> fallback:false, onProvider o singura data", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockRes(true, OPENAI_OK));
    const onProvider = vi.fn();
    const r = await LLM.chainLLM(PROMPT, ["groq", "gemini", "mistral"], {
      fetchImpl,
      onProvider,
    });
    expect(r).toEqual({ text: "ok", provider: "GROQ", fallback: false });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(onProvider).toHaveBeenCalledTimes(1);
    expect(onProvider).toHaveBeenCalledWith("GROQ", false);
  });

  it("primul da HTTP !ok -> fallback la al 2-lea (fallback:true)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(mockRes(false, {}, 500))
      .mockResolvedValueOnce(mockRes(true, GEMINI_OK));
    const onProvider = vi.fn();
    const onError = vi.fn();
    const r = await LLM.chainLLM(PROMPT, ["groq", "gemini", "mistral"], {
      fetchImpl,
      onProvider,
      onError,
    });
    expect(r).toEqual({ text: "g", provider: "GEMINI", fallback: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(onProvider).toHaveBeenNthCalledWith(1, "GROQ", false);
    expect(onProvider).toHaveBeenNthCalledWith(2, "GEMINI", true);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("fetch arunca (retea cazuta) -> trece la urmatorul provider", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(
        mockRes(true, { choices: [{ message: { content: "m" } }] }),
      );
    const r = await LLM.chainLLM(PROMPT, ["groq", "mistral"], { fetchImpl });
    expect(r.text).toBe("m");
    expect(r.fallback).toBe(true);
  });

  it("raspuns 200 dar MALFORMAT -> tratat ca esec (guard) -> fallback", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(mockRes(true, { choices: [] })) // groq: gol -> parse arunca
      .mockResolvedValueOnce(
        mockRes(true, { choices: [{ message: { content: "ok2" } }] }),
      );
    const r = await LLM.chainLLM(PROMPT, ["groq", "mistral"], { fetchImpl });
    expect(r.text).toBe("ok2");
    expect(r.fallback).toBe(true);
  });

  it("TOTI esueaza -> arunca 'Toți providerii AI au eșuat' cu mesajul ultimei erori", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockRes(false, {}, 503));
    await expect(
      LLM.chainLLM(PROMPT, ["groq", "gemini", "mistral"], { fetchImpl }),
    ).rejects.toThrow(/Toți providerii AI au eșuat.*503/);
  });

  it("trimite request-ul corect: path proxy + provider + body OpenAI", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockRes(true, OPENAI_OK));
    await LLM.chainLLM(PROMPT, ["groq"], { fetchImpl });
    const [url, opts] = fetchImpl.mock.calls[0];
    expect(url).toBe("/api/proxy?provider=groq");
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opts.body)).toEqual({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: PROMPT }],
      temperature: 0.2,
    });
  });

  it("gemini trimite body-ul de tip contents", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockRes(true, GEMINI_OK));
    await LLM.chainLLM(PROMPT, ["gemini"], { fetchImpl });
    const [url, opts] = fetchImpl.mock.calls[0];
    expect(url).toBe("/api/proxy?provider=gemini");
    expect(JSON.parse(opts.body).contents[0].parts[0].text).toBe(PROMPT);
  });

  it("respecta proxyPath custom (injectabil)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockRes(true, OPENAI_OK));
    await LLM.chainLLM(PROMPT, ["mistral"], {
      fetchImpl,
      proxyPath: "/custom/api",
    });
    expect(fetchImpl.mock.calls[0][0]).toBe("/custom/api?provider=mistral");
  });

  it("functioneaza fara optionale (onProvider/onError default no-op)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockRes(true, OPENAI_OK));
    const r = await LLM.chainLLM(PROMPT, ["groq"], { fetchImpl });
    expect(r.text).toBe("ok");
  });

  it("lant lung cu provideri noi: cade pana la cerebras (eticheta CEREBRAS)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(mockRes(false, {}, 429)) // groq
      .mockResolvedValueOnce(mockRes(true, OPENAI_OK)); // cerebras
    const r = await LLM.chainLLM(PROMPT, ["groq", "cerebras", "gemini"], {
      fetchImpl,
    });
    expect(r).toEqual({ text: "ok", provider: "CEREBRAS", fallback: true });
    expect(fetchImpl.mock.calls[1][0]).toBe("/api/proxy?provider=cerebras");
  });

  it("failover pe cheia secundara gemini2 (eticheta GEMINI·2, body contents)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(mockRes(false, {}, 429)) // gemini (cheie 1)
      .mockResolvedValueOnce(mockRes(true, GEMINI_OK)); // gemini2 (cheie 2)
    const r = await LLM.chainLLM(PROMPT, ["gemini", "gemini2"], { fetchImpl });
    expect(r).toEqual({ text: "g", provider: "GEMINI·2", fallback: true });
    const [url, opts] = fetchImpl.mock.calls[1];
    expect(url).toBe("/api/proxy?provider=gemini2");
    expect(JSON.parse(opts.body).contents[0].parts[0].text).toBe(PROMPT);
  });
});
