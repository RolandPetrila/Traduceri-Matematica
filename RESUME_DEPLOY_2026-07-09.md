# RESUME — Deploy Vercel ✅ LIVE (2026-07-09)

> Branch `faza-g-editor` (tot pushed). Deploy v4 pe Vercel = **FĂCUT, aplicația e LIVE.**

## 🎉 STARE — LIVE ȘI FUNCȚIONAL

- 🔗 **Frontend: https://traduceri-frontend.vercel.app** (Next 15.5.20, toate rutele → 200: /traduceri /editor /asistent /convertor /diagnostics)
- 🔗 **API: https://traduceri-api.vercel.app** (`/api/health` → 200; funcții Python + `api/lib/` merg la runtime)
- ✅ **Cablat**: `NEXT_PUBLIC_API_URL` = API, `ALLOWED_ORIGIN` = frontend, **CORS verificat** (frontend→API OK). Chei pe `traduceri-api` toate setate: **GOOGLE_AI_API_KEY (cheie nouă AQ., testată live 200)**, DEEPL (+_2, testată 200), GROQ, MISTRAL, HF, OPENROUTER.

## Cum s-a deployat (pt referință / repetare)

**2 proiecte Vercel** (team `rolandpetrilas-projects` / `team_Mt1Ou3cwc6O8BXh73dRACE22`):
- `traduceri-api` (`prj_Ayi48yZMJUe38jXHzCGscmEjDC3z`) — root `.`, funcții Python. Deploy: `cd <repo>; vercel --prod --yes` (root `.vercel/` linkat).
- `traduceri-frontend` (`prj_oV2VAykJ9rK7alVdtHiCDRwL18Kg`) — root `frontend/`, Next 15. Deploy: `cd frontend; export VERCEL_ORG_ID=team_Mt1Ou3cwc6O8BXh73dRACE22 VERCEL_PROJECT_ID=prj_oV2VAykJ9rK7alVdtHiCDRwL18Kg; vercel --prod --yes`.

`vercel.json` final (root, pt API): `buildCommand` scrie `public/index.html` (evită „Output Directory empty"), `installCommand: pip install --break-system-packages ...` (PEP668), `functions.api/*.py.maxDuration=60`.

## RĂMAS (polish, nu blocaje)

1. **Chei proxy Asistent** (module `/asistent`): `frontend/scripts/set-vercel-env.ps1` push-uiește GROQ/GOOGLE_API_KEY/MISTRAL/etc. pe `traduceri-frontend`. Rulat 2026-07-09 (lent, 22 apeluri). **După ce sunt setate → REDEPLOY frontend** (`vercel --prod` din frontend/) ca să le preia. Fără ele, doar Asistentul e degradat; restul merge.
2. **Test flux live** (Roland, browser): deschide frontend → upload poză → OCR → switch RO/SK → export. (Infra verificată; testul real consumă cotă.)
3. **Supabase** = amânat (logare fail-open; `/diagnostics` n-are log-uri cross-device până la setup — vezi `docs/DEPLOY_VERCEL.md` Pas 1).
4. **Merge `faza-g-editor` → `main`** după validare (opțional; deploy-urile sunt din `faza-g-editor` via CLI, nu git-auto).

## Capcane deploy rezolvate (NU repeta) — vezi și memoria [[deploy-vercel-python-gotchas]]

1. `.bat` = PowerShell **5.1** (nu 7.6) → `$ErrorActionPreference="Continue"`.
2. `vercel link --project X --yes` din Bash non-interactiv → **eroare `missing_scope`**. Workaround: `vercel project add X --scope rolandpetrilas-projects` + scrie manual `frontend/.vercel/project.json` (projectId+orgId din MCP `list_projects`) + `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` env vars.
3. PEP668 → `pip install --break-system-packages`.
4. `npm run build` default (root fără package.json) + „Output Directory empty" → `buildCommand` scrie `public/index.html`.
5. Frontend build: `src/lib/tab-config.ts` importa `../../../config/tabs.json` (rădăcina, în afara frontend/) → copiat în `frontend/config/tabs.json` + import `../../config/` (commit c226a5e).
6. **vercel CLI e autentificat global** (`vercel whoami`=rolandpetrila) → AI-ul poate deploya direct din Bash (deploy productie gated de safety → cere aprobare Roland).

## RESTUL SESIUNII (pushed pe faza-g-editor)

Audit 83/100 · M5/M6/M7 · **31 teste** (21 pytest + 10 jest) · **Next 15 mergeuit** (PR#1, vuln HIGH rezolvat) · cheie Gemini nouă procesată în `.api-keys`. Snapshot: `~/.claude/context-snapshots/Traduceri-Matematica-checkpoint-2026-07-09/`.
