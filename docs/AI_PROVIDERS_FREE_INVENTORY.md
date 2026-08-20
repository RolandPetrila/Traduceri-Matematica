# Inventar AI-uri gratuite deținute — Traduceri Matematica

> Creat 2026-08-20 la cererea lui Roland. Sursa cifrelor: catalogul personal `.api-keys/catalog.md`
> (notele lui Roland când a obținut cheile — [PROBABIL], furnizorii se schimbă). Cele marcate
> ✅LIVE / ❌MORT au fost testate real pe prod (`scratchpad/provider_health.mjs`).
>
> **Scop:** referință pt „ce mai putem cabla ca să nu se atingă limitele free-tier". Cheile EXISTĂ la
> Roland (`.api-keys` → env vars Windows), dar pt fiecare provider NOU trebuie adăugate în env-ul
> **Vercel** al aplicației (proiectele `traduceri-frontend` = chat/proxy, `traduceri-api` = OCR/traducere).
>
> ⚠️ Catalogul poate fi optimist: `groq` zicea „14.400 req/zi" dar e **404 (cont fără acces)**;
> `cerebras` zicea „1M tokens/zi permanent" dar e **402 (plată cerută)**. Verifică ÎNTOTDEAUNA live
> înainte de a te baza pe un provider (regula R-DIAG-AUTO).

## Legendă status

- ✅ **cablat + activ** — folosit acum în aplicație
- 🟡 **cablat dar inactiv/mort** — în cod, dar cheia/cota nu merge
- ⬜ **necablat** — cheia există la Roland, dar NU e în aplicație (candidat de adăugat)

---

## 🔤 TRADUCERE (F8) — caractere/lună

| Serviciu                       | Env var(s)                                 | Capacitate free           | Status                                                                 |
| ------------------------------ | ------------------------------------------ | ------------------------- | ---------------------------------------------------------------------- |
| **Azure Translator**           | `AZURE_TRANSLATOR_KEY` (+`_2`, +`_REGION`) | **2M × 2 chei = 4M/lună** | 🟡 **cod cablat 2026-08-20, așteaptă cheia în Vercel `traduceri-api`** |
| DeepL                          | `DEEPL_API_KEY` (+`_2`)                    | 500K × 2 = 1M/lună        | ✅ cablat (principal, cu failover cheia 2)                             |
| Google Translate               | `GOOGLE_API_KEY` (+`_2`)                   | 500K × 2 = 1M/lună        | ⬜ necablat (API separat pe cheile Gemini)                             |
| HF NLLB-200                    | `HF_TOKEN`                                 | 1000 req/zi               | ✅ cablat (fallback)                                                   |
| OpenRouter (LLM)               | `OPENROUTER_API_KEY`                       | 50 req/zi (fără sold)     | ✅ cablat (fallback slab)                                              |
| Cloudflare Workers AI (m2m100) | `CF_AI_TOKEN`                              | 10.000 neurons/zi         | ⬜ necablat                                                            |

**Lanț actual (după 2026-08-20):** DeepL → **Azure** → NLLB → OpenRouter → Gemini.
**Total disponibil dacă se cablează tot: ~6M caractere/lună** (≈ 2000-3000 pagini text) = practic nelimitat pt 1 profesoară.

## 📄 OCR (import documente) — pagini/lună

| Serviciu                        | Env var(s)                                  | Capacitate free                                           | Status                                               |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| Gemini (multimodal)             | `GOOGLE_API_KEY` (+`_2`)                    | ~1000 req/zi Flash × 2 chei                               | ✅ cablat (principal)                                |
| Mistral OCR (Pixtral)           | `MISTRAL_API_KEY` (+`_2`)                   | 1 MILIARD tokens/lună (2 req/min)                         | ✅ cablat (fallback)                                 |
| **Azure Document Intelligence** | `AZURE_DOC_INTEL_KEY` (+`_2`, +`_ENDPOINT`) | **500 × 2 = 1000 pagini/lună** (layout HQ: tabele/figuri) | ✅ **cablat + activ** (R7.5): import PDF → `engine=azure` (`azure_layout.py`), gardă R-MATH (fără tabel → fallback Gemini). Failover KEY→KEY_2 adăugat 2026-08-20 (×2 = 1000 pag/lună). Verificat live. |
| Google Document AI              | `GOOGLE_API_KEY` (+`_2`)                    | 1000 pagini/lună × 2                                      | ⬜ necablat                                          |
| Adobe Acrobat Services          | `ADOBE_API_KEY` + `ADOBE_CLIENT_SECRET`     | 500 tranzacții/lună                                       | ⬜ necablat                                          |

## 💬 CHAT AI / LLM general

| Serviciu                | Env var(s)                                 | Capacitate free                        | Status                                                            |
| ----------------------- | ------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------- |
| Gemini Flash            | `GOOGLE_API_KEY` (+`_2`)                   | ~1000 req/zi × 2 = 2000/zi             | ✅ cablat (principal ×2)                                          |
| Mistral Large           | `MISTRAL_API_KEY` (+`_2`)                  | 1B tokens/lună, 2 req/min              | ✅ cablat (fallback ×2)                                           |
| Cerebras (gpt-oss-120b) | `CEREBRAS_API_KEY`                         | 1M tokens/zi (catalog)                 | 🟡 **402 MORT** — plată cerută/cotă; SCOS din lanț 2026-08-20     |
| Groq (Llama 70B/8B)     | `GROQ_API_KEY`                             | 14.400/zi 8B + 1000/zi 70B (catalog)   | 🟡 **404 MORT** — cheie/cont fără acces; SCOS din lanț 2026-08-20 |
| Cohere                  | `COHERE_API_KEY`                           | 1000 req/lună                          | ⬜ necablat                                                       |
| SambaNova               | `SAMBANOVA_API_KEY`                        | free permanent + $5 credit             | ⬜ necablat                                                       |
| Fireworks AI            | `FIREWORKS_API_KEY`                        | 600 req/oră (fără card)                | ⬜ necablat                                                       |
| NVIDIA NIM              | `NVIDIA_API_KEY`                           | 5000 credite                           | ⬜ necablat                                                       |
| GitHub Models           | `GITHUB_MODELS_TOKEN`                      | 50-150 req/zi                          | ⬜ necablat                                                       |
| Hugging Face (LLM)      | `HF_TOKEN`                                 | 1000 req/zi                            | ✅ cablat (doar NLLB)                                             |
| xAI Grok                | `XAI_API_KEY` (+`_2`)                      | $25 credit + $150/lună cu data-sharing | ⬜ necablat                                                       |
| Reka                    | `REKA_API_KEY`                             | $10 recurent lunar                     | ⬜ necablat                                                       |
| Scaleway                | `SCALEWAY_ACCESS_KEY` + `SCALEWAY_API_KEY` | 1M tokens total                        | ⬜ necablat                                                       |

## 🔎 CĂUTARE WEB (dacă se readuce Deep Research în Chat)

| Serviciu     | Env var                | Free             | Status                           |
| ------------ | ---------------------- | ---------------- | -------------------------------- |
| Brave Search | `BRAVE_SEARCH_API_KEY` | 2000 query/lună  | ⬜ (proxy îl suportă, UI retras) |
| Tavily       | `TAVILY_API_KEY`       | 1000 req/lună    | ⬜ (idem)                        |
| Jina Reader  | `JINA_API_KEY`         | 1M tokens        | ⬜                               |
| Firecrawl    | `FIRECRAWL_API_KEY`    | 500 credite/lună | ⬜                               |

---

## Cum adaugi o cheie nouă în Vercel (pasul manual / R-SEC)

Valoarea NU trece prin chat. Din `.api-keys` (env vars Windows), o adaugi în proiectul Vercel corect:

```bash
# traducere/OCR = proiectul backend „traduceri-api" (rulează api/*.py)
cd C:/Proiecte/Traduceri_Matematica
echo "$AZURE_TRANSLATOR_KEY" | npx vercel env add AZURE_TRANSLATOR_KEY production
echo "westeurope"            | npx vercel env add AZURE_TRANSLATOR_REGION production   # regiunea resursei tale
# (opțional failover) echo "$AZURE_TRANSLATOR_KEY_2" | npx vercel env add AZURE_TRANSLATOR_KEY_2 production

# chat = proiectul „traduceri-frontend" (rulează /api/proxy) — dacă adaugi provideri LLM noi acolo
cd C:/Proiecte/Traduceri_Matematica/frontend
echo "$COHERE_API_KEY" | npx vercel env add COHERE_API_KEY production
```

Apoi redeploy proiectul respectiv (`vercel deploy --prod --yes`) și health-check live (ca la
`scratchpad/provider_health.mjs`). Regula: **niciodată nu te baza pe catalog — testează live**.

## Ce e cablat în cod dar așteaptă cheia

- **Azure Translator** (traducere): cod gata (`api/lib/translation_router.py::translate_with_azure` +
  lanț în `api/translate_text.py`), test `api/tests/test_translate_chain.py`. Se activează când
  `AZURE_TRANSLATOR_KEY` ajunge în `traduceri-api`. Fără cheie = no-op (trece la NLLB) — zero regresie.
