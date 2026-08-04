# PROMPT SESIUNE NOUĂ — Traduceri Matematică (creat 2026-08-04)

> Lipește ACEST fișier (sau referința lui) ca prim mesaj în sesiunea nouă, după `/onboard`.
> Scop: continuare la ~100% context, cu **FOCUS MAXIM pe CALITATE + funcționalitate**.

## MOD DE LUCRU (obligatoriu, cerut de Roland)

**NU implementa / NU deploya NIMIC** până Roland nu confirmă explicit „execută".
Întâi: `/onboard` + citește `docs/HANDOFF_SESIUNE.md` + `docs/PLAN_RUNDA_MODULE_2026-08-04.md` + acest fișier.
Apoi **stabilește TOATE detaliile prin AskUserQuestion** (scope, ordine, mock-uri §17 unde e UI nou) și **abia după confirmarea lui Roland** începe execuția. Gate după fiecare item (`tsc·jest·next build` + probă live), deploy pe prod DOAR cu confirmarea lui. R-HANDOFF la zi.

## STAREA LA ZI (2026-08-04) — ce e LIVE pe prod

Branch `faza-g-editor` = `main` (sincronizate). Prod: `traduceri-frontend.vercel.app` (**v32**) + `traduceri-api.vercel.app`. 2 proiecte Vercel; `.vercelignore` la root; bump `CACHE_VERSION` la deploy; verifică ALIASUL.

**Livrat + DEPLOYAT + verificat această rundă:** G0 (merge→main), V5 (funcția liniară a≠0), M2 (constructor matematic RECURSIV), M5 (figuri parametrice editabile), **Calculator** (v30), **Chat AI nativ** (v31, înlocuiește Asistentul), **Teste** (v32). Gate global: `tsc 0 · jest 157/157 · build OK`.

**Eyeball Roland pe prod (rămas — §8):** cele 3 module noi pe telefon + OCR-attach (Chat/Teste — netestat local, backend absent local) + M1 teoreme (Cristina) + fidelitate export.

## ⭐ PRIORITATE #1 — Repară robustețea Chat AI (calitate + durată)

**Simptom (screenshot Roland):** după ~10 mesaje, Chat AI dă „Niciun provider AI n-a răspuns (**OpenRouter: Failed to fetch**)". Roland: **nu integra AI-uri cu limită mică**; maximizează calitatea + durata.

### ⚠️ VERIFICĂ ÎNTÂI cauza (NU sări direct la fix — dovada e ambiguă)

Cauza NU e confirmată; extinderea oarbă a lanțului poate AGRAVA (vezi mai jos). Diagnostichează:

1. **Reproduce pe PROD (`traduceri-frontend.vercel.app`), NU pe localhost.** Screenshot-ul era pe `localhost:3399`, iar în sesiunea de build am omorât `next start` de mai multe ori → „Failed to fetch" pe local poate fi doar serverul dev căzut, nu prod.
2. **Citește string-ul EXACT** (în `sendChat`, non-ok = `"<label>: HTTP <status>"`, iar fetch aruncat = `"<label>: Failed to fetch"`):
   - `HTTP 429` / `HTTP 4xx` ⇒ **cotă/RPM provider** → extinderea lanțului (mai jos) E fix-ul corect.
   - **`Failed to fetch`** ⇒ transport/server/**rate-limiter same-origin**, NU cotă provider.
3. **Capcana `RL_MAX` (proxy.js):** limită in-memory **30 cereri/min/IP**. Azi: ~10 mesaje × ≤3 provideri = ~30 apeluri → atinge plafonul pe la mesajul 10. **Dacă extinzi lanțul la 5–6 provideri, fiecare mesaj = 5–6 apeluri → plafonul vine la ~5 mesaje (MAI RĂU).** Deci: dacă e implicat rate-limiter-ul, întâi **ridică `RL_MAX`** (ex. 120) SAU **plafonează nr. de provideri încercați per mesaj** (nu-i lovi pe toți dacă primul răspunde) ÎNAINTE de a lărgi lanțul.

### Fix (după ce cauza e clară) — extinde lanțul pt calitate + durată

`frontend/src/lib/chat-providers.ts` (`CHAIN`) + `frontend/src/pages/api/proxy.js` (`MODEL_ALLOW`), lanț confirmat de Roland:
**Gemini 2.5 Flash (GOOGLE_API_KEY) → Gemini key2 (GOOGLE_API_KEY_2) → Cerebras (1M tokens/zi, 30 RPM, permanent) → Groq 70B (GROQ_API_KEY) → Mistral (1 miliard tokens/lună; +MISTRAL_API_KEY_2) → OpenRouter.**

- ajustează `RL_MAX`/attempts-per-message conform diagnosticului de mai sus.

* Provideri OpenAI-compatibili (Cerebras/Groq/Mistral/OpenRouter) refolosesc `buildOpenAiPayload`; Gemini are formatul lui. Cerebras e deja în `proxy.js` PROVIDERS (`gpt-oss-120b` în MODEL_ALLOW — verifică un model bun de math; Cerebras servește și Llama). Mistral e în PROVIDERS (`mistral-large-latest`).
* Adaugă cheile lipsă în env Vercel `traduceri-frontend` la deploy (GOOGLE_API_KEY/GROQ/OPENROUTER sunt deja; verifică CEREBRAS_API_KEY, MISTRAL_API_KEY, MISTRAL_API_KEY_2, GOOGLE_API_KEY_2 — toate SET local, `.api-keys/verify.ps1`).
* Failover pe 429/eroare (lanțul deja continuă la non-ok). Indicatorul arată providerul activ.
* Catalog complet chei: `~/.api-keys/catalog.md` (Cerebras 1M/zi, Mistral 1mld/lună, XAI/Grok $150/lună cu data-sharing, SambaNova, NVIDIA 5000 credite, Fireworks, GitHub Models — TOATE candidați de fallback pt „durată maximă"). NU cere valorile; cod pe `process.env.X` (proxy le citește server-side).

## PRIORITATE #2 — P3 + P4 (modulul Planșe, `frontend/public/planse/`, vanilla-JS)

Contract generator (vezi `generators/labirint.js` ca model): `buildOne(params,seed)→item`, `render(item,mm?)→{pages:[puzzle,answer],css,interactive,interactiveCss}`, `selftest()→{ok,detalii}`, `signature(item)`. Se înregistrează pe `window.PlanseGen.<id>`. `app.js` are SUBTABS (numere/integramă/labirint(ready)/unește/dictare/căutare/școlare). Lib: `lib/{prng,render,signature}.js`. Print = `PlanseRender.printDocument` + fereastră nouă. Precache în `sw.js` la deploy (offline).

- **P3 — 5 generatoare** (efort MARE): `căutare` (word-search pe teme), `unește` (connect-the-dots din catalog forme), `dictare` (dictare grafică pe grilă), `numere` (careu numeric 3×3 multi-crossing — necesită SOLVER pt soluție unică), `integramă` (aritmetică cu soluție unică — SOLVER). Fă-le UNUL CÂTE UNUL, cu selftest (invarianți: soluție unică unde e cazul) + gate + probă live. Cele 2 cu soluție unică (numere/integramă) sunt cele mai grele — atenție la corectitudine.
- **P4** (efort mediu): `lib/history.js` — coș de planșe → un singur PDF + unicitate persistentă între sesiuni (localStorage). Integrează cu print-ul existent.

## ACȚIUNE ROLAND (manuală, nu e cod) — oprește emailurile „build failed"

Gmail primește la fiecare push emailuri de la `no-reply@render.com` „build failed for Traduceri-Matematica". **Cauză:** serviciu Render VECHI rămas conectat la repo (dinainte de migrarea pe Vercel) → build eșuat la fiecare push. **Fix (Roland, în dashboard Render):**

1. https://dashboard.render.com → serviciul „Traduceri-Matematica".
2. Cel mai curat: **Settings → Delete Service** (proiectul e 100% pe Vercel acum).
3. Alternativ: **Settings → Build & Deploy → Auto-Deploy = No**, SAU dezconectează repo-ul GitHub.
   (Nu există `render.yaml` de șters în repo — verifică totuși la nevoie.)

## RESTANȚE / BACKLOG (rămân pe backlog dacă nu se decide altfel)

- M3 dark-mode = **RESPINS DEFINITIV** (nu-l re-propune).
- §8 verificări umane (V1–V4) + Cristina (corectitudine formule/teoreme).
- §4 cleanup rămas: `/asistent` route + `public/asistent/*` (iframe vechi retras din UI, fișierele rămase) — curăță când e sigur.
- §7 backlog: Next 16, Tailwind 4, Upstash, PDF>20 batching etc.

## REGULI FERME

Onestitate R3 (declară ce n-ai rulat); CORS `text/plain`/multipart browser→API Python (backend `traduceri-api`); Chat/proxy = same-origin `/api/proxy` (JSON OK); 2 proiecte Vercel; bump `CACHE_VERSION`; verifică ALIASUL; R-COST (free; OpenRouter plătit permis, dar folosește modele free unde se poate); §17 mock pt UI nou; **FOCUS MAXIM PE CALITATE.**
