# PROMPT SESIUNE NOUĂ — Traduceri Matematică (creat 2026-08-07, seara — a 2-a rundă din ziua asta)

> Lipește ACEST fișier (sau doar secțiunea **PROMPT SCURT** de la final) ca PRIM mesaj în sesiunea nouă, după `/onboard`.
> **Acest fișier ÎNLOCUIEȘTE** `docs/PROMPT_SESIUNE_NOUA_2026-08-09.md` — care era **mislabelat**: verificat cu `git log` (commit `cd6fd2a`, ora sistemului) că a fost creat de fapt pe **2026-08-07**, nu pe 08-09. Nu presupune nicio dată dintr-un nume de fișier fără verificare (`date` / `git log --format=%ad`) — asta a produs deja o eroare propagată într-o sesiune. Nu le șterge pe cele vechi (istoric git), dar NU le folosi ca punct de plecare.

## MOD DE LUCRU (obligatoriu, cerut de Roland — neschimbat)

Ritm: **UN livrabil câte unul** → (mock §17 unde e UI nou) → cod → **selftest/gate** → **probă live** → commit. **Deploy GRUPAT, doar cu confirmarea Roland**. R-HANDOFF la zi după fiecare item (HANDOFF + plan + memorie + commit/push — commit/push e AUTOMAT conform `feedback_auto_push`, deploy-ul NU). Folosește **advisor** înainte de decizii mari și înainte de „gata" — a dovedit azi că prinde bug-uri reale pe care gate-ul automat nu le vede (vezi mai jos).

## STAREA LA ZI (2026-08-07 seara) — ce e gata dar NEDEPLOYAT

Branch `faza-g-editor`. Prod încă pe starea de dinainte (CACHE_VERSION v43-20260807b la frontend, backend neschimbat) — **6 commit-uri noi azi, toate frontend-only, NEDEPLOYATE**:

```
df6800a fix(docs): corectie data reala 2026-08-07 (nu 08-09)
641508b docs(handoff): rezultatele rundei advisor + #26b
3a85b47 feat(teste): #26b - trateaza trunchierea raspunsului AI (Generate + Corecteaza)
56c7dcb fix: verificare advisor - D confirmat pe OCR real + bug randare gol la #8
e9af450 docs(handoff): D rezolvat + #7/#8/#17/#18 din /improve inchise
491c3d3 fix(istoric): #8 - ascunde tab-ul "Traduceri" cand e gol
4ac4cce feat(teste): #7 - buton "Trimite corectarea in Editor" la Corecteaza
fee08c1 fix(editor): D - \lim standalone randeaza displaystyle, nu inline
```

**Gate final:** `tsc 0 · jest 181/181 · pytest 50/50 · next build OK`.

### Ce s-a livrat (sesiune „execută tot ce poți autonom", cu advisor + Chrome + Vercel MCP)

- ✅ **D — bug randare `\lim` REZOLVAT.** `ocr-map.ts` trata ORICE `$\lim...$` ca nod inline, indiferent de context — KaTeX text-style pune indicele lateral, nu stivuit. Fix `displaystyleStandaloneLim()`: doar linii „etichetă scurtă + O SINGURĂ formulă `\lim`, nimic altceva" primesc `\displaystyle`; proza rămâne neatinsă; `\liminf`/`\limsup`/`\limits` excluse. **Verificat pe payload OCR REAL** (curl direct pe `traduceri-api.vercel.app`, nu doar stringuri sintetice) — 9/9 formule din `limite_matematica.jpeg` confirmate, test permanent de regresie adăugat. Detaliu: `docs/PLAN_MASTER.md` §6b.
- ✅ **#7** (raport `/improve`) — buton „Trimite corectarea în Editor" la Teste→Corectează (lipsea, asimetric vs Generează).
- ✅ **#8** (raport `/improve`) — tab „Istoric→Traduceri" (permanent gol) ascuns când nu are conținut; date legacy tot accesibile dacă cineva le are.
- ✅ **#26b** (gap găsit de advisor, deja semnalat în HANDOFF ca „RĂMAS") — Teste (Generate+Correct) tratau tăcut trunchierea AI la limita de tokeni; adăugat „Continuă răspunsul" ca la Chat.
- ✅ **#17/#18** (raport `/improve`) — verificate, fără cod necesar: DeepL citește limita live din API; Fluid Compute [PROBABIL] activ implicit pe platformă azi.
- **Rundă advisor înainte de „gata" a prins 2 bug-uri BLOCANTE** (ambele corectate în același commit `56c7dcb`): (1) fix D era verificat DOAR pe date sintetice — riscul era un no-op silențios pe conținut OCR real; (2) `HistoryList.handleClearTranslations` nu reseta `viewMode` → un user cu intrări legacy care apasă „Șterge tot" rămânea cu panou gol până la reload.

**Lecție de reținut (nouă, din corecția de mai sus):** un nume de fișier cu dată (`PROMPT_SESIUNE_NOUA_2026-08-09.md`) NU e dovadă de dată reală — verifică `date` sau `git log --format=%ad` înainte de a scrie orice dată în documentație/memorie. Vezi memoria `finding_ocr_map_inline_vs_displaystyle_2026_08_07` (secțiunea de sus a HANDOFF are corecția completă).

---

## ▶️ COADA ACTIVĂ — prioritate ÎNAINTEA oricărui alt lucru (§6b din `PLAN_MASTER.md`)

### PRIMUL PAS: deploy grupat (cod deja gata + testat + verificat live)

Cele 8 commit-uri de mai sus (D + #7 + #8 + #26b + docs) sunt gata de deploy. **Cere confirmarea explicită a lui Roland**, apoi: bump `CACHE_VERSION` în `frontend/public/sw.js`, `vercel deploy --prod --yes` din `frontend/`, verifică ALIASUL (`traduceri-frontend.vercel.app`), nu doar URL-ul de deployment. Backend `traduceri-api` NEATINS de sesiunea asta (toate schimbările = frontend).

### C — Modul „Școlare 🌐" full-curriculum RO (grădiniță→liceu) — NU începe direct

Decizie de arhitectură REZOLVATĂ (risc copyright discutat cu Roland): sursă de CONȚINUT = programa oficială (rocnee.eu, document public); manualele MEN = DOAR referință de aliniere, niciodată stocate/redistribuite; conținut nou = original AI aliniat curricular. Cerință fermă: acoperire 100% a claselor/categoriilor.

**Necesită `PLAN_SCOLARE_[data].md` (R-PLAN) + AskUserQuestion propriu ÎNAINTE de cod.** Verifică LIVE statusul reformei curriculare la liceu (edu.ro) — nu presupune stabilitate.

---

## REGULI FERME (neschimbate)

- Gate Planșe = selftest (harness Node `scratchpad/planse_*.js`, UNTRACKED) + `selftest.html` (`__SELFTEST_OK__===true`), oracolul labirint Python NEATINS.
- Gate frontend = `tsc --noEmit` + `npm run typecheck` + `jest` + `next build`. Gate backend = `pytest api/tests/`.
- NU deploya fără confirmare explicită Roland.
- R-COST (tot gratis), R-THEME (tablă verde + cretă, Patrick Hand).
- R-COPYRIGHT (Școlare, C): programă oficială = sursă de conținut; manuale = referință de citit, NU de stocat/redistribuit.
- **Verifică data reală înainte de a o scrie oriunde** (`date` sau `git log --format=%ad`) — nu presupune dintr-un nume de fișier.

## PROMPT SCURT

> `/onboard`. Continuăm Traduceri Matematică. Azi (2026-08-07, rundă 2): **D rezolvat** (bug `\lim` — verificat pe payload OCR REAL, nu doar sintetic) + **#7/#8/#26b** din raportul `/improve` livrate + verificate live (Chrome) + **#17/#18** verificate fără cod. Rundă advisor a prins și corectat 2 bug-uri blocante (fix D neverificat pe date reale + `HistoryList` rămânea gol după clear). Gate: `tsc 0 · jest 181/181 · pytest 50/50 · build OK`. **8 commit-uri NEDEPLOYATE** pe `faza-g-editor` — **primul pas: cere confirmarea Roland pentru deploy grupat**. După deploy, coada §6b rămasă: **C** (modul Școlare) cere `PLAN_SCOLARE_[data].md` + AskUserQuestion propriu înainte de orice cod. Efort: **xhigh**.
