// Logica de rutare AI multi-provider cu fallback — EXTRASA din index.html ca sa fie
// testabila unitar (Vitest, in Node) FARA DOM. Pattern UMD: ruleaza si in browser
// (clasic <script> -> window.LLM) si in Node (module.exports, pt teste).
//
// Functii pure / fara DOM:
//   - escapeHtml(unsafe)            -> string (comportament IDENTIC cu cel din index.html)
//   - buildLLMBody(provider, text)  -> body-ul de trimis la /api/proxy
//   - parseLLMResponse(provider,d)  -> extrage textul din raspuns, cu GUARD (vezi audit #6)
//   - chainLLM(text, order, opts)   -> lant de fallback; fetch + UI injectate prin opts
//
// UI-ul (loadingProviderText / setLoadingProvider / window.__llmResult) NU e aici:
// e injectat de apelant prin opts.onProvider, ca logica de fallback sa fie testabila.

(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = api; // Node / Vitest
  }
  if (root) {
    root.LLM = api; // Browser (window.LLM) si globalThis in Node
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof self !== "undefined"
      ? self
      : this,
  function () {
    "use strict";

    var LLM_LABEL = {
      groq: "GROQ",
      gemini: "GEMINI",
      mistral: "MISTRAL",
      cerebras: "CEREBRAS",
      openrouter: "OPENROUTER",
      gemini2: "GEMINI·2",
      mistral2: "MISTRAL·2",
    };
    var MODELS = {
      groq: "llama-3.1-8b-instant",
      mistral: "mistral-large-latest",
      mistral2: "mistral-large-latest",
      cerebras: "gpt-oss-120b",
      openrouter: "meta-llama/llama-3.3-70b-instruct:free",
    };
    // Provideri cu formatul Google Gemini (contents/parts) vs OpenAI (messages/choices)
    function isGemini(p) {
      return p === "gemini" || p === "gemini2";
    }

    // IDENTIC cu index.html (NU escapeaza ghilimele — vezi audit #25, neschimbat intentionat).
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    // Construieste body-ul upstream in functie de provider (gemini vs OpenAI-like).
    function buildLLMBody(provider, promptText) {
      if (isGemini(provider)) {
        return {
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.2 },
        };
      }
      return {
        model: MODELS[provider],
        messages: [{ role: "user", content: promptText }],
        temperature: 0.2,
      };
    }

    // Extrage textul din raspuns CU GUARD: un raspuns gol / blocat de safety / malformat
    // arunca o eroare clara (in loc de TypeError), pe care chainLLM o trateaza ca esec -> fallback.
    function parseLLMResponse(provider, data) {
      if (isGemini(provider)) {
        var t =
          data &&
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].text;
        if (typeof t !== "string") {
          var fr =
            data &&
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].finishReason;
          throw new Error("Gemini: răspuns gol" + (fr ? " (" + fr + ")" : ""));
        }
        return t;
      }
      var c =
        data &&
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content;
      if (typeof c !== "string") {
        var em = data && data.error && data.error.message;
        throw new Error(
          provider + ": răspuns gol" + (em ? " (" + em + ")" : ""),
        );
      }
      return c;
    }

    // Lant de fallback liniar (fara recursie/bucle): primul succes castiga.
    // opts: { fetchImpl, onProvider(label,isFallback), onError(provider,err), proxyPath }
    // Returneaza { text, provider(label), fallback(bool) }.
    async function chainLLM(promptText, order, opts) {
      opts = opts || {};
      var fetchImpl =
        opts.fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
      var onProvider = opts.onProvider || function () {};
      var onError = opts.onError || function () {};
      var proxyPath = opts.proxyPath || "/api/proxy";
      if (typeof fetchImpl !== "function")
        throw new Error("fetch indisponibil");

      var lastErr;
      for (var i = 0; i < order.length; i++) {
        var p = order[i];
        var label = LLM_LABEL[p] || p;
        try {
          onProvider(label, i > 0);
          var res = await fetchImpl(proxyPath + "?provider=" + p, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildLLMBody(p, promptText)),
          });
          if (!res.ok) throw new Error(p + " API Error: " + res.status);
          var data = await res.json();
          var text = parseLLMResponse(p, data);
          return { text: text, provider: label, fallback: i > 0 };
        } catch (e) {
          lastErr = e;
          onError(p, e);
        }
      }
      throw new Error(
        "Toți providerii AI au eșuat: " + ((lastErr && lastErr.message) || ""),
      );
    }

    return {
      LLM_LABEL: LLM_LABEL,
      MODELS: MODELS,
      escapeHtml: escapeHtml,
      buildLLMBody: buildLLMBody,
      parseLLMResponse: parseLLMResponse,
      chainLLM: chainLLM,
    };
  },
);
