# RESUME — Deploy Vercel ✅ LIVE (2026-07-09)

> Branch `faza-g-editor` (tot pushed). Deploy v4 pe Vercel = **FĂCUT, aplicația e LIVE.**

## 🎉 STARE — LIVE ȘI FUNCȚIONAL

- 🔗 **Frontend: https://traduceri-frontend.vercel.app** (Next 15.5.20, toate rutele → 200: /traduceri /editor /asistent /convertor /diagnostics)
- 🔗 **API: https://traduceri-api.vercel.app** (`/api/health` → 200; funcții Python + `api/lib/` merg la runtime)
- ✅ **Cablat**: `NEXT_PUBLIC_API_URL` = API, `ALLOWED_ORIGIN` = frontend, **CORS verificat** (frontend→API OK). Chei pe `traduceri-api` toate setate: **GOOGLE_AI_API_KEY (cheie nouă AQ., testată live 200)**, DEEPL (+_2, testată 200), GROQ, MISTRAL, HF, OPENROUTER.

## ✅ SESIUNE 2026-07-09 (partea 2) — validare LIVE + audit + features A/B

Ultimul commit: **`f54611a`**. Toate porțile verzi (tsc 0, next build 8 rute, pytest 24/24, jest 10/10).

- **Validare LIVE e2e** (curl direct API): OCR 200/26.9s (6 figuri, LaTeX, RISC D7 60s NU se materializează) · Traducere RO→SK 200 DeepL (6/6 figuri, LaTeX intact).
- 🔴 **BUG CRITIC găsit+reparat** (`64e1277`): traducerea era **404 în prod** — frontend cheamă `/api/translate-text` (cratimă), Vercel servea underscore după numele fișierului. Fix `rewrites` vercel.json → **deployat, verificat 204 live**. (+ `/api/deepl-usage`, `/api/gemini-usage` reparate.)
- **Audit complet 18 domenii** (4 agenți), **79→86**. Raport: `.claude-outputs/audit/2026-07-09_041859/`. Remediate+verificate: Gemini-LaTeX protect (apel real), DOCX figuri (era pierdere silențioasă)+3 teste, 413→6MB, deepl dual-key, CSP font, a11y, docs.
- **Feature A** (`f54611a`): `.docx` scos din upload Traduceri (OCR image-only) + mesaj „salvează ca PDF".
- **Feature B** (`f54611a`): export HTML **interactiv** (buton RO/SK/EN, schimbă doar textul; layout/figuri/formule intacte). Verificat browser real.
- **Ambele deploy-uri prod live.**

## Cum s-a deployat (pt referință / repetare)

**2 proiecte Vercel** (team `rolandpetrilas-projects` / `team_Mt1Ou3cwc6O8BXh73dRACE22`):

- `traduceri-api` (`prj_Ayi48yZMJUe38jXHzCGscmEjDC3z`) — root `.`, funcții Python. Deploy: `cd <repo>; vercel --prod --yes` (root `.vercel/` linkat).
- `traduceri-frontend` (`prj_oV2VAykJ9rK7alVdtHiCDRwL18Kg`) — root `frontend/`, Next 15. Deploy: `cd frontend; export VERCEL_ORG_ID=team_Mt1Ou3cwc6O8BXh73dRACE22 VERCEL_PROJECT_ID=prj_oV2VAykJ9rK7alVdtHiCDRwL18Kg; vercel --prod --yes`.

`vercel.json` final (root, pt API): `buildCommand` scrie `public/index.html` (evită „Output Directory empty"), `installCommand: pip install --break-system-packages ...` (PEP668), `functions.api/*.py.maxDuration=60`.

## RĂMAS (polish, nu blocaje)

1. ✅ **Chei proxy Asistent = FĂCUT** (22 env vars setate + frontend redeployat 2026-07-09). Asistentul `/asistent` are cheile AI. (NB: `GOOGLE_API_KEY` proxy putea fi billing-blocked → provider Gemini din Asistent degradat, dar fallback-ul din llm.js acoperă.)
2. ✅ **Test flux live = FĂCUT** (2026-07-09 partea 2, via API direct) — a dezvăluit + reparat bug-ul 404 al traducerii. Vezi secțiunea „SESIUNE 2026-07-09 (partea 2)".
3. **Supabase** = amânat (logare fail-open; `/diagnostics` n-are log-uri cross-device până la setup — vezi `docs/DEPLOY_VERCEL.md` Pas 1).
4. ⏳ **Code-review workflow în curs** (`wf_b0aba786-817`, xhigh) — citește findings-urile înainte de merge.
5. **Merge `faza-g-editor` → `main`** după review (gated; deploy-urile sunt din `faza-g-editor` via CLI, nu git-auto).
6. **Flagged din audit** (decizia Roland): quota hard-cap+Upstash, `npm install next@latest`, lint config, figure_crop perf, dead code.

## Capcane deploy rezolvate (NU repeta) — vezi și memoria [[deploy-vercel-python-gotchas]]

1. `.bat` = PowerShell **5.1** (nu 7.6) → `$ErrorActionPreference="Continue"`.
2. `vercel link --project X --yes` din Bash non-interactiv → **eroare `missing_scope`**. Workaround: `vercel project add X --scope rolandpetrilas-projects` + scrie manual `frontend/.vercel/project.json` (projectId+orgId din MCP `list_projects`) + `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` env vars.
3. PEP668 → `pip install --break-system-packages`.
4. `npm run build` default (root fără package.json) + „Output Directory empty" → `buildCommand` scrie `public/index.html`.
5. Frontend build: `src/lib/tab-config.ts` importa `../../../config/tabs.json` (rădăcina, în afara frontend/) → copiat în `frontend/config/tabs.json` + import `../../config/` (commit c226a5e).
6. **vercel CLI e autentificat global** (`vercel whoami`=rolandpetrila) → AI-ul poate deploya direct din Bash (deploy productie gated de safety → cere aprobare Roland).
7. **Deploy prin `!`/bash — proiectul corect** (2026-07-09 p2): `cd C:\...` cu **BACKSLASH eșuează în bash** → `vercel deploy` rulează din rădăcină → deployează **traduceri-api** (greșit pt frontend). `--cwd` citește `vercel.json` din rădăcină → eroare `api/*.py`. **CORECT: `cd "C:/Proiecte/Traduceri_Matematica/frontend" && vercel deploy --prod --yes`** (forward slashes + `&&`). Verifică output: `Aliased: traduceri-frontend.vercel.app` (nu `-api`). Smoke test API: `curl -sI -X OPTIONS .../api/translate-text` → 204.

## RESTUL SESIUNII (pushed pe faza-g-editor)

Audit 83/100 · M5/M6/M7 · **31 teste** (21 pytest + 10 jest) · **Next 15 mergeuit** (PR#1, vuln HIGH rezolvat) · cheie Gemini nouă procesată în `.api-keys`. Snapshot: `~/.claude/context-snapshots/Traduceri-Matematica-checkpoint-2026-07-09/`.
