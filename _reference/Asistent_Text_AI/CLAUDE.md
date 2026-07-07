# CLAUDE.md — Asistent Text AI

PWA no-build (HTML/JS) pentru dictare vocală + procesare AI multi-provider, pe Vercel.
**Live:** https://asistent-text-ai.vercel.app · **Deploy root:** `pwa/`

> Regulile globale din `~/.claude/` se aplică. Regulile locale din `.claude/rules/` au prioritate la conflict.

---

## LA START SESIUNE (citește în ordine)

1. `RESUME_PUNCT_CURENT.md` — unde am rămas (stare + următorii pași)
2. Memory-ul proiectului (auto-injectat) — decizii, capcane, preferințe
3. `docs/ARCHITECTURE.md` dacă atingi structura · `docs/SECURITY.md` dacă atingi securitatea/CDN

## Stack & arhitectură (pe scurt — detalii în `docs/ARCHITECTURE.md`)

- **`pwa/`** = rădăcina de deploy Vercel (NU muta). Conține:
  - `index.html` — aplicația (single-file, ~3600 linii: UI + logică + 3 `<script>`)
  - `lib/llm.js` — logica AI (rutare + fallback) extrasă ca modul UMD (`window.LLM`), **testată** cu Vitest
  - `sw.js` — service worker (network-first pagină, cache-first assets same-origin, update opt-in)
  - `manifest.json` · `vercel.json` (CSP + headers) · `icon-*.png`
  - `api/proxy.js` — proxy serverless Vercel; injectează cheile (server-side) către 5 provideri
- **`tests/`** + `vitest.config.js` + `package.json` (root) = tooling dev/test. **NU se deployează** (Vercel root = `pwa/`).

## Comenzi

```bash
npm test            # Vitest (52 teste: proxy + fallback AI) — RULEAZĂ înainte de deploy
npm run test:watch  # watch
```

Deploy: vezi `docs/DEPLOY.md` (Vercel CLI, link via `.vercel/project.json`).

## Env vars (chei — sistem central, NICIODATĂ în browser/cod)

Consumate **server-side** în `api/proxy.js` (env vars Vercel):

- **Bază (primari):** `GROQ_API_KEY`, `MISTRAL_API_KEY`, `GOOGLE_API_KEY`, `DEEPL_API_KEY`, `TAVILY_API_KEY`.
- **Reziliență (provideri gratuiti + failover chei secundare):** `CEREBRAS_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY_2`, `MISTRAL_API_KEY_2`, `DEEPL_API_KEY_2`, `BRAVE_SEARCH_API_KEY`.
- **Deploy:** `VERCEL_API_KEY`.

Codul tolerează lipsa cheilor de reziliență: un provider fără cheie întoarce 500 → lanțul de fallback continuă la următorul (zero regresie). Sursă: sistemul central `C:\Users\ALIENWARE\.api-keys` (catalog.md). Detalii: `docs/SECURITY.md`.

## ⚠️ Capcane critice (citește înainte să modifici)

1. **SW NU interceptează cross-origin.** CDN-urile (Tailwind/FA/marked/…) trebuie să se încarce direct. Dacă SW face `fetch()` spre ele, CSP `connect-src 'self'` le blochează → **layout complet rupt** (bug rezolvat: commit 5b9341d). `sw.js` ignoră explicit cross-origin.
2. **Bump `CACHE` în `sw.js` la fiecare deploy** care schimbă assets (acum `asistent-ai-v17`). SW = update **opt-in** (toast „Versiune nouă · Reîncarcă"), fără `skipWaiting()` automat.
3. **Chei DOAR server-side** (`/api/proxy`). Nu strica origin allowlist-ul din proxy (altfel app-ul ia 403).
4. **Deploy Vercel:** `--scope` e ignorat (bug) → proiectul e linkat prin `pwa/.vercel/project.json`.
5. **SRI pe CDN:** toate librăriile versionate au `integrity` (vezi `.claude/rules/02`). **Tailwind Play CDN NU** are SRI (build mutabil — un hash fix s-ar rupe la update). `pdf.worker` e URL-string, fără SRI.
6. **Logica AI testabilă** trăiește în `pwa/lib/llm.js` (`window.LLM`). Dacă o modifici, **actualizează `tests/llm.test.js`** și rulează `npm test`. Modelele sunt definite în 2 locuri: `lib/llm.js` (`MODELS`) și `api/proxy.js` (URL Gemini) — ține-le sincronizate.

## Workflow

`npm test` (verde) → commit → push → deploy Vercel → verificare live (curl headers + smoke). **Validez înainte de deploy** (vezi memory `user-auto-push-deploy`). Branch `main` (proiect solo, deploy din main).

## Convenții

- Commit-uri Conventional (`feat:`/`fix:`/`security:`/`chore:`/`test:`/`docs:`), în română.
- Prettier (hook global auto-format pe Write/Edit). Cod = engleză minim necesar; UI/comentarii = română cu diacritice.
- `.claude/rules/` — reguli locale: `01_pwa_deploy` · `02_security_cdn_sri` · `03_ai_providers`.
