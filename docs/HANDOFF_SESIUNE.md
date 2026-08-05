# HANDOFF SESIUNE — reluare context 100% (editor TipTap + stare proiect)

> Ultima actualizare: 2026-08-06 (**P3 Planșe 4/5: Numere (SOLVER) + Dictare = DEPLOY GRUPAT v37**). Scop: o sesiune NOUĂ reia exact de unde am rămas, cu tot contextul operațional.
> ➡️ **PENTRU SESIUNEA NOUĂ: lipește `docs/PROMPT_SESIUNE_NOUA_2026-08-06.md`** (continuă P3/P4: **integramă (SOLVER)→P4**; dictare + numere = gata).

---

## ▶️ REIA DE AICI (2026-08-06 seara) — P3 Planșe 4/5: Numere (crossmath SOLVER) LIVRAT + DEPLOY GRUPAT

**Generatorul `numere` (careu crossmath 3×3 multi-crossing, primul cu SOLVER soluție-unică) = livrat + gate verde + dovedit LIVE local.** Deployat GRUPAT cu dictare (v37) — vezi statusul deploy la finalul acestui bloc.

- ✅ **`generators/numere.js`** — careu 3×3 de numere; fiecare RÂND și fiecare COLOANĂ = ecuație de 3 termeni cu 2 operatori (`+`/`−`, evaluat STÂNGA→DREAPTA = ordinea standard pt +/− → **zero capcană de precedență**). Operatorii + cele 6 rezultate TIPĂRITE; unele celule ascunse; copilul le completează.
- ✅ **CORECTITUDINE = SOLUȚIE UNICĂ, cu 3 straturi:**
  1. **Domeniul e TIPĂRIT** („numere de la 1 la N") → unicitatea se verifică pe domeniul DECLARAT (altfel „unic" e fals pt copilul care nu știe plafonul). N: Ușor 6 / Standard 9 / Greu 12.
  2. **Insight liniar (advisor):** grila e sistem liniar ±1; a 2-a soluție apare exact la un CICLU (dreptunghi 2×2) în graful bipartit rânduri↔coloane. **Ascundem un set ACICLIC (pădure)** → eliminare prin „singletoni" golește tot → **unic INDEPENDENT de domeniu**. Max 5 celule (arbore de acoperire 3+3). Levierul de dificultate = **nr ascunse 3→4→5** (fără colaps: aciclic atinge mereu ținta).
  3. **VERIFICATOR INDEPENDENT** (backtracking care NUMĂRĂ soluțiile pe domeniu; nu împarte logica de rezolvare cu generatorul care doar CONSTRUIEȘTE) → acceptă doar `count==1` ȘI `sol==intended` (= check pe calcularea FORWARD a rezultatelor).
- ✅ **ROUND-TRIP pe HTML-ul TIPĂRIT** (lecția dictare): selftest extrage glifele operatorilor + numerele + rezultatele din HTML, hartă glif→op scrisă INDEPENDENT, re-rulează solverul → prinde un bug de randare (ex. „−" tipărit ca „+"). **Negative-control** (glifă minus→„+") → FAIL pe Standard/Greu = round-trip-ul are dinți. + oracol `evalLine` (5 cazuri) + control-negativ ciclu 2×2 → 3 soluții (solverul chiar numără).
- ✅ **GATE (selftest = gate real):** oracol + Ușor/Standard/Greu × **24 seed-uri** fiecare → soluție UNICĂ + round-trip HTML + nr ascunse la țintă (3/4/5) + determinism (pe puzzle serializat) + control negativ. Rulat Node (`scratchpad/planse_numere.js`, UNTRACKED) + in-app (`selftest.html` §7, `__SELFTEST_OK__===true`, oracolul labirint Python NEATINS). `next build` OK.
- ✅ **DOVEDIT LIVE local** (static :8899 + Chrome MCP): subtab Numere, Greu seed 7 → careu randat corect (verificat manual toate 6 ecuațiile), 5 goluri, toggle soluție (verzi), domeniul „1 la 12" tipărit, temă corectă. Print-crop: toate ≤ 297mm (grilă mică → mult slack).
- ✅ **Wiring 5/5** (ca cautare/uneste/dictare): `index.html` · `app.js` (`ready:true` + `mountNumere` + `renderPanel` + `injectCss`) · `sw.js` `PLANSE_ASSETS` (`/planse/generators/numere.js`) · `selftest.html` §7 · toggle `.nm-grid.show-solution`. + polish dictare-meta („doar atâtea forme distincte" când Greu dă < cerut — carry-forward advisor).
- 🔧 **Harness gate (UNTRACKED):** `scratchpad/planse_numere.js`. Rulează: `node scratchpad/planse_numere.js`.
- ⏭️ **RĂMAS P3/P4:** **integramă** (aritmetică — **SOLVER soluție-unică**, aceeași disciplină: generator↔verificator independent) · **P4** (`lib/history.js`: coș planșe → PDF unic + unicitate persistentă localStorage).

**✅✅ DEPLOYAT GRUPAT v37 (dictare + numere) — VERIFICAT pe alias (2026-08-06).** `cd frontend && vercel deploy --prod` (frontend-only `traduceri-frontend`, `dpl_FHa4AaoCtczMfcQ3V86FDey3qCnQ`, READY/production). **Aliasul `traduceri-frontend.vercel.app` servește v37:** `sw.js`=`v37-20260806a`; homepage / `/planse/index.html` / `/planse/generators/{numere,dictare}.js` / `/planse/app.js` / `/editor-nou` = toate **200**; `numere.js` conține solverul. **GATE PE PROD VERDE:** `selftest.html` pe alias → `__SELFTEST_OK__===true`, 7/7 secțiuni (incl. §6 dictare + §7 numere), 0 fail, oracolul labirint Python neatins. Backend `traduceri-api` NEATINS (planșe = static frontend). **RĂMAS: eyeball Roland pe telefon** (print PDF real + offline pentru dictare/numere).

---

## ▶️ REIA DE AICI (2026-08-06) — P3 Planșe 3/5: Dictare LIVRAT (NEDEPLOYAT)

**Generatorul `dictare` (dictare grafică pe grilă) = livrat + gate verde + dovedit LIVE local. NU deployat** (deploy grupat, cu confirmarea Roland).

- ✅ **`generators/dictare.js`** — contur RECTILINIU pe grilă exprimat ca pași cardinali („8 căsuțe jos ↓", „1 căsuță dreapta →" …); pornind din punct marcat → apare o formă. **Catalog 17 forme** (pătrat, L, T, cupă, scări, casă, cruce/cruce-mare, H, I, E, munte, robot, coroană, cetate, munte-mare, scări-mari). Fără solver (conturul e dat).
- ✅ **Dificultatea folosește AMBELE pârghii** (cerința „mărime grilă + nr pași"): benzi de pași FĂRĂ suprapunere — Ușor 4–8 (grilă 10) · Standard 9–13 (grilă 13) · Greu 14+ (grilă 16). Grila crește automat ca să încapă o formă mare; **subtitlul afișează grila REALĂ**. „Amestecat" alege din banda dificultății; formă anume = o planșă.
- ✅ **Wiring 5/5** (ca la cautare/uneste): `index.html` (script înainte de app.js) · `app.js` (`ready:true` + `mountDictare` + ramură `renderPanel` + `injectCss`) · `sw.js` `PLANSE_ASSETS` (`/planse/generators/dictare.js` precache offline) · `selftest.html` (script + secțiunea 6) · toggle `.dict-draw.show-solution`.
- ✅ **GATE (selftest = gate-ul real):** 17/17 forme verzi — **închis · cardinal · poligon SIMPLU · în cadru · determinism (pe GEOMETRIE, nu semnătură) · text↔contur**. Cel din urmă = check INVERS pe textul VIZIBIL al pasului (hartă `REV_LABEL` scrisă independent) → prinde o hartă de etichete inversată (U↔D), singurul bug pe care invarianții geometrici NU-l văd. **Negative-control** (bug plantat U↔D) → 35 FAIL = gate-ul are dinți. Rulat în Node (harness) ȘI in-app (`__SELFTEST_OK__===true`, labirint-oracle Python NEATINS). `next build` OK.
- ✅ **DOVEDIT LIVE local** (static :8899 + Chrome MCP): subtab Dictare (badge ●), formă+dif+nr planșe, „Generează" → scări-mari Greu 18 pași grilă 16×16 randate corect (start-dot → traseul reproduce EXACT pașii), toggle soluție (sol-line ascunsă→vizibilă), temă corectă (tablă verde + cretă + Patrick Hand). **Probă print-crop:** înălțimea naturală a paginii puzzle pt TOATE cazurile worst (Greu 16–18 pași) ≤ 297mm → `overflow:hidden`@print NU decupează (≈50mm slack).
- 🔧 **Harness gate (UNTRACKED):** `scratchpad/planse_dictare.js` (scratchpad e efemer — reconstruit după model). Rulează: `node scratchpad/planse_dictare.js`.
- 📝 **De îmbunătățit la următorul generator (neblocant, advisor):** Greu are 4 forme eligibile dar stepper-ul „Număr planșe" merge la 8 → „Amestecat + Greu + 8" dă tăcut doar 4 (dedup pe semnătură). `meta` raportează numărul REAL onest (nu e bug), dar la eyeball pe telefon poate părea rupt. Adaugă în `meta`, când `items.length < np`, un „(doar N forme distincte la această dificultate)". De pliat cu numere/integramă, nu commit separat.
- ⚠️ **Pentru `numere`/`integramă` (SOLVER soluție-unică), lecția din dictare:** solverul care GENEREAZĂ puzzle-ul și solverul care VERIFICĂ unicitatea NU trebuie să împartă cod (un solver care-și validează propriul output nu dovedește nimic — la fel ca harta `REV_LABEL` scrisă independent). Începe cu context proaspăt + o rundă advisor pe designul de verificare a unicității ÎNAINTE de cod.
- ⏭️ **RĂMAS P3/P4:** **numere** (careu 3×3 multi-crossing — **SOLVER soluție-unică**) · **integramă** (aritmetică — **SOLVER soluție-unică**) · **P4** (`lib/history.js`: coș planșe → PDF unic + unicitate persistentă localStorage). Cele 2 cu solver = cele mai grele.
- ⚠️ **DEPLOY (când Roland zice „execută", GRUPAT):** bump `CACHE_VERSION` în `frontend/public/sw.js` (v36→v37…) — bump-ul de grup trebuie să acopere **toate** fișierele P3/P4 livrate (dictare + numere/integramă/P4 când sunt gata); `dictare.js` e DEJA în `PLANSE_ASSETS`. Verifică ALIASUL după deploy. Eyeball Roland pe telefon (print PDF real + offline).

---

## ▶️ REIA DE AICI (2026-08-05) — Chat AI robustețe + completitudine + UI = DEPLOYAT v35

**Sesiune Chat AI (Prioritate #1 + cerințe noi din capturi Roland). Tot LIVE pe prod, verificat.**

- **v33** — robustețe lanț (vezi mai jos).
- **v34** — răspunsuri COMPLETE + „➕ În editor" + full-width (vezi mai jos).
- **v35** — randare formule provideri fallback (`\(..\)`/`\[..\]`) + markdown + RL_MAX 30→60. **main = v35 (`293d8fc`).**

**Verificat LIVE pe prod v35:** conversație reală (limite + derivate) → răspuns **complet** (a,b,c), math randat, markdown bold, **fallback dovedit LIVE** (Cerebras 120B a răspuns o dată), **„➕ În editor" funcțional** (comută pe Editor + inserează cu formule randate editabile). Full-width pe Chat/Calculator/Teste. Gate final: `tsc 0 · jest 169/169 · build OK`.

### ▶️ v33 — robustețe lanț (Prioritate #1)

**Prioritatea #1 din `PROMPT_SESIUNE_NOUA_2026-08-05.md` (Chat AI moare după ~10 mesaje) = ÎNCHISĂ.** Diagnostic pe DOVADĂ (nu extindere oarbă), fix confirmat de Roland, deployat + verificat live.

- 🔬 **DIAGNOSTIC pe prod (7 probe `/api/proxy`, read-only):** 6 provideri = **200** (gemini/gemini2/groq/cerebras/mistral/mistral2 — env-ul e SĂNĂTOS, 0 chei lipsă). **OpenRouter `meta-llama/llama-3.3-70b-instruct:free` = 404 „unavailable for free"** — slug-ul `:free` a fost retras → ultimul fallback era MORT. „Failed to fetch" din screenshot = artefact **localhost** (`next start` omorât), NU problemă prod (pe prod fiecare apel dă status HTTP curat; SW passthrough nu fabrică „Failed to fetch"). RL_MAX=30 nu era cauza (Gemini sănătos = 1 apel/mesaj, nu 3).
- ✅ **FIX (Roland: „Fix complet" + „Scoate OpenRouter din lanț"):** `chat-providers.ts` — `CHAIN` = **Gemini→Gemini2→Cerebras→Groq70B→Mistral→Mistral2** (6 free, 0 OpenRouter, **0 chei noi**); `sendChat` colectează **TOATE** erorile (nu doar ultima) → următoarea pică e auto-diagnosticabilă; `AbortController` timeout 20s/provider; `parseReply` recunoaște `gemini2`. `proxy.js` — **RL_MAX 30→120**. 3 teste noi `sendChat`.
- ✅ **Gate:** `tsc 0 · jest 160/160 (+3) · next build OK`. Commit `a52628d`. Doar frontend (`traduceri-api` NEATINS).
- ✅✅ **DEPLOYAT v33-20260805a** (`traduceri-frontend`, `dpl_CX4uYEuPMPy41BwQnEdyYuqNpth7`, READY/production). **Alias verificat:** `sw.js`=v33, homepage 200. **SMOKE LIVE pe prod:** conversație **12/12 mesaje OK, 0 eșuate** (istoric crescând, ca la user real) → **NU mai moare** la ~10 mesaje. `main` ff la `a52628d` (=prod).
- ⚠️ **Onest (R3):** cele 12 mesaje au mers toate pe Gemini (RPM neatins în rulare) → **fallback-ul nu a fost declanșat LIVE** acum, dar e dovedit prin cele 6 probe 200 individuale + testele unitare. Dacă Gemini/Groq pică, cele 4 plase vii (gemini2/cerebras/mistral/mistral2) preiau.
- 📝 **Notat pt viitor (advisor, neblocant):** proxy-ul (`proxy.js:261`) nu are AbortController pe fetch-ul UPSTREAM → în worst-case un mesaj = 3×60s server-side; relevant la „durată maximă" dacă apare. Upstash e comentat (RL in-memory per-instanță) — OK pt single-user.

### ▶️ v34 + v35 — răspunsuri complete + UI (cerințe capturi Roland)

Roland (capturi TEST XI): AI răspundea doar a-c+partial d (tăiat la 2048 tok); chenar chat prea mic; voia să adauge răspunsul în editor.

- ✅ **v34 — completitudine + „În editor" + full-width** (commit `405af0a`): `maxOutputTokens/max_tokens` 2048→8192; `isTruncated()` (finishReason MAX_TOKENS / finish_reason length) → buton **„Continuă răspunsul"** (garanție complet la orice lungime); system-prompt „răspunde COMPLET la TOATE punctele". Buton **„➕ În editor"** per mesaj AI (`onSendToEditor`→`insertEditorText`). Full-width: Chat/Calculator/Teste `max-w-3xl`→`w-full` (Editor/Istoric erau deja full). Mobilul neafectat.
- ✅ **v35 — randare formule fallback** (commit `94ceddf`): **descoperit la eyeball v34** — Cerebras/Groq/Mistral scriu `\(..\)`/`\[..\]`+markdown, pe care `renderMathText` (doar `$..$`) NU le randa → math brut când răspunde un fallback. Fix: `normalizeMathDelimiters()` partajat (`\[..\]`→`$$`, `\(..\)`→`$`) + markdown minim, folosit ȘI la chat ȘI la inserarea în editor (`EditorTiptap.textToContent`). `math-html.test.ts` nou.
- ⚠️ **Onest (R3):** pe v35 Gemini a răspuns la re-test (randat perfect); randarea `\[..\]` a unui fallback nu a fost RE-declanșată live pe v35 (dar: defectul văzut direct pe v34 + unit-teste 7/7 + cod deployat). Butonul „Continuă" (trunchiere) — logică unit-testată, nedeclanșat live (răspunsurile au încăput în 8192).

### ▶️ P3/P4 PLANȘE — în curs (2026-08-05)

Modul `frontend/public/planse/` (vanilla-JS, iframe). Contract generator (ca `labirint.js`): `buildOne/render/renderPages/selftest/signature` pe `window.PlanseGen.<id>`. Wiring nou = `index.html` (script) + `app.js` (subtab `ready` + `mount<Name>` + `injectCss` + `renderPanel`) + `sw.js` precache + `selftest.html`. Gate = **selftest** (Node + `selftest.html` in-app, `__SELFTEST_OK__`), NU tsc/jest (static). Ordine: căutare→unește→dictare→numere→integramă→P4.

- ✅✅ **Căutare** (word-search, `cautare.js`) — commit `0f897ae`. 5 teme × 3 dif, selftest 60 planșe verde, dovedit LIVE. **DEPLOYAT v36.**
- ✅✅ **Unește** (connect-the-dots, `uneste.js`) — commit `32f4360`. 7 forme × 3 dif (SVG), selftest verde, dovedit LIVE (stea 20 pct). **DEPLOYAT v36.**
- ✅✅ **DEPLOYAT v36-20260805d** (`b07b7d5`): alias `traduceri-frontend.vercel.app` sw.js=v36, `/planse/generators/{cautare,uneste}.js`=200 (precache offline). **RĂMAS eyeball Roland pe telefon** (print PDF real + offline). main=b07b7d5.
- ✅✅ **Dictare** (dictare grafică pe grilă, `dictare.js`) — LIVRAT 2026-08-06, gate verde, dovedit LIVE. **NEDEPLOYAT.** Vezi blocul „REIA DE AICI (2026-08-06)" din capul fișierului.
- ⏭️ **RĂMAS P3:** **numere** (careu 3×3 multi-crossing — **SOLVER soluție-unică**) · **integramă** (aritmetică — **SOLVER soluție-unică**). Cele 2 cu solver = cele mai grele (atenție corectitudine). + **P4** (`lib/history.js`: coș planșe → PDF unic + unicitate persistentă localStorage).
- **Deploy P3/P4:** grupat, cu confirmarea Roland; bump `CACHE_VERSION`; noile fișiere sunt DEJA în `sw.js` precache. Uneltele: `scratchpad/planse_*.js` (harness Node selftest).

### ▶️ RĂMAS (Chat AI)

- 🔧 **Gol cunoscut (neblocant, advisor):** `TestePanel` (căile Generează `:79` + Corectează `:263`) folosește `sendChat` dar **ignoră `truncated`** — un test lung (10 itemi + barem) care atinge 8192 tok s-ar tăia MUT (aceeași clasă de defect ca la Chat, dar fără buton „Continuă"). Beneficiază deja de 8192 + `normalizeMathDelimiters`. De adăugat handling trunchiere când se atinge modulul (nu merită deploy separat acum).
- ➡️ **URMĂTORUL:** Prioritatea #2 = **P3** (5 generatoare planșe, numere/integramă cu solver soluție-unică) + **P4** (istoric→PDF). Vezi `PLAN_RUNDA_MODULE_2026-08-04.md` §Etapa 4 + `PROMPT_SESIUNE_NOUA_2026-08-05.md` §Prioritate #2. + acțiune manuală Roland: oprește emailurile Render (Delete Service).

---

## ▶️ REIA DE AICI (2026-08-04, RUNDĂ MODULE — execuție autonomă)

**Plan activ: `docs/PLAN_RUNDA_MODULE_2026-08-04.md`** (stabilit integral cu Roland prin AskUserQuestion). Scope: M2+M5+P3+P4+Calculator+Corectare/Teste+Chat AI nativ + V5 + merge→main. Ritm: secvențial, gate după fiecare item, **deploy grupat cu confirmarea Roland**.

- ✅ **G0** merge `faza-g-editor`→`main` (ff, `9926ae1`), main = prod v28. Lucrez pe faza-g-editor, sincronizez main la deploy.
- ✅ **V5** funcția liniară VIII = `a≠0` — **0 modificări** (biblioteca deja o definește așa; nuanță denumire = Cristina).
- ✅ **M2** constructor matematic RECURSIV (`math-builder-tree.ts` + rescris `EditorMathBuilder.tsx`) — √-în-fracție etc., 0 cod per combinație. Commit `e503028`. Gate tsc0/jest129/build. Dovedit LIVE desktop.
- ✅ **M5** figuri parametrice (etichete+laturi, editabile după inserare via `figure:edit`, EXPORT-SAFE `<img>` SVG). Commit `9a720e8`. Gate tsc0/jest136/build. Dovedit LIVE (A→M, latură=5).
- **M3** dark-mode = **RESPINS DEFINITIV** (de marcat în PLAN_MASTER §5 la FIN).
- ✅✅ **DEPLOYAT + VERIFICAT pe alias:** v29 (V5+M2+M5), v30 (Calculator), v31 (Chat AI), v32 (Teste). main = v32 (`338b99e`).
- ✅ **CALC** Calculator (științific+grafic+matrice, math.js, grafic→editor). ✅ **CHAT** Chat AI nativ (Gemini→Groq→OpenRouter prin `/api/proxy`, KaTeX, OCR-attach, înlocuiește iframe Asistent — cheile deja pe traduceri-frontend). ✅ **TESTE** (Generează AI→editor + Corectează OCR). Toate dovedite LIVE local + gate verde.
- **M3** dark-mode = RESPINS DEFINITIV (de marcat în PLAN_MASTER §5 la FIN).
- ➡️ **RĂMAS → SESIUNE NOUĂ** (Roland a ales să amâne, cu prompt complet): vezi **`docs/PROMPT_SESIUNE_NOUA_2026-08-05.md`**. Mod de lucru: AskUserQuestion → confirmare Roland → execuție. Ordine:
  1. **PRIORITATE #1 — repară Chat AI** (moare după ~10 mesaje: „OpenRouter: Failed to fetch"; free-tier RPM/cotă mici). Extinde lanțul: **Gemini(+key2)→Cerebras(1M/zi)→Groq70B→Mistral(1mld/lună)→OpenRouter**. Roland: nu integra AI cu limită mică; maximizează calitate+durată.
  2. **P3** (5 generatoare planșe, unul câte unul; numere+integramă cer solver soluție-unică) + **P4** (istoric→PDF).
  3. §8 eyeball Roland (Calc/Chat/Teste + OCR-attach netestat local) + Cristina (formule/teoreme).
- **ACȚIUNE ROLAND (manuală):** emailuri `no-reply@render.com` „build failed for Traduceri-Matematica" la fiecare push = serviciu **Render vechi** rămas conectat la repo (post-migrare Vercel). Fix: dashboard Render → serviciul → **Delete** (sau Auto-Deploy=No). Nu e cod. (Confirmat: 5+ emailuri în Gmail, 03–04.08.)
- **M3 dark-mode = RESPINS DEFINITIV** (marcat în PLAN_MASTER §5).
- **Gate curent global:** `tsc 0 · jest 157/157 · next build OK`. main=v32.

---

## ▶️ REIA DE AICI (2026-08-01, sesiune execuție autonomă) — §2 SECURITATE în curs

**Ordine execuție rămasă:** §2 SECURITATE (S1–S8) → §3 REGRESII (G1–G4) → R8.4+R8.5 → §4 CURĂȚENIE (C1–C7) → §5 EDITOR (M1–M6) → §6 PLANȘE (P1–P4). §7 backlog = NU. §8 = doar semnalez.

- ✅ **S1** `npm audit fix` non-force: 5 vuln→3 (dompurify→3.4.12, katex→0.16.47 [peer `^0.16.4` satisfăcut, gate_check 334/334], next→15.5.22). 3 HIGH residual = transitive-under-next (fix doar Next 16/backlog). Doar `package-lock.json`.
- ✅ **S2** XSS `HistoryDetail.tsx:65` → `sanitizeHtml(entry.html)`. `editor-export.ts:179` verificat = risc scăzut (getHTML schema-constrained), lăsat.
- ✅ **S3** `pypdf 4.3.1→6.14.2`; 5 căi reale convert.py testate pe PDF real (pytest nu atinge pypdf).
- ✅ **S4** timeout-uri OCR/traducere < 60s (Gemini 180→45+retries0 = F9 bounded; Claude/NLLB capate; gap Azure+Gemini stack închis cu buget rămas). Residuu onest: gemini_request/ocr_with_mistral 55×3 (partajate cu OCR legacy).
- ✅ **S5** `/api/logs`: rate-limit per-IP (120/min) + body cap 32KB + caps câmpuri.
- ✅ **S6** `error_response`: mesaj generic pt non-AppError (nu scurge corpul providerului), error_code păstrat.
- ✅ **S8** corectat comentariul fals „CI runs lint" (nu există CI; lint are 12 erori pre-existente).
- ⏳ **S7 — BLOCAT pe Roland** (AskUserQuestion): `ALLOWED_ORIGIN` default `"*"` fail-open. NU se poate schimba autonom — riscă ruperea CORS live (app-ul e cross-origin frontend↔api) + poate cere env var pe prod. Vezi întrebarea.
- ✅ **S7 — DECIS: risc acceptat** (Roland, AskUserQuestion). `ALLOWED_ORIGIN="*"` rămâne (fără auth/cookies → nu expune date; rate-limited). NU „fixa" autonom.
- **Gate §2:** `tsc 0 · jest 123/123 · next build OK · pytest 50/50`. Commits `75fa1ee`(S2)…`9b80468`(bump).
- ✅✅ **DEPLOYAT §2 v26 (2026-08-01, confirmat Roland „deploy acum grupat"):** frontend `traduceri-frontend` (dpl `traduceri-frontend-9bmut5zvi`) + backend `traduceri-api` (dpl `traduceri-i7e7ww0ul`). **Aliasuri VERIFICATE:** `traduceri-frontend.vercel.app/sw.js`=`v26-20260801c`, homepage+/editor-nou=200; `traduceri-api.vercel.app/api/ocr` OPTIONS=200, `/api/health`=200. **SMOKE OCR REAL pe prod (multipart, engine=gemini, `limite_matematica.jpeg`):** 200 în **10.8s** (< 60s = S4 OK), 10 secțiuni, 9 formule LaTeX — F9 NEATINS de §2. ⚠️ **Descoperire onestă (pre-existent, out-of-scope):** calea JSON din `ocr.py` NU decodează base64 (`data` rămâne str → TypeError); clientul real folosește multipart → nefolosită, dar latentă.
- ✅✅ **§3 REGRESII (G1–G4) COMPLET (2026-08-01, NEDEPLOYAT — toate frontend):**
  - **G1** contor DeepL discret reintrodus lângă F8 (`DeepLQuotaBadge`, verificat pe endpoint live).
  - **G2** cache traduceri PERSISTENT cablat (decizia Roland; content-based SHA-256; reopen+switch = fără reconsum DeepL). 3 teste noi.
  - **G3** notificare browser la import lung (tab ascuns) — `import-notify.ts`.
  - **G4** verificare vizuală original↔rezultat (mock §17 aprobat: thumbnail+lightbox sursă în banner + dialog).
  - Gate §3: `tsc 0 · jest 126/126 · next build OK`. Commits `4c97834`(G3)…`1fa1d86`(G4).
- ✅✅ **R8.4 + R8.5 LIVRATE (2026-08-01):** R8.4 (figuri supra-decupate) = ATENUAT (expansiune snap 0.35→0.15 + cap creștere; decizia Roland; F9-safe dovedit prin fixture + 1 test nou; pytest 51). R8.5 (layout export) = CSS page-break + compactare.
- ✅✅✅ **DEPLOYAT v27 (2026-08-03, confirmat Roland „deploy acum grupat"):** frontend `traduceri-frontend` (§3 G1–G4 + R8.5, `CACHE_VERSION v26→v27-20260803a`) + backend `traduceri-api` (R8.4 figure_crop). **Aliasuri VERIFICATE:** FE sw.js=v27, homepage 200; BE `/api/ocr` OPTIONS 200, `/api/health` 200. **SMOKE OCR prod (2.0_test_page figuri, engine=gemini):** 200/23.9s, **6 figuri crop-uite** (R8.4 nu a rupt cropping-ul). **RĂMAS eyeball Roland pe prod:** badge DeepL, cache reopen, notificări, preview thumbnail+lightbox, export tabel compact, duplicare figuri construcție.
- ✅✅ **§4 CURĂȚENIE (C1–C7) COMPLET (2026-08-03, NEDEPLOYAT):**
  - **C1** overlay ȘTERS (git rm 3 fișiere + dev_server; abandon G5). **C4** `api/translate.py` ȘTERS (client curent nu-l cheamă). **C2** `pdf-rasterize.ts` ȘTERS. **C3** orfani ȘTERȘI (figure-payloads/export-naming +teste, config/languages+math_terms) — `translation-cache` PĂSTRAT (G2), `error_codes.json` PĂSTRAT. **C5** `react-dropzone`/`react-markdown` uninstall + `getHistoryEntry`/`ConversionRequest` șterse. **C6** rute clarificate doc-only. **C7** capcană respectată (VII neatinse).
  - **CORECȚII plan:** `import re as _re` = VIU (S6), `translation-cache` = folosit acum (G2) — ambele NEATINSE.
  - Gate: `tsc 0 · jest 115/115 · next build OK · pytest 46/46`. Commits `6dcd1a9`…`975cbba`.
  - ⚠️ **DEPLOY §4 pending:** endpoint-urile `/api/overlay` + `/api/translate` (live) → 404 după deploy backend. Fără urgență (cleanup, 0 impact user, client curent nu le cheamă) → batch cu §5. Frontend cleanup = bundle mai mic, batch cu §5.
- ✅ **§5 EDITOR (parțial 2026-08-03):** M1 (teoreme bisectoarei/Menelaus/Ceva la VII, 334→337) · M4 (a11y role/aria-live bare import) · M6 (decizie crop consemnată §9) = LIVRATE. **M2/M3/M5 = de decis/backlog (vezi mai jos).**
- ✅ **§6 PLANȘE (parțial 2026-08-03):** P1 (secțiune Planșe reintrodusă, vezi mai jos) · P2 (offline reparat: precache `/planse/*` în `sw.js`) = LIVRATE. **P3/P4 = backlog.**

### 🧩 MODUL PLANȘE (P1 — reintrodus 2026-08-03)

**Stare reală:** 2/8 faze — F0 (schelet) + F1 (generator labirint). **1 generator din 6.** Cod: `frontend/public/planse/` (index.html, app.js, style.css, generators/labirint.js, lib/{prng,render,signature}.js) + tab în `config/tabs.json` (iframe). Absent din handoff 8+ zile → acum documentat. **P2 fix:** cele 7 fișiere prod sunt precache-uite în `sw.js` → offline imediat după instalare.
**Backlog (P3/P4, decizia Roland NU acum):** 5 generatoare rămase (numere/integramă/unește/dictare/căutare) + `lib/history.js` (coș→PDF unic).

### ⏳ RĂMAS de decis/backlog (§5) — pt Roland / sesiune nouă

- **M2** (constructor nested radical-în-fracție): rework UX MEDIU-MARE (compoziție recursivă de câmpuri). NU e bug — constructorul mono-segment MERGE. De decis dacă merită efortul.
- **M3** (dark-mode): ⚠️ CONFLICT cu R-THEME (tema fixă „tablă verde + cretă"). `next-themes` absent, 0 clase `dark:`. NU implementez autonom — **cere decizia ta** (vrei dark-mode peste identitatea chalkboard?).
- **M5** (figuri PARAMETRICE): explicit „efort MARE — candidat backlog". Amânat conștient de 3× deja.
- ✅✅✅ **DEPLOYAT v28 (2026-08-03, confirmat Roland „frontend + backend cu translate"):** frontend `traduceri-frontend` (`CACHE_VERSION v27→v28-20260803b`: M1 teoreme + M4 a11y + P2 planse-offline + cleanup FE) + backend `traduceri-api` (§4 C1 overlay + C4 translate removals). **VERIFICAT pe alias:** FE sw.js=v28, homepage+/editor 200; **toate 7 `/planse/*` = 200** (precache offline funcțional, non-fatal); BE `/api/overlay`+`/api/translate` = **404** (scoase curat), `/api/translate-text`+`/api/ocr`+`/api/health(GET)` = 200 (clientul curent neatins). (`/api/health` OPTIONS=501 = doar OPTIONS-neimplementat, GET=200, NU regresie.)
- ➡️ **URMĂTORUL (sesiune nouă / Roland):** decizii **M2** (constructor nested — merită?) + **M3** (dark-mode — vrei peste R-THEME?); backlog M5/P3/P4; **§8 eyeball Cristina** (corectitudine+plasare teoreme M1, badge DeepL, cache reopen, preview import, export tabel, duplicare figuri construcție).

---

## ▶️ REIA DE AICI (2026-08-01) — R7 UPGRADE CALITATE OCR = DEPLOYAT + PROD-VERIFICAT

**R7 (Azure Doc Intelligence pt documente + Gemini pt math) COMPLET + DEPLOYAT. RĂMAS doar eyeball CLIENT Roland pe prod.**

**✅ DEPLOY (2026-08-01), confirmat de Roland (AskUserQuestion):**

- **DOUĂ proiecte Vercel** (capcană — vezi mai jos): frontend `traduceri-frontend` (Next) + API `traduceri-api` (Python, unde rulează `azure_layout`). Backendul R7 = pe `traduceri-api`, NU pe frontend!
- **Env Azure** (`AZURE_DOC_INTEL_KEY`+`ENDPOINT`) adăugate pe **`traduceri-api`** (proiectul corect). Scoase din frontend (unde le pusesem greșit inițial).
- **Frontend v24** (`CACHE_VERSION v23→v24`, dpl_AdoBQ…) — alias servește v24 (verificat curl), homepage 200.
- **API `traduceri-api`** (dpl_8G6WYzYF…) — după fix `.vercelignore` (prima încercare a picat: bundle 374MB>225MB, urca `99_Roland_Work`=314MB manuale gitignored). Alias `/api/ocr` OPTIONS 200.
- **✅ SMOKE PROD la sursă (Filtrasan real, engine=azure):** HTTP 200 în 6.2s, `source=azure-layout`, **5 tabele + 2 figuri**, tabelul rezultate **7×4** reconstruit. Env-urile Azure funcționează pe prod (nu fallback Gemini).

**⚠️ CAPCANĂ DEPLOY (pt sesiuni viitoare):** proiectul API `traduceri-api` NU e linkat în tree (root `.vercel` gol) → `vercel link --project traduceri-api` din root ÎNAINTE de env/deploy. Root `vercel deploy` urcă WORKING-DIR → `.vercelignore` OBLIGATORIU (exclude 99_Roland_Work/frontend/scratchpad/docs). Env backend = pe `traduceri-api`, NU pe `traduceri-frontend`.

**R7 COMPLET pe cod + gate + dovadă la sursă:**

- ✅ **PASUL 1 confirmat la sursă:** Azure `prebuilt-layout` dă tabele/figuri/reading-order **gratis pe F0**; `features=formulas` dă LaTeX dar e **add-on PLĂTIT** → exclus prin R-COST, **math rămâne Gemini** (10/10 neatins). Limite F0 [CERT]: 2 pag/doc, 4MB, 500/lună. Decizii Roland (AskUserQuestion): rutare pe FORMA fișierului + gardă R-MATH; euristică auto + buton „Forțează OCR" (§17 mock aprobat).
- ✅ **R7.1 tabele** — `azure_layout.py` → tip secțiune `table` → noduri TipTap (`ocr-map.ts`). Filtrasan real → **tabel 7×4 reconstruit**.
- ✅ **R7.2 forțează-OCR** — `pdf-text-quality.ts` (`cleanWordRatio`, prag 0.55 măsurat pe fișiere reale, ambii poli unit-testați) + buton „Forțează OCR" în `EditorInsertMenu`.
- ✅ **R7.3 ordine multi-coloană** — diagnostic real (cauza = aplatizarea, nu promptul) → `orderReadingSequence` în `ocr-map.ts` → `a,b,c,d,e,f`.
- ✅ **R7.4 figuri business PDF** — polygon Azure → bbox → `figure_crop` cu `snap=False`. Filtrasan → **logo + sigiliu decupate curat** (PNG verificate vizual).
- ✅ **R7.5 rutare** — `api/ocr.py` `engine` param (imagine→Gemini / PDF→Azure) + gardă `_has_table`→Gemini + error→Gemini.
- ✅ **Gate:** `tsc 0 · jest 116/116 · next build OK · pytest 49`. Raport: `docs/OCR_COMPARATIE_2026-07-31.md`.

---

## ▶️ RUNDĂ FIDELITATE EXPORT (2026-08-01 seara) — 3 fix-uri DEPLOYATE v25

Roland a testat pe prod (import merge Teste_Input → export PDF, 14 pagini). Claude a verificat **exhaustiv toate 14 paginile**.

**✅ R7 confirmat vizual în export:** ambele lab-uri (CettaClear+Filtrasan) → logo-uri randate + **tabele reconstruite** (rezultate Parameter/Einheit/Ergebnis/Verfahren cu valori corecte) + text curat. Fracții 9–13 → math + ordine a–f corectă.

**✅ 3 BUG-uri găsite + reparate + DEPLOYATE v25 (`traduceri-frontend`, alias verificat):**

- **SEV1 garbaj Hangul în loc de formule** (`∢피뭐푓`↔`∢MOP`): litere Math-Alphanumeric (U+1D400+) **TRUNCHIATE la 16 biți → Hangul (U+D400)** _în stratul-text al PDF sursă_ (exportator Word→PDF stricat; `1.2_Unghiuri.pdf`). Fix `fixTruncatedMathAlnum` (+0x10000 NFKC) în `ocr-map.ts`. Vezi memoria `finding_truncated_math_unicode_2026_08_01`.
- **SEV2 `$latex$` brut în caption figură** → parsat prin `parseInlineToNodes` (se randează).
- **SEV3 cifre-zgomot izolate** (limite: 9 rânduri „1" fantomă) → filtru `^\d$` în `textToParagraphs`.
- Gate `tsc 0 · jest 123/123 · build OK`. Commits `a4b4801`+`7a4cff2`. Frontend-only (backend Azure neatins).

**⚠️ DEFERAT ONEST (SEV3, NErezolvat — candidate pt sesiunea nouă):**

- **Figuri Gemini SUPRA-decupate** pe pagini de construcție: `_snap_to_content` (snap=True) extinde bbox-ul mic al Gemini (+35%) → înghite textul tipărit ce e ȘI transcris → **duplicare** (poză + text). Risc: schimbarea snap-ului regresează figurile math F9 → cere re-verificare atentă.
- **Layout „umflat" la export**: 1 pag lab → 3 pag (rânduri tabel înalte, tabele rupte peste page-break). Cosmetic, la EXPORT (turbodocx/print CSS din `editor-export.ts`), nu la extragere.

---

**➡️ URMĂTORUL (transfer sesiune nouă 2026-08-01):**

1. **Cerințe NOI Roland** (de stabilit prin AskUserQuestion la începutul sesiunii — vezi lista în PLAN_MASTER §1 după ce le confirmă).
2. **Deferat fidelitate:** figuri supra-decupate (risc F9) + densitate layout export.
3. **§2 SECURITATE** (S1 npm audit — capcană `katex@0.16.11` pinuit; S2 XSS `HistoryDetail.tsx:65`) → §3/§4/§5/§6.

**⚠️ Trade-off documentat (Roland a ales „0 tabele→Gemini"):** un PDF business FĂRĂ tabel (scrisoare simplă) → Azure rulează, găsește 0 tabele → fallback Gemini (dublu-work minor + Gemini poate rata un logo). Filtrasan/CettaClear AU tabel → rămân pe Azure. Refinabil dacă deranjează.

---

---

## ▶️ REIA DE AICI (2026-07-30 seara) — execuție PLAN_MASTER §1

**Sesiune de execuție a `PROMPT_SESIUNE_NOUA.md` (cerințele R1–R4). Progres:**

- ✅ **PASUL 0 — curățenie planuri vechi (§11 W1–W4).** Roland a confirmat. Șterse **11 planuri**: 9 tracked prin `git rm` (commit `2a93465`, recuperabile din git la `54fac8f`) + 2 gitignored prin `rm` (ireversibil, dar cu backup local de sesiune în `scratchpad/deleted_plans_backup/`). Referințe reparate în CLAUDE.md / README / HANDOFF / PLAN_MASTER §11 / cod (`tab-config.ts`, `IframeModule.tsx`) / `scratchpad/README_autorare_math.md`. **Descoperire onestă:** premisa planului „toate-s recuperabile din git" era falsă pt 2 fișiere (gitignored).
- ✅ **PASUL 1 = R2 — eliminat selectorul global de limbi (§1 R2).** `git rm` `LanguageToggle.tsx` + `language-context.tsx`; curățat `layout.tsx` (scos `LanguageProvider` + actualizat `metadata.description`) + `TopBar.tsx` (scos `<LanguageToggle/>`). `git grep` = 0 referințe rămase. **Switch-ul F8 din editor NEATINS** (dovedit static: 0 importuri de `language-context` din editor; cheia `translate_lang` era owned doar de contextul șters). **Gate: `tsc 0 · jest 57/57 · next build OK (8 rute)`.**
- ✅ **DEPLOYAT + VERIFICAT LIVE pe prod (2026-07-30).** `CACHE_VERSION v19→v20-20260730b` (commit `e4c353a`), deployment `dpl_3ZdTuim2LS4GUbz56enS7hDQB91y`, alias `traduceri-frontend.vercel.app` servește v20 (Age:0). **Live-check (Chrome MCP):** selectorul global 🇷🇴🇸🇰🇬🇧 ABSENT; **F8 RO→SK→RO funcțional** (text real „Lucrare de control"→„Kontrolná práca"→revenire instant din cache); consolă curată; fără overflow. Viewport 390 real n-a putut fi forțat prin `resize_window` → **eyeball mobil final = Roland**.
- ✅ **PASUL 2 = R1 — icon-rail colapsabil (Mosslein), §1 R1.** NOU `components/layout/Sidebar.tsx` (`<aside>` w-60↔w-14, `bg-chalkboard-dark`, nav din `TABS` prin `onTabChange` NU rute, activ `border-l-4 border-chalk-yellow`, footer ⚙+VersionBadge, persistă `localStorage["mosslein:sidebar:collapsed"]`, init DEFAULT+`useEffect`/matchMedia → 0 hydration); `page.tsx` rescris flex `<Sidebar/>+<main>` (divurile `display:none` EXACT păstrate); `git rm TopBar.tsx`. **Gate `tsc 0 · jest 57/57 · build OK`.** **VERIFICAT LIVE local** (`next start` :3320 + Chrome MCP): desktop toate 5 taburi comută+randează (incl. iframe), collapse/expand persistă, consolă curată; **mobil iframe-probe 390px** (viewport 386): default colapsat (matchMedia), comutare prin iconițe, expand OK, 0 overflow, editor „Format" Sheet intact. Commit `<R1>`.
- ✅ **R1 DEPLOYAT v21** (`CACHE_VERSION v20→v21-20260730c`, deployment `traduceri-frontend-nosz48y40`, alias servește v21). **Verificat LIVE pe prod (Chrome MCP):** `<aside>` prezent (240px desktop), bara de sus dispărută (`oldTopTabsGone:true`), toate 5 taburile comută+randează (Istoric „Traduceri (7)" = date reale prod). Commits `997da0d` (feat) + `c328929` (bump). **RĂMAS: eyeball Roland pe telefon real** (mobilul verificat de mine doar prin iframe-probe 390px).
- 🆕 **CERINȚE NOI de la Roland (2026-07-30 runda 2), stabilite prin AskUserQuestion — scrise în `PLAN_MASTER §1`:**
  - **R5** — mută butoanele de limbi (F8 „scris în RO SK EN DE") în rândul de SUS al toolbar-ului, după evidențiere+„Șterge formatarea". **Păstrează toolbar-ul cum e** (a RESPINS explicit redesign-ul în module-panel). Trivial.
  - **R6** — search GLOBAL (Ctrl+K) peste TOATĂ aplicația (funcții editor + comută între module + acțiuni). Search-ul din Matematică rămâne. §17 mock.
  - **OCR/DOCX (extinde R3+R4):** fișierele lui Roland `test5nr.naturale2025.docx` + `2.Unghiuri. Bisectoare.docx` (+ `test.multimi2.docx`) = test set R3. **✅ OMML verificat la sursă (2026-07-30):** 20/0img · 9/0img · **6 OMML/1 IMAGINE** (2.Unghiuri → R3 trebuie și `word/media`). Dovada bug: `Downloads/*.pdf` au matematica DISPĂRUTĂ. Fidelitate: math+ordine ÎNTÂI (ferm), apoi vizual. R4 = și OCR imagine/scan pe mai multe tipuri.
  - ⚠️ **PĂSTREAZĂ (nu șterge ca junk):** `scratchpad/ocr_fixture_raw.json` (376KB) + `ocr_fixture_trimmed.json` (3.8KB) = fixture-uri OCR reale din F9 (răspuns Gemini: 9 secțiuni/6 figuri) — **baseline util pentru R4** (comparație provideri). Untracked intenționat (raw prea mare pt repo).
- ➡️ **ORDINE (aleasă de Claude, Roland „alegi tu"): R3 → R5 → R6 → R4 → §2 securitate → §3/§4/§5/§6.**
- ✅✅ **R3 (DOCX OMML→LaTeX) LIVRAT (2026-07-30) — cod + gate + dovedit LIVE, NEDEPLOYAT.** NOU `frontend/src/lib/omml-to-latex.ts` (parser OMML→LaTeX pur recursiv) + `docx-to-blocks.ts` (`docxXmlToBlocks` + `docxArrayBufferToBlocks`: unzip **fflate** + rels + `word/media`→base64) + integrat în `editor-import.tsx` (ramura `.docx` înlocuiește **mammoth**, care e ȘTERS + shim). **Deviere R3.4 documentată:** NU refolosesc `parseInlineToNodes` (acela-i pt string-ul Gemini; DOCX-ul e OMML structurat → construiesc `inlineMath` direct, evit capcana `$`-injection). **Gate: `tsc 0 · jest 102/102` (57→102) · `build OK`.** **DOVEDIT LIVE (Chrome MCP, import binar .docx REAL):** multimi2 → **20 formule la locul lor** (ℕ double-struck, `{2,3,7}⊂…`), banner onest, 0 overflow; unghiuri → **6 formule + figura JPEG reală 512×244 randată la locul ei** + bold + ∢/grade + dialog §17 „înlocuiește/adaugă". Invariant `inlineMath===OMML` (20/9/6) aserție jest + KaTeX-validare per formulă. **ETAPA A completă pe toate 3;** ETAPA B (liste/tabele/spațiere) = rămas neblocant. Detalii: PLAN_MASTER §1 „✅✅ R3 LIVRAT".
- ✅ **R5 (mut F8 sus) LIVRAT (2026-07-30).** `LanguageSwitch` mutat în `TiptapToolbar` după grupul culori/clear (`<LanguageSwitch compact />`, DOAR varianta `bar`); rândul separat din `EditorShell` → `md:hidden` (fără regresie mobilă — Option B). **Gate `tsc 0 · jest 102/102 · build OK`** + LIVE (screenshot: F8 pe rândul 2 al toolbar-ului, rândul separat dispărut pe desktop; click SK→spinner). Fișiere: `TiptapToolbar.tsx` (+import +grup F8), `EditorTiptap.tsx` (rând `md:hidden`).
- ✅✅ **DEPLOYAT v22-20260730d (2026-07-30) — R3+R5 LIVE pe prod, verificat pe ALIAS.** Roland a confirmat deploy-ul (AskUserQuestion). `CACHE_VERSION v21→v22`, `vercel deploy --prod` OK, deployment `dpl_8dwQg6hMe4MWCFb99ivafyhikD3t` READY/production; **aliasul `traduceri-frontend.vercel.app` servește v22** (`sw.js` CACHE_VERSION=v22, homepage 200 Age:0, `/editor-nou` 200). Commits `1b366ed`+`037b417` (R3) + `cf8d5e5` (R5) + `d681538` (bump).
- ✅✅ **R6 (search GLOBAL Ctrl+K) LIVRAT (2026-07-30) — mock §17 aprobat + gate verde + dovedit LIVE, NEDEPLOYAT.** Command palette peste toată aplicația (module + acțiuni editor + globale). **Fără `cmdk`** (nu era în proiect, contrar onboard-ului) → construită pe `Dialog` custom (R-COST). NOU `lib/editor-commands.ts` (punte cross-tab) + `components/command/CommandPalette.tsx`; modificate `page.tsx` (Ctrl+K global + render), `EditorTiptap.tsx` (EditorShell înregistrează handler), `Sidebar.tsx` (buton 🔍). **Gate `tsc 0 · jest 102/102 · build OK`.** LIVE: Ctrl+K→paletă (15 comenzi), filtrare, comutare module, comandă editor→inserează tabel, buton Sidebar, fără conflict Ctrl+F, **centrat desktop+390px**. ⚠️ **Bug project-wide prins:** animația `enter` (tailwindcss-animate) hijack `transform`→identity → `DialogContent` nu se centrează; fix scoped `!translate-x/y-[-50%]`. Detalii: memoria `finding_dialog_transform_animation_2026_07_30` + PLAN_MASTER §1 „✅✅ R6 LIVRAT".
- ✅✅ **R6 DEPLOYAT v23-20260731a — R3+R5+R6 TOATE LIVE pe prod.** Roland a confirmat deploy-ul (AskUserQuestion). `CACHE_VERSION v22→v23`, deployment `traduceri-frontend-nzchoo4l9`, **aliasul servește v23** (Age:0, homepage 200, `/editor-nou` 200). Commits `8c633fe`+`910e270` (R6) + `c47c5e3` (bump). ⚠️ **Limită onestă R6:** insert (tabel/formulă) din paletă când ești pe ALT modul = best-effort (poate să nu insereze; ProseMirror settle incert după comutare); **cazul comun — deja în editor — MERGE fiabil**; module/găsește/traducere merg din orice modul.
- 🆕 **CERINȚĂ NOUĂ R7 (Roland, 2026-07-31) — upgrade calitate OCR, pe DOVADĂ. ÎNGLOBEAZĂ + EXECUTĂ R4.** Roland a testat 3 fișiere reale (`99_Roland_Work/Teste_Input`→`Teste_Output`), Claude a verificat vizual. **Scorecard:** `limite_matematica.jpeg` math **10/10** (Gemini excelent, nu-l atinge) · `IMG-WA0001.jpg` poză rotită **8.5/10** (conținut complet, DAR ordine multi-coloană greșită `a,d,b,c`) · `Analyse Filtrasan.pdf` lab **3/10** (TABEL pierdut, logo-uri lipsă, PDF cu strat-text-prost→garbaj). **4 goluri = cerințe (AskUserQuestion):** R7.1 tabele · R7.2 forțează-OCR-pe-PDF-text-prost · R7.3 ordine multi-coloană · R7.4 figuri pe toate căile. **Provider: Azure Doc Intelligence (docs) + Gemini (math), rutat pe tip** (R7.5; sub-pas 1 = confirmă la sursă că Azure dă LaTeX). Detalii: **PLAN_MASTER §1 R7** + memoria `finding_ocr_test_scorecard_2026_07_31`.
- ➡️ **URMĂTORUL: R7** (vezi mai sus; începe cu sub-pasul de confirmare Azure la sursă + euristica text-vs-OCR din `editor-import.tsx`). Apoi **§2 securitate** (S1 `npm audit fix` — ⚠️ capcană `katex@0.16.11` pinuit pt `@tiptap/extension-mathematics@3.28.0`; S2 XSS `HistoryDetail.tsx:65` `document.write` nesanitizat, fix 1 linie). **RĂMAS: eyeball Roland pe prod** (R3 import `.docx`, R5 F8 sus, R6 Ctrl+K — pe telefon). ⚠️ Advisor: liniile ~340-480 din acest HANDOFF necitite integral (istoric); grep înainte de lucru care le atinge.

---

## 🧭 ÎNCEPE DE AICI (2026-07-30) — PLAN MASTER + prompt de reluare

**`docs/PLAN_MASTER.md` = SURSA UNICĂ de adevăr** (creată prin audit în cod cu 5 agenți paraleli, dovezi `fișier:linie`). A înlocuit 11 planuri vechi — **ȘTERSE 2026-07-30** (§11 executat, confirmat de Roland). Cele 9 tracked sunt recuperabile din git la `54fac8f`; 2 erau gitignored (backup local, în afara git-ului). Referințele istorice către `PLAN_*` din secțiunile datate de mai jos sunt lăsate ca jurnal (nu mai sunt navigabile).

**`docs/PROMPT_SESIUNE_NOUA.md`** = promptul direct executabil pentru sesiunea nouă (deciziile lui Roland deja confirmate, ordinea pașilor, regulile de gate).

**Cerințele Roland (2026-07-30), în ordinea confirmată de el:** R1 meniu icon-rail colapsabil (ca Mosslein; bara de sus dispare) · R2 elimin selectorul global de limbi (F8 din editor RĂMÂNE) · R3 DOCX cu matematică prin parsare OMML→LaTeX · R4 OCR ales pe dovadă măsurată. **Securitatea (§2) DUPĂ cerințe** — decizia lui, asumată conștient.

**⚠️ Descoperiri de audit verificate personal, ACTIVE în prod:** `npm audit --omit=dev` = 5 vulnerabilități, **3 HIGH** (`next`/`postcss`/`sharp`) + `dompurify` și `katex` **pe calea de randare a conținutului OCR/AI**, toate cu fix disponibil · **XSS viu** la `HistoryDetail.tsx:65` (`document.write` nesanitizat, deși `sanitizeHtml` e importat în același fișier) · `timeout=180`×3 în `ocr_structured.py:116` vs `maxDuration:60` → 504 opac · contor DeepL invizibil · `translation-cache.ts` orfan (cache-ul NU persistă) · modul **Planșe LIVE dar netracked** (2/8 faze; `sw.js` nu precache-uiește `/planse/*` deși F1 e bifat „offline").

**⚠️ CORECȚIE a acestui handoff:** afirmația repetată mai jos că „meniul Matematică e desktop-only / pe mobil nu există math" este **FALSĂ**. Verificat: `MobileToolbar.tsx:128` randează `TiptapToolbar variant="sheet"`, iar `EditorMathMenu` la `TiptapToolbar.tsx:491` e **necondiționat** → toate cele 4 taburi (Construiește/Formule/Simboluri/Figuri) sunt accesibile din Sheet-ul mobil. Ignoră mențiunile contrare din secțiunile istorice.

---

## ✅ F9 — OCR DRAG&DROP MATEMATIC (2026-07-29/30) — DEPLOYAT v19 (ULTIMA fază §5c)

**✅ DEPLOYAT 2026-07-30** pe `traduceri-frontend.vercel.app` (`CACHE_VERSION v18→v19-20260730a`, deployment `dpl_6Qgs1YtxUNuxp3ZkUGsQpLtcuLJf`). Verificat pe alias: `sw.js` servește v19, `/editor-nou`→200, `/api/ocr` OPTIONS→200 (CORS live), **smoke-test OCR real pe deploy-ul nou: POST imagine reală → 200 în 21.5s, 8 secțiuni** (backend confirmat pe ACEST deploy). Commits `08cae4a`+`fbb2cf9`+`cb883df`+`efcda27` (bump versiune). **RĂMAS: testarea end-to-end DIN BROWSER pe prod (Roland testează direct pe server+aplicație, nu doar local — preferință confirmată) + PDF multi-pagină + DOCX real** (vezi gap-urile onestе mai jos, neschimbate de deploy).

**Consolidarea Traduceri→Editor e COMPLETĂ (F7 tab retras + F8 traducere + F9 OCR).** F9 = ultima fază din `PLAN_editor_tiptap` §5c.

**Ce livrează:** drag&drop fișier pe foaie (overlay la dragover) SAU meniul **Inserare → „Import fișier (OCR)"**. Rutare onestă (R3): **imagine/PDF-scanat → `/api/ocr`** (Gemini → text + `$LaTeX$` + figuri) → noduri TipTap **EDITABILE** (formule `inlineMath` KaTeX + figuri `ResizableImage` redimensionabile F3c); **DOCX/PDF-cu-text/TXT/MD → text brut** (fără matematică transcrisă). Destinație §17 (confirmată): editor pristine → doc nou; altfel dialog **înlocuiește / adaugă la sfârșit**. Bannere oneste (Mistral-fallback / pagini eșuate / plafon / text-brut).

**Fișiere:** NOI `components/editor/{ocr-map.ts, editor-import.tsx, ImportUI.tsx, editor-initial.ts}` + `lib/image-downscale.ts` + `types/mammoth-browser.d.ts` + test `ocr-map.test.ts`; MODIFICATE `EditorTiptap.tsx` (`EditorImportProvider` ÎN interiorul `EditorTranslateProvider` — R-EDIT) + `EditorInsertMenu.tsx`. Reuse: `/api/ocr`, `lib/pdf-rasterize.ts`, `ResizableImage`, nod `inlineMath`, dependință nouă `mammoth` (docx, gratis MIT).

**Non-regresie: `tsc 0 · jest 57/57 · next build OK (8 rute)`.** Commits `08cae4a` (feat) + `fbb2cf9` (fix). **Eyeball LIVE determinist** (mock pe `fetch('/api/ocr')` cu fixture REAL 9 secțiuni/6 figuri, ca să evit flakiness-ul dev): import → **6 figuri ResizableImage + 36 formule KaTeX** randate, banner onest, rename din nume fișier; **`editor.getHTML()` (sursa export PDF/HTML/Word) = 36 `data-latex` + 6 `<img base64>`** → fidelitate export DOVEDITĂ; **360px fără overflow**; dialog §17 înlocuiește/adaugă funcțional (append data-latex 2→4, dialog se închide). **Backend OCR dovedit separat** (curl prod 200 în 30s + „Success 9 secțiuni/6 figuri" în logul local Gemini). Capcane rezolvate (advisor): `$$…$$` înainte de `$…$` + latex-gol→literal (R-MATH), figuri în `two_column` recursate, 413 downscale imagini/pagini, `changeSource` post-import (R-EDIT), CORS multipart fără preflight, dublu-import (`importingRef` + debounce 800ms), append fără pageBreak (rupea inserarea).

**⚠️ NEVERIFICAT (onest, R3) — de pipăit de Roland pe prod, nu blocante:** (a) **OCR real end-to-end DIN BROWSER** — backendul (curl) și clientul (mock) dovedite SEPARAT, niciodată legate (proxy-ul dev de 30s a împiedicat-o); prima poză reală pe prod = primul moment când lanțul rulează întreg. (b) **PDF multi-pagină scanat** — bucla per-pagină + plafon 20 + marcaj `[Pagina N: OCR eșuat]` = scrise, ZERO rulări (28s/pag → 5 pag ≈ 2.5 min). (c) **DOCX/mammoth** — importul dinamic al build-ului de browser a trecut `next build`, dar nerulat cu un .docx real.

**⚠️ CAPCANĂ DEV (nu bug):** proxy-ul Next dev are **timeout 30s** → OCR-ul real de ~28-31s dă `socket hang up ECONNRESET`→500. Pt test local: pornește Next cu `NEXT_PUBLIC_API_URL=http://localhost:8000` (browserul lovește direct `dev_server.py`, care dă ACAO=* pt localhost). Prod OK (Vercel maxDuration 60s). Detalii: memoria `finding_ocr_import_editor_2026_07_29`.

**➡️ URMĂTORUL PAS:** (1) **deploy v18→v19** cu confirmarea Roland (bump `CACHE_VERSION` în `frontend/public/sw.js`, `vercel deploy --prod` din `frontend/`, verifică aliasul); (2) eyeball Roland pe OCR real end-to-end (o poză de manual → formule+figuri) + export PDF/.docx; (3) opțional: paritate mobilă math, figuri parametrice. **Consolidarea §5c e ÎNCHEIATĂ.**

---

## ▶️ REIA DE AICI (2026-07-29, după deploy v17) — CITEȘTE ÎNTÂI

**✅ DEPLOYAT v17 pe `traduceri-frontend.vercel.app` (cache `v17-20260729a`, verificat live Age:0; deployment `dpl_2tRNxk5A…`):**

- ✅ **F3c — Figuri/imagini REDIMENSIONABILE pe foaie** (2026-07-29): prinzi colțul jos-dreapta → mărești/micșorezi cu **aspect blocat**; **dublu-click = mărime originală**. Dimensiunea = atribut de nod `width/height` → în `getHTML()` (sursa export-urilor). **PDF/HTML verificat** (gate de export + live); **DOCX [PROBABIL]** — width-ul e păstrat în `<img>`-ul dat lui turbodocx, dar randarea la mărimea nouă în Word rămâne **eyeball-ul tău pe .docx** (neverificat empiric). `frontend/src/components/editor/image-resize.ts` (`ResizableImage`) + CSS handle în `globals.css` + test `image-resize.test.ts`. **F3b (formule cu găuri contenteditable) = SUPERSEDED** (formulele deja editabile via `MathEditDialog` + builder + bibliotecă). Verificat LIVE (Chrome MCP): insert→handle · click→selecție · drag 120×112→270×252 aspect păstrat · getHTML duce width/height · reset · 360px fără overflow. **Non-regresie: tsc 0 · jest 33/33 · build OK.** Commits `58efcc5`+`8ac39d8`+`6075e91`. Detalii: `PLAN_editor_tiptap` F3c + memoria `finding_image_resize_nodeview_2026_07_29`.
- **RĂMAS neblocant:** eyeball Roland pe .docx/PDF cu o figură redimensionată (confirmă DOCX-ul [PROBABIL]) + (opțional) figuri PARAMETRICE + paritate mobilă math.

**🆕 FIR ACTIV NOU (2026-07-29) — CONSOLIDARE Traduceri → Editor (planificat, aștept GO pt Faza 1):**

Roland retrage tab-ul „Traduceri 📐" și mută motoarele lui în editor. Decizii confirmate (AskUserQuestion): (1) scot UI-ul Traduceri, PĂSTREZ backend, default→**Editor**; (2) switch de limbi în editor = **tot documentul, reversibil+editabil, cache pe limbă**, formule/figuri intacte (reuse `/api/translate-text`); (3) OCR drag&drop = **tot** (docx/pdf/img/txt/md), conținut în **doc nou**, matematica prin OCR-ul Gemini din Traduceri (reuse `/api/ocr`, structured_pages→noduri TipTap editabile), UX drag&drop portat din `Asistent_Text_AI`. **Plan detaliat = `PLAN_editor_tiptap` §5c (F7/F8/F9)** — integrat în planul editorului (NU fișier nou). **PROGRES:** ✅ **F7 DONE** (`2891d00` — tab Traduceri scos, backend păstrat) → ✅ **F8 DONE** (`bffc930` — switch RO|SK|EN|DE, tot documentul, reversibil, `$latex$` intact) → ⏳ **F9** (OCR, cere mock §17). **✅✅ F7+F8 DEPLOYATE v18** (`v18-20260729b`, deployment `traduceri-frontend-2qoeumuqq`, verificat live: `/traduceri`→404, `/api/translate-text`→200). **Traducerea VERIFICATĂ LIVE end-to-end pe prod:** tastat RO cu 2 formule → SK „Nech $x^2$… plocha kruhu $\pi r^2$…" → EN „Let $x^2$… area of the disk…" → RO reversibil din cache (instant, fără spinner); **formulele intacte în toate limbile**, consolă curată.

**✅ F9 (OCR drag&drop matematic) = DONE 2026-07-29** (vezi blocul „✅ F9" din capul fișierului). Ce urmează: bloc istoric mai jos.

**~~➡️ URMĂTOAREA SESIUNE = F9 (OCR drag&drop matematic)~~** — ultima fază §5c, amânată conștient în sesiune nouă (context proaspăt). **Formă §17 DEJA CONFIRMATĂ (nu re-întreba):** (1) destinație = doc nou dacă editorul e gol, altfel întreb înlocuiește/adaugă (ca banner legacy-import); (2) declanșare = drag&drop pe foaie (overlay) + buton „Import-OCR" în meniu Fișier/Inserare. **Reuse (mapat de agenți):** imagini/PDF-scanat → `POST /api/ocr` (multipart, Gemini JSON → `structured_pages`: text + `$LaTeX$` + `figure.img_b64`, 1 pag/cerere, cap 4MB); docx→`mammoth`, pdf-text→`pdf.js getTextContent`, txt/md→`file.text()` (UX+dispecer portate din `C:\Proiecte\Asistent_Text_AI` `pwa/index.html` 2263-2488); rasterizare client pdf.js. Mapare `structured_pages`→noduri TipTap: paragraph/heading/list→text; `$…$`→nod `inlineMath`; `figure.img_b64`→nod `ResizableImage` (F3c, redimensionabil); `two_column`→coloane/flatten. Onest: docx/txt = fără matematică (text brut). Detalii: `PLAN_editor_tiptap` §5c F9. **Prompt reluare:** `/onboard` + citește acest bloc + §5c F9, apoi mock vizual scurt (deja confirmat la nivel de decizii) → cod cu non-regresie + gate+eyeball.

---

## ▶️ REIA (2026-07-28, după deploy v16)

**STARE LA ZI — TOT LIVE pe `traduceri-frontend.vercel.app` (cache `v16-20260728a`):**

- ✅ **Cerința 1** — chenar „Matematică" REDIMENSIONABIL (grip est/sud/colț + reflow auto coloane). Commit `7d7ff29`. DEPLOYAT în v16.
- ✅ **Cerința 2 / Decizia 4** — goluri autorate TOATE clasele: **biblioteca 272 → 334 formule** (toate cu explicație), 6 loturi (VII/VIII/VI/V/XI/XII), R3 la manuale, gate+eyeball, + 2 mutări [PROBABIL] + îmbunătățiri CAT.5. DEPLOYAT în v16. Detalii + tabel: § „SESIUNE 2026-07-28" mai jos.
- Editorul nativ TipTap + interactiv A/B/C + matematică academică KaTeX = LIVE de dinainte (istoric mai jos).
- Non-regresie la ultima livrare: `tsc 0 · jest 28/28 · next build OK (11 rute)`. Branch `faza-g-editor`, HEAD sincron cu origin.

**CE A RĂMAS DESCHIS (niciunul nu blochează; alege cu Roland ce urmează):**

1. **Verificare de domeniu (Cristina)** — semantica celor 62 formule noi. Gate+eyeball garantează DOAR KaTeX + curățenie, NU corectitudinea matematică. (Nu e „implementare", e validare de expert.)
2. **Eyeball Roland** — PDF/.docx real cu o formulă + o figură (perceptualul; mecanica e dovedită).
3. **Decizie deschisă Roland (semnalată, NEATINSĂ):** VIII „funcția liniară" `(a≠0)` vs `f(x)=ax+b` general `a,b∈ℝ`. Manualul nu impune a≠0; „funcția de gradul I" chiar cere a≠0. De ales denumirea.
4. **Paritate mobilă math** — meniul „Matematică" (formule + A/B/C) e **desktop-only**; pe mobil (Sheet) nu există math. Adevărată implementare, dacă se dorește.
5. **Opțional:** figuri PARAMETRICE pe foaie (schimbi etichetele A/B/C / laturile — NodeView parametric, amânat conștient). _(Redimensionarea figurilor/imaginilor = LIVRATĂ la F3c 2026-07-29, vezi blocul de sus.)_

**UNELTE autorare (persistente în `scratchpad/`):** `lot_engine.js` (`applyLot{CLASA,LATEX_FIX,EXPL,NEW,REMOVE,RENAME}`) · `gaps_5..12.js`+`gaps_7.js`+`gaps_fix.js` (datele per lot) · `gate_check.js` (KaTeX+invarianți) · `eyeball.js <N>` (dump latex+randat). Manuale (13 PDF) + TOC extracte = în `99_Roland_Work/` + `scratchpad/toc_*.txt` (GITIGNORED). Consumatorul datelor: `frontend/src/components/editor/math-data.json` → `EditorMathMenu.tsx`.

**Deploy (când Roland confirmă):** din `frontend/`, `vercel deploy --prod --yes --token="$VERCEL_API_KEY"` (CLI 56.4.1, proiect `traduceri-frontend` `prj_oV2VAykJ...`); bump `CACHE_VERSION` în `frontend/public/sw.js`; verifică aliasul servește noua versiune.

---

## ✅✅ STARE #4 — COMPLET (2026-07-27)

**Autorare V→XII (213→276 formule, toate cu explicație) + interactiv A (chips domeniu) + C (constructor Matrice/Sistem/Σ/∫) + B (paletă 16 figuri SVG).**

- **TOT LIVE pe `traduceri-frontend.vercel.app` (cache v15, `dpl_h6VhYCxdAk1qqvAzPq4eAiLJyKvP`):** autorarea + A + C + B (figuri + fix export Word). Verificat: aliasul servește `v15-20260727d`.

### 🔵 RĂMAS DESCHIS (pt sesiunea următoare — consolidat)

1. **Eyeball Roland (manual, nu se automatizează):** PDF/.docx real cu o figură + o formulă (mecanica dovedită, perceptualul nu); redimensionarea figurii (acum fixă 120px).
2. **Verificare de domeniu (Cristina):** corectitudinea matematică/notațională a formulelor noi (gate+eyeball garantează KaTeX + curățenie, NU semantica).
3. **Paritate mobilă:** meniul Matematică (formule + A/B/C interactiv) e **desktop-only**; pe mobil (Sheet) nu există math. Decizie separată dacă se adaugă.
4. **Opțional:** figuri EDITABILE pe foaie (NodeView parametric — amânat conștient la B); redimensionare figuri (handles Image).

---

## 🆕 CERINȚE NOI (Roland, 2026-07-28) — prompt pt sesiunea următoare

> ⚠️ #4 e GATA. Pentru sesiunea nouă folosește **acest** prompt (nu cel de la „PROMPT DE RELUARE" de mai jos, care e istoric pt #4).

**Decizii confirmate (Roland, nu le re-întreba):**

1. **Redimensionare chenar Matematică** (Screenshot (238).png = popover-ul `EditorMathMenu`): prinzi marginea/colțul cu mouse-ul → mai mare/mic; funcțiile dinăuntru se rearanjează automat după lățime; dimensiunea se ține minte (localStorage).
2. **Verificare + completare vs manuale oficiale** (manuale.edu.ro). Roland a **DESCĂRCAT deja** manualele (13 PDF-uri) în `99_Roland_Work/Carti_descarcate_EDU/` (GITIGNORED — NU se committează). DOAR clasele din folder erau disponibile pe site; restul = conținut indisponibil (→ pt ele rămâne programa deja folosită).
   - Agentul: (a) inventariază folderul (identifică pt fiecare PDF clasa + editura din copertă/cuprins → `INDEX.md`); (b) extrage CUPRINSUL din fiecare; (c) compară materiile din manualele oficiale cu materiile din editor (`math-data.json`) — **nu doar clasa, ci și COMPLETITUDINEA**: respectă documentarea din editor programa oficială? e completă? (d) remediază: formulă în clasă GREȘITĂ → **mut-o automat**; temă/formulă din manual LIPSĂ din editor → **adaug-o** (latex+explicatie, gate+eyeball); îmbunătățiri sesizate → **aplică-le**. (e) raport final (mutări + adăugiri + îmbunătățiri, cu manualul-sursă).
   - A1739/A1740 = clasa VII (Booklet + art Klett) — verificate deja ca format.

**Prompt gata de lipit (primul mesaj în sesiunea nouă):** vezi mesajul din chat 2026-07-28 (v2, cu folderul local). Efort: **xhigh**.

---

## 🆕 SESIUNE 2026-07-28 — EXECUȚIE cerințe noi

### ✅ CERINȚA 1 — chenar „Matematică" REDIMENSIONABIL + responsive (LIVRAT + DEPLOYAT v16)

Formă confirmată de Roland (§17, mock): **grip custom** (margine dreaptă + margine jos + colț jos-dreapta) — NU `resize:both` nativ (care prinde doar colțul) + **Formule auto 1→2→3 coloane** (nu doar grilele).

Implementat în `frontend/src/components/editor/`:

- **`EditorMathMenu.tsx`:** popover-ul e acum `flex flex-col` cu `width/height` din state (init default 380×540, încărcat din localStorage în `useEffect` — fără hydration mismatch, cf. [[finding_hydration_tab_and_deploy_verify_2026_07_26]]). 3 grip-uri absolute (est/sud/colț) cu `onPointerDown`; **drag prin listeneri pe `window`** (`pointermove`/`pointerup`/`pointercancel`) — NU `setPointerCapture` (capcană: `setPointerCapture` arunca pe pointer-ul CDP → dragRef nu se seta; window-listeners e robust și nu depinde de capture). Clamp `[320..760]×[380..min(900,vh-80)]`. Persistă în `localStorage["editor_math_menu_size_v1"]` la pointerup. Grilele: Simboluri/Figuri/Formule → `grid-cols-[repeat(auto-fill,minmax(...,1fr))]` (Formule minmax 230px → 1/2/3 coloane; Simboluri 2.5rem; Figuri 4rem). ScrollArea/TabsContent → `flex-1 min-h-0` (înălțimea se distribuie la resize); TabsContent activ = `data-[state=active]:flex` (ca `[hidden]` să câștige pe cele inactive).
- **`EditorMathBuilder.tsx`:** grila „Construcții gata" `grid-cols-4` → `grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))]`.

**Verificat LIVE (localhost:3311, Chrome MCP):** resize colț 380×540→580×604 + grip est →clamp 320; popover NU se închide la drag (grip inside + pointermove/up pe window; Radix se închide doar la pointer-DOWN outside); persistă la Escape+reopen (580×604); reflow: Construiește 4→8, Formule 1→2, Simboluri 6→11, Figuri 8/7 col; KaTeX se re-fit-ează (AutoFitKatex are ResizeObserver). **Non-regresie: tsc 0 · jest 28 · next build 11 rute · consolă curată.** ✅ DEPLOYAT în v16 (2026-07-28, împreună cu Decizia 4).

### ⏳ CERINȚA 2 — audit vs manuale oficiale (AUDIT GATA + safe-fixes aplicate; BLOCAT pe 4 decizii Roland)

Inventar (13 PDF-uri, GITIGNORED verificat) → `docs/manuale/INDEX.md`. Clase acoperite: V,VI,VII,VIII,XI,XII. FĂRĂ manual: IX,X. ⚠️ XI–XII = manuale 2006–2007 → PREZENȚĂ nu absență. A1260 (Art Klett V) TOC eșuat → V pe 2 manuale.

**Audit făcut** (6 subagenți, citat-dovadă din `scratchpad/toc_*.txt` vs `scratchpad/editor_dump.txt`). RAPORT: `docs/manuale/AUDIT_RAPORT.md` + sinteză `scratchpad/AUDIT_FINDINGS.md`.

**DESCOPERIREA-CHEIE:** offset SISTEMATIC pre-2017 la gimnaziu — calcul prescurtat VII→VIII, radicali/sisteme/trig VIII→VII, patrulatere/cerc VI→VII (~20 formule = O realiniere coerentă, de aplicat ca un tot). Liceu XI/XII: 0 misplasări (curat).

**APLICAT deja** (neambiguu, gate PASS, 276→275, NEDEPLOYAT): VIII −„Raport de arii" (duplicat VII); VI „Proporție derivată"→„Proprietatea fundamentală a proporției". Script: `scratchpad/apply_safe.js`. Unelte engine: `lot_engine.js` (REMOVE class-scoped), `gate_check.js`, `eyeball.js`.

**DECIZII ROLAND (2026-07-28, confirmate):** (1) DA realiniere gimnazială; (2) probabilitate V→înlocuiesc cu Frecvența (mut prob. la VI); (3) trig VIII→mut definițiile la VII, păstrez sin²+cos²=1+tg=sin/cos la VIII; (4) autorez TOATE ~40 goluri, ordine VII→VIII→VI→V→XI→XII (sesiune separată).

**✅ REALINIERE APLICATĂ (Decizia 1+2+3, commit pending, gate PASS 275→272, NEDEPLOYAT).** Script `scratchpad/realign.js` (mută obiecte întregi, păstrează latex+explicatie). Mutări: VI→VII (Proprietăți paralelogram/romb/trapez + Suma unghiuri patrulater + Lungimea cercului; șters ariile duplicate din VI); VIII→VII (Raționalizare, Introducere sub radical, Sistem 2×2, Linia mijlocie, def. sin/cos/tg/ctg + valori 30/45/60); VII→VIII ([Calcul algebric] 9 formule); V→VI (Probabilitatea) + NEW Frecvența relativă la V. **Counts: V40 VI28 VII34 VIII37 IX33 X37 XI32 XII31 = 272.** Grup nou [Trigonometrie] la VII. Rămas minor (VIII [PROBABIL] neincluse în lista Deciziei 1: Proprietăți paralelogram-diagonale, Inegalitatea triunghiului — de tratat la autorarea VIII, coliziune nume la VII).

**✅✅ Decizia 4 — GOLURI TOATE CLASELE AUTORATE (2026-07-28) — COMPLETĂ, NEDEPLOYAT.** Bibliotecă **276 → 334** formule, toate cu explicație. Ordine executată VII→VIII→VI→V→XI→XII, R3 verificat la TOC-ul/corpul manualelor (am PDF-urile local), gate PASS + eyeball la fiecare lot, commit per clasă.

| Lot     | Clasă | Δ     | Noi                                       | Sursă TOC      | Commit    |
| ------- | ----- | ----- | ----------------------------------------- | -------------- | --------- |
| gaps_7  | VII   | 34→41 | +7                                        | A1739/40/42    | `80ca79b` |
| gaps_8  | VIII  | 37→51 | +16 (+2 mutări la VI/VII)                 | A1983          | `5d6f6b5` |
| gaps_6  | VI    | 29→38 | +9 (+fix Înălțimea +rename Aria discului) | A1497          | `eaac23a` |
| gaps_5  | V     | 40→45 | +5                                        | A1254          | `bf3b96c` |
| gaps_11 | XI    | 32→45 | +13                                       | A178/A196 (M1) | `407042d` |
| gaps_12 | XII   | 31→43 | +12                                       | A197/A264 (M1) | `911090e` |

- **Counts finale:** V45 VI38 VII42 VIII51 IX33 X37 XI45 XII43 = **334** (toate cu explicație).
- **MUTĂRI [PROBABIL] rezolvate (gaps_8, geom. plană misplasată la VIII spațială):** „Inegalitatea triunghiului" VIII→VI (A1497 p.185, grup nou VI „Triunghiuri"); „Proprietăți paralelogram (diagonale)" VIII→VII (intrare distinctă, Roland „VII cu redenumire").
- **CAT.5 aplicate:** VI „Înălțimea" latex era A=a·h/2 (ARIA!) → def. corectă `AD⊥BC`; VII „Aria cercului"→„Aria discului"; XI Cramer generalizat n×n + Kronecker-Capelli. Semnalat, NEATINS (decizia Roland): VIII funcția liniară `(a≠0)` vs `a,b∈ℝ`.
- **ABANDONAT (R3, gate TOC):** VIII „fracții algebrice" (scoase din gimnaziu prog. 2017, absent din TOC); V „baza 2" (algoritm, fără formulă); VI „modul rațional" (near-dup cu VI[5] Modulul întreg).
- **DEDUP XII (advisor):** FTC autorat ca `G(x)=∫ₐˣ⇒G'=f` (NU dublează Primitivă-def F'=f); „lege de compoziție/parte stabilă" (NU re-listare axiome Grup).
- **⚠️ Onestitate R3:** XI/XII = manuale M1 2006-07 → golurile probează PREZENȚA temei în M1, NU apartenența la programa curentă. Gate+eyeball garantează KaTeX+curățenie; **corectitudinea semantică rămâne verificarea de domeniu a Cristinei**.
- **Non-regresie (2026-07-28):** `tsc 0 · jest 28/28 · next build OK (11 rute)`. Unelte: `scratchpad/gaps_<N>.js` + `lot_engine.js` (acum cu `RENAME`) + `gate_check.js` + `eyeball.js`.

**✅ DEPLOYAT v16 (2026-07-28, confirmat Roland „Deploy acum"):** `vercel deploy --prod` pe `traduceri-frontend`; `CACHE_VERSION` v15→**v16-20260728a**. Verificat: aliasul `traduceri-frontend.vercel.app/sw.js` servește v16 (Age:0). Deployment `traduceri-frontend-o8pi8ckhp`. Cele 62 formule noi + mutări + CAT.5 = LIVE.

**RĂMAS (neblocant):** verificare de domeniu Cristina (semantica celor 62 formule noi — gate+eyeball garantează DOAR KaTeX+curățenie) + eyeball Roland PDF/.docx. **Decizie deschisă Roland:** VIII funcția liniară `(a≠0)` vs `a,b∈ℝ` (semnalat, neatins).

---

## ⚡ PROMPT DE RELUARE (lipește-l ca PRIMUL mesaj în sesiunea nouă)

```
/onboard

/effort xhigh

Apoi citește INTEGRAL, în ordine, ÎNAINTE de a acționa:
1. docs/HANDOFF_SESIUNE.md — secțiunea „SESIUNE 2026-07-27" + blocul „#4 ▶️ ÎN EXECUȚIE" (decizii + progres + ȘABLON de continuare).
2. docs/PLAN_math_curriculum_2026-07-27.md — taxonomia (clase × domenii × goluri ➕) + §7 CONFIRMAT.
3. scratchpad/README_autorare_math.md — pattern-ul repetabil per clasă + capcanele R3.
4. git log --oneline -15 (jurnalul; ultimul lot = „feat(#4 clasa V)").

CONTEXT: editorul matematic e LIVE pe traduceri-frontend.vercel.app (cache v15). #4 COMPLET + TOT DEPLOYAT: autorare Clasele V…XII (bibliotecă 213→276, TOATE cu explicație) + interactiv A (chips domeniu) + C (constructor Matrice/Sistem/Σ/∫) + B (tab „Figuri", 16 figuri SVG, export Word reparat). Datele: frontend/src/components/editor/math-data.json (276 formule + 103 simboluri).

DECIZII CONFIRMATE (Roland, nu le re-întreba): toate profilurile · implementare exhaustivă · ~65–95 formule noi + explicație la TOATE · ordine V→XII lot cu lot · interactiv A+C+B (B = figuri geometrice SVG, fază separată).

EXECUTĂ CONTINUAREA #4, în ordine:
1. ✅ AUTORARE V→XII — COMPLETĂ (8 loturi, bibliotecă 213→276, toate cu explicație). Vezi tabelul din secțiunea „AUTORARE V→XII COMPLETĂ". NU relua.
2. ✅ INTERACTIV A + C — LIVRAT (commit `ced8cf8`, verificat live, NEDEPLOYAT). A = chips domeniu; C = constructor 2 rânduri (Matrice/Sistem/Σ/∫). NU relua.
3. ✅ INTERACTIV B — LIVRAT + DEPLOYAT LIVE (paletă SVG-ca-imagine, tab „Figuri", 16 figuri, export Word reparat, cache v15). #4 COMPLET + TOT LIVE. RĂMAS opțional: eyeball PDF/.docx real + verificare domeniu Cristina + paritate mobilă.

REGULI OBLIGATORII:
- R3 corectitudine: gate_check.js validează DOAR KaTeX + invarianți (NO_LATEX=0, proză_în_html=0), NU corectitudinea matematică/semantica. Verifică FIECARE formulă la sursă; NU inventa. Capcane cunoscute: divizibilitate = convenția RO `a \vdots b` (⋮ = „a se divide cu b", NU internaționala `b \mid a`); litru = `\ell` (nu `\text{l}`); zecimale RO = `{,}` (ex. `2{,}35`); `.katex` e inline → măsoară cu getBoundingClientRect, nu scrollWidth.
- R-MATH (0% pierdere notație) · R-COST (gratuit) · R-EDIT.
- R-HANDOFF: ține HANDOFF + plan + memoria la zi + commit/push după FIECARE clasă. Deploy prod DOAR cu confirmarea mea (grupat, după mai multe clase; bump CACHE_VERSION v12→v13 la deploy).
- Non-regresie pt cod (interactiv A/C/B): tsc 0 · npm test (jest, 28) · npx next build · probă 390px+desktop.

#4 e COMPLET (autorare V→XII + interactiv A+C+B, toate verificate live). RĂMAS opțional: deploy B (v14→v15), eyeball export Word/redimensionare figuri, paritate mobilă math, verificare de domeniu Cristina. Confirmă în 2–3 rânduri ce ai înțeles, apoi întreabă-mă ce urmează.
```

---

## 📋 BACKLOG MATEMATICĂ (2026-07-26) — STARE la 2026-07-27

> **#1 ✅ · #2 ✅ · #3 ~ (parțial) — DEPLOYATE LIVE 2026-07-27** (`dpl_DyPf8jS5`, target production, `CACHE_VERSION v12`; verificat pe alias `traduceri-frontend.vercel.app`: sw.js=v12 + 24 construcții + „Construcții gata"). **#4 ⏳ ÎN CURS (taxonomie).** Commise `c37f22b`, `adaaaa8`, `969af17`, `5efc9b6`. RĂMAS de decis de Roland: (a) #3-extins (explicații ~157 formule) — Roland a ales să le autorez în #4, la același standard; (b) confirmarea TAXONOMIEI #4 înainte de autorare.

Cerut de Roland (3 capturi 231/232/233 + text). Ordine de prioritate 1→4. Toate în modulul Editor. Respectă §17 + gate + R-MATH + R-COST + R-HANDOFF. Fișiere-cheie: `frontend/src/components/editor/{EditorMathMenu,EditorMathBuilder,MathEditDialog,math-input,math-data.json}` + `app/globals.css`.

**1. Ghid de sintaxă / hint-uri (în „Construiește" + „Editează formula").**

- Ce: panou pliabil „Cum scriu?" cu tabel `ce scriu → ce obțin` pentru toate construcțiile (putere `a^{1}`→a¹, indice `a_{1}`→a₁, `\frac{a}{b}`, `\sqrt{}`, `\sqrt[n]{}`, `\int`, `\sum`, `\prod`, `\lim`, trig `\sin/\cos/\tan`, `\vec{}`, `\overline{}`, matrice `\begin{matrix}`, sisteme `\begin{cases}`, ≤≥≠∈⊂∪∩ etc.). Cristina vrea să genereze ORICE, nu doar ce e în paletă.
- Unde: în `EditorMathBuilder.tsx` (tab Construiește) + în `MathEditDialog.tsx`. Reutilizabil ca un component `MathSyntaxHelp`. §17: propune forma (accordion/popover/tab) cu mock.

**2. Formule lungi — overflow/deformare (screenshot 232).**

- Pe FOAIE: nodul inline-math lung iese din chenarul A4 în ambele părți. Fix în CSS (`app/globals.css` / `.editor-sheet` / nodurile `[data-type=inline-math]`/`block-math`): `max-width:100%`, `overflow-x:auto`, sau conversie la math BLOC pt formule lungi (wrap). Atenție: exportul re-randează din `data-latex` (`lib/math-render.ts`) → verifică și în PDF/HTML/Word.
- În DIALOG: `MathEditDialog` e `max-w-md` → pt formule lungi câmpul + previzualizarea ies. Fă dialogul mai lat/responsiv + `overflow-x:auto` pe preview (deja parțial) + câmpul poate fi `textarea`.

**3. Explicații la formule — dar NU inserate pe foaie (screenshot 233).**

- Ce: fiecare formulă din bibliotecă capătă `explicatie` (text pt profesor). La CLICK pe formulă în meniu → se inserează DOAR `latex` (ca acum); explicația se vede în meniu (rând extensibil / tooltip / icon „i"), NU intră în document.
- CONEXIUNE cu #2: unele din cele 214 intrări au proza/explicația stocată CHIAR în `latex` (ex. „se înmulțesc ca numere naturale…", „se așază virgulă sub virgulă…") → randează deformat (proză ca litere math lipite) + overflow. Auditează `math-data.json`: separă `latex` CURAT de `explicatie`; unde intrarea e pură explicație, mut-o în `explicatie` cu un `latex` real sau elimină formula falsă.
- Date: `math-data.json` → `formule[clasa][]` are azi `{grup, nume, html, latex?}`. Adaugă `explicatie?`. Convertorul de referință: `scratchpad/convert-math.js` (a validat 214/214 KaTeX).

**4. Extindere programă 5–12 (cercetare exhaustivă) — EFORT MARE, multi-sesiune.**

- Acoperă TOATĂ materia RO clasele 5–12: algebră, geometrie (+ figuri geometrice), analiză, trigonometrie, teoreme (Pitagora, Thales, teorema catetei/înălțimii, teoreme de arie/volum), funcții, ecuații, progresii, combinatorică, numere complexe, derivate/integrale etc.
- Proces OBLIGATORIU: (a) cercetează programa oficială RO pe clase; (b) fă o TAXONOMIE (clase × domenii × grupuri) în `docs/PLAN_math_curriculum_*.md`; (c) cere confirmarea lui Roland ÎNAINTE de a autor sute de formule; (d) autor incremental per clasă/domeniu, fiecare formulă cu `latex` + `explicatie`, VALIDAT KaTeX (script, ca la M4) + corect matematic (R3 — NU inventa formule); (e) grupează cu cele existente, totul editabil.
- „Mai interactiv/smart": ex. figuri geometrice inserabile, structuri cu găuri (F3b deferat), căutare mai bună. Propune, nu presupune.

**Gap deja cunoscut (de decis separat):** meniul Matematică e desktop-only (toolbar); pe mobil (Sheet) nu există math încă.

---

## 🆕 SESIUNE 2026-07-27 — backlog math #1/#2/#3 (DEPLOYAT LIVE) + #4 în curs

Branch `faza-g-editor`. Commit-uri: `c37f22b` (#1), `adaaaa8` (#2+#3), `5efc9b6` (fix html fallback + cache v12). Gate fiecare: **tsc 0 · build 11 rute · 28 teste · 213/213 KaTeX · verificat LIVE local + prod**. **DEPLOYAT prod 2026-07-27** (`dpl_DyPf8jS5`, `CACHE_VERSION v12`; Roland a aprobat; verificat pe alias). Roland a ales apoi **#4 taxonomie** ca următorul pas, iar #3-extins (explicații pt restul formulelor) să fie autorat în #4 la același standard.

**#1 ✅ — Construcții gata-făcute (REFRAME Roland).** Roland la §17: NU vrea „ghid cum să scrii", ci **structuri gata, toate vizibile, un click = pe foaie**. Livrat: grilă de **24 construcții** (xⁿ, xₙ, x²ₙ, a/b, √, ⁿ√, |x|, lim, Σ, Π, ∫, ∫ᵃᵇ, f′, sin/cos/tg, vector, overline, binom, ∠, grade, sistem, matrice) în tab-ul „Construiește" (deasupra constructorului cu câmpuri), fiecare randată KaTeX, un click → `insertInlineMath` → editabilă la click. `math-input.ts` (`MATH_CONSTRUCTIONS`) + `EditorMathBuilder.tsx` + `AutoFitKatex.tsx` (nou). Verificat LIVE: grila randează, click inserează fracția academic.

**#2 ✅ — Formule lungi se încadrează (nu ies din chenar).** Roland: „să cuprindă în casetă, calibrată corect" → **scale-to-fit (zoom)**, NU scroll (scroll nu supraviețuiește la print). `math-fit.ts` (`installMathAutoFit`): micșorează cu `zoom` nodurile `.katex` care depășesc lățimea foii; MutationObserver (re-randare) + ResizeObserver; **măsoară cu `getBoundingClientRect` — `.katex` e inline → `scrollWidth`=0 (BUG prins la verificare live)**. Montat în `EditorTiptap` robust (`editor.on('create')`, capcana view-lipsă). Export: script de fit (zoom) în PDF/HTML + **cap 658px pe imaginea DOCX** (aceeași lățime A4 în editor/PDF/Word). `MathEditDialog` responsiv (`max-w-2xl` + `Textarea` + preview scroll). Verificat LIVE: matrice/integrală se micșorează (zoom 0.61/0.77) și încap exact.

**#3 ~ parțial — Explicații (audit + chevron).** `math-data.json`: cele **16 intrări proză-pură** auditate → **15 primesc `latex` REAL corect (R3) + câmp `explicatie`; 1 ștearsă** (înmulțirea zecimalelor — procedură fără formulă). **213/213 valide KaTeX** (era 214, −1 ștearsă). UI: `EditorMathMenu` — **rând extensibil (chevron)** arată explicația; click pe formulă inserează **DOAR** latex, NICIODATĂ explicația. `type Formula + explicatie?`. Verificat LIVE (mediana: chevron → „centrul de greutate").

- **RĂMAS #3-extins (DECIZIE Roland):** restul de ~157 formule (116 curate + ~42 condiții/„sudate") **NU au încă `explicatie`**. Backlog-ul cerea explicație pt TOATE. De autorat separat — **înainte sau după taxonomia #4?** (În #4 oricum se autoreaza formula+explicatie la un standard.) NU se pliază tacit în #4.

**#4 ▶️ ÎN EXECUȚIE — taxonomie confirmată, autorare V→XII pe loturi.** Cercetare la sursă (OMEN 3393/2017 + Matematică_TC 2025 edu.ro + Real XI–XII); TAXONOMIE în **`docs/PLAN_math_curriculum_2026-07-27.md`**.

**DECIZII ROLAND (2026-07-27, confirmate):** (1) **TOATE profilurile** (Cristina predă la toate) — implementare **exhaustivă**; (2) **complet** (~65–95 formule noi + explicații la TOATE, inclusiv cele ~198 fără); (3) ordine **V→XII**, lot cu lot, gate+commit după fiecare clasă; (4) interactiv **A + C + B** (filtrare pe domeniu + construcții extinse + **figuri geometrice SVG** — B = feature mare, fază separată). Grupuri noi distincte unde e firesc.

**PROGRES: Clasa V ✅ (lot 1, commit `56afebd`)** — +11 formule noi (arii, unități de măsură, probabilitate, ecuații simple, divizor/multiplu) + explicații la toate cele 40 + curățat proza rămasă (ordinea operațiilor, criterii divizibilitate, zecimale, modul→`\begin{cases}`). **Bibliotecă 213→224.** Gate: 224/224 KaTeX, NO_LATEX=0, proză_în_html=0. **NEDEPLOYAT** (deploy grupat, după mai multe clase, cu confirmarea Roland).

**PROGRES: Clasa VI ✅ (lot 2, commit `feat(#4 clasa VI)`)** — 27→36 (+9 noi: șir rapoarte egale, mărimi direct/invers proporționale, mărire/micșorare cu p%, ecuația gr. I, arii paralelogram/romb/trapez, frecvența relativă). Explicații la toate cele 36. **Curățat proza sudată** (14 latex): procente (**fix `%` = comentariu KaTeX** → `\%`), modul→`\begin{cases}`, unghiuri compl./supl./paralele+secantă (simbolic + verbal în explicatie), regula semnelor, rotunjire (exemplu numeric), proprietăți paralelogram/romb (simbolic `\parallel`/`\cong`/`\perp` + verbal). Grupuri noi: „Ecuații", „Organizarea datelor". **Bibliotecă 224→233.** Gate PASS (233/233 KaTeX, NO_LATEX=0, proză_în_html=0) **+ eyeball manual 36/36** (nu doar gate). Script persistent: `scratchpad/clasa_6.js` + unealtă `scratchpad/eyeball.js <clasa>`. **NEDEPLOYAT.**

**REGULĂ NOUĂ dovedită empiric (R3):** diacriticele RO **NU** randează curat în `\text{}` KaTeX (`ă â î` se descompun în bază+accent; `ș ț` se păstrează dar font-fallback) → proza RO cu diacritice merge **DOAR în `explicatie`** (text HTML), latex = pur simbolic; `\text{}` doar pt etichete scurte fără diacritice (`\text{compl.}`, `\text{din}`). Capcana `%` = comentariu KaTeX (mănâncă restul liniei) → mereu `\%`.

**PROGRES: Clasa VII ✅ (lot 3, commit `feat(#4 clasa VII)`)** — 24→32 (+8 noi: pătratul trinomului, descompunere factor comun, **Teorema lui Thales**, triunghiuri asemenea + raportul ariilor (k²), media geometrică, aria+înălțimea triunghiului echilateral). Grupuri noi: „Asemănare", „Triunghi echilateral". Explicații la toate cele 32. Curățat 5 latex: direct proporț. (proză), teorema înălțimii/catetei (proiecțiile → explicatie), unghi la centru/înscris (proză pură → simbolic `m(\angle)=m(\overset{\frown}{})`; `\overparen` NU e suportat în KaTeX 0.16.11, folosit `\overset{\frown}{}`). **Bibliotecă 233→241.** Gate PASS (241/241) + eyeball 32/32. **NEDEPLOYAT.**

**PROGRES: Clasa VIII ✅ (lot 4, commit `feat(#4 clasa VIII)`)** — 27→35 (+8 noi: raționalizarea numitorului, introducerea sub radical, panta prin 2 puncte, intersecția cu axele (gr. I), diagonala cubului/paralelipipedului, **relația fundamentală sin²+cos²=1**, tangenta ca raport). Explicații la toate cele 35. Curățat **15 latex** grav sudate: sistem cu acolade literale (invizibile!) → `\begin{cases}`; sin/cos/tg/ctg complet rupt → forme cu litere a/b/c + legendă în explicatie; **tabel trigonometric 3×3** (`\begin{array}` sin/cos/tg × 30°/45°/60°); probabilitate/frecvență rupte → `\text{}`/`f_r`; **fix `%` la Frecvența relativă**; `A_{bază}`→`A_{b}`, `(\frac{1}{3})`→`\dfrac{1}{3}`. **Bibliotecă 241→249.** Gate PASS (249/249) + eyeball 35/35. **NEDEPLOYAT.**

**PROGRES: Clasa IX ✅ (lot 5, commit `feat(#4 clasa IX)`)** — 25→33 (+8 noi: logică — negarea cuantificatorilor + De Morgan; geom. analitică — ecuația dreptei (pantă-punct), paralelism/perpendicularitate, distanța punct-dreaptă; produsul scalar; formula lui Heron). Grup nou: „Logică". Explicații la toate cele 33. Curățat **16 latex**: `\surd`→`\sqrt` (formula rădăcinilor, distanța), **teorema sinusurilor MALFORMATĂ** (`\frac{a}{\sin } A`) → `\dfrac{a}{\sin A}`; vectori `u⃗`/`v⃗` raw → `\vec{}`; sin/cos/tg rupt → forme cu litere; monotonia proză → `\nearrow`/`\searrow`; inj/surj/bij blob → `\begin{aligned}`. **Bibliotecă 249→257.** Gate PASS (257/257) + eyeball 33/33. **NEDEPLOYAT.**

**PROGRES: Clasa X ✅ (lot 6, commit `feat(#4 clasa X)`)** — 27→37 (+10 noi: **combinatorică** completă — permutări/aranjamente/combinări/complementare/binom Newton/sumă=2ⁿ (grup nou „Combinatorică"); compunerea + inversa funcțiilor; modul&argument (formă trig); dobânda compusă (grup nou „Matematici financiare")). Explicații la toate cele 37. Curățat **19 latex**: `log`→`\log` (7 intrări, altfel randa ca variabile italice!); `z̄`→`\bar{z}`; `∥`/`⊥` raw→`\parallel`/`\perp`; `\surd`→`\sqrt` (înjumătățire); `\cdot` separatori→`,\quad` (adunare/dublare); `ℤ`→`\mathbb{Z}`; inecuații proză „dacă"→`\begin{cases}`. **Bibliotecă 257→267.** Gate PASS (267/267) + eyeball 37/37. **NEDEPLOYAT.**

**PROGRES: Clasa XI ✅ (lot 7, commit `feat(#4 clasa XI)`)** — 29→32 (**−5 combinatorică mutată la X** conform plan §2 + **8 noi**: teoremele **Rolle/Lagrange/l'Hôpital**, limita fundamentală tg x/x, transpusa, det(AB)=detA·detB, inversa 2×2, (aˣ)'=aˣln a). Explicații la toate cele 32. Curățat **22 latex** (cel mai mare lot): `′`/`″` raw→`f'`/`f''` (ASCII prime — **avertismentul `″` rezolvat**); reguli derivare `\cdot`→`\begin{aligned}`; determinant→`\begin{vmatrix}`, inversa→`\begin{pmatrix}`; monotonia/Fermat/concavitate proză→simbolic; **2 ERORI MATEMATICE reparate**: `\ln\frac{1+x}{x}`→`\frac{\ln(1+x)}{x}` (limita e) și `m = \lim f\frac{x}{x}`→`\lim\frac{f(x)}{x}` (asimptota oblică). **Bibliotecă 267→270** (+8−5). Gate PASS (270/270, fără avertisment `″`) + eyeball 32/32. **NEDEPLOYAT.** Engine: `applyLot` acceptă acum `REMOVE`.

**PROGRES: Clasa XII ✅ (lot 8 — ULTIMA, commit `feat(#4 clasa XII)`)** — 25→31 (+6 noi: lungimea graficului, media unei funcții pe interval, morfism de grupuri, relațiile Viète grad 3, congruențe (aritmetică modulară), abaterea standard). Explicații la toate cele 31. Curățat **19 latex**: `\int [a,b]` literal→`\int_{a}^{b}` (Leibniz-Newton, arii, volum); `′` raw→`'`; probabilitate condiționată/Laplace malformate; Bézout/inel proză→simbolic (`P(x)\vdots(x-a)` convenția RO, `(A,+,\times)`); `grad`→`\operatorname{grad}`. **Bibliotecă 270→276.** Gate PASS + eyeball 31/31.

## ✅✅ AUTORARE V→XII COMPLETĂ + DEPLOYAT LIVE (2026-07-27) — bibliotecă 213→276, TOATE cu explicație

**8 loturi (V…XII), committed+pushed, ✅ DEPLOYAT prod 2026-07-27** (`dpl_9RqRLBqj3ovWL5CpZ48jMgR2kvro`, READY, `CACHE_VERSION v12→v13` = `v13-20260727b`; verificat: aliasul `traduceri-frontend.vercel.app/sw.js` servește v13). Roland a confirmat deploy „Acum". Rezumat:

| Lot | Clasă | Δ intrări | Noi                                     | Fix latex         | Commit      |
| --- | ----- | --------- | --------------------------------------- | ----------------- | ----------- |
| 1   | V     | 29→40     | +11                                     | proză             | `56afebd`   |
| 2   | VI    | 27→36     | +9                                      | 14 (fix `%`)      | `c568c99`   |
| 3   | VII   | 24→32     | +8 (Thales/asemănare)                   | 5                 | `114eb65`   |
| 4   | VIII  | 27→35     | +8 (tabel trig)                         | 15                | `cf142ff`   |
| 5   | IX    | 25→33     | +8 (logică)                             | 16                | `45a37e8`   |
| 6   | X     | 27→37     | +10 (combinatorică)                     | 19 (`log`→`\log`) | `c8ca4bc`   |
| 7   | XI    | 29→32     | +8 (Rolle/Lagrange/l'Hôpital), −5 comb. | 22 (2 erori mat.) | `b495287`   |
| 8   | XII   | 25→31     | +6                                      | 19                | (acest lot) |

- **Bibliotecă: 213 → 276 formule.** `cu_explicatie = 276/276` (obiectivul #3-extins + #4 atins: TOATE au explicație).
- **Grupuri noi:** Unități de măsură, Organizarea datelor (V); Ecuații (VI); Asemănare, Triunghi echilateral (VII); Logică (IX); Combinatorică, Matematici financiare (X).
- **Capcane R3 dovedite:** diacritice RO nu randează curat în `\text{}` (→ explicatie); `%`=comentariu KaTeX (→`\%`); `\surd`/`\Sigma`/`log` fără `\` randează greșit; `\overparen` nesuportat (→`\overset{\frown}{}`); `′`/`″` raw→`'`/`''`; convenția RO divizibilitate `\vdots`.
- **Unelte persistente:** `scratchpad/lot_engine.js` (`applyLot`), `clasa_5..12.js`, `eyeball.js <clasa>`, `gate_check.js`.
- **INTERACTIV A + C ✅ (commit `ced8cf8`, ✅ DEPLOYAT LIVE v13→v14 `v14-20260727c`, verificat pe alias):** A = rând de chips de domeniu (Toate + grupurile clasei) → filtrează lista plată pe `f.grup`, reset la schimbarea clasei, chevron intact (`EditorMathMenu.tsx`). C = constructor pe 2 rânduri (`EditorMathBuilder.tsx`): Kind-uri noi `matrix` (n×n≤5, grilă → `\begin{pmatrix}`), `system` (n≤6 → `\begin{cases}`), `sum` (limite editabile → `\sum_{}^{}`), `integral` (limite + `\,dx` → `\int_{}^{}`); celule goale = `\square`; draft persistat. **Verificat LIVE** (localhost:3300): A filtrează 40→8 Geometrie; Matrice randează pmatrix (4 celule 2×2); Σ cu limite k=1→n; insert end-to-end → nod `data-latex` pe foaie. Non-regresie: tsc 0 · jest 28 · next build 11 rute.
- **INTERACTIV B ✅ (figuri geometrice SVG — commit pending, NEDEPLOYAT).** Formă confirmată de Roland (§17): **paletă SVG-ca-imagine** (NU NodeView parametric — amânat). `editor-figures.ts` = 16 figuri hand-drawn (9 plane: triunghi oarecare/dreptunghic/echilateral, pătrat, dreptunghi, paralelogram, romb, trapez, cerc; 7 corpuri: cub, paralelipiped, cilindru, con, sferă, piramidă, prismă) cu notații A/B/C(/D), muchii ascunse punctate. Tab nou „Figuri" în `EditorMathMenu` (popover lărgit 340→380px, 4 taburi), un click → `setImage({src: data-URI SVG base64})` (extensia Image, `allowBase64`). **Verificat LIVE**: toate 16 randează corect în paletă; click Cub → `<img>` cu `data:image/svg+xml;base64` + alt pe foaie. tsc 0 · jest 28 · build OK.
  - **Export Word REZOLVAT** (nu mai e caveat): `renderFiguresToPng` (în `lib/math-render.ts`, apelat în `exportDocx`) rasterizează figurile SVG → PNG înainte de turbodocx (Word nu embed-uiește SVG). Mecanism = identic cu math-to-PNG (Image→canvas→`toDataURL`, ne-tainted — dovedit live: PNG 15KB, tainted=false). PDF/HTML lasă SVG (browserul randează). tsc 0 · jest 28 · build OK.
  - **Caveat rămas (eyeball Roland):** (a) figura se inserează la 120px, **NU e redimensionabilă** pe foaie (Image nu-i configurat resizable) — de decis dacă adăugăm handles; (b) figurile NU sunt editabile (etichete/dimensiuni) = NodeView-ul parametric amânat; (c) eyeball vizual PDF/.docx real cu o figură (mecanica e dovedită, perceptualul rămâne la ochiul tău).
- **✅ #4 COMPLET + TOT DEPLOYAT LIVE (autorare V→XII + interactiv A+C+B, cache v15).** Notă: meniul Matematică e desktop-only — A/C/B apar doar pe desktop; paritatea mobilă = decizie separată.
- **De verificat de Cristina (R3, expert final):** corectitudinea matematică/notațională a formulelor noi (gate+eyeball garantează KaTeX + curățenie, NU semantica).
- **Duplicate INTENȚIONATE (revizitări per clasă — NU le „repara"):** Thales (VII+VIII), panta dreptei (VIII/IX/X), `sin²+cos²=1` (VIII+X), probabilitate (V/VIII/XII), arii pătrat/dreptunghi/triunghi (V+VI). Corecte — aceeași formulă revizitată la clase diferite.
- **Baseline non-regresie post-autorare (2026-07-27):** `tsc 0 · npx next build OK (11 rute) · jest 28/28`; `math-data.json` = un singur consumator (`EditorMathMenu.tsx`, grupare dinamică pe `f.grup`, fără whitelist). Bază curată pt interactiv A/C/B.

**Refactor unelte:** engine-ul de autorare e acum în `scratchpad/lot_engine.js` (`applyLot({CLASA,LATEX_FIX,EXPL,NEW})`); fiecare `clasa_<N>.js` doar furnizează datele. Model: `clasa_8.js`.

**URMĂTORUL: Clasa IX** (apoi X…XII), apoi interactiv A/C, apoi B (figuri).

**ȘABLON de continuare (repetabil per clasă):** script Node ca `scratchpad/clasa_v.js` — `LATEX_FIX` (curăță proza/formulele sudate rămase), `EXPL` (explicație la fiecare intrare existentă), `NEW` (formule noi din golurile ➕ ale clasei din plan); `html` regenerat din latex cu `katex.renderToString`; apoi rulează `scratchpad/gate_check.js` (trebuie PASS: KaTeX 0 fail, NO_LATEX=0, proză_în_html=0) → commit → update handoff. Înainte de fiecare clasă, dump intrările existente (`python`) ca să NU dublezi + să vezi ce proză a mai rămas (bucket-c prinde doar proza pură; multe au proză AMESTECATĂ cu `\frac`/`^`).

### DE PIPĂIT MANUAL de Roland (nu se pot automatiza)

1. **Export PDF/DOCX cu o formulă LUNGĂ** — verifică vizual că se încadrează (scriptul de fit + cap-ul de imagine sunt în cod, dar `window.print` blochează Chrome MCP; DOCX = eyeball).
2. **Mobil** — meniul Matematică rămâne desktop-only (gap cunoscut); #1/#3 nu apar pe telefon încă. De decis dacă intră paritatea mobilă.
3. **Verificare de domeniu (Cristina)** pe cele 15 latex-uri noi (corecte matematic, dar expertul confirmă).

---

## 🆕 SESIUNE 2026-07-26 (3) — EDITABILITATE TOTALĂ + PALETĂ ONE-CLICK + FIX RADICAL (LIVE pe prod)

Cerințe Cristina/Roland (5 poze): tot ce inserez = editabil, nu doar de șters; semnele = un click, fără codificări; simplitate maximă. **Toate implementate + verificate LIVE (tsc 0 · build 11 rute · 28 teste verzi). DEPLOYAT pe `traduceri-frontend.vercel.app`** (dpl `2c2xZuNM…`, READY, `CACHE_VERSION` v10→v11; verificat: aliasul servește v11 + paleta se randează live pe prod). Comit-uri: `2cad818` (feature) + `ef05703` (norm fără colaps spații) + `d7a0090` (bump cache).

1. **Paletă simboluri ONE-CLICK în constructor** (`MathSymbolPalette.tsx` + `math-input.ts`): rând de butoane (² ³ ⁿ ₁ ₂ ₙ √ ∛ π ∞ ≤ ≥ ≠ · × ÷ ± → ( )) deasupra câmpurilor din Fracție/Limită/Radical → inserează în **câmpul activ** (setter nativ + `input` event, `onMouseDown`+preventDefault ca să nu fure focusul). Textul-ajutor „Scrii normal: ^…" ELIMINAT. Verificat: click √ → `√5` în câmp.
2. **Formule EDITABILE după inserare** (`MathEditDialog.tsx` + `extensions.ts`): `Mathematics.configure` primește `inlineOptions.onClick`/`blockOptions.onClick` → emit `math:edit` (latex+pos) pe window → dialog cu câmp LaTeX + paletă + previzualizare KaTeX live → `updateInlineMath`/`updateBlockMath` la ACEA poziție (pos din click, valid cât dialogul e deschis). Merge la 100% din formule (bibliotecă + constructor + 214). Buton „Șterge formula" în dialog. Verificat: click pe formulă → dialog cu latexul exact → modificat 5→fracție → foaia s-a actualizat.
3. **FIX radical fără vinculum** (`math-input.ts` `norm()`, extras din builder): `√5`/`√x`/`√25` (fără paranteze) → `\sqrt{...}`; `√(6x+3)`, `∛8`, `∜16` la fel. Înainte `√5` rămânea glif → KaTeX îl randa `\surd` (fără linie) — bug screenshot 227. **Bonus (bug latent reparat):** comenzile `\cdot`/`\times`/… primeau spațiu terminator lipsă (`a·b`→`a\cdotb` rupt) → acum `a\cdot b`. Test `math-input.test.ts` (7 cazuri). Verificat LIVE: `lim(x→∞) √5` cu linie deasupra.
4. **Persistența schiței constructorului** (`EditorMathBuilder.tsx`): tipul + toate câmpurile se salvează în `localStorage` (`editor_math_builder_draft_v1`), init lazy din draft (client-only, fără hydration mismatch). Închizi meniul/comuți → la redeschidere regăsești formula în construcție. Verificat: reopen → Limită + √5 restaurate.
5. **Dictare — DIAGNOSTIC [CERT] + test microfon** (`MicTestDialog.tsx`): telemetria (Supabase `logs`, `editor:dictation%`) arată `dictation_audio` ✅ apoi DOAR `no-speech`→`no_voice_loop` → **microfonul selectat livrează stream TĂCUT** (dispozitiv greșit „Sound Blaster Rec" / Mut / nivel 0). NU e bug de app; Web Speech API nu permite alegerea dispozitivului din cod. **Fix pe mașină:** Chrome → lacăt → Microfon → alege microfonul REAL. Am adăugat un test cu **indicator de nivel live + selector dispozitiv** (`getUserMedia`+`AnalyserNode`), deschis din toast-ul de eroare — Roland vede care intrare îi duce vocea. Test-ul e build-verified; măsurarea reală cere microfonul lui.

**Fișiere:** NOI `math-input.ts`, `math-input.test.ts`, `MathSymbolPalette.tsx`, `MathEditDialog.tsx`, `MicTestDialog.tsx`; MODIFICATE `EditorMathBuilder.tsx` (paletă+persistență+`norm` din shared), `extensions.ts` (onClick), `EditorTiptap.tsx` (montează `MathEditDialog`), `editor-dictation.tsx` (buton „Testează microfonul" + `MicTestDialog`).

**RĂMAS de pipăit manual de Roland (nu se pot automatiza):** dictare cu voce reală + test microfon pe mașina lui; eyeball PDF/.docx cu formule editate; verificare pe MOBIL (paleta/dialogul de editare — meniul Matematică e desktop-only în toolbar, mobilul NU are încă math în Sheet → gap cunoscut, de decis separat).

**Lint (R3):** erorile ESLint rămase (`any` în dictare, ghilimele în banner legacy) sunt PREEXISTENTE, nu introduse acum; `next build` (Next 15) nu rulează ESLint → nu blochează deploy.

---

## 🆕 SESIUNE 2026-07-26 (2) — MATEMATICĂ ACADEMICĂ KaTeX (M1–M5, LIVE)

Cerință Cristina (poză `Downloads/limite_matematica.jpeg`): fracții cu bară (NU `/`), `lim` cu x→a dedesubt, radicali cu overline, nivel academic. Plan: `docs/PLAN_math_academic_2026-07-26.md`. **TOATE fazele M1–M5 gata + deployate.**

- **Motor:** KaTeX + `@tiptap/extension-mathematics@3.28.0` (EXACT ca `@tiptap/core` 3.28 — vezi capcană versiuni în [[project_math_academic_katex_2026_07_26]]) + `katex@0.16.11` + `@types/katex`. `Mathematics.configure` în `extensions.ts`, `import "katex/dist/katex.min.css"` în `EditorTiptap.tsx`.
- **Constructor** (`EditorMathBuilder.tsx`) — tab „Construiește" în meniul Matematică: Fracție/Limită/Radical, câmpuri prietenoase + previzualizare KaTeX live → `insertInlineMath`. Fără LaTeX tastat.
- **Bibliotecă (214 formule):** `EditorMathMenu` preferă `latex` (fallback `html`); convertor `scratchpad/convert-math.js` → 214/214 validate KaTeX; review vizual clase 5/9/11/12 corecte.
- **Export** (`lib/math-render.ts`): getHTML dă noduri math GOALE → RE-randez la export. PDF/HTML = `renderMathToKatexHtml` + `lib/katex-inline-css.ts` (fonturi base64, self-contained). Word = `renderMathToImages` (foreignObject→canvas→PNG, fără CDN).
- **Verificat LIVE + prod:** editor curat (0 erori), constructor + bibliotecă randează academic, export HTML are KaTeX + fonturi, DOCX valid. `CACHE_VERSION` v9→v10. **RĂMAS neblocant:** verificare domeniu Cristina (corectitudine 214), eyeball PDF/.docx real, cosmetice (proză italic în paranteze, `·` separator).

---

## 🆕 SESIUNE 2026-07-26 — fix dictare + layout „bara slim" (toate LIVE)

1. **Dictare — reparat diagnosticul** (`editor-dictation.tsx`): datele live arătau 44s cu ZERO transcript și ZERO eroare logată (onerror nu logha, nu era vizibil, repornea mut la infinit). Acum: `onerror`→`editor:dictation_error{code}`, `onaudiostart`→`editor:dictation_audio` (diagnostic-cheie: mic livrează sunet?), STOP după 3 restarturi fără audio (nu buclă mută), **eroare VIZIBILĂ** (toast roșu) cu mesaj per cauză. **NU e confirmat că transcrie la Roland** (n-am mic în automatizare) — cel mai probabil permisiune microfon site / dispozitiv de intrare. La următoarea lui încercare, logurile arată exact (`dictation_audio`? cod eroare?). Verificat live: fără mic → toast „nu primește sunet" + `dictation_error:no_audio_loop` în tabelă.
2. **Layout „bară slim"** (decizie Roland): antetul mare + TabNav → o singură bară subțire (`components/layout/TopBar.tsx`; `Header.tsx`+`TabNav.tsx` RETRASE). Funcția activă ocupă ~tot ecranul, la toate taburile. Editor: antet intern minim + înălțime mărită.
3. **FIX bug hydration/comutare** (`page.tsx`): `activeTab` era citit din localStorage în initializer → mismatch SSR↔client („1 Issue") + uneori tabul afișat ≠ cel salvat / comutarea nu se aplica. Fix: init DEFAULT + restore în `useEffect`. Comutarea merge acum + fără warning.

**Capcană verificare deploy (2026-07-26):** NU verifica un deploy prin `grep` după stringuri care apar în `<meta name=description>` (ex. „Traducere documente matematica cu AI") — persistă în `<head>` indiferent de UI. Folosește un marcaj UNIC al componentei vizibile (ex. clasa `md:text-5xl` a titlului vechi). Aliasul Vercel poate servi edge-cache stale câteva minute; `X-Vercel-Cache: HIT` + `Age>0` = cache, nu cod vechi — confirmă pe URL-ul deployment-ului direct.

---

## 📍 UNDE SUNTEM (editor nativ — 2026-07-25)

Am rescris **Editorul matematic** din HTML-vanilla-în-iframe (chrome triplu pe telefon) în **modul nativ React: TipTap 3 + shadcn/ui**, aliniat cu app-ul de referință Mösslein (`C:\Proiecte\Mosslein_Sistem_Gestiune - Copy`). **PARITATE ATINSĂ — iframe-ul vechi RETRAS.**

**Progres (vezi PLAN pt detalii):**

- [x] F0 setup · F1 core+G1 · F2 tabele+inserare
- [~] F3 matematică (G2): **214 formule V–XII + 103 simboluri + căutare** ✓ · **F3b** structuri interactive (fracție/radical cu găuri) = **DEFERAT** (custom NodeView; Roland: nu blochează retragerea)
- [x] **F4 COMPLET** (a export · b fișier/auto-save · c dictare ro-RO · d pagini A4) — vezi istoricul git
- [x] **F6 COMPLET** ✅ 2026-07-25 — non-regresie G1–G9 + retragere iframe:
  - **G1**: + undo/redo pe bara desktop (Ctrl+Z/Y oricum nativ).
  - **G3**: + **zebra (dungi alternante) + culoare fundal celulă**. Sortare/total = RETRASE INTENȚIONAT (Roland).
  - **G4**: + **întrerupere de pagină** (nod `pageBreak` → print/PDF/HTML + `<w:br w:type=page>` în DOCX).
  - **G6**: + **import automat din editorul vechi** (`editor_documente_v1` → adus o singură dată, cu banner; flag `editor_nou_legacy_imported_v1`).
  - **G8**: **Găsește & Înlocuiește** — bară sub toolbar (Ctrl+F + buton 🔍), evidențiere ca decorații, contor, potrivire exactă, Înlocuiește/Toate.
  - **Audit LIVE (grupurile F6)** desktop + probă 390px: G8 (highlight+replace, decorații absente din getHTML), G4 (marcaj+getHTML), G3 (zebra+fundal live+getHTML), G6 import (banner+R-MATH+one-time), G1 undo/redo, G9 temă — toate verzi. **G2/G5/G7 NEre-testate acum** (neatinse de F6) → pe pipăitul manual pre-deploy.
  - **Retras `public/editor/` (`git rm`)**; `app/editor/page.tsx` randează acum editorul NATIV; `/editor-nou` = „Tot ecranul".
  - Fix-uri la audit: zebra invizibilă live (nodeView TableView ignoră atribute → decorație pune `data-zebra` pe `.tableWrapper`) + `Duplicate extension names: ['link']` (StarterKit 3 include Link → `StarterKit.configure({link})`).
- [~] F5 polish (a11y aprofundat + dark-mode opțional) — RĂMAS, neblocant.

**Editorul nativ = tabul „Editor" (`/editor`) + „Tot ecranul" (`/editor-nou`).** Ambele randează `components/editor/EditorTiptap.tsx`. **Cod la zi (branch `faza-g-editor`, HEAD `3d604b2`), gate verde (tsc 0 · build 9 rute), DEPLOY FĂCUT pe `traduceri-frontend.vercel.app`** (2026-07-25, verificat LIVE). Vezi mai jos ce rămâne de pipăit manual.

Fișiere `frontend/src/components/editor/`: `EditorTiptap.tsx` (providere: document → pagini → dictare → **find**) · `TiptapToolbar.tsx` (+undo/redo/🔍) · `MobileToolbar.tsx` (Sheet controlat, se închide la deschiderea căutării) · `EditorInsertMenu.tsx` (+întrerupere pagină, +zebra/fundal celulă) · `EditorMathMenu.tsx` · `EditorFileMenu.tsx` · `editor-document.tsx` (+import legacy) · `editor-pages.tsx` · `editor-dictation.tsx` + `dictation-interim.ts` · **`editor-find.tsx` + `search-find.ts`** (G8) · **`page-break.ts`** (G4) · **`table-extensions.ts`** (zebra+fundal+decorație) · `extensions.ts` · `math-data.json`. Plus `lib/editor-export.ts` (+zebra inline+page-break CSS), `app/editor/page.tsx` (native, nu iframe), `app/globals.css`.

### ⚠️ DE PIPĂIT MANUAL de Roland (nu se pot automatiza — rămân deschise)

1. **Export PDF** — `window.print()` deschide dialog modal care blochează Chrome MCP. De verificat că PDF-ul arată corect, unde cade ruptura de pagină, ȘI că **întreruperea de pagină** rupe corect.
2. **Dictare cu voce reală** — nu există intrare audio în automatizare. De verificat: textul intră **la cursor**; `continuous` ține prin pauze; **Oprește** stinge indicatorul.
3. **O dictare reală → Export Word** (cu un tabel cu zebra + o întrerupere de pagină) — combină motor vocal real + export real + funcțiile noi F6.
4. **Găsește & Înlocuiește pe MOBIL** — verificat prin logică + tsc (Sheet-ul se închide la deschiderea căutării), dar NU vizual (proba mobil instabilă). De confirmat pe telefon real: 🔍 din „Format" → bara apare sus și e utilizabilă.

### 🚀 DEPLOY F6 — FĂCUT ✅ 2026-07-25

Deploy pe producție rulat (`vercel deploy --prod`, dpl_D6sHfPje…, READY) → **`traduceri-frontend.vercel.app` rulează acum editorul NATIV** (verificat LIVE: `/editor` = header nativ + toolbar, fără iframe; contor „2 pag A4"; consolă curată). `CACHE_VERSION` bumpat v8→v9 (PWA instalat ia bundle-urile noi). SW-ul NU precache-uiește fișierele șterse (`/editor/*`) — ștergere sigură (verificat).

**Gaura de import — ÎNCHISĂ** (banner non-distructiv, LIVE): când `editor_nou_v1` are conținut ȘI există `editor_documente_v1` ȘI flag nesetat → banner „Ai un document salvat în editorul vechi: «X». [Adu-l]". „Adu-l" pe editor gol = aduce direct; pe editor cu conținut = dialog de confirmare „documentul curent va fi înlocuit" (R-EDIT). După tratare: flag setat (nu reoferă), documentul vechi rămâne intact în localStorage. **Demonstrat pe date reale** la deploy: browserul de test avea deja conținut + legacy → banner-ul a păstrat conținutul și a oferit aducerea. Cristina ajunge oricum prin auto-import (cheia nouă goală la ea).

**RĂMAS de pipăit manual de Roland** (nu se pot automatiza):

1. **G2/G5/G7 re-verificare** (matematică/dictare/pagini) — NEre-testate în F6 (neatinse structural).
2. **Export PDF** — `window.print()` blochează Chrome MCP. Verifică PDF corect + unde cade ruptura vs ghidaj + **întreruperea de pagină** rupe corect.
3. **Dictare cu voce reală** — text la cursor, `continuous` prin pauze, Oprește stinge microfonul.
4. **O dictare reală → Export Word** (cu tabel-zebra + întrerupere de pagină) — combină toate funcțiile noi.
5. **Găsește/Înlocuiește pe MOBIL real** — verificat prin logică+tsc (Sheet se închide la deschiderea căutării), nu vizual (probă mobil instabilă).

### 📊 TELEMETRIE EDITOR — ACTIVĂ ✅ 2026-07-25 (pt verificare din loguri)

Ghid complet: `docs/GHID_VERIFICARE_EDITOR_F6.md` (per verificare: 🟢 ce confirmă logul automat / 🟡 ce rămâne la ochiul lui Roland).

- **Ce:** `trackEditor("<ev>")` → `logAction("editor:<ev>")` → `/api/logs` → Supabase `logs`. **Always-on** (decizie Roland), evenimente SEMANTICE (nu click brut): math_insert, dictation_start/final/stop, page_count (doar la schimbare), insert (page_break/table/zebra/cell_bg/…), export (+steaguri conținut), find_open, find_replace_all, legacy_bring. Fișier: `components/editor/editor-telemetry.ts`.
- **Sink:** tabela `logs` în proiectul Supabase **tenders-ro** (`ywlykyyivthpsxfkdwzl`) — REFOLOSIT (0 $, R-COST; NU proiect dedicat = ar fi fost 10 $/lună). Izolat prin prefixul `editor:` + `source`.
- **Env prod:** `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` setate pe `traduceri-frontend` (numele exact citit de `route.ts`; cheia luată via Management API, nu în chat). ⚠️ Codul citește `SUPABASE_SERVICE_KEY`, NU `SERVICE_ROLE_KEY`.
- **Cum citesc logurile:** Supabase MCP `execute_sql` pe `logs`, filtru `message like 'editor:%'`; sau `/diagnostics` live. `level="action"`, `source="user-action"`.
- **Dovedit end-to-end** (2026-07-25): `editor:find_open` + `editor:page_count` au ajuns în tabelă din site-ul LIVE.
- **Onestitate (R3):** logul dovedește MECANICA (acțiune + date), NU perceptualul (cum arată PDF-ul, ce cuvinte a auzit dictarea) — acela rămâne 🟡.

---

## 🔑 CONTEXT OPERAȚIONAL (ce NU se vede din cod — CRITIC)

1. **URL canonic = `traduceri-frontend.vercel.app`** (proiectul NOU, iulie). Există și `traduceri-matematica.vercel.app` (VECHI, martie) — de pe el era instalat PWA-ul lui Roland; ambele rulează acum codul nou, dar **canonic e traduceri-frontend**. NU le confunda.
2. **Deploy:** din `frontend/`, `vercel deploy --prod --yes --token="$VERCEL_API_KEY"` (Vercel CLI instalat global via `npm i -g vercel`; tokenul e în env `VERCEL_API_KEY`, sistem central de chei). Deploy = outward-facing → confirmare scurtă de intenție de la Roland, apoi îl rulez EU.
3. **Testare mobil:** `resize_window` din Chrome MCP **NU emulează** viewport-ul (rămâne 1536). Metoda care merge: injectează un **iframe de 390px** cu pagina în ea (same-origin), via `javascript_tool` → screenshot. (Ecranele CDP dau uneori timeout — reîncearcă.)
4. **Decizii §17 (confirmate):** matematică FIDEL (Unicode + HTML, NU LaTeX); toolbar mobil = bară slim + bottom Sheet (ca Google Docs); temă „cretă" tokenizată (NU neutral). Export (F4) + paritate = de confirmat la faza lor.
5. **Insight cheie Mösslein:** copiem MOTORUL lui (config TipTap, FontSize custom, auto-save, export), dar toolbar-ul LUI e desktop-only → noi facem toolbar mobil MAI BUN (Sheet). Vezi PLAN §2.
6. **Preferință Roland:** rulez EU tot ce se poate automatiza (deploy/push/CLI); manual doar login/2FA/aprobări. Execuție autonomă cu tracking clar + commit/push după fiecare fază.
7. **Workflow per fază:** cod → `tsc 0` + `next build OK` → verificare LIVE la 390px (iframe-probe) + desktop → commit+push → deploy → raport. NU trece la faza următoare fără confirmare.

---

## 🧭 CUM RELUEZI (pas cu pas, în sesiunea nouă)

1. Deschide Claude Code ÎN `C:\Proiecte\Traduceri_Matematica`.
2. Lipește PROMPT-ul de reluare de mai sus.
3. Verifică: `git branch --show-current` = `faza-g-editor`; `git log -1` = ultimul commit editor-tiptap.
4. Continuă faza aleasă din PLAN, respectând §17 + non-regresie.

> Notă: acest fișier + PLAN-ul + memoria + git = „creierul" transferabil. Actualizează-le la fiecare fază (așa rămâne handoff-ul mereu valid).
