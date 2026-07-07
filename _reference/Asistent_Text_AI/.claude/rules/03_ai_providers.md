# Regulă locală — Provideri AI & rutare

## Provideri (via `/api/proxy?provider=…`)

| Provider     | Model / endpoint                         | Env var                | Folosit pentru                                  |
| ------------ | ---------------------------------------- | ---------------------- | ----------------------------------------------- |
| `groq`       | `llama-3.1-8b-instant`                   | `GROQ_API_KEY`         | rapid: corectură, îmbunătățire, ton, magic edit |
| `mistral`    | `mistral-large-latest`                   | `MISTRAL_API_KEY`      | complex: rezumat, email, raport, SEO, RAG, DR   |
| `gemini`     | `gemini-2.5-flash` (`v1beta`)            | `GOOGLE_API_KEY`       | fallback text + OCR (Vision)                    |
| `deepl`      | `v2/translate` (api-free)                | `DEEPL_API_KEY`        | traducere                                       |
| `tavily`     | `/search`                                | `TAVILY_API_KEY`       | deep research (web)                             |
| `cerebras`   | `gpt-oss-120b`                           | `CEREBRAS_API_KEY`     | fallback LLM (ultra-rapid, 1M tok/zi)           |
| `openrouter` | `meta-llama/llama-3.3-70b-instruct:free` | `OPENROUTER_API_KEY`   | fallback LLM (gateway, free)                    |
| `gemini2`    | `gemini-2.5-flash` (cheie 2)             | `GOOGLE_API_KEY_2`     | failover text + OCR la 429                      |
| `mistral2`   | `mistral-large-latest` (cheie 2)         | `MISTRAL_API_KEY_2`    | failover complex la 429                         |
| `deepl2`     | `v2/translate` (cheie 2)                 | `DEEPL_API_KEY_2`      | failover traducere la cotă                      |
| `brave`      | `/res/v1/web/search` (GET, header token) | `BRAVE_SEARCH_API_KEY` | fallback deep research (web)                    |

> Status verificat 2026-06. Provideri de reziliență adăugați 2026-06-21 din catalogul `.api-keys`.

## Rutare & fallback — `pwa/lib/llm.js` (`window.LLM`)

- Logica de rutare + lanț de fallback (`chainLLM`) e EXTRASĂ în `pwa/lib/llm.js` ca modul UMD, **testat unitar** (`tests/llm.test.js`).
- `index.html` deleagă la `window.LLM` printr-un wrapper subțire (păstrează efectele UI: `loadingProviderText`, badge provider, `window.__llmResult`).
- `parseLLMResponse` are guard pe răspuns gol/blocat → tratat ca eșec → fallback (nu TypeError). `gemini`/`gemini2` au aceeași formă (contents/parts); `cerebras`/`openrouter`/`mistral2` sunt OpenAI-style (choices).
- **Lanțuri LLM** (liniare, fără bucle/recursie), îmbogățite cu provideri gratuiti + chei secundare:
  - text: `groq→cerebras→gemini→mistral→openrouter→gemini2→mistral2` (și permutări per acțiune).
  - traducere: `deepl→deepl2→gemini` (`callDeepLAPI`).
  - deep research: `tavily→brave→fără-web` (`callTavilyAndMistral`).
  - OCR: `gemini→gemini2→Tesseract` (`geminiOCR` în modulul OCR din `index.html`).
- **Toleranță la chei lipsă:** un provider fără env var în Vercel întoarce 500 → lanțul continuă (zero regresie). Activarea rezilienței = doar setarea cheilor în Vercel.

## Reguli la modificare

- **Modelele sunt în 2 locuri:** `lib/llm.js` (`MODELS = {groq, mistral, mistral2, cerebras, openrouter}`) + `api/proxy.js` (`MODEL_ALLOW` + URL-uri/PROVIDERS). Ține-le sincronizate.
- Orice schimbare pe logica AI → **actualizează `tests/llm.test.js` + `tests/proxy.test.js` + `npm test`** înainte de commit.
- Provider nou: adaugă în `PROVIDERS` (proxy) + `MODEL_ALLOW` dacă e LLM cu model + `MODELS`/`LLM_LABEL` (llm.js) + lanțul relevant. Brave = GET (`method:"GET"`, `auth:"header"`, `query:[…]`).
