# Asistent Text AI

PWA (Progressive Web App) pentru **dictare vocala + procesare AI multi-provider**. Functioneaza pe **orice device** (telefon / tableta / desktop), instalabila ca aplicatie, fara server local.

**Live:** https://asistent-text-ai.vercel.app · **Repo:** RolandPetrila/Asistent_Text_AI (privat)

> Context pentru dezvoltare: vezi `CLAUDE.md` + `docs/` (arhitectura, deploy, securitate, decizii). Punct curent: `RESUME_PUNCT_CURENT.md`.

## Instalare pe telefon (Android)

Deschide link-ul in **Chrome** -> meniu &#8942; -> **„Instaleaza aplicatia"**. Porneste in ecran complet, merge cu laptopul oprit.

## Functii

- **Dictare vocala** (Speech-to-Text) — Android Chrome nativ; pe iPhone/Safari fallback la dictarea din tastatura (app-ul detecteaza si anunta). Comenzi vocale: „asistent rezuma", „asistent corecteaza".
- **AI Toolbar:** Imbunatatire / Corectura (Groq), Rezumat / Email / Raport / SEO / Data Miner (Mistral), Deep Research (Tavily+Mistral), Analiza Ton.
- **Magic Inline Edit:** selectezi text -> Extinde / Scurteaza / Reformuleaza (Groq).
- **Traducere DeepL** (RO/EN/SK/FR/DE).
- **Fallback automat** la fiecare provider AI (`chainLLM`: groq -> gemini -> mistral, fara bucle).
- **Persistenta** (localStorage): input + output + persona + history se salveaza si se restaureaza la redeschidere.
- **Chaining:** Regenereaza + „Foloseste rezultatul ca sursa".
- **Share rezultat** (Web Share API) + **Share Target** (primesti text din alte app-uri).
- **Import fisier:** txt / md / csv / json / **docx** (mammoth) / **pdf** (pdfjs).
- **Export:** TXT / MD / DOCX / PDF / Copy. **Preview Markdown** (sanitizat DOMPurify) + **Diff** vs sursa.
- **RAG Chat** cu documentul sursa. Tema dark/light. Autocorect diacritice inline.

### Imbunatatiri UI/UX (2026-06)

- **Design tokens semantici** (CSS variables `:root`/`.dark`) — paleta unica coerenta; `theme-color` aliniat la brand (sky/dark, separat light/dark).
- **Theme toggle functional** — comuta dark/light, persista in `localStorage` (`theme`) + respecta `prefers-color-scheme`.
- **Skeleton shimmer + typewriter reveal** — la generare AI apare skeleton in coloana Output, apoi rezultatul se "scrie" progresiv (respecta `prefers-reduced-motion`).
- **Badge provider/fallback** pe rezultat — vezi ce model a raspuns si daca s-a facut fallback.
- **Dictare cu feedback real-time** — bare equalizer + timer (mm:ss) cat dictezi.
- **Command Palette** (Ctrl/Cmd+K) — acces rapid la toate actiunile (cautare fuzzy, navigare sageti).
- **Buton instalare PWA** (`beforeinstallprompt` pe Android; hint „Add to Home Screen" pe iOS) + **indicator offline** in navbar.
- **Accesibilitate (nivel A remediat)** — `aria-label` pe câmpuri + butoane icon, `aria-hidden` pe iconițe decorative, **Magic Edit operabil din tastatură** (selectezi text + `Alt+M`), marcaje autocorect focusabile (Enter aplică), modale `role="dialog"` cu **focus-trap + return**, `aria-live` pe toast, roving tabindex pe bara AI, `:focus-visible` global, `<html lang="ro">`, `prefers-reduced-motion`. (Conformanță WCAG 2.2 **AA** încă în lucru — contrast pe câteva badge-uri; vezi audit.)
- **Error boundary global** — `window.error`/`unhandledrejection` → toast (throttled), recovery elegant.
- **IndexedDB draft backup** — salveaza inputul si peste localStorage (util pt documente mari).
- **Export PDF branded** — header cu titlu + data. **`<select>` dark fix** (optiunile native respecta tema).

### Securitate & calitate (2026-06)

- **SRI** (Subresource Integrity) pe toate librariile CDN versionate (inclusiv Tesseract injectat dinamic) + **DOMPurify 3.4.11** + **pdf.js `isEvalSupported:false`** (anti CVE-2024-4367). Vezi `docs/SECURITY.md`.
- **Teste Vitest** (52): proxy + lant de fallback AI. Logica AI extrasa in `pwa/lib/llm.js`. `npm test`.

## Arhitectura

- `pwa/` — sursa PWA, **radacina de deploy Vercel** (HTML static + service worker + manifest + iconite).
- `pwa/lib/llm.js` — logica AI (rutare + fallback) ca modul UMD (`window.LLM`), testabila in Node.
- `pwa/api/proxy.js` — **proxy serverless** Vercel. Cheile API (Gemini/Groq/Mistral/DeepL/Tavily) stau **server-side** ca env vars Vercel, **NICIODATA in browser**.
- `pwa/sw.js` — service worker (network-first pe pagina, cache-first pe asset-uri same-origin).
- `tests/` + `package.json` (root) — suite Vitest; **NU se deployeaza** (Vercel root = `pwa/`).
- Context Claude Code: `CLAUDE.md`, `.claude/rules/`, `docs/`. **Deploy:** vezi `docs/DEPLOY.md`.

## Securitate

- Chei doar server-side (proxy) + **origin allowlist** + **rate-limit** + **security headers** (CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy `microphone=self`) + **SRI** pe librariile CDN versionate.
- Markdown din output AI e sanitizat cu DOMPurify inainte de render (anti-XSS).
- Detalii complete + stare CVE dependinte: `docs/SECURITY.md`.

## Note tehnice (capcane — citeste inainte sa modifici)

1. **Service Worker NU intercepteaza cross-origin.** CDN-urile (Tailwind/FontAwesome/marked/etc.) trebuie sa se incarce direct. Daca SW-ul le face `fetch()`, CSP `connect-src 'self'` le blocheaza -> Tailwind nu se incarca -> **layout complet rupt**. (Bug rezolvat 2026-06-04, commit 5b9341d.) **Bump `CACHE` la fiecare deploy** (acum `asistent-ai-v6`).
   - SW-ul NU face `skipWaiting()` automat la install. Pagina afiseaza un toast **„Versiune noua · Reincarca"** (opt-in, via `postMessage SKIP_WAITING`). La `controllerchange` pagina se reincarca o data.
2. **Deploy Vercel:** CLI `--scope` e ignorat (bug) -> proiectul e linkat via `.vercel/project.json` (orgId+projectId).
3. **NICIODATA chei in browser** — tot prin `/api/proxy`. Nu strica check-ul origin din proxy (altfel app-ul ia 403).
4. **Librarii din CDN cu SRI:** versiunile versionate au `integrity` (hash din fisierul real, versiune exacta in URL). **Exceptii (fara SRI):** `cdn.tailwindcss.com` (build mutabil) si `pdf.worker` (URL-string). Cand adaugi/bumpezi o librarie -> genereaza SRI (vezi `.claude/rules/02`).
5. **Logica AI testabila** e in `pwa/lib/llm.js` (`window.LLM`). Daca o modifici -> actualizeaza `tests/llm.test.js` + `npm test`.

---

_Versiunea locala (HTML cu chei in browser) a fost retrasa — PWA-ul cloud e sursa unica._
