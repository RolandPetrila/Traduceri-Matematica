# PROMPT SESIUNE NOUĂ — Traduceri Matematică (creat 2026-08-07)

> Lipește ACEST fișier (sau referința lui) ca PRIM mesaj în sesiunea nouă, după `/onboard`.

## STAREA LA ZI (2026-08-07)

Modulul **Planșe e COMPLET pe cod: 6/6 generatoare + P4 (coș→PDF)**. Ultimele livrate (NEDEPLOYATE):

- **Integramă** (SOLVER soluție-unică, „moară de vânt") — commit `bca987c`.
- **P4** (`lib/history.js`: coș cross-generator → 1 PDF + unicitate persistentă) — commit `aa9c49a`.

Ambele: gate verde (selftest Node + selftest.html în-app) + dovedite LIVE (Chrome MCP, verificat din DOM). Detalii complete: `docs/HANDOFF_SESIUNE.md` blocul „REIA DE AICI (2026-08-07)".

Branch `faza-g-editor`. Prod (`traduceri-frontend.vercel.app`) e încă pe **v38** (Teste-selecție-tipuri) — integramă+P4 nu sunt pe prod.

## ⭐ CE URMEAZĂ

### 1) Deploy grupat (când Roland zice „execută")

- Bump `CACHE_VERSION` în `frontend/public/sw.js` (v38→v39; fișierele noi — `generators/integrama.js`, `lib/history.js` — sunt DEJA în `PLANSE_ASSETS`).
- `cd frontend && vercel deploy --prod --yes`.
- Verifică ALIASUL (nu URL-ul deployment-ului) — `traduceri-frontend.vercel.app`: `sw.js` arată CACHE_VERSION nou, homepage 200, `/planse/index.html` + `/planse/generators/integrama.js` + `/planse/lib/history.js` = 200, `selftest.html` pe alias → `__SELFTEST_OK__===true` (9/9 secțiuni).
- Backend `traduceri-api` NEATINS (planșe = static frontend).
- 2 proiecte Vercel — vezi memoria `finding_two_vercel_projects_2026_07_23`.

### 2) Eyeball Roland pe telefon (restanță acumulată din mai multe runde)

- **Integramă + Coș (P4)** — noi, netestate pe telefon.
- **Dictare + Numere** — print PDF real + offline (restanță din 2026-08-06).
- **Căutare + Unește** — print + offline (restanță din 2026-08-05).
- Opțional: Teste-selecție-tipuri (deja verificat E2E pe desktop, telefon opțional).

### 3) După eyeball — decide ce urmează

Modulul Planșe fiind complet, următorul focus e probabil: goluri deferate mai vechi (figuri Gemini supra-decupate, layout export „umflat" — vezi HANDOFF secțiunea „RUNDĂ FIDELITATE EXPORT") SAU cerințe noi de la Roland. Întreabă la începutul sesiunii dacă nu e clar din context.

## REGULI FERME (neschimbate)

- Gate = selftest (harness Node `scratchpad/planse_*.js`, UNTRACKED — reconstruiește după model dacă lipsesc) + `selftest.html` (`__SELFTEST_OK__===true`), oracolul labirint Python NEATINS.
- NU deploya fără „execută" explicit din partea lui Roland.
- R-COST (tot gratis), R-THEME (tablă verde + cretă, Patrick Hand).

## PROMPT SCURT

> `/onboard`. Continuăm Traduceri Matematică. Modulul Planșe e COMPLET pe cod (6/6 generatoare + P4 coș→PDF, ultimele — integramă SOLVER + istoric — nedeployate, gate verde, dovedite live). Rămas: **1) deploy grupat** (bump CACHE_VERSION v38→v39 + `vercel deploy --prod` + verifică aliasul) **2) eyeball Roland pe telefon** (integramă, coș, dictare, numere, căutare, unește — print real + offline). NU deploya fără „execută".
