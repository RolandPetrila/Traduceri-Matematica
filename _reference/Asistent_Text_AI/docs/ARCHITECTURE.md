# Arhitectură — Asistent Text AI

PWA **no-build** (HTML/JS servit static) + **proxy serverless** Vercel pentru chei. Fără backend propriu, fără bază de date.

## Hartă fișiere

```
Asistent_Text_AI/
├── CLAUDE.md, RESUME_PUNCT_CURENT.md   # context Claude + checkpoint
├── .claude/rules/                      # reguli locale (pwa/deploy, securitate, AI)
├── docs/                               # arhitectură, deploy, securitate, decizii
├── tests/ + vitest.config.js + package.json   # DEV/TEST — NU se deployează
└── pwa/                                # ← RĂDĂCINA DE DEPLOY (Vercel)
    ├── index.html                      # aplicația: UI (Tailwind) + 3 <script> (logică)
    ├── lib/llm.js                      # logica AI (rutare+fallback), UMD, window.LLM, testată
    ├── sw.js                           # service worker (network-first pagină, cache-first assets)
    ├── manifest.json                   # PWA (share_target, shortcuts, icons)
    ├── vercel.json                     # CSP + security headers + cache-control
    ├── api/proxy.js                    # proxy serverless multi-provider (chei server-side)
    └── icon-192.png, icon-512.png
```

## Flux de date (o acțiune AI)

```
Browser (index.html)
  → window.LLM.chainLLM(prompt, order)        [pwa/lib/llm.js]
    → fetch POST /api/proxy?provider=<p>       (același origin — permis de CSP)
      → proxy.js: origin allowlist + rate-limit → injectează cheia → upstream (Groq/Mistral/Gemini/DeepL/Tavily)
      ← răspuns brut
    ← parseLLMResponse (guard pe gol/blocat) → fallback la următorul provider dacă eșec
  ← text → typewriter reveal + badge provider + DOMPurify la preview/PDF
```

- **Fallback liniar** (fără bucle/recursie): primul provider care reușește câștigă. Ordini per acțiune (ex. corectură: `groq→gemini→mistral`).
- **Cheile nu ajung niciodată în browser** — doar proxy-ul le vede (env vars Vercel).

## Service Worker

- **Pagină (navigate):** network-first → cache fallback (offline). Mereu versiune proaspătă online.
- **Assets same-origin:** cache-first + update în fundal.
- **Cross-origin (CDN): IGNORAT** — se încarcă direct (vezi capcana din `.claude/rules/01`).
- **Update opt-in:** SW nou așteaptă; pagina arată toast „Versiune nouă · Reîncarcă" → `postMessage SKIP_WAITING`. Bump `CACHE` la fiecare deploy de assets.

## De ce `lib/llm.js` separat

Logica de rutare/fallback era inline în `index.html` (netestabilă fără DOM). Extrasă ca modul UMD: rulează în browser (`window.LLM`) și în Node (Vitest). UI-ul (loading/badge) rămâne în `index.html` și e injectat prin callback-uri, ca logica pură să fie testabilă. Vezi `tests/llm.test.js`.
