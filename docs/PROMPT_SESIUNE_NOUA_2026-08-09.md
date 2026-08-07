# PROMPT SESIUNE NOUĂ — Traduceri Matematică (creat 2026-08-07, sesiune `/improve` completă)

> Lipește ACEST fișier (sau doar secțiunea **PROMPT SCURT** de la final) ca PRIM mesaj în sesiunea nouă, după `/onboard`.
> **Acest fișier ÎNLOCUIEȘTE** `docs/PROMPT_SESIUNE_NOUA_2026-08-07.md` (stale, descria starea v38 din 2026-08-06) și `docs/PROMPT_SESIUNE_NOUA_2026-08-08.md` (A/B/D descrise acolo ca „neterminate" — de fapt A și B sunt COMPLETE, D are acum repro confirmat). Nu le șterge (istoric git), dar NU le folosi ca punct de plecare.

## MOD DE LUCRU (obligatoriu, cerut de Roland — neschimbat)

Ritm: **UN livrabil câte unul** → (mock §17 unde e UI nou) → cod → **selftest/gate** → **probă live** → commit. **Deploy GRUPAT, doar cu confirmarea Roland** (excepție: dacă Roland spune explicit „fă deploy când consideri necesar" într-o sesiune anume, ca azi — nu presupune asta implicit în sesiuni viitoare fără o cerere nouă). R-HANDOFF la zi după fiecare item (HANDOFF + plan + memorie + commit/push — commit/push e AUTOMAT conform `feedback_auto_push`, deploy-ul NU). Folosește **advisor** înainte de decizii mari și înainte de „gata".

## STAREA LA ZI (2026-08-07 seară) — ce e LIVE pe prod

Branch `faza-g-editor`. Prod: `traduceri-frontend.vercel.app` (**CACHE_VERSION v43-20260807b**) + `traduceri-api.vercel.app` (backend). **2 proiecte Vercel** (`traduceri-frontend` + `traduceri-api`, ambele `.vercel/project.json` deja legate corect — root→api, `frontend/`→frontend). `vercel` CLI e instalat (56.4.1, global). Deploy: `vercel deploy --prod --yes` din root (backend) / din `frontend/` (frontend) — verifică ALIASUL după (nu URL-ul de deployment).

**Modulul Planșe e COMPLET pe cod ȘI DEPLOYAT: 6/6 generatoare (labirint/căutare/unește/dictare/numere/integramă) + integramă cu 4 forme (moară/zigzag/cruce/scară) + P4 (coș→PDF).** v40 deployat pt integramă multi-formă, v41 pt extinderea B (catalog forme/teme mărite la unește/dictare/căutare/numere/labirint).

**Sesiune `/improve` completă azi (2026-08-07):** prima rulare `/improve complet` a produs 26 recomandări pe 3 lentile (raport: `.claude-outputs/improve/2026-08-07_010000/improve_report.md`). **16/26 executate, testate și DEPLOYATE**:

- F8 (traducere-în-editor) folosește acum **DeepL implicit** (nu mai ocolea spre Gemini — bug real prins prin audit)
- Lock avertisment coliziune autosave `/editor` ↔ `/editor-nou`
- `maxDuration` Python 60→300s (`vercel.json`, verificat la sursă că Hobby permite acum 300s)
- `pages/api/proxy.js` migrat la `app/api/proxy/route.ts` (App Router) — prerequisit Next 16 rezolvat, verificat live pe prod
- Curățenie cod mort: `translation_router.py` (8 funcții + integrare Claude neutilizată), `app/asistent/` + `public/asistent/` (iframe vechi, deja marcat mort în cod)
- CI minimal GitHub Actions (`.github/workflows/gate.yml`, tsc+jest+build+pytest, non-blocking) — **verificat LIVE cu rulare reală**
- 4 teste noi handler HTTP `/api/ocr` (pytest 46→50)
- Calculator: insert Științific/Matrice în editor (nu doar Grafic)
- Convertor: mesaj onest la re-download indisponibil (≥2MB)
- Housekeeping `PLAN_MASTER.md` §7 (3 rânduri stale șterse) + comentarii/titluri stale în Planșe corectate

**Gate final (re-verificat după toate):** `tsc 0 · jest 172/172 · pytest 50/50 · next build OK`.

**⚠️ Lecție de reținut din sesiune:** `outputFileTracingRoot` în `next.config.js` a rupt deploy-ul REAL pe Vercel (`ENOENT path0/path0`) deși `next build` LOCAL mersese OK de multiple ori — revert imediat. Vezi `finding_output_file_tracing_root_breaks_vercel_deploy_2026_08_07` în memorie. **Regulă:** orice schimbare la config de căi din `next.config.js` cere un `vercel deploy --prod` real de test, nu doar build local.

**Rămas neexecutat din raportul `/improve` (P1, cu motiv):**

- **#3** — verifică statutul de cost `gemini-2.5-pro` (ultimul fallback OCR) în Google AI Studio — [INCERT], cere accesul lui Roland la cont.
- **#7, #8** — Teste→Corectează fără „trimite în editor" (asimetric vs Generează) + tab „Istoric→Traduceri" permanent gol (`addToHistory` mort).
- **#17, #18** — verifică continuitatea cheilor DeepL (deja confirmat parțial azi: `character_limit:1000000` pe endpoint-ul live = planul nou „Developer", nu vechiul Free 500k) + Fluid Compute activ pe ambele proiecte Vercel (neconfirmabil din API `get_project`, cere dashboard).
- **#19 (Next 16), #20 (Tailwind v4), #21 (AI Gateway), #26 (persistență Chat/Teste/Calculator)** — Roland a confirmat explicit azi „nu acum" pt toate 4 (AskUserQuestion) — NU redeschide fără o cerere nouă explicită.
- **#25 (prompt instalare PWA)** — verificat azi: **gap CONFIRMAT real** (0 referințe `beforeinstallprompt` în tot frontend-ul), dar Roland a ales să nu implementeze acum. Dacă se redeschide: cere mock+confirmare (regula §17 UI nouă) înainte de cod.
- Restul P2-P4 din raport (neexecutate, listă completă în `improve_report.md`).

---

## ▶️ COADA ACTIVĂ — prioritate ÎNAINTEA oricărui alt lucru (§6b din `PLAN_MASTER.md`)

Astea sunt cerințe Roland deja confirmate ca **execuție obligatorie**, nu backlog opțional (vezi `feedback_execution_queue_discipline`). Semnalează-le la fiecare onboard viitor până sunt bifate `[x]`.

### D — Bug randare `\lim` (repro CONFIRMAT, gata de fix)

Roland a dat exemplul precis (`Screenshot (260).png`, comparație editor vs original `limite_matematica.jpeg`/`.pdf`). **Bug real identificat:** `\lim_{x\to\infty}` randează cu subscriptul `x→∞` lipit inline de „lim" (stil TEXT/inline KaTeX) în loc de stivuit CENTRAT dedesubt (stil DISPLAY, ca-n original tipărit). **NU e pierdere de conținut** — cifrele/formulele sunt corecte (consistent cu scorul math 10/10 din `finding_ocr_test_scorecard_2026_07_31`) — e STRICT o problemă de stil de randare KaTeX.

**Candidat fix (ieftin, risc mic):** forțează `\displaystyle` sau `\operatorname*{lim}` pe LaTeX-ul generat pentru `\lim` — probabil în promptul Gemini OCR (`api/lib/ocr_structured.py` sau echivalent) sau într-un post-procesor de LaTeX. **Verifică să NU regreseze** alte formule cu limite inline (text curent, unde inline chiar e corect — ex. o limită menționată în proză, nu într-un bloc de calcul).

**Recomandare: ÎNCEPE CU D** — repro confirmat, fix candidat identificat, risc mic. Cel mai ieftin item rămas din coadă.

### C — Modul „Școlare 🌐" full-curriculum RO (grădiniță→liceu) — NU începe direct

Decizie de arhitectură REZOLVATĂ (risc copyright discutat cu Roland, 2026-08-07): sursă de CONȚINUT = programa oficială (rocnee.eu, document public); manualele MEN (`manuale.edu.ro`, legale/gratuite) = DOAR referință de aliniere, niciodată stocate/redistribuite; conținut nou = original AI aliniat curricular (modelul `project_curriculum_audit_2026_07_28`); PDF-uri de referință DOAR local gitignored, NICIODATĂ committed. Cerință fermă: acoperire 100% a claselor/categoriilor (pilotul e la alegerea sesiunii, ținta finală NU se negociază).

**Necesită `PLAN_SCOLARE_[data].md` (R-PLAN) + AskUserQuestion propriu ÎNAINTE de cod.** Verifică LIVE statusul reformei curriculare la liceu (edu.ro anunța 175 programe noi „în transparență" la ultima verificare, 2026-08-07) — nu presupune stabilitate.

---

## REGULI FERME (neschimbate)

- Gate Planșe = selftest (harness Node `scratchpad/planse_*.js`, UNTRACKED) + `selftest.html` (`__SELFTEST_OK__===true`), oracolul labirint Python NEATINS.
- Gate frontend = `tsc --noEmit` (acum și `npm run typecheck`) + `jest` + `next build`. Gate backend = `pytest api/tests/`.
- NU deploya fără confirmare explicită Roland (excepție: dacă o cerere explicită din sesiunea curentă o autorizează).
- R-COST (tot gratis), R-THEME (tablă verde + cretă, Patrick Hand).
- R-COPYRIGHT (Școlare, C): programă oficială = sursă de conținut; manuale = referință de citit, NU de stocat/redistribuit; conținut nou = original, aliniat curricular. Niciun PDF de manual committed în git.

## PROMPT SCURT

> `/onboard`. Continuăm Traduceri Matematică. Planșe COMPLET (6/6 generatoare + integramă 4 forme + coș P4), DEPLOYAT. Sesiune `/improve` completă azi (2026-08-07): 16/26 recomandări executate+testate+deployate (DeepL default în F8, lock autosave, maxDuration 300s, migrare proxy.js→App Router, curățenie cod mort, CI GitHub Actions, teste handler OCR, ș.a.) — vezi `.claude-outputs/improve/2026-08-07_010000/improve_report.md` pt restul (P2-P4 + #3/#7/#8/#17/#18 neexecutate, #19/#20/#21/#25/#26 amânate conștient de Roland). **Coada activă rămâne prioritară:** recomand să continui cu **D** (bug `\lim` — subscriptul randează inline, nu stivuit/display; repro confirmat cu `Screenshot (260).png`; candidat fix `\displaystyle`/`\operatorname*{lim}`; risc mic) — **C** (modul Școlare) cere `PLAN_SCOLARE_[data].md` + AskUserQuestion propriu înainte de orice cod, mai complex. Efort: **xhigh**.
