// Teste pentru proxy-ul serverless multi-provider (pwa/api/proxy.js).
// Modul cu risc HIGH: access control (origin allowlist), rate-limit, rutare provideri,
// injectare chei + forward upstream. Rulat cu Vitest in Node, FARA retea (fetch mock-uit).
//
// Rulare:  npm test   (din radacina proiectului)
//
// NOTA: cheile din process.env de mai jos sunt VALORI FALSE de test, nu chei reale.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import proxyModule from "../pwa/api/proxy.js";

// proxy.js face `module.exports = async function handler(...)` -> default import = functia.
const handler =
  typeof proxyModule === "function" ? proxyModule : proxyModule.default;

// ---- Helpers de mock --------------------------------------------------------

let ipSeq = 0;
/** IP unic per test ca sa nu se contamineze bucket-ul de rate-limit (Map la nivel de modul). */
function uniqueIp() {
  return `10.0.0.${++ipSeq}`;
}

/** Construieste un req valid (POST, origin permis, provider groq, body realist). Override prin `over`. */
function createReq(over = {}) {
  const headers = {
    host: over.host !== undefined ? over.host : "asistent-text-ai.vercel.app",
    "x-forwarded-for": over.ip || uniqueIp(),
  };
  // origin/referer: doar daca sunt specificate sau implicite (permite stergere cu undefined explicit)
  headers.origin =
    "origin" in over ? over.origin : "https://asistent-text-ai.vercel.app";
  if ("referer" in over) headers.referer = over.referer;
  Object.assign(headers, over.headers || {});

  return {
    method: over.method || "POST",
    headers,
    query: over.query !== undefined ? over.query : { provider: "groq" },
    body:
      "body" in over
        ? over.body
        : {
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: "Bună ziua" }],
          },
  };
}

/** Mock pentru obiectul `res` din Vercel (status/json/send/setHeader, toate chainable). */
function createRes() {
  return {
    statusCode: undefined,
    jsonBody: undefined,
    sentBody: undefined,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.jsonBody = obj;
      return this;
    },
    send(text) {
      this.sentBody = text;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
      return this;
    },
  };
}

/** Mock fetch care raspunde OK (200 JSON), configurabil. */
function fetchOk({
  status = 200,
  contentType = "application/json",
  text = '{"choices":[{"message":{"content":"răspuns"}}]}',
} = {}) {
  return vi.fn().mockResolvedValue({
    status,
    headers: {
      get: (h) =>
        String(h).toLowerCase() === "content-type" ? contentType : null,
    },
    text: vi.fn().mockResolvedValue(text),
  });
}

const REAL_FETCH = global.fetch;
const FAKE_KEYS = {
  GROQ_API_KEY: "test-groq-000",
  GOOGLE_API_KEY: "test-google-000",
  MISTRAL_API_KEY: "test-mistral-000",
  DEEPL_API_KEY: "test-deepl-000",
  TAVILY_API_KEY: "test-tavily-000",
  // Provideri adaugati pt reziliență (failover + provideri gratuiti noi)
  CEREBRAS_API_KEY: "test-cerebras-000",
  OPENROUTER_API_KEY: "test-openrouter-000",
  GOOGLE_API_KEY_2: "test-google2-000",
  MISTRAL_API_KEY_2: "test-mistral2-000",
  DEEPL_API_KEY_2: "test-deepl2-000",
  BRAVE_SEARCH_API_KEY: "test-brave-000",
};

beforeEach(() => {
  for (const [k, v] of Object.entries(FAKE_KEYS)) process.env[k] = v;
  global.fetch = fetchOk();
});

afterEach(() => {
  for (const k of Object.keys(FAKE_KEYS)) delete process.env[k];
  global.fetch = REAL_FETCH;
  vi.restoreAllMocks();
});

// ---- 1. Method guard --------------------------------------------------------

describe("metoda HTTP", () => {
  it("respinge GET cu 405", async () => {
    const res = createRes();
    await handler(createReq({ method: "GET" }), res);
    expect(res.statusCode).toBe(405);
    expect(res.jsonBody.error).toMatch(/POST only/i);
  });

  it("respinge PUT cu 405 (nu apeleaza fetch)", async () => {
    const res = createRes();
    await handler(createReq({ method: "PUT" }), res);
    expect(res.statusCode).toBe(405);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ---- 2. Access control: origin allowlist (zona CRITICA din audit) -----------

describe("origin allowlist (A01 Broken Access Control)", () => {
  it("403 cand lipsesc si Origin si Referer (client non-browser tacut)", async () => {
    const res = createRes();
    await handler(createReq({ origin: undefined }), res); // fara origin, fara referer
    expect(res.statusCode).toBe(403);
    expect(res.jsonBody.error).toMatch(/Forbidden/i);
  });

  it("403 cand Origin e un host strain", async () => {
    const res = createRes();
    await handler(createReq({ origin: "https://evil.example.com" }), res);
    expect(res.statusCode).toBe(403);
  });

  it("permite cererea cand Origin e in allowlist (asistent-text-ai.vercel.app)", async () => {
    const res = createRes();
    await handler(
      createReq({ origin: "https://asistent-text-ai.vercel.app" }),
      res,
    );
    expect(res.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("permite cererea cand DOAR Referer e in allowlist", async () => {
    const res = createRes();
    await handler(
      createReq({
        origin: undefined,
        referer: "https://asistent-text-ai.vercel.app/index.html",
      }),
      res,
    );
    expect(res.statusCode).toBe(200);
  });

  it("permite cand Origin = host-ul cererii (preview/deploy alternativ)", async () => {
    const res = createRes();
    await handler(
      createReq({
        host: "asistent-text-ai-git-preview.vercel.app",
        origin: "https://asistent-text-ai-git-preview.vercel.app",
      }),
      res,
    );
    expect(res.statusCode).toBe(200);
  });

  // Test de DOCUMENTARE a limitarii cunoscute (constatarea CRITICA #1 din audit):
  // un client non-browser poate falsifica header-ul Origin -> allowlist-ul NU opr. abuzul.
  it("[LIMITARE CUNOSCUTA] un Origin falsificat dar permis trece de check (proxy NU autentifica)", async () => {
    const res = createRes();
    // un curl/script poate seta manual acest header; browserul nu, dar un atacator da.
    await handler(
      createReq({ origin: "https://asistent-text-ai.vercel.app" }),
      res,
    );
    expect(res.statusCode).toBe(200); // documenteaza ca protectia e ocolibila -> vezi fix in audit
  });
});

// ---- 3. Rate-limit ----------------------------------------------------------

describe("rate-limit (best-effort, per IP)", () => {
  it("blocheaza al 31-lea request din acelasi IP intr-un minut (429)", async () => {
    const ip = "203.0.113.7";
    let last;
    for (let i = 0; i < 31; i++) {
      last = createRes();
      // provider necunoscut -> 400, dar trece intai prin gate-ul de rate-limit (consuma bucket)
      await handler(createReq({ ip, query: { provider: "nope" } }), last);
    }
    expect(last.statusCode).toBe(429);
    expect(last.jsonBody.error).toMatch(/Prea multe cereri/i);
  });

  it("primele 30 de requesturi NU sunt limitate", async () => {
    const ip = "203.0.113.8";
    const codes = [];
    for (let i = 0; i < 30; i++) {
      const res = createRes();
      await handler(createReq({ ip, query: { provider: "nope" } }), res);
      codes.push(res.statusCode);
    }
    expect(codes.every((c) => c === 400)).toBe(true); // 400 = a trecut de rate-limit
  });

  it("IP-uri diferite nu se influenteaza reciproc", async () => {
    const res = createRes();
    await handler(
      createReq({ ip: "198.51.100.1", query: { provider: "nope" } }),
      res,
    );
    expect(res.statusCode).toBe(400); // nu 429
  });
});

// ---- 4. Validare provider ---------------------------------------------------

describe("validare provider", () => {
  it("400 pentru provider necunoscut", async () => {
    const res = createRes();
    await handler(createReq({ query: { provider: "openai" } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonBody.error).toMatch(/Unknown provider: openai/);
  });

  it("400 cand lipseste provider-ul", async () => {
    const res = createRes();
    await handler(createReq({ query: {} }), res);
    expect(res.statusCode).toBe(400);
  });

  it("accepta provider cu majuscule (normalizat la lowercase)", async () => {
    const res = createRes();
    await handler(createReq({ query: { provider: "GROQ" } }), res);
    expect(res.statusCode).toBe(200);
  });
});

// ---- 5. Cheie de server lipsa ----------------------------------------------

describe("cheie server lipsa", () => {
  it("500 cand env var-ul cheii nu e setat", async () => {
    delete process.env.GROQ_API_KEY;
    const res = createRes();
    await handler(createReq({ query: { provider: "groq" } }), res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonBody.error).toMatch(/GROQ_API_KEY/);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ---- 6. Rutare + injectare cheie + forward upstream ------------------------

describe("injectare cheie per tip de auth", () => {
  it("groq: Authorization Bearer + url corect", async () => {
    const res = createRes();
    await handler(createReq({ query: { provider: "groq" } }), res);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(opts.headers.Authorization).toBe("Bearer test-groq-000");
    expect(opts.method).toBe("POST");
  });

  it("mistral: Authorization Bearer", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "mistral" },
        body: { model: "mistral-large-latest", messages: [] },
      }),
      res,
    );
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.mistral.ai/v1/chat/completions");
    expect(opts.headers.Authorization).toBe("Bearer test-mistral-000");
  });

  it("gemini: cheia in query string, fara header Authorization", async () => {
    const res = createRes();
    await handler(
      createReq({ query: { provider: "gemini" }, body: { contents: [] } }),
      res,
    );
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("?key=test-google-000");
    expect(opts.headers.Authorization).toBeUndefined();
  });

  it("deepl: header DeepL-Auth-Key", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "deepl" },
        body: { text: ["salut"], target_lang: "EN-US" },
      }),
      res,
    );
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api-free.deepl.com/v2/translate");
    expect(opts.headers.Authorization).toBe("DeepL-Auth-Key test-deepl-000");
  });

  it("tavily: cheia injectata in body (api_key)", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "tavily" },
        body: { query: "stiri 2026" },
      }),
      res,
    );
    const [, opts] = global.fetch.mock.calls[0];
    const sent = JSON.parse(opts.body);
    expect(sent.api_key).toBe("test-tavily-000");
    expect(sent.query).toBe("stiri 2026");
  });
});

describe("forward raspuns upstream", () => {
  it("propaga status + content-type + body brut catre client", async () => {
    global.fetch = fetchOk({
      status: 200,
      contentType: "application/json",
      text: '{"ok":true}',
    });
    const res = createRes();
    await handler(createReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res.headers["Content-Type"]).toBe("application/json");
    expect(res.sentBody).toBe('{"ok":true}');
  });

  it("propaga si erorile upstream (ex. 429 de la provider)", async () => {
    global.fetch = fetchOk({
      status: 429,
      text: '{"error":"rate limited upstream"}',
    });
    const res = createRes();
    await handler(createReq(), res);
    expect(res.statusCode).toBe(429);
    expect(res.sentBody).toContain("rate limited upstream");
  });

  it("content-type implicit application/json daca upstream nu il trimite", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: { get: () => null },
      text: vi.fn().mockResolvedValue("text simplu"),
    });
    const res = createRes();
    await handler(createReq(), res);
    expect(res.headers["Content-Type"]).toBe("application/json");
  });
});

// ---- 7. Parsarea body-ului --------------------------------------------------

describe("parsarea body-ului", () => {
  it("accepta body ca string JSON si il parseaza inainte de forward", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "tavily" },
        body: '{"query":"din string"}',
      }),
      res,
    );
    const [, opts] = global.fetch.mock.calls[0];
    const sent = JSON.parse(opts.body);
    expect(sent.query).toBe("din string");
    expect(sent.api_key).toBe("test-tavily-000"); // cheia tot injectata
  });

  it("string JSON invalid -> body devine {} (nu crapa), cheia tot injectata pt tavily", async () => {
    const res = createRes();
    await handler(
      createReq({ query: { provider: "tavily" }, body: "nu e json {{{" }),
      res,
    );
    expect(res.statusCode).toBe(200);
    const [, opts] = global.fetch.mock.calls[0];
    const sent = JSON.parse(opts.body);
    expect(sent.api_key).toBe("test-tavily-000");
  });
});

// ---- 8. Esec upstream -------------------------------------------------------

describe("esec retea upstream", () => {
  it("502 cand fetch arunca (provider inaccesibil)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNRESET boom"));
    const res = createRes();
    await handler(createReq(), res);
    expect(res.statusCode).toBe(502);
    expect(res.jsonBody.error).toMatch(/Proxy upstream failed/);
    expect(res.jsonBody.detail).toContain("ECONNRESET boom");
  });
});

// ---- 9. Ramuri defensive (fallback-uri) ------------------------------------

describe("fallback-uri defensive", () => {
  it("fara x-forwarded-for -> IP devine 'unknown', cererea merge (l.73-75)", async () => {
    const res = createRes();
    const req = createReq();
    delete req.headers["x-forwarded-for"];
    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it("fara header host -> fallback '' la host, allowlist decide pe Origin (l.61)", async () => {
    const res = createRes();
    await handler(createReq({ host: "" }), res); // String('' || '') -> ''
    expect(res.statusCode).toBe(200); // origin e in ALLOWED_HOSTS, deci trece
  });

  it("body null -> devine {} si se forwardeaza ca '{}' (gemini = fara cost-cap)", async () => {
    const res = createRes();
    // gemini nu trece prin cost-cap (doar groq/mistral primesc model fortat) -> body ramane {}
    await handler(
      createReq({ query: { provider: "gemini" }, body: null }),
      res,
    );
    expect(res.statusCode).toBe(200);
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.body).toBe("{}");
  });

  it("eroare upstream fara .message -> detail = String(e) (l.134)", async () => {
    global.fetch = vi.fn().mockRejectedValue("eroare ca string");
    const res = createRes();
    await handler(createReq(), res);
    expect(res.statusCode).toBe(502);
    expect(res.jsonBody.detail).toContain("eroare ca string");
  });
});

// ---- 10. Cost-cap: allowlist modele + plafoane (audit #1) -------------------

/** Body-ul JSON forwardat catre upstream din primul apel fetch. */
function sentBody() {
  const [, opts] = global.fetch.mock.calls[0];
  return JSON.parse(opts.body);
}

describe("cost-cap (allowlist modele + plafoane)", () => {
  it("groq: model nepermis -> fortat la llama-3.1-8b-instant", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "groq" },
        body: { model: "llama-3.3-70b-versatile", messages: [] },
      }),
      res,
    );
    expect(res.statusCode).toBe(200);
    expect(sentBody().model).toBe("llama-3.1-8b-instant");
  });

  it("mistral: model nepermis -> fortat la mistral-large-latest", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "mistral" },
        body: { model: "mistral-medium", messages: [] },
      }),
      res,
    );
    expect(sentBody().model).toBe("mistral-large-latest");
  });

  it("groq: model permis ramane neschimbat", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "groq" },
        body: { model: "llama-3.1-8b-instant", messages: [] },
      }),
      res,
    );
    expect(sentBody().model).toBe("llama-3.1-8b-instant");
  });

  it("groq: max_tokens excesiv -> plafonat la 8192", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "groq" },
        body: {
          model: "llama-3.1-8b-instant",
          max_tokens: 999999,
          messages: [],
        },
      }),
      res,
    );
    expect(sentBody().max_tokens).toBe(8192);
  });

  it("groq: fara max_tokens -> NU se adauga (zero behavior change pe trafic legit)", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "groq" },
        body: { model: "llama-3.1-8b-instant", messages: [] },
      }),
      res,
    );
    expect(sentBody().max_tokens).toBeUndefined();
  });

  it("tavily: max_results excesiv -> plafonat la 10", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "tavily" },
        body: { query: "x", max_results: 100 },
      }),
      res,
    );
    expect(sentBody().max_results).toBe(10);
  });

  it("tavily: fara max_results -> NU se adauga", async () => {
    const res = createRes();
    await handler(
      createReq({ query: { provider: "tavily" }, body: { query: "x" } }),
      res,
    );
    expect(sentBody().max_results).toBeUndefined();
  });
});

// ---- 11. Provideri noi (reziliență: failover + provideri gratuiti) ----------

describe("provideri noi — rutare + injectare cheie", () => {
  it("cerebras: Bearer + url Cerebras", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "cerebras" },
        body: { model: "llama-3.3-70b", messages: [] },
      }),
      res,
    );
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.cerebras.ai/v1/chat/completions");
    expect(opts.headers.Authorization).toBe("Bearer test-cerebras-000");
  });

  it("openrouter: Bearer + extraHeaders (HTTP-Referer / X-Title)", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "openrouter" },
        body: { model: "x", messages: [] },
      }),
      res,
    );
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(opts.headers.Authorization).toBe("Bearer test-openrouter-000");
    expect(opts.headers["HTTP-Referer"]).toBe(
      "https://asistent-text-ai.vercel.app",
    );
    expect(opts.headers["X-Title"]).toBe("Asistent Text AI");
  });

  it("gemini2: cheia GOOGLE_API_KEY_2 in query, acelasi endpoint ca gemini", async () => {
    const res = createRes();
    await handler(
      createReq({ query: { provider: "gemini2" }, body: { contents: [] } }),
      res,
    );
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("gemini-2.5-flash:generateContent");
    expect(url).toContain("?key=test-google2-000");
    expect(opts.headers.Authorization).toBeUndefined();
  });

  it("mistral2: Bearer cu cheia secundara, endpoint Mistral", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "mistral2" },
        body: { model: "mistral-large-latest", messages: [] },
      }),
      res,
    );
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.mistral.ai/v1/chat/completions");
    expect(opts.headers.Authorization).toBe("Bearer test-mistral2-000");
  });

  it("deepl2: DeepL-Auth-Key cu cheia secundara", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "deepl2" },
        body: { text: ["salut"], target_lang: "EN-US" },
      }),
      res,
    );
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api-free.deepl.com/v2/translate");
    expect(opts.headers.Authorization).toBe("DeepL-Auth-Key test-deepl2-000");
  });

  it("brave: GET cu X-Subscription-Token + query din body, FARA corp", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "brave" },
        body: { q: "stiri 2026", count: 5 },
      }),
      res,
    );
    const [url, opts] = global.fetch.mock.calls[0];
    expect(opts.method).toBe("GET");
    expect(opts.body).toBeUndefined();
    expect(opts.headers["X-Subscription-Token"]).toBe("test-brave-000");
    expect(url).toContain("https://api.search.brave.com/res/v1/web/search?");
    expect(url).toContain("q=stiri+2026");
    expect(url).toContain("count=5");
  });
});

describe("cost-cap provideri noi", () => {
  it("cerebras: model nepermis -> fortat la gpt-oss-120b", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "cerebras" },
        body: { model: "ceva-scump", messages: [] },
      }),
      res,
    );
    expect(sentBody().model).toBe("gpt-oss-120b");
  });

  it("openrouter: model nepermis -> fortat la modelul free din allowlist", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "openrouter" },
        body: { model: "anthropic/claude-opus", messages: [] },
      }),
      res,
    );
    expect(sentBody().model).toBe("meta-llama/llama-3.3-70b-instruct:free");
  });

  it("mistral2: model nepermis -> fortat la mistral-large-latest", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "mistral2" },
        body: { model: "mistral-medium", messages: [] },
      }),
      res,
    );
    expect(sentBody().model).toBe("mistral-large-latest");
  });

  it("brave: count excesiv -> plafonat la 10", async () => {
    const res = createRes();
    await handler(
      createReq({
        query: { provider: "brave" },
        body: { q: "x", count: 50 },
      }),
      res,
    );
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("count=10");
  });
});
