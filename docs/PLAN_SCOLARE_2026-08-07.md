# PLAN — Modul „Școlare 🌐" (materiale curriculare RO, grădiniță→liceu)

> Versiune plan: 1.1 (revizie advisor: skeleton-first în F0, regulament separat de skeleton, bug 7-regulamente confirmat, plafon prompt verificat) · Data reală: **2026-08-07** (verificată `date`, nu dedusă din nume de fișier) · Efort țintă: xhigh
> Cerința C din coada §6b (`docs/PLAN_MASTER.md`). Sursă de context: sesiunea de design Carla (`docs/Export_chat_sesiune_Carla.md` — **local, UNTRACKED, nu în git**) + scope memory `project-scolare-curriculum-scope` + folderul-sursă Carla (`G:\My Drive\Roly\4. Artificial Inteligence\Folder_Lucru\Carla\` — de asemenea local/gitignored).
> **R-PLAN: NU se scrie cod până Roland confirmă acest plan** (măcar pilotul F0). Acest fișier = checklist bifabil + reguli de siguranță + jurnal de execuție.

---

## 1. Context (de ce) — ce ESTE modulul

Roland are un sistem propriu „Carla" (folder pe Google Drive) care generează **fișe educaționale A4** pentru tot ciclul școlar românesc (grădiniță→liceu), condus de AI din reguli scrise de el (`regulament.md` + `Curricula/config_*.json` per clasă). Azi generarea se face manual, prin bucla Claude Code (VSCode → terminal → onboard → cerere → așteptare) — lent, nu merge de pe telefon.

**Obiectiv C:** un modul „Școlare 🌐" în aplicația Traduceri_Matematica (PWA deja pe telefonul lui Roland), unde: alegi **ciclu → clasă → materie → dificultate** → butonul cheamă AI-ul cu regulamentul clasei → întoarce o fișă A4 print-ready, cu strat de verificare + marcaj „verifică înainte de tipărire". Non-repetare via istoric. Online, câteva secunde (diferit de Planșe, care e instant/offline).

**Utilizatori:** Cristina (profesoară mate, clasele V-XII) + copiii lui Roland (grădiniță→primar). Cerință fermă a lui Roland: **acoperire 100%** a claselor/materiilor — pilotul e la alegerea sesiunii, ținta finală nu se negociază.

---

## 2. Reframe cheie — SKELETON (mărginit, 100% verificabil) vs CONȚINUT (nemărginit, AI)

„100%" e o promisiune verificabilă DOAR pe o parte a sistemului. Le separăm explicit:

|            | **Skeleton (structura curriculară)**                                                                   | **Conținut (fișele)**                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Ce e       | ciclu → clasă → materie/domeniu → capitole/competențe                                                  | exerciții/fișe A4 generate per selecție                                   |
| Sursă      | programa oficială (rocnee.eu) + `config_*.json` Roland                                                 | AI (lanț Gemini/Groq/…), din `regulament.md` clasei                       |
| Mărginit?  | **DA** — finit, enumerabil, stabil (primar/gimnaziu)                                                   | **NU** — spațiu practic infinit (seed/variație)                           |
| „100%" =   | **toate clasele + materiile prezente ca noduri selectabile** ← livrabil bifabil                        | fără sens (nu poți genera „toate fișele")                                 |
| Verificare | **verificator de completitudine INDEPENDENT** (nr materii/clasă vs config, scris separat de extractor) | strat de corectitudine (re-evaluare numerică la mate) + marcaj „verifică" |

Deci „acoperire 100%" = **skeleton-ul acoperă toate cele 16 nivele × toate materiile lor** (bifabil, verificabil independent), iar conținutul se generează la cerere pe orice nod. Această separare dizolvă ambiguitatea „ce e modulul": e un **arbore de selecție curricular + generator AI la cerere pe fiecare nod**.

---

## 3. Decizii blocate

Din sesiunea de design Carla (D8) + AskUserQuestion 2026-08-07 (acest onboard) + decizii tehnice delegate lui Claude („decide tu"):

| #      | Decizie                          | Valoare                                                                                                                                                                                                                                                                                                                                                               | Sursă                             |
| ------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| D1     | Ce generează                     | AI la cerere (online/serverless), NU cod determinist                                                                                                                                                                                                                                                                                                                  | Carla D8 (Opțiunea 1)             |
| D2     | **Unitate fișă**                 | **O materie odată** (clasă+materie → fișă pe acea materie)                                                                                                                                                                                                                                                                                                            | AskUserQuestion 2026-08-07        |
| D3     | **Pilot**                        | **Gimnaziu Clasa 5 — Matematică** (stabil, domeniul Cristinei, reutilizare Teste)                                                                                                                                                                                                                                                                                     | AskUserQuestion 2026-08-07        |
| D4     | **Liceu**                        | **Include în skeleton; conținut marcat „programă în reformă 2026-2027, verifică"**                                                                                                                                                                                                                                                                                    | AskUserQuestion 2026-08-07        |
| D5     | Sursă conținut                   | `regulament.md` PROPRIU al lui Roland (Carla) = primar; programa oficială rocnee.eu = referință de aliniere. **Manualele MEN = NICIODATĂ stocate/redistribuite.**                                                                                                                                                                                                     | scope memory (copyright rezolvat) |
| D6     | Anti-repetare                    | istoric în cod (semnătură per fișă → re-roll la coliziune), ca P4 Planșe                                                                                                                                                                                                                                                                                              | Carla + P4 `history.js`           |
| D7     | Corectitudine                    | fișele AI NU au garanția planșelor → strat de verificare (re-eval numerică la mate) + marcaj vizibil „verifică înainte de tipărire"                                                                                                                                                                                                                                   | Carla §11                         |
| **D8** | **Gazdă/formă (decizie Claude)** | **Modul NATIV React „Școlare 🌐" separat** (tab `kind:"react"`, ca Teste/Calculator), NU sub-tab Planșe, NU iframe. **De ce:** AI/online e fundamental diferit de Planșe (instant/offline); reutilizează `sendChat`+`/api/proxy`+randare math+„trimite în editor" — nu re-implementez pipeline-ul în vanilla JS. **Roland poate suprascrie la confirmarea planului.** | delegare „decide tu"              |
| D9     | Generare AI                      | reutilizează `/api/proxy` (lanț provideri + rate-limit + cost-cap + origin-allowlist deja construit), prompt construit client-side din skeleton+regulament (ca `test-generator.ts`)                                                                                                                                                                                   | audit cod curent                  |

---

## 4. Arhitectură & schema de date

### 4.1 Modul nativ React (D8)

- Tab nou în `config/tabs.json` **ȘI** `frontend/config/tabs.json` (identice — ambele, sincron): `{ "id": "scolare", "label": "Școlare", "icon": "🌐", "kind": "react" }`.
- Wiring în `frontend/src/app/page.tsx` (ca Teste/Calculator): import dinamic `ScolarePanel` + `<div style={{display: activeTab==="scolare" ? ...}}>`. (Array-ul de validare localStorage din page.tsx e acum bazat pe registrul viu `TABS`, deci nu mai cere editare hardcodată — de verificat la F0.)
- Componentă: `frontend/src/components/scolare/ScolarePanel.tsx` + helpers `frontend/src/lib/scolare/`.
- Temă: clase `chalk-*` (tablă verde + cretă, Patrick Hand) — R-THEME.

### 4.2 Skeleton curricular — schemă DUAL-SHAPE (advisor: acoperă „materii" ȘI „domenii" din prima)

Grădinița NU are materii, are **domenii de dezvoltare** (coduri DLC/DS/DEC/DOS). Schema trebuie să poarte ambele forme de la început, altfel se rescrie:

```
frontend/src/lib/scolare/curriculum/
  index.ts                 # tipuri + loader + verificator de completitudine
  gradinita.json           # { nivel, tip:"domenii", noduri:[{cod:"DLC", nume:"Comunicare", regulament_ref:"..."}] }
  primar.json              # { nivel, tip:"materii", noduri:[{nume:"Matematica", regulament_ref:"..."}] }  (Clasa 0-4)
  gimnaziu.json            # (Clasa 5-8)
  liceu.json               # (Clasa 9-12) — flag "in_reforma": true pe conținut
public/scolare/regulamente/        # textul de reguli, ASSET SEPARAT (se încarcă per clasă la generare)
  gimnaziu_clasa5_matematica.md    # ... etc. per (clasă × materie)
```

**Skeleton subțire vs regulament separat (advisor):** JSON-ul de skeleton ține DOAR structura (noduri + `regulament_ref` = pointer), NU textul regulilor inline. Motiv: (a) 16 fișiere de regulament inline ar umfla ce trebuie să rămână un arbore de selecție subțire; (b) regulamentele se schimbă pe altă cadență decât skeleton-ul (bug-ul „7 regulamente" e un bug de regulament, NU de skeleton); (c) verificatorul de completitudine rămâne onest — verifică STRUCTURA, nu proza. Fiecare fișier de skeleton: `sursa_url` + `data_extragere` (trasabilitate; programa e publică/oficială).

### 4.3 Fluxul de generare (per REGULAMENT_GENERARE.md, adaptat la app)

1. UI: selectezi ciclu → clasă → materie → dificultate (Ușor/Standard/Avansat) + rubrică opțională „Cerință specifică" (text liber — cerută explicit de regulament, se aplică la toate).
2. Citește istoricul (localStorage) pt clasa+materia aleasă → extrage conceptele deja folosite.
3. Construiește promptul client-side: `regulament.md` clasei (concepte permise, interdicții, exemple) + „evită conceptele: [listă din istoric]" + dificultate + cerință specifică + reguli de format A4/print.
4. `sendChat` → `/api/proxy` → AI → HTML A4 (`.page-a4`, `page-break-after`, print color-adjust — CSS din regulament).
5. Strat de verificare (D7): la Matematică, re-evaluează numeric rezultatele detectabile; marchează „⚠ verifică înainte de tipărire".
6. Preview + Print/PDF + „➕ În editor" (reutilizează `insertEditorText`/print existent). Salvează semnătura în istoric (anti-repetare).

**Plafon prompt verificat (D9, 2026-08-07):** `/api/proxy` are `MAX_TOKENS_CAP=8192` pe OUTPUT (`max_tokens`), nu pe input. Regulamentul Clasei 5 întreg = 6468 chars (~1900 tokens); pt unitatea „o materie" (D2) trimit doar secțiunea materiei = și mai mic. Deci asamblarea prompt-ului client-side + lista de evitat + regulile de format încap lejer, iar 8192 tokeni de output ajung pentru o fișă A4. Asamblarea client-side (ca `test-generator.ts`) e confirmată viabilă.

---

## 5. Cele două piese de infrastructură (advisor — de numit explicit)

- **Extracție skeleton — TOATE cele 16 nivele deodată, în F0 (advisor):** cele 4 `config_*.json` (grădiniță/primar/gimnaziu/liceu) sunt mici, deja locale, deja ale lui Roland → extrag ÎNTREG skeleton-ul (16 nivele × materiile/domeniile lor) în cele 4 JSON-uri versionate de la §4.2, cu `sursa_url`+`data_extragere`. **Aici trăiește „acoperirea 100%"**, și e ieftin — nu îl amân în F2-F5. (Textul de regulament se importă per (clasă×materie) când e nevoie, ca asset separat — vezi §4.2.)
- **Verificator de completitudine INDEPENDENT, rulat peste TOT skeleton-ul:** funcție scrisă SEPARAT de extractor (cultura proiectului: numere.js solver, round-trip HTML, bug plantat) care numără materiile/domeniile/clasă din skeleton și le compară cu config-ul-sursă, pe toate 16 nivelele → „100% skeleton" devine un GATE verde, nu o afirmație. Test cu un nod șters intenționat → FAIL (dovada că are dinți).

---

## 6. F0 — DOUĂ livrabile: skeleton 100% (acoperire) + pilot de conținut (pipeline)

F0 conține **ambele jumătăți din §2**, ca să nu amân acoperirea (advisor): (A) skeleton-ul COMPLET al tuturor celor 16 nivele = livrabilul de „100%"; (B) un pilot de conținut cap-coadă pe cel mai curat nod (Clasa 5 Matematică) = dovada pipeline-ului. Sunt independente și ambele intră într-o sesiune.

### 6A — Skeleton 100% (acoperirea, mărginit & verificabil)

- [x] Extras din cele 4 `config_*.json` → `curriculum/{gradinita,primar,gimnaziu,liceu}.ts` (16 nivele × materii/domenii, 112 noduri), schemă dual-shape (materii / domenii-cod), cu `sursa_url`+`data_extragere`.
- [x] Verificator de completitudine INDEPENDENT (`verifier.ts`, oracol verbatim) rulat peste TOATE 16 nivelele → verde (112 noduri). Test negativ (nod șters/typo/nivel șters) → FAIL.
- [x] Liceu cu flag `in_reforma:true` pe ciclu + noduri (marcaj UI „programă în tranziție 2026-2027" — verificat LIVE).

### 6B — Pilot de conținut: Gimnaziu Clasa 5, Matematică (cap-coadă)

Cel mai curat caz (programă stabilă 2017, reutilizare Teste/math). Concepte permise (din regulament): puteri (exponent natural), fracții ordinare/zecimale, unități de măsură, geometrie inițiere (unghiuri/triunghi), perimetru/arie. Text-only + CSS shapes pt geometrie, 3-5 exerciții/pagină A4.

- [x] Tab „Școlare 🌐" apare (tabs.json ×2 + wiring page.tsx), restul intact. **Verificat LIVE.**
- [x] Import regulament Clasa 5 Matematică ca asset separat (`public/scolare/regulamente/`).
- [x] `ScolarePanel.tsx`: selectoare ciclu/clasă/materie/dificultate (populate din skeleton) + „Cerință specifică" + buton Generează. **+ banner „nod ne-ghidat" (advisor).**
- [x] Generare Matematică Clasa 5 prin `/api/proxy` → fișă A4 randată. **Verificat LIVE (Gemini Flash, KaTeX).**
- [x] Strat de verificare numerică (mate) + marcaj „⚠ verifică înainte de tipărire". **Bug fals-pozitiv prins la probă → corectat.**
- [~] Anti-repetare: dedup semnătură exactă + avoid-list + re-roll. **Onest: re-roll = plasă (dublură byte-identică ~imposibilă la temp 0.3); avoid-list netestat izolat live.**
- [x] Print/PDF + „➕ În editor". **Butoane prezente; print-area izolată verificată structural; print-to-hârtie = eyeball Roland pe telefon.**

### Gate F0

- [x] `tsc 0 · jest 205/205 (+24) · next build OK`. **Dovadă LIVE:** Chrome pe dev :3341 (după curățare SW stale) + 2 fișe reale prin `/api/proxy` PROD (script Node). **Runda advisor pe F0: 3 fix-uri (banner ne-ghidat, verify-fisa graniță, guard defensiv).**

---

## 7. Fazare spre 100% (realist: multi-sesiune / multi-lună)

**Skeleton-ul (acoperirea 100%) e livrat integral în F0** (6A). Fazele următoare adaugă doar CONȚINUT — regulamentele proprii + generarea per (clasă×materie/domeniu). „100% conținut" nu există (spațiu infinit); ce se extinde e acoperirea de regulamente + validarea generării.

| Fază   | Conținut (după skeleton-ul 100% din F0)                                                                                                               | Mărime                 |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **F0** | Skeleton 100% (16 nivele) + pilot conținut Clasa 5 Matematică cap-coadă                                                                               | M (1 sesiune)          |
| **F1** | ✅ **LIVRAT (2026-08-08)** — Gimnaziu Matematică, regulamente proprii Clasa 6/7/8 + generare validată                                                 | M                      |
| **F3** | ✅✅ **LIVRAT + DEPLOYAT v47 (2026-08-08)** — Primar Cl.0-4, 21 regulamente proprii + verificare la sursă + LIVE 6/21 + verificat end-to-end pe alias | M-L                    |
| **F4** | 🎯 **URMĂTORUL** — Grădiniță, TOATE domeniile (DLC/DS/DEC/DOS + Cunoașterea Mediului), 12 noduri; schema dual-shape „domeniu"                         | M                      |
| F2     | Gimnaziu toate materiile non-mate — ⏸️ **AMÂNAT** (Roland 2026-08-08: gimnaziu = doar Mate acum)                                                      | L                      |
| F5     | Liceu (Clasa 9-12) non-mate + mate — ⏸️ **AMÂNAT** (Roland 2026-08-08: liceu = doar Mate acum; reformă activă)                                        | L (incert pe aliniere) |
| F6     | Șlefuire: coș multi-fișă (opțional), rezervor pre-generat pt clasele des-folosite (instant/offline)                                                   | S-M                    |

> **🔮 SCOPE REVIZUIT (Roland, 2026-08-08, după F3 deployat) — vezi PLAN_DECISIONS D52:** acoperire cu TOATE materiile/domeniile DOAR pt **Grădiniță + Primar 0-4**. Primar 0-4 = **DEJA FĂCUT (F3)**. Gimnaziu + Liceu = **doar Matematică deocamdată** (F1 gimnaziu mate gata). → **Următorul = F4 (Grădiniță).**
>
> **VIITOR, la cererea explicită a lui Roland — GATA DE EXECUTAT DIRECT:** extindere **Cl.5-12 cu TOATE materiile non-mate** (Limba Română, Istorie, Geografie, Biologie, Fizică, Chimie, Engleză, Ed. Tehnologică, Informatică+TIC, Ed. Socială la gimnaziu; + materiile de liceu). **Skeleton-ul le are DEJA ca noduri** (verificator verde pe toate 16 nivele) — lipsește DOAR conținutul: regulamente proprii per (clasă×materie), sursate Carla-Cl.5 (are secțiuni per-materie) + programa oficială pt Cl.6-12 (ca F1). Model dovedit: F3. Când Roland cere „extinde gimnaziu/liceu" → se aplică exact tiparul F3 (subagenți verificare la sursă → regulamente aliniate → wire → gate → LIVE → deploy).

**Onest (advisor point 4):** acoperirea de CONȚINUT (regulamente proprii + generare validată pe toate materiile × 16 nivele) e **multi-sesiune/multi-lună** — nu o promit într-o sesiune. Dar „100% skeleton" (arborele complet de selecție, verificat) e livrat în F0. F0 dă prima valoare reală + dovedește mașinăria; restul e repetiție a aceluiași tipar.

---

## 8. Pre-condiții & bug-uri cunoscute (de verificat, NU presupus)

- **Bug „7 regulamente" — VERIFICAT 2026-08-07, CONFIRMAT (mai grav decât raporta exportul):** cele 7 fișiere (Gimnaziu Clasa_6/7/8 + Liceu Clasa_9/10/11/12) sunt **copii byte-identice ale regulamentului Clasei 5** (titlu literal „# REGULAMENT — Clasa 5", aceeași descriere „debutul ciclului gimnazial, 11-12 ani"). Deci gimnaziu 6-8 + TOT liceul NU au încă reguli proprii — au regulile Clasei 5. **Consecință pt plan:** F0 (Clasa 5) e neafectat (regulamentul lui e corect). F1+ NU pot genera conținut corect pt aceste clase până nu există regulament propriu → F1/F2/F5 includ SCRIEREA regulamentelor proprii (conținut nou, aliniat la programa oficială pe clasă — modelul `project_curriculum_audit_2026_07_28`), în Carla (sursa) SAU direct ca asset în app. Decizie de sursare la F1.
- **Liceu în reformă (verificat LIVE 2026-08-07):** 175 programe noi „în transparență", intră eșalonat (clasa IX din 2026-2027). Re-verifică rocnee.eu la F5. Nu presupune stabilitate.

---

## 9. Reguli de siguranță (R-PLAN)

- **R-COPYRIGHT:** conținut = `regulament.md` PROPRIU Roland (autor privat = el, sigur) + programa oficială rocnee.eu (document public). Manualele MEN = referință de citit, **NICIODATĂ** stocate/redistribuite/committed. PDF-uri complete ca referință dev = doar local gitignored, niciodată committed.
- **R-COST:** tot pe free tier (lanțul AI `/api/proxy` deja gratuit).
- **R-THEME:** tablă verde + cretă + Patrick Hand.
- **R-EXT:** modul separat; NU atinge pipeline-ul de Traduceri.
- **R-DEPLOY:** deploy grupat, DOAR cu confirmarea explicită a lui Roland.
- **Corectitudine AI (D7):** fișele AI nu au garanția planșelor deterministe → strat verificare + marcaj „verifică înainte de tipărire" OBLIGATORIU pe fiecare fișă.
- **Gate:** `tsc 0 · jest · next build OK` după fiecare fază; verificatorul de completitudine = gate pt „100%".

---

## 10. La confirmarea planului

**Decis de mine (mi-ai delegat „decide tu" de 2 ori — le poți suprascrie, altfel merg pe ele):**

- **D8 (gazdă):** modul nativ React separat „Școlare 🌐" (argumentat din precedentul Teste/Chat: AI/online, reutilizează `sendChat`/`/api/proxy`/randare math/„în editor").
- **Rubrica „Cerință specifică"** (text liber per fișă) inclusă în F0 — o cere regulamentul Carla.

**Singura întrebare care e a ta:**

1. **F0 acum sau sesiune nouă?** Pilotul (6A skeleton + 6B conținut) e o sesiune de sine stătătoare. Pot începe F0 imediat după ce confirmi planul, SAU îl las ca prim pas al sesiunii următoare (cu prompt de reluare pregătit).

---

## 11. Jurnal de execuție

| Data       | Fază          | Status      | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-08 | **F3 LIVRAT** | ✅✅        | Primar Cl.0-4 — 21 regulamente proprii `public/scolare/regulamente/primar_*.md` (toate materiile) + `regulament_ref`+`capitole` pe cele 21 noduri. Sursare D5 (Carla) ALINIATĂ la programa oficială, verificată la SURSĂ cu 7 subagenți paraleli (OMEN 3418/2013 + 5003/2014); Carla=generat Gemini, neverificat → corecții baked (MEM CP 0-31; Științe fără sisteme corp uman; LR fără numeral; Istorie tematică fără ani; Ed.Civică simboluri la Cl.4). 4 capcane advisor (plafon 4000→8000 = bug LIVE real pe gimnaziu clasa6/7; refToFile partajat; gate `regulament-files.test.ts`; banner derivat `describeGroundedCoverage`). 2 bug-uri LIVE fixate (verify-fisa fals-pozitiv `\div`; runaway underscore → `sanitize.ts`). **Gate `tsc 0 · jest 242/242 · build OK`.** Validat LIVE pe prod 6/21 noduri (0 scurgeri, 0 fals-poz, 0 ziduri). Reziduuri oneste: LIVE 6/21; LR Cl.4 barem poate fi trunchiat (MAX_TOKENS); D7 aproape inert pe primar (binRe nu prinde `\times`/`\div`) = item audit. Commit `60236fa`. NEDEPLOYAT.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-08-08 | **F1 LIVRAT** | ✅✅        | Regulamente proprii scrise pentru Clasa 6/7/8 Matematică (bug „7 regulamente" rezolvat pt aceste 3 clase), sursate din PDF-ul oficial OMEN 3393/2017 descărcat direct de la `ise.ro` (`sursa_url` din skeleton) — pdftotext pt localizarea capitolelor per clasă + citire imagine (Read tool) pt extragere cu diacritice corecte (pdftotext pierde ț/ș/ă/â/î pe acest PDF). 3 fișiere noi `public/scolare/regulamente/gimnaziu_clasa{6,7,8}_matematica.md` (model identic Clasa 5: domenii permise, tipuri exerciții, exemple, interdicții, densitate) + `regulament_ref`+`capitole` adăugate pe nodurile `matematica` din `curriculum/gimnaziu.ts`. **Verificat LIVE** (dev local, chei reale, generare REALĂ Gemini Flash pt toate 3 clase): Clasa 6 (mulțimi/divizibilitate, rapoarte, întregi/raționale, unghiuri, Pitagora), Clasa 7 (radicali, sisteme ecuații, trapez, Thales, trigonometrie), Clasa 8 (inecuații, factor comun/formule prescurtate, ecuație gradul II, statistică, geometrie în spațiu) — toate aliniate exact capitolelor din regulament. **Bug real prins la proba LIVE și corectat:** `verify-fisa.ts` avea fals-pozitiv pe lanțuri de puteri cu „⋅" (U+22C5 DOT OPERATOR, glifa reală folosită de Gemini pt `\cdot`) — `CHAIN` includea doar „·" (U+00B7 MIDDLE DOT), deci un lanț ca `2^1⋅3^1⋅5^1=2⋅3⋅5=30` era tăiat greșit și `5^1=2` semnalat ca eroare. Fix 1 caracter + test de regresie cu string-ul EXACT din răspunsul AI real. **Gate: `tsc 0 · jest 206/206 (+1) · next build OK`.** NEDEPLOYAT (deploy grupat cu confirmarea Roland, ca la F0). |
| 2026-08-07 | Plan v1.0     | ✅ scris    | Research LIVE reformă + explorare folder Carla + AskUserQuestion (3 decizii) + advisor.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-08-07 | Plan v1.1     | ✅ revizuit | Advisor: skeleton-first (16 nivele) în F0 = acoperirea 100%; regulament = asset separat de skeleton; bug „7 regulamente" VERIFICAT+confirmat (copii Clasa 5); plafon prompt `/api/proxy` verificat (8192 output, input OK).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-08-07 | **F0 LIVRAT** | ✅✅        | **6A Skeleton 100%** (16 nivele/112 noduri, `frontend/src/lib/scolare/curriculum/*.ts`) + verificator INDEPENDENT (`verifier.ts`, controale negative). **6B Pilot** Clasa 5 Matematică: `ScolarePanel.tsx` (tab `scolare 🌐`, wiring page.tsx + tabs.json×2), prompt din regulament+programa oficială (`prompt.ts`), anti-repetare re-roll (`history.ts`), verificare aritmetică (`verify-fisa.ts`). **Grounding pe programa oficială aprobată** OMEN 3393/2017 (nu manuale — R-COPYRIGHT). **Gate: tsc 0 · jest 205/205 (+24) · build OK.** **Dovadă LIVE** (2 fișe reale prin `/api/proxy` PROD, aliniate curricular, verificare 0 fals-pozitive — bug de graniță prins la probă și corectat+testat). **NEDEPLOYAT.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
