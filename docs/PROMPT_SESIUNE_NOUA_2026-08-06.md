# PROMPT SESIUNE NOUĂ — Traduceri Matematică (creat 2026-08-05)

> Lipește ACEST fișier (sau referința lui) ca PRIM mesaj în sesiunea nouă, după `/onboard`.
> Scop: continuă implementarea stabilită (**P3/P4 Planșe**) la ~100% context, cu **FOCUS MAXIM pe CALITATE + corectitudine**.

## MOD DE LUCRU (obligatoriu, cerut de Roland)

**NU implementa / NU deploya NIMIC** până Roland nu confirmă explicit „execută".
Întâi: `/onboard` + citește `docs/HANDOFF_SESIUNE.md` (secțiunea **P3/P4 PLANȘE**) + `docs/PLAN_RUNDA_MODULE_2026-08-04.md` (Etapa 4) + acest fișier.
Ritm: **UN generator câte unul** → mock §17 (unde e UI nou) → cod → **selftest** (invarianți) → gate → **probă live** → commit. **Deploy GRUPAT, doar cu confirmarea Roland.** R-HANDOFF la zi după fiecare item.

## STAREA LA ZI (2026-08-05) — ce e LIVE pe prod

Branch `faza-g-editor` = `main` (sincronizate, `0ceb366`). Prod: `traduceri-frontend.vercel.app` (**v36**) + `traduceri-api.vercel.app`. 2 proiecte Vercel; bump `CACHE_VERSION` în `frontend/public/sw.js` la deploy; **verifică ALIASUL**.

**Livrat + DEPLOYAT această rundă:** Chat AI robustețe+complet+UI (v33→v35) · **P3 Planșe 2/5: Căutare** (word-search) + **Unește** (connect-the-dots) — v36. Gate: `tsc 0 · jest 169/169 · build OK` + selftest planșe verde.

## ⭐ CE URMEAZĂ — P3/P4 (modulul Planșe, `frontend/public/planse/`, vanilla-JS)

Ordine rămasă: **dictare → numere (SOLVER) → integramă (SOLVER) → P4**.

### Contract generator (model: `generators/cautare.js` + `uneste.js`, ambele PROASPETE)

Fișier nou `generators/<id>.js` = IIFE care înregistrează pe `window.PlanseGen.<id>`:
`buildOne(params, seed) → item` · `render(item, mm?) → {pages:[puzzle,answer], css, interactive, interactiveCss}` · `renderPages(item, nr, total, mm?)` · `selftest() → {ok, detalii}` · `signature(item) → string`.

- RNG seedabil: `root.PlansePRNG.PyRandom(seed)` → `randrange(stop)`/`randrange(a,b)`/`randint(a,b)`/`choice(seq)`/`shuffle(x)` (Fisher-Yates in-place)/`getrandbits(k≤32)`. Determinist (același seed → aceeași planșă). **`sample()` NU e portat** (aruncă) — folosește `shuffle`+`slice`.
- Semnătură: `root.PlanseSig.md5(canonicalString).slice(0,12)`.
- Print: `root.PlanseRender.printDocument({title, css, puzzlePages, answerPages})` + `openPrintWindow(html)`. Pagina de răspuns = clasă `.pagina-raspuns` (ascunsă la print). Font Patrick Hand, A4, `@page size:A4 margin:0`.

### Wiring (5 locuri, ca la cautare/uneste)

1. `index.html` — `<script src="./generators/<id>.js">` ÎNAINTE de `app.js`.
2. `app.js` — marchează subtab `ready:true` + funcție `mount<Name>()` (model `mountCautare`/`mountUneste`) + ramură în `renderPanel()` + `interactiveCss` în `injectCss()`.
3. `sw.js` — adaugă `/planse/generators/<id>.js` în `PLANSE_ASSETS` (offline precache).
4. `selftest.html` — `<script>` include + secțiune care rulează `.selftest()` (gate-ul in-app, `__SELFTEST_OK__`).
5. Preview interactiv: toggle soluție prin clasă (ex. `.show-solution`) pe elementul de desen (vezi `.cauta-grid` / `.unaste-draw`).

### GATE (vanilla-JS NU e în graful TS)

- **selftest = gate-ul REAL.** Rulează în Node cu harness-ul: `scratchpad/planse_cautare.js` / `planse_uneste.js` (model: `require` lib/prng, lib/signature, generatorul → `globalThis.PlanseGen.<id>.selftest()`). ȘI verifică `selftest.html` in-app (`window.__SELFTEST_OK__ === true`, labirint-oracle Python **neatins**).
- Rulează și `npx next build` (sanity — planșele-s copiate ca static, dar nu strica build-ul).
- **Probă live:** servește static (`cd frontend/public && python -m http.server 8899`), deschide `/planse/index.html`, generează + toggle soluție + (opțional) print. Capcană Chrome MCP: după click pe subtab, dacă nu comută, folosește `document.querySelector('.subtab[data-id="<id>"]').click()`.

## DETALII per generator rămas

### 1) dictare — dictare grafică pe grilă (EFORT MEDIU, fără solver)

Instrucțiuni gen „3 dreapta, 2 sus, …" pe o grilă; copilul desenează traseul → apare o formă. Reutilizează ideea de contur ca la `uneste` (poligon pe grilă întreagă), dar exprimat ca **pași cardinali** (N/S/E/V + număr de căsuțe) pornind dintr-un punct. **Puzzle** = lista de pași + grila goală; **Răspuns** = traseul desenat. Invarianți selftest: pașii reproduc exact conturul (fără ieșire din grilă, închis). Dificultate = mărime grilă + nr pași.

### 2) numere — careu numeric 3×3 multi-crossing (EFORT MARE, **SOLVER soluție-unică**)

Careu tip „crossmath": operații pe rânduri/coloane care trebuie să dea rezultatele date, cu unele celule ascunse. **Trebuie SOLVER** care confirmă **soluție UNICĂ** (altfel exercițiul e ambiguu = bug). Abordare sigură: generează o soluție validă (numere + operatori), ascunde celule, apoi **rulează un solver exhaustiv** (backtracking pe domeniul cifrelor) și ACCEPTĂ doar dacă numărul de soluții == 1; altfel regenerează/ascunde mai puțin. Invariant selftest FERM: **exact 1 soluție** pe fiecare planșă generată (verificat de solver independent). Atenție la corectitudine — e cel mai greu.

### 3) integramă — aritmetică cu soluție unică (EFORT MARE, **SOLVER soluție-unică**)

Similar: grilă de aritmetică (definiții/indicii → numere) cu **soluție unică** garantată de solver. Aceeași disciplină: generează → verifică unicitatea cu solver exhaustiv → acceptă doar unic. Invariant selftest: 1 soluție.

### 4) P4 — istoric planșe → PDF unic + unicitate persistentă (EFORT MEDIU)

`lib/history.js`: „coș" de planșe (din orice generator) → un SINGUR document PDF/print + **unicitate persistentă între sesiuni** (localStorage: reține semnăturile deja generate ca să nu se repete). Integrează cu `PlanseRender.printDocument` (concatenează puzzle-pages + answer-pages din mai multe generatoare). Precache în `sw.js`.

## REGULI FERME

Onestitate R3 (declară ce n-ai rulat / n-ai declanșat live); **selftest-ul e gate-ul de corectitudine — niciun generator „gata" fără verde**; solverele (numere/integramă) = **soluție unică OBLIGATORIU**, verificată independent; R-COST (tot gratis, offline); R-THEME (tabla verde + cretă, font Patrick Hand); bump `CACHE_VERSION` + verifică ALIASUL la deploy; 2 proiecte Vercel; `.vercelignore` la root pt backend. **FOCUS MAXIM PE CORECTITUDINE** (mai ales solverele).

## RESTANȚE / EYEBALL (rămân pe Roland)

- Eyeball telefon: Chat AI (răspuns lung + „Continuă" + „➕ În editor"), Căutare/Unește (print PDF real + offline). Fallback `\[..\]` + butonul „Continuă" = unit-testate/deployate dar nedeclanșate live pe v35 (Gemini a răspuns) — de confirmat perceptual.
- Gol cunoscut: `TestePanel` (Generează/Corectează) folosește `sendChat` dar ignoră `truncated` → test lung s-ar tăia mut (fără buton „Continuă"). De tratat când se atinge modulul.
- **Acțiune manuală Roland (nu e cod):** oprește emailurile `no-reply@render.com` „build failed" → dashboard.render.com → serviciul vechi „Traduceri-Matematica" → **Delete Service** (proiectul e 100% pe Vercel).

## PROMPT SCURT (dacă vrei doar esențialul, lipește asta)

> `/onboard`. Continuăm **P3/P4 Planșe** (`frontend/public/planse/`, vanilla-JS). Sunt gata Căutare+Unește (v36 live). Urmează, UNUL câte unul cu selftest+gate+probă live: **dictare → numere (SOLVER soluție-unică) → integramă (SOLVER soluție-unică) → P4 (istoric→PDF)**. Model: `generators/uneste.js`. Gate = selftest (Node harness `scratchpad/planse_*.js` + `selftest.html` `__SELFTEST_OK__`). NU deploya fără „execută"; deploy grupat + bump `CACHE_VERSION` + verifică aliasul. Solverele = soluție unică OBLIGATORIU. Efort: **xhigh**.
