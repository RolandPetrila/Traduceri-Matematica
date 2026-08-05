# PROMPT SESIUNE NOUĂ — Traduceri Matematică (creat 2026-08-06)

> Lipește ACEST fișier (sau referința lui) ca PRIM mesaj în sesiunea nouă, după `/onboard`.
> Scop: continuă execuția la ~100% context, cu **FOCUS MAXIM pe CALITATE + corectitudine**.

## MOD DE LUCRU (obligatoriu, cerut de Roland)

**NU implementa / NU deploya NIMIC** până Roland nu confirmă explicit „execută".
Întâi: `/onboard` + citește `docs/HANDOFF_SESIUNE.md` (blocurile „REIA DE AICI 2026-08-06") + acest fișier.
Ritm: **UN livrabil câte unul** → (mock §17 unde e UI nou) → cod → **selftest/gate** → **probă live** → commit. **Deploy GRUPAT, doar cu confirmarea Roland.** R-HANDOFF la zi după fiecare item (HANDOFF + plan + memorie + commit/push).
Folosește **advisor** înainte de a scrie cod la solver (integramă) și înainte de „gata".

## STAREA LA ZI (2026-08-06) — ce e LIVE pe prod (v38)

Branch `faza-g-editor`. Prod: `traduceri-frontend.vercel.app` (**v38-20260806b**) + `traduceri-api.vercel.app` (backend, NEATINS de rundele recente). **2 proiecte Vercel**; la deploy frontend: bump `CACHE_VERSION` în `frontend/public/sw.js` + `cd frontend && vercel deploy --prod --yes` + **verifică ALIASUL** (nu URL-ul deployment-ului). `vercel` CLI merge (global + `npx`); `frontend/.vercel`→`traduceri-frontend`, root `.vercel`→`traduceri-api`.

**Livrat + DEPLOYAT recent (v37→v38):**

- **P3 Planșe — Dictare** (dictare grafică pe grilă) + **Numere** (crossmath 3×3, **primul SOLVER soluție-unică**) — v37, gate verde + prod-verificat.
- **Teste → selecție tipuri de item** (număr per tip: alegere multiplă / completare / rezolvare probleme / adevărat-fals / corespondență) — v38, **verificat E2E pe prod** (AI onorează tipurile).

## ⭐ CE URMEAZĂ (ordine)

### 1) integramă — ULTIMUL generator P3 (SOLVER soluție-unică, EFORT MARE)

Sub-tabul „Integramă" din modulul Planșe (`frontend/public/planse/`, vanilla-JS). Grilă de aritmetică cu **soluție unică** garantată de un solver. **Aceeași disciplină ca la `numere` (model proaspăt: `generators/numere.js`):**

- **Domeniul TIPĂRIT** pe planșă → unicitatea se verifică pe domeniul DECLARAT.
- **GENERATOR ↔ VERIFICATOR INDEPENDENT:** generatorul CONSTRUIEȘTE; un solver separat (backtracking) NUMĂRĂ soluțiile; acceptă doar `count==1` ȘI `sol==intended`. NU lăsa generatorul să-și valideze singur output-ul.
- Dacă structura e liniară (ecuații ±): **set ascuns ACICLIC (pădure)** → unic independent de domeniu (vezi memoria numere). Dificultate = nr celule ascunse (nu domeniu).
- **ROUND-TRIP pe HTML-ul TIPĂRIT** în selftest (parsează glife/numere/rezultate, hartă independentă, re-solve) + **negative-control** care dovedește că gate-ul are dinți.
- Rundă **advisor** pe designul de unicitate ÎNAINTE de cod.

### 2) P4 — istoric planșe → PDF unic + unicitate persistentă (EFORT MEDIU)

`frontend/public/planse/lib/history.js`: „coș" de planșe (din ORICE generator) → un SINGUR document PDF/print (concatenează puzzle-pages + answer-pages via `PlanseRender.printDocument`) + **unicitate persistentă între sesiuni** (localStorage: reține semnăturile deja generate ca să nu se repete). Wiring + precache în `sw.js`. Gate: selftest + probă live.

### 3) Eyeball / restanțe (Roland, pe telefon)

- Print PDF real + offline pentru **dictare** + **numere** (generate → Print/PDF → verifică pe hârtie).
- Căutare/Unește print + offline (rămas din runde anterioare).
- Teste-tipuri: verificat E2E pe prod (desktop); eyeball pe telefon opțional.

## CONTRACT GENERATOR PLANȘE (recap — model `generators/numere.js` / `dictare.js`)

Fișier nou `generators/<id>.js` = IIFE care înregistrează pe `window.PlanseGen.<id>`:
`buildOne(params, seed) → item` · `render(item, mm?) → {pages:[puzzle,answer], css, interactive, interactiveCss}` · `renderPages(item, nr, total, mm?)` · `selftest() → {ok, detalii}` · `signature(item) → string`.

- RNG: `root.PlansePRNG.PyRandom(seed)` (`randrange`/`randint`/`choice`/`shuffle`/`getrandbits`; `sample()` NU e portat). Semnătură: `root.PlanseSig.md5(...).slice(0,12)`. Print: `root.PlanseRender.printDocument({title,css,puzzlePages,answerPages})` + `openPrintWindow`. Pagina de răspuns = clasă `.pagina-raspuns` (ascunsă la print). Font Patrick Hand, A4.

### Wiring (5 locuri, ca la numere/dictare)

1. `index.html` — `<script src="./generators/<id>.js">` ÎNAINTE de `app.js`.
2. `app.js` — subtab `ready:true` + `mount<Name>()` + ramură în `renderPanel()` + `injectCss()`.
3. `sw.js` — adaugă `/planse/generators/<id>.js` în `PLANSE_ASSETS`.
4. `selftest.html` — `<script>` include + secțiune nouă care rulează `.selftest()`.
5. Preview interactiv: toggle soluție prin clasă `.show-solution` pe elementul de desen.

### GATE (vanilla-JS NU e în graful TS)

- **selftest = gate-ul REAL.** Rulează în Node cu harness (`scratchpad/planse_<id>.js` — **UNTRACKED**, scratchpad efemer; reconstruiește după modelul `planse_numere.js`: `require` lib/prng + lib/signature + generatorul → `globalThis.PlanseGen.<id>.selftest()`). ȘI in-app `selftest.html` (`window.__SELFTEST_OK__===true`, **oracolul labirint Python NEATINS**).
- Rulează și `npx next build` (sanity — planșele-s statice).
- **Probă live:** `cd frontend/public && python -m http.server 8899`, deschide `/planse/index.html`, generează + toggle soluție + (opțional) print. Capcană Chrome MCP: click pe subtab prin `document.querySelector('.subtab[data-id="<id>"]').click()`; NU trage rapid pe steppere (closure stale — lasă React să re-randeze între click-uri, `await` mic).

## REGULI FERME + LECȚII (memorie)

- Onestitate R3 (declară ce n-ai rulat / n-ai declanșat live); **selftest = gate de corectitudine, niciun generator „gata" fără verde**; solverele = **soluție unică OBLIGATORIU**, verificată INDEPENDENT.
- Lecția solver (dictare→numere, valabilă la integramă): verificarea trebuie să fie INDEPENDENTĂ de generare (verificatorul rezolvă/numără; generatorul doar construiește). Determinism = pe GEOMETRIE serializată, NU pe semnătură (semnătura e seed-independentă). Round-trip pe artefactul TIPĂRIT prinde bug-uri de randare pe care logica internă nu le vede.
- R-COST (tot gratis, offline pt planșe), R-THEME (tablă verde + cretă, font Patrick Hand). La deploy: bump `CACHE_VERSION` + verifică ALIASUL; 2 proiecte Vercel; `.vercelignore` la root pt backend.
- Memorii cheie: `finding_numere_solver_unicitate_2026_08_06`, `finding_dictare_reverse_label_gate_2026_08_06`, `finding_two_vercel_projects_2026_07_23`, `deploy_vercel_python_gotchas_2026_07_09`.

## RESTANȚĂ MANUALĂ ROLAND (nu e cod)

Oprește emailurile `no-reply@render.com` „build failed": `dashboard.render.com` → serviciul vechi **„Traduceri-Matematica"** → **Settings → Delete Service** (jos, Danger Zone) SAU **Auto-Deploy = No**. Ireversibil — confirmă serviciul corect. Dacă persistă: GitHub → Settings → Applications → Render → revoke acces la repo.

## PROMPT SCURT (dacă vrei doar esențialul, lipește asta)

> `/onboard`. Continuăm proiectul Traduceri Matematică. LIVE v38 (Planșe: dictare+numere-SOLVER + Teste-selecție-tipuri, toate prod-verificate). Urmează, UNUL câte unul cu gate+probă live: **1) integramă** (ULTIMUL generator P3, **SOLVER soluție-unică** — refolosește disciplina de la `generators/numere.js`: domeniu tipărit + verificator INDEPENDENT + round-trip HTML + set ascuns aciclic dacă e liniar; rundă advisor înainte de cod), **2) P4** (`lib/history.js`: coș planșe→PDF unic + unicitate persistentă localStorage). Gate = selftest (Node harness `scratchpad/planse_*.js` UNTRACKED + `selftest.html` `__SELFTEST_OK__`). NU deploya fără „execută"; deploy grupat + bump `CACHE_VERSION` (v38→…) + `cd frontend && vercel deploy --prod` + verifică aliasul. Efort: **xhigh**.
