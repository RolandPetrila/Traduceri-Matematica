# PLAN ÎN LUCRU — tablou de bord viu

> **Deschide-l oricând, inclusiv în mijlocul unei faze.** Se actualizează la fiecare sub-pas,
> nu la finalul fazei (recomandarea mea la 6b, confirmată de Roland).
>
> Stări: ⬜ neînceput · 🟡 în lucru · 🟢 gata + dovadă · 🔴 blocat · ⏸️ amânat conștient
>
> **O căsuță devine 🟢 DOAR** dacă execuția e făcută ȘI verificată live ȘI dovada e scrisă în
> dreptul ei. Fără dovadă → rămâne 🟡. (Decizia 6a: „nimic gata fără dovadă live în browser".)
>
> **Distincția cerută de auditori:** „exersat live" ≠ „verificat în cod și în pachetul livrat".
> A doua e reală și utilă, dar NU e dovadă live. Fiecare rând spune care dintre ele e.
>
> **Acest fișier ține DOAR ce rămâne de făcut** (Faza 5, decizia proprie §0: itemii deja închiși
> migrează în `docs/Plan_Finalizat.md`, rezumat + link la commit-uri, nu ținuți și aici — evită
> dublura pe care Faza 5 o interzice explicit). Istoricul complet al fazelor închise, cu tabelele
> de dovadă live: `docs/Plan_Finalizat.md`.

> ### ⏰ Notă despre ceasul laptopului (infirmată empiric, 2026-09-12)
>
> Nota veche de aici ("ceasul e cu o zi înainte", scrisă 2026-09-07/08) NU se mai confirmă.
> Reverificat 2026-09-12: ora locală vs. 3 surse externe independente (Google, GitHub,
> Cloudflare) — identice la secundă (un al 4-lea martor, Vercel, a dat o valoare discordantă,
> dar prin header de edge cache, nu ca sursă de timp primară). **Ceasul e corect ACUM.** Rămâne
> un risc mic, nu un defect activ: `w32tm /query /status` arată serviciul de sincronizare oră
> Windows OPRIT — nesincronizat, ceasul poate deriva din nou în timp. De remediat la conveniență
> (pornire serviciu W32Time), fără urgență.

**Ultima actualizare:** 2026-09-12 (mentenanță post-Faza 6 — programul de reparație e ÎNCHIS,
nicio fază nouă; adăugat R-DIAG-AUTO — fix orbire diagnostică `unhandledrejection`; vezi
§🔧 Mentenanță mai jos pt task-urile curente) · **Producție:**
`traduceri-frontend.vercel.app` — **redeployată 2026-09-12** cu fixul E-PLAN-001 la Planșe (commit
`687f61d`), confirmat LIVE (`GET /sw.js` → `CACHE_VERSION = "v78-20260912"`) · `traduceri-api.vercel.app`
neatinsă (nimic backend modificat) · Faza 6 (ultima) închisă 2026-09-11/12, vezi
`docs/HANDOFF_SESIUNE.md`

---

## 🔧 Mentenanță (2026-09-12) — fără fază nouă, aceeași disciplină

- [x] 🟢 **R-DIAG-AUTO — verificare + diagnostic log-uri de eroare (sesiune `/onboard` nouă,
      2026-09-12, prima rulare a acestei reguli în această sesiune):**
      **Control pozitiv (obligatoriu înainte de verdict):** interogat direct Supabase
      (`tenders-ro`, `logs`). Cele trei grupuri documentate la Faza 6 §2.7 s-au reprodus EXACT:
      `editor:dictation_error`=61 (2026-07-26), `editor:translate_error`=10 (2026-08-20→09-06),
      `editor:ocr_import_error`=4 (2026-07-30→09-02) — aceleași cifre, aceleași ferestre de timp.
      Totalul `level=action AND error_code IS NULL` = **854** (nu 846 ca la Faza 6) — delta de +8
      **corectat de `auditor-dovezi`** după o primă explicație greșită a mea: cele 8 rânduri
      excedentare sunt EXCLUSIV din 2026-09-12 (azi), compuse din 4× `editor:translate` + 4×
      `editor:page_count` (acțiuni normale, nu erori) — NU din `editor:insert`/`editor:ocr_import`
      cum am afirmat inițial fără verificare directă. Lecție reținută: nu prezenta o explicație de
      delta ca fapt fără să o verifici separat.
      **Item găsit** (citind TOATE nivelele, nu doar ERROR/WARN): `level=error, error_code=NULL,
message="Internal error"`, id `244f7ac5`, `2026-09-11 07:22:50`, `source=unhandled-promise-
rejection`, `context=null`, `stack=null`, iOS/Safari/mobile. **Precizie cerută de
      `auditor-cerinte`:** NU e un item "nou" apărut după Faza 6 — predatează închiderea Fazei 6
      (2026-09-11 21:19) cu ~14 ore; corect spus, e un item preexistent din bucket-ul
      `level=error/warn, error_code=null` (43 rânduri), niciodată examinat individual până acum
      (Faza 6 a acoperit doar bucket-ul `level=action`). Șirul „Internal error" NU apare nicăieri
      în codul sursă propriu (grep repo-wide, zero rezultate) — cauza erorii ÎN SINE rămâne
      **[NEGĂSIT]** (posibil o chirie WebKit/iOS Safari, nereprodusă local), NU s-a speculat.
      **Cauza confirmată ÎN COD** (nu presupunere) pt orbirea diagnostică din jurul ei:
      `frontend/src/lib/monitoring.ts`, handler-ul `window.addEventListener("unhandledrejection",
...)` nu trimitea NICIODATĂ câmpul `context` la `logError` — orice `reason` care nu e un
      `Error` propriu-zis (string, DOMException, obiect simplu) rămânea fără nicio urmă
      diagnostică dincolo de mesaj. **Fix (UN SINGUR item, plafonul respectat):** handler-ul
      capturează acum `context: {reasonType, reasonName, reasonCode, reasonString}` — dacă
      recidivează, viitorul rând din Supabase va avea de-acum context real, nu `null`.
      **Dovadă live, în 2 trepte:** (1) test nou `monitoring-unhandledrejection.test.ts` (2 teste,
      execuție reală prin jsdom, nu mock — unul reproduce exact `reason="Internal error"`); (2) la
      cererea `auditor-cerinte` (jsdom nu ajunge, a cerut verificare într-un browser real),
      reprodus manual în Chrome pe dev-server local (`localhost:3000`, fără deploy):
      `Promise.reject('Internal error')` → log capturat cu
      `context:{reasonType:"string",reasonString:"Internal error"}` — confirmat vizual, nu doar în
      test. **Gate**: `tsc 0 · jest 452/452 (450+2 noi) · lint 12 (=baseline) · build OK ·
pytest 121/121` — identic cu baseline, verificat independent de `auditor-regresie`.
      **Service worker**: NU necesită bump de `CACHE_VERSION` (confirmat de `auditor-regresie`) —
      `monitoring.ts` e servit prin chunk Next.js hashat, cale network-first în `sw.js`, nu
      cache-first pe nume fix ca la modulul Planșe.
      **Scope respectat** (confirmat de `auditor-cerinte`): NU am atins Groq 429/auto-continuare,
      NU am atins opțiunea B de capacitate OCR, NU am deschis fază nouă, NU am făcut deploy. Cele
      61 rânduri `editor:dictation_error` NU au fost tratate ca bug (microfon tăcut, nu defect de
      cod — `finding_dictation_silent_device_2026_07_26`), zero cod de dictare atins.
      **Verdictele celor trei auditori:** `auditor-regresie` → FĂRĂ REGRESIE. `auditor-dovezi` →
      7/8 CONFIRMAT + 1 corecție (delta +8, aplicată mai sus). `auditor-cerinte` → mandat respectat
      pe scop/disciplină + 2 corecții (verificare live completată ulterior în browser real;
      etichetare „nou"→„preexistent, neexaminat" aplicată mai sus).
- [x] 🟢 **Hook `SessionStart` (R-DOCS-GUARD) — CONFIRMAT LIVE (2026-09-12, sesiune `/onboard`
      nouă, `session_id` diferit de rundele 1-3):** mesajul `SessionStart:startup hook success:
R-DOCS-GUARD scanate=15 de_revizuit=0` a apărut vizibil în context — exact testul decisiv
      cerut de runda 3. Istoric diagnostic complet (3 runde, ipoteze excluse) + cauza reală (JSON
      brut pe stdout pica validarea de schemă a hook-urilor Claude Code) + fix:
      `docs/Plan_Finalizat.md` §„Mentenanță post-program — hook SessionStart" (2026-09-12).
- [x] **`E-PLAN-001` la Planșe (`dictare`, `uneste`) — diagnosticat COMPLET, cu dovadă rulată, nu
      presupunere:**
      **a) Bug sau comportament corect?** COMPORTAMENT CORECT — bucla respectă contractul ei (nu
      repetă o semnătură deja „văzută"). Cauza reală: `dictare.js`/`uneste.js` au un catalog FIX de
      forme numite (nu geometrie procedurală ca labirint/căutare/numere/integramă), iar
      `signature()` depinde DOAR de (formă, dificultate), nu de seed. Rulat direct generatoarele
      reale (`scratchpad/planse_pool_size_check.js`) → spațiu TOTAL de rezultate posibile:
      `dictare` = 23 (Ușor 8/Standard 9/Greu 6), `uneste` = 36 (12 forme × 3 dificultăți).
      `MAX_SEEN` (istoric global, comun la toate 6 generatoarele) = 300. Cu doar 6-9 rezultate
      posibile/dificultate, istoricul se epuizează prin uz normal (fiecare planșă
      printată/adăugată-în-coș e marcată definitiv „văzută"), nu doar prin testare. **Nu s-a atins
      bucla — funcționează cum trebuie.**
      **b) Codul de eroare corect?** PARȚIAL — tiparul E-HIST-001/002. Catalogul
      (`config/error_codes.json` + oglinda generată `error-catalog.ts`, regenerată cu
      `scratchpad/gen-error-catalog.mjs`, NU editată manual) descria doar cazul „excepție reală"
      (`context.kind:"logic"`); a fost extins să acopere și cazul real întâlnit (`kind:"unknown"` =
      epuizare pool, fără excepție) — **corectat 2026-09-12**, gate verificat identic cu baseline
      (`tsc 0 · jest 447/447 · build OK · pytest 121/121`).
      **Decizie confirmată (AskUserQuestion, 2026-09-12):** doar corectez mesajul din UI, nu ating
      politica de istoric (fără buton reset, fără mărire catalog acum). Implementat: `diag.js`
      (`notaLot`) primește un 4-lea parametru opțional `advice` care înlocuiește textul generic
      "Mai apasă o dată pentru altele noi." (înșelător când chiar TOATE variantele posibile la acea
      dificultate sunt deja văzute) — omis → comportament identic ca înainte pt labirint/căutare/
      numere/integramă (spațiu de semnături practic nelimitat, unde sfatul chiar ajută). `app.js`
      (generate() la `dictare` + `uneste`) trimite acum textul corect: „Există doar atâtea forme
      distincte la această dificultate — încearcă altă dificultate sau altă formă." + adăugat
      hint-ul lipsă din `uneste` (dictare îl avea deja parțial, doar în `meta`, nu și în banner).
      **Test non-regresie NOU** (`planse-smoke.test.ts`, 3 teste, deterministe fără flake — rulează
      generatoarele reale prin jsdom, nu mock-uri): dictare/Greu (6 posibile TOTAL) + cerere 8 →
      pigeonhole garantat incomplet; uneste/Standard cu toate cele 12 forme marcate „văzute" +
      cerere 2 → 0 produse; labirint (generator neafectat) → avertisment vechi neschimbat (probă că
      fix-ul nu a scăpat la celelalte 4 generatoare). **Gate final: `tsc 0 · jest 450/450 (447+3) ·
build OK · pytest 121/121`** — zero regresie.
      **Verdictele celor doi auditori (R-AUDIT-FAZA, 2026-09-12, aplicat și în mentenanță):**
      `auditor-dovezi` — CONFIRMAT structural pe ambele fixuri (hook + E-PLAN-001), a găsit o
      citare falsă (script de investigație salvat în scratchpad de SESIUNE, nu de proiect) —
      corectată imediat (`scratchpad/planse_pool_size_check.js` mutat în proiect, re-rulat, output
      identic 23/36). `auditor-regresie` — FĂRĂ REGRESIE pe poartă (cifre confirmate live
      independent), a găsit aceeași citare moartă (rezolvată) + lint nou +1 în testul adăugat
      (`no-unsafe-function-type`, corectat imediat, lint revenit la 12 = baseline) + **`sw.js`
      cache-first pe `app.js`/`diag.js` (ambele modificate) fără bump de `CACHE_VERSION`** — un PWA
      deja instalat n-ar fi văzut fixul. **Corectat, cu confirmarea lui Roland (AskUserQuestion):**
      `CACHE_VERSION` bump-uit `v77-20260911` → `v78-20260912`. Gate re-verificat după TOATE
      corecțiile: `tsc 0 · jest 450/450 · lint 12 (= baseline) · build OK · pytest 121/121`.

---

## ✅ Faze 1 → 4.5e — ÎNCHISE (istoric complet migrat)

Faza 1 (orbirea diagnostică), Faza 2 (bug SK + 5 runde audit), Faza 2.5 (cei trei auditori
instituiți), Faza 3 (caiet de sarcini, 104 butoane), Faza 4 (audit real în browser, 16 defecte),
Faza 4.5a (6 reparații contenite), Faza 4.5b (P3 traducere F8), Faza 4.5c (P2 timeout lanț AI,
rămas 🟡 — traseul de realocare Groq neexercitat live), Faza 4.5d→4.5e (free tier + siguranță
OCR + reparație de proces) — toate cu dovadă live, verdicte ale celor trei auditori și hash-uri
de commit reale. **Detaliul complet, per fază, cronologic: `docs/Plan_Finalizat.md`.**

Rămân deschise din acest istoric (nu sărite — vezi §„Datorii tehnice deschise" mai jos):
riscul Groq de 429 pe auto-continuare, opțiunea B de capacitate OCR. (Retestarea onestă Mistral
„2 req/min" — REZOLVATĂ 2026-09-12, vezi §Datorii tehnice.)

---

## Ordinea confirmată de Roland

```
1. FAZA 2    — riscul „originalul se pierde" ÎNTÂI, apoi bug-ul SK
2. FAZA 2.5  — cei trei agenți de audit
3. FAZA 3    — caietul de sarcini (viu, .md + .html cu căutare)
4. FAZA 4    — auditul real în browser, cu fișierele din Teste_Input
5. FAZA 4.5a — reparațiile contenite, risc redus (P1, „→ Editor", P4, P5, P6, P7) — ÎNCHISĂ
6. FAZA 4.5b — traducere F8 (P3, R-MATH) — ÎNCHISĂ
7. FAZA 4.5c — timeout lanț AI la Teste mari (P2) — izolată într-o fază proprie (defect LATENT,
   necesită măsurare pe providerul real înainte de fix — vezi Roland, decizia din 4.5b)
8. FAZA 5    — unificarea documentației + memorie + mediu nativ + /onboard — ÎNCHISĂ
9. FAZA 6    — automatizarea + lista de pornire
```

---

## ✅ FAZA 5 — Unificarea documentației `ÎNCHISĂ (2026-09-11)`

Decizii: **5a** documente vechi → `docs/arhiva/` · **5b** rezumat per fază/sesiune cu linkuri la
commit-uri în `docs/Plan_Finalizat.md` · **5c** cronologic + index pe module · linia F5/F6:
structura (arhivă+`Plan_Finalizat.md`+`CLAUDE.md` la zi) în F5, automatizarea (regulă de
curățenie, mediu nativ Claude Code, `/onboard`→`AskUserQuestion`) în F6. Plan complet + listă
exactă de fișiere + jurnal execuție: `docs/arhiva/PLAN_FAZA5_UNIFICARE_DOCUMENTATIE_2026-09-11.md`
(arhivat la Faza 6, fază închisă).

**Ce s-a livrat:** `docs/Plan_Finalizat.md` (nou) + `docs/arhiva/` (nou, 21 fișiere) +
`PLAN_MASTER.md`/`CHANGELOG.md` absorbite (backlog → mai jos, decizii → `CLAUDE.md`) +
`docs/HANDOFF_SESIUNE.md` redus de la >1800 la <100 linii + 24 fișiere de memorie și `CLAUDE.md`
cu referințe fixate (7 erau deja moarte dinainte de Faza 5) + **acest fișier golit de fazele
închise** (vezi secțiunea de mai sus). Zero cod de aplicație touch-uit. Poartă identică cu
baseline: `tsc 0 · jest 447/447 · build OK · pytest 121/121`.

**Verdicte auditori:** regresie — FĂRĂ REGRESIE de cod; a găsit 5 referințe suplimentare deja-
moarte în fișiere neatinse de Faza 5 (`.claude/agents/auditor-dovezi.md`,
`docs/PROMPT_SESIUNE_NOUA.md`, `README.md`, `99_Plan_vs_Audit/PLAN_DECISIONS.md`,
`docs/Fazele.md`) — corectate imediat, înainte de commit. dovezi — 6 CONFIRMAT, 1 PARȚIAL (o
referință ratată în sampling, corectată), 1 CONFIRMAT-cu-rezervă (2 puncte operaționale minore,
necritice, absente din noul HANDOFF — nu redate, notă rămasă în plan). cerințe — a găsit o
**abatere reală majoră**: acest fișier NU fusese încă golit de fazele închise cum promitea §0 al
planului (dublură cu `Plan_Finalizat.md`) — **corectată imediat, ÎNAINTE de commit** (trimiterea
de mai sus); + `CLAUDE.md` mai avea Chat AI listat ca modul livrat, la 14 linii de propria notă
că a fost eliminat — **corectat**.

---

## ✅ FAZA 6 — Automatizarea procesului `ÎNCHISĂ 2026-09-11` (ultima din program)

Plan confirmat de Roland pe toate punctele §4: `docs/arhiva/PLAN_FAZA6_AUTOMATIZARE_2026-09-11.md`
(arhivat la închiderea Fazei 6, dovadă vie a Completării 4 — vezi mai jos). Actualizat live, la
fiecare sub-pas (decizia 6b).

- [x] Baseline gate ÎNAINTE de prima modificare — `tsc 0 · jest 447/447 · build OK ·
pytest 121/121` (identic cu baseline Faza 5; capcană găsită: `pytest.exe` direct nu adaugă
      rădăcina proiectului în `sys.path` → `ModuleNotFoundError: No module named 'api'` pe
      `test_nllb_lang_map.py` — fals-negativ de INVOCARE, nu regresie; `python -m pytest` (care
      adaugă `cwd`) dă 121/121 corect. De reținut în `docs/MEDIU_CLAUDE_CODE.md`.)
- [x] **Completare 1 (prim pas, cerut de Roland):** `docs/Plan_Finalizat.md` nu avea secțiune
      pentru Faza 5 — referința „vezi Faza 5 mai jos" țintea spre nimic. Adăugată secțiunea
      completă (livrare + verdicte auditori, reconstruite din `HANDOFF_SESIUNE.md` +
      `Plan_in_Lucru.md` vechi) + notă retrospectivă despre de ce niciun auditor n-a prins-o
      (mandatul lor nu acoperă completitudinea internă a fișierului) + bullet nou în §Notă de
      proces ca să nu se repete.
- [x] **Completare 2:** cele 4 referințe active către `docs/PLAN_FAZA5_...md` (2 în
      `HANDOFF_SESIUNE.md`, 2 în acest fișier) reparate spre `docs/arhiva/...` ÎNAINTE de mutare,
      apoi `git mv docs/PLAN_FAZA5_UNIFICARE_DOCUMENTATIE_2026-09-11.md docs/arhiva/...` — zero
      linkuri moarte fabricate.
- [x] 2.1/2.3 — `.claude/scripts/check-docs-classification.mjs` (pattern/titlu-H2, extins la
      `.html` per completarea 3) + hook `SessionStart` local (`.claude/settings.local.json`) +
      pas nou în `CLAUDE.md` pt `AskUserQuestion`. **Bug real găsit și reparat empiric la prima
      rulare:** scanarea prozei (nu doar titlul) confunda „arhivat la Faza 6" (mențiune în
      secțiunea Faza 5) cu o declarație de stare pt Faza 6 → fals „legitim" pt un fișier
      PLAN_FAZA5 de test. Fix: doar titlul H2, ancorat. Re-testat: caz curat (0), caz stale
      simulat (1, prins corect), cleanup (0) — toate 3 confirmate live. Mecanismul + logica sunt
      🟢, verificate live.
- [ ] 🟡 **VERIFICARE PROGRAMATĂ (sesiunea următoare):** declanșarea AUTOMATĂ a hook-ului
      `SessionStart` + `AskUserQuestion` la `de_revizuit > 0` — NU se poate dovedi din sesiunea
      curentă (sesiunea a pornit deja). **Actualizat 2026-09-12 (mentenanță):** confirmat empiric că
      NU a rulat vizibil la pornirea acestei sesiuni (spre deosebire de hook-urile SessionStart ale
      pluginului Vercel, care AU produs output — deci mecanismul de bază funcționează). Cauză
      diagnosticată cu documentația oficială (matcher și shell Windows EXCLUSE ca și cauze; calea
      relativă fără `${CLAUDE_PROJECT_DIR}` = cauza probabilă) + fix aplicat + hook mutat în
      `.claude/settings.json` (versionat, confirmat de Roland). Detaliu complet:
      `docs/HANDOFF_SESIUNE.md` §REIA DE AICI. Rămâne 🟡 până la confirmare live la sesiunea
      următoare — fixul nu se poate dovedi în sesiunea care îl aplică.
- [x] 2.2 — `docs/MEDIU_CLAUDE_CODE.md` scris (auditori, reguli, gardă docs/, memorie, flux fază,
      capcane operaționale — inclusiv gotcha-ul pytest găsit la baseline).
- [x] 2.4 — `CLAUDE.md` pasul 1 include acum `docs/completari_pt_reparatie.md`.
- [x] 2.5 — R-HANDOFF §2 (`project_rules.md`) are acum sub-pas explicit: transferă bifatele în
      `Plan_Finalizat.md` ÎNAINTE de commit, ca pas separat de simpla bifare.
- [x] 2.6 — `.claude/memory/` (3 fișiere) arhivat în `.claude/memory/arhiva/` (`git mv`, nimic
      șters) + `.claude/memory/MEMORY.md` rescris ca pointer + `CLAUDE.md` pasul 4 corectat spre
      memoria canonică auto-încărcată. **Întrebarea lui Roland (nedecisă, adusă în raportul de
      închidere):** memoria canonică nu e în git — risc la o viitoare migrare de laptop. Propunere
      în raport, nu implementată unilateral.
- [x] 2.7 — R-DIAG-AUTO (`project_rules.md`) lărgită la toate nivelele. **Probă empirică live pe
      Supabase (`tenders-ro`, tabela `logs`, nu date sintetice):** 846 rânduri `level=action`, TOATE
      cu `error_code=null` — complet invizibile la regula veche (`ERROR`/`WARN`+`error_code`).
      Căutare pe conținut mesaj a găsit real, în grupuri separate: 10 rânduri `editor:translate_error`
      (2026-08-20 → 09-06, EXACT bug-ul SK din Faza 1), 4 rânduri `editor:ocr_import_error`
      (2026-07-30 → 09-02) și 61 rânduri `editor:dictation_error` (din 2026-07-26) — toate invizibile
      regulii vechi, toate prinse de cea lărgită. Corectat 2026-09-12 (auditor-dovezi): citarea
      inițială combina primele două grupuri sub „10" ca și cum ar fi aceeași fereastră de timp — nu
      erau. Nu a fost nevoie de log de test sintetic — dovada reală era deja în producție. 🟢.
- [x] **Completare 4 (auto-consistență):** Faza 6 însăși, la închidere, a devenit plan de fază
      închisă — dovadă live, în ordine: (1) titlu H2 flipat la `✅ ÎNCHISĂ` → gardă rulată →
      `PLAN_FAZA6_AUTOMATIZARE_2026-09-11.md` flagat `STALE` (`de_revizuit:1`, exit 1) — mecanismul
      și-a prins propriul autor; (2) referințe reparate repo-wide (nu doar `docs/`): comentariul
      din `.claude/scripts/check-docs-classification.mjs` + linia din acest fișier; (3) fișier mutat
      în `docs/arhiva/PLAN_FAZA6_AUTOMATIZARE_2026-09-11.md`; (4) gardă rulată din nou →
      `{"scanate":15,"de_revizuit":0,"detalii":[]}`, exit 0. Jurnal complet:
      `docs/Plan_Finalizat.md` §Faza 6.
- [x] Cei trei auditori (verdicte: regresie FĂRĂ REGRESIE · dovezi 6 CONFIRMAT + 2 PARȚIAL (corectate) + 1 INFIRMAT-onest (rezolvat imediat după) · cerințe toate 4 completările onorate) + handoff +
      transfer Plan_Finalizat + memorie + commit/push + STOP — vezi `docs/Plan_Finalizat.md` §Faza 6
      pentru verdictele complete.

---

## ⏳ Datorii tehnice deschise (identificate 4.5c-4.5e; una rezolvată 2026-09-12, restul cu bună știință deschise)

- [x] 🟢 **Mistral OCR — retestare ONESTĂ a limitei „2 req/min" — REZOLVATĂ (2026-09-12):**
      12/12 cereri reale (2 chei × 6, spațiate 35s) → HTTP 200, zero 429. **Mistral OCR e VIU** —
      „429 persistent" (4.5c) era artefact al sondei burst, nu limitare reală. Fallback-ul din
      `api/lib/ocr_structured.py` rămâne neschimbat. Detaliu + dovadă:
      `docs/Plan_Finalizat.md` §„Mentenanță — retestare Mistral" (2026-09-12).
- 🟡 **Groq — risc de 429 pe auto-continuare în aceeași fereastră de 60s**: `maxTokens:6000`
  (4.5d/4.5e) e dovedit sub plafonul de 8000 TPM pt O SINGURĂ cerere (live, `total_tokens`
  ~2500-2800). Dar `continueGenerate`/`continueCorrect` pot declanșa un AL DOILEA apel Groq în
  același minut (auto-continuare pe răspuns trunchiat) → cele două cereri se cumulează pe
  aceeași fereastră → al doilea apel poate lovi din nou plafonul, chiar dacă fiecare cerere
  individuală respectă limita. Cunoscut, lăsat deliberat nerezolvat
  (`docs/arhiva/PLAN_FAZA4.5D_FREE_TIER_SIGURANTA_2026-09-11.md`, PUNCTUL 5).
- ⏸️ **OCR — capacitate opțiunea B, amânată conștient**: cablarea `GOOGLE_AI_API_KEY_
TRADUCERI_2` ca a doua cheie liberă în `ocr_structured.py` ar duce capacitatea de la ~520 la
  ~1040 pagini/zi. Marcată [RELEVANT, nu necesar] — 520/zi e deja confortabil pentru o singură
  utilizatoare. De reconsiderat doar la un motiv concret de volum mai mare.

---

## ⏸️ Amânat conștient (migrat din `PLAN_MASTER.md` §7/§8 la Faza 5, 2026-09-11)

Backlog confirmat de Roland (2026-08-07, „nu acum, fără cerere nouă") — nu redeschide fără
cerere explicită:

| Item                                                             | Stare azi                                         | Efort     |
| ---------------------------------------------------------------- | ------------------------------------------------- | --------- |
| Next 15 → 16                                                     | `next: ^15.5.20`                                  | mare      |
| Tailwind v3 → v4                                                 | `tailwindcss: ^3.4.0`                             | mediu     |
| Quota hard-cap + Upstash (rate-limit distribuit)                 | `rate_limiter.py` e in-memory per-instanță        | mediu     |
| PDF >20 pagini în loturi                                         | azi = plafonare la 20 cu mesaj onest, nu batching | mediu     |
| Export HTML interactiv multi-limbă                               | `data-i` = 0 hituri                               | mediu     |
| SW auto-versioning                                               | `sw.js` `CACHE_VERSION` încă manual               | mic       |
| Logging JSON structurat / bundle analyzer / dicționar math în UI | —                                                 | mic-mediu |

**Verificări umane (Roland), nu se automatizează** — nefăcute încă, cu bună știință:

- ⬜ V1 — Eyeball PDF + .docx real cu o formulă ȘI o figură redimensionată
- ⬜ V2 — Verificare de domeniu **Cristina**: corectitudinea matematică/notațională a formulelor
- ⬜ V3 — OCR real end-to-end din browser pe prod cu o poză de manual
- ⬜ V4 — PDF multi-pagină scanat (bucla per-pagină + plafon 20 + marcaj eșec onest per pagină)

---

## Riscuri deschise (genuine — cele rezolvate au migrat în `Plan_Finalizat.md`)

| Risc                                          | Stare                                                                                                                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Germana revenea în slovacă prin NLLB          | 🟡 reparat + 8 teste; nedovedibil live din exterior (DeepL servește `de` direct, nu ajunge la NLLB într-o cerere reală)                                                                                             |
| Mesaje neacționabile în modulele neatinse     | 🟡 mecanism gata, 9 locuri centrale reparate la Faza 2; acoperirea sistematică pe fiecare buton a trecut prin Faza 3 (inventar) + Faza 4 (audit live) — de reconfirmat dacă a mai rămas vreun gol la Faza 6         |
| Ceasul laptopului — serviciul W32Time e oprit | 🟢 ceasul CORECT (verificat 2026-09-12 vs 3 surse externe, identic la secundă) — nota veche „cu o zi înainte" era infirmată; rămâne doar risc mic de drift viitor (serviciul de sincronizare e oprit), fără urgență |
