# PLAN — Faza 5: Unificarea documentației în două fișiere vii

> Creat: 2026-09-11. Respectă R-PLAN (task cu >5 sub-operații, risc HIGH — mută fișiere,
> atinge documentele de care depinde lanțul de handoff). **NU se mișcă niciun fișier până
> Roland nu confirmă lista exactă din acest document.** Sursă cerințe: `docs/Fazele.md`
> §FAZA 5 + `99_Roland_Work/Fazele_mentiuni_Roland.md` (5a/5b/5c + mențiunea generală) +
> mesajul lui Roland din 2026-09-11 care a deschis explicit faza asta (unele fraze din
> acel mesaj au ajuns trunchiate la transmitere — punctele afectate sunt reconstruite aici
> din sursele primare de mai sus, nu din paranteza ghicită).

---

## 0. Ce e deja DECIS (nu se mai discută)

Din `99_Roland_Work/Fazele_mentiuni_Roland.md`, verbatim:

- **5a — documente vechi:** se mută în `docs/arhiva/` (NU se șterg — git ține istoricul, dar
  Roland vrea să le poată răsfoi).
- **5b — detaliu istoric în `Plan_Finalizat.md`:** rezumat per fază/sesiune, cu linkuri la
  commit-uri (nu fiecare commit în detaliu, nu doar titluri de faze).
- **5c — ordonare:** cronologic, cu index pe module la început.
- **`docs/completari_pt_reparatie.md` NU se atinge.**
- **`docs/Plan_in_Lucru.md` rămâne** fișierul activ; când o fază se închide, itemii ei bifați
  se transferă în `Plan_Finalizat.md`.

Ce trebuie să iasă concret (confirmat de Roland în mesajul care a deschis faza):

- `docs/Plan_Finalizat.md` — **NOU**. Tot istoricul implementărilor, de la prima execuție la
  ultima, cu dovadă (commit, deploy, verificare). Fișier viu, actualizat după fiecare sesiune.
- `docs/arhiva/` — **NOU**. Documentele vechi mutate aici, nerescrise.
- `docs/Plan_in_Lucru.md` — neschimbat ca fișier, dar golit de itemii deja închiși (aceia
  migrează în `Plan_Finalizat.md`) + primește cei 3 itemi tehnici de la §3 mai jos.

---

## 1. Ce ai TU de decis ACUM (recomandarea mea pe fiecare, dar decizia e a ta)

### 1.1 — Linia F5 / F6 (cerută explicit de tine, nu decid singur) — ✅ CONFIRMAT: F5 = structură, F6 = automatizare

Mențiunea ta la Faza 5 cuprinde trei lucruri diferite:

1. regula ca cele 34 de fișiere să nu se mai adune la loc (curățenie automată),
2. documentația pentru un „mediu nativ Claude Code",
3. `/onboard` să deschidă `AskUserQuestion` când apar modificări în proiect.

`docs/Fazele.md` are deja o Fază 6 („Automatizarea procesului") cu temă IDENTICĂ — reguli
care se auto-încarcă, ca să nu depindă de memoria unei sesiuni. Punctele 1-3 de mai sus sunt
automatizare de proces, nu structură de fișiere.

**Recomandarea mea:** F5 livrează STRUCTURA (arhivă + `Plan_Finalizat.md` + `Plan_in_Lucru.md`
curățat + referințele din `CLAUDE.md` actualizate ca să nu mintă din prima zi despre unde e
sursa de adevăr). F6 livrează AUTOMATIZAREA pe structura deja existentă: regula de curățenie
(ex. verificare la `/onboard` — „docs/ are N fișiere necategorizate, vrei arhivare?"),
documentația de mediu nativ, și trigger-ul `/onboard` → `AskUserQuestion` la modificări.
Motiv: a scrie reguli de întreținere pentru o structură care încă nu există în forma finală
înseamnă reguli scrise pe nisip — exact eroarea pe care o repari acum (documentație
neconfruntată cu realitatea).

**Alternativă:** dacă vrei totul într-o singură fază (F5 absoarbe și automatizarea), pot muta
punctele 1-3 aici — dar atunci F6 rămâne doar cu (b)/(c)/(d) din descrierea ei originală
(citirea automată la start, dovada live obligatorie, verificarea de erori pe toate nivelele),
care nu se leagă de documentație.

→ **CONFIRMAT de Roland (2026-09-11): F5 livrează structura; punctele 1-3 (curățenie
automată, documentația de mediu nativ Claude Code, trigger `/onboard`→`AskUserQuestion`)
migrează în Faza 6.**

### 1.2 — Soarta `docs/PLAN_MASTER.md` — ✅ CONFIRMAT: absorbție + arhivare

E numit „SURSA UNICĂ DE ADEVĂR" în `CLAUDE.md` — dar propriul lui §CURENT e un snapshot
îngheţat din 2026-08-09 (mai vechi decât Fazele 3, 4, 4.5a-e, care nu apar deloc în el).
Dacă rămâne un al treilea fișier viu, contrazice exact scopul Fazei 5 („două fișiere, nu
optsprezece").

**Recomandarea mea:** absorbție + arhivare. Concret:

- §1 (R1-R8, cerințele Roland 2026-07-30) — toate par livrate (§CURENT: „nimic nedeployat
  acum") → intră în `Plan_Finalizat.md` ca fază istorică „Runda R1-R8 (2026-07-30→08-10)".
- §7 (backlog amânat conștient: Next.js 16, Tailwind v4, AI Gateway, prompt PWA, persistență)
  → migrează în `Plan_in_Lucru.md`, secțiune nouă „⏸️ amânat conștient" (starea există deja
  în legenda fișierului, nefolosită încă).
- §9 (decizii moștenite încă valabile) → migrează fie în `CLAUDE.md` (dacă sunt convenții
  permanente), fie ca notă în indexul `Plan_Finalizat.md`.
- Restul (§0, §2-§6, §8, §10-§11) → istoric pur, rezumat scurt în `Plan_Finalizat.md`,
  fișierul original arhivat.
- `CLAUDE.md` (secțiunea „Status" + „PRIMA ACTIUNE") — actualizat să citeze
  `Plan_in_Lucru.md` + `Plan_Finalizat.md` ca sursă unică, nu mai `PLAN_MASTER.md`.

**Alternativă:** păstrezi `PLAN_MASTER.md` ca document SEPARAT de „cerințe/scop" (diferit de
„istoric de implementare"), nu-l arhivezi — dar atunci nu mai sunt „două fișiere vii", sunt
trei, și trebuie explicat clar de ce al treilea nu e redundant.

→ **CONFIRMAT de Roland (2026-09-11): absorbție + arhivare, mecanismul de mai sus.**

### 1.3 — Când se curăță `docs/HANDOFF_SESIUNE.md` — ✅ CONFIRMAT: acum, ca ultim pas al F5

E fișierul EXACT pe care l-ai numit „documentul de care depinde procesul" — dacă sesiunea
pică la mijlocul fazei, următoarea trebuie să poată relua din el. Azi conține, pe lângă
blocul curent „REIA DE AICI", tot istoricul detaliat al fazelor 4.5c/4.5d/4.5e (>150 linii) —
exact genul de conținut care ar trebui să migreze în `Plan_Finalizat.md`.

**Recomandarea mea:** DA, se curăță ACUM, dar ULTIMUL pas al fazei (după ce
`Plan_Finalizat.md` există și conține deja rezumatele), cu procedura de siguranță: scriu
noul HANDOFF (doar blocul „REIA DE AICI" curent + linkuri către `Plan_Finalizat.md` pt
istoric), ți-l arăt înainte de commit, și SEPARAT de asta, dacă sesiunea asta pică la mijloc,
versiunea veche (necurățată) rămâne validă în git — nu se pierde nimic. Motiv să fac asta
acum: dacă las HANDOFF-ul „pentru mai târziu", el redevine exact fișierul care minte prin
volum (18 fișiere → 1 fișier gigantic), problema mutată, nu rezolvată.

**Alternativă:** las HANDOFF_SESIUNE.md exact cum e acum (doar adaug blocul nou de
închidere a Fazei 5) și tratez curățarea lui ca primul item din F6.

→ **CONFIRMAT de Roland (2026-09-11): curăț acum, ULTIMUL pas al fazei, cu diff arătat
înainte de commit.**

---

## 2. Listă EXACTĂ de fișiere — propunere, NU execuție

Legendă acțiune: **ACTIV** = rămâne pe loc, neschimbat · **ARHIVEAZĂ** = mutat verbatim în
`docs/arhiva/`, cu un rezumat nou scris în `Plan_Finalizat.md` · **NEATINS** = nu face parte
din problema asta (folder de date/active, nu documentație de fază) · **FLAG** = incertitudine
reală, nu decid eu.

| #   | Fișier/folder                                         | Acțiune propusă            | Notă                                                                                                                                                |
| --- | ----------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `AI_PROVIDERS_FREE_INVENTORY.md`                      | ACTIV                      | inventar viu, actualizabil                                                                                                                          |
| 2   | `AUDIT_COMPLET_2026-08-08.md`                         | ARHIVEAZĂ                  | propriul header spune deja „doc istoric"                                                                                                            |
| 3   | `caiet_de_sarcini.md` + `.html` + `caiet_de_sarcini/` | ACTIV                      | generat, viu (Faza 3), NU e problema asta                                                                                                           |
| 4   | `CHANGELOG.md`                                        | ACTIV                      | reper versiuni (v-based), altă axă decât fazele — **FLAG**: vrei să rămână separat de `Plan_Finalizat.md` sau să-l absorb?                          |
| 5   | `COMENZI_SLASH.md`                                    | ACTIV                      | ghid referință                                                                                                                                      |
| 6   | `completari_pt_reparatie.md`                          | **NU SE ATINGE**           | ordinul tău explicit                                                                                                                                |
| 7   | `DEPLOY_VERCEL.md`                                    | ACTIV                      | ghid referință — cel mai vechi (2026-07-mig.), merită un spot-check de acuratețe, dar NU în faza asta                                               |
| 8   | `dovada_faza1_*.jpg` ×3 (rădăcină)                    | mutare în `docs/dovezi/`   | doar consistență de loc, prioritate joasă, opțional                                                                                                 |
| 9   | `docs/dovezi/` (9 poze)                               | NEATINS                    | dovezi active, citate din rezumate                                                                                                                  |
| 10  | `Erata_dovezi_2026-09-08.md`                          | ARHIVEAZĂ                  | conținutul „lecția" intră ca notă la Faza 1/2 în `Plan_Finalizat.md`                                                                                |
| 11  | `Export_chat_sesiune_Carla.md`                        | **FLAG**                   | pare NELEGAT de acest proiect (menționează alt subiect/persoană) — nu presupun; arhivez implicit dacă nu spui altceva, dar confirmă                 |
| 12  | `FAZA1_ACOPERIRE.md`                                  | ARHIVEAZĂ                  | rezumat în `Plan_Finalizat.md`                                                                                                                      |
| 13  | `Fazele.html`                                         | ACTIV                      | document de lucru al tău, editat direct — rămâne până se închide F6                                                                                 |
| 14  | `Fazele.md`                                           | ACTIV                      | programul curent, ÎN EXECUȚIE — rămâne până se închide F6                                                                                           |
| 15  | `GHID_FEEDBACK_LOOP.md`                               | ACTIV                      | ghid referință                                                                                                                                      |
| 16  | `GHID_VERIFICARE_EDITOR_F6.md`                        | ARHIVEAZĂ                  | **coliziune de nume**: „F6" aici e un milestone vechi al Editorului (2026-07-25), NELEGAT de „Faza 6" curentă — risc de confuzie, semnalat explicit |
| 17  | `HANDOFF_SESIUNE.md`                                  | ACTIV, dar vezi §1.3       | decizia ta pe timing                                                                                                                                |
| 18  | `docs/manuale/` (2 fișiere)                           | NEATINS                    | date curriculum, altă temă                                                                                                                          |
| 19  | `OCR_COMPARATIE_2026-07-31.md`                        | ARHIVEAZĂ                  | rezumat                                                                                                                                             |
| 20  | `OPTIUNI_API_AI_2026-09-10.html`                      | **FLAG**                   | recent (ieri) — pare analiză de decizie punctuală, nu inventar viu; arhivez dacă confirmi, altfel rămâne ACTIV                                      |
| 21  | `PLAN_FAZA3_CAIET_SARCINI_2026-09-09.md`              | ARHIVEAZĂ                  | Faza 3 ÎNCHISĂ                                                                                                                                      |
| 22  | `PLAN_FAZA4.5A_REPARATII_2026-09-10.md`               | ARHIVEAZĂ                  | 4.5a ÎNCHISĂ                                                                                                                                        |
| 23  | `PLAN_FAZA4.5B_TRADUCERE_F8_2026-09-10.md`            | ARHIVEAZĂ                  | 4.5b ÎNCHISĂ                                                                                                                                        |
| 24  | `PLAN_FAZA4.5C_TIMEOUT_LANT_AI_2026-09-10.md`         | ARHIVEAZĂ                  | 4.5c ÎNCHISĂ (🟡 rămas — notat în rezumat)                                                                                                          |
| 25  | `PLAN_FAZA4.5D_FREE_TIER_2026-09-11.md`               | ARHIVEAZĂ                  | 4.5d ÎNCHISĂ — rezumatul include ȘI abaterea de proces (fork reluat extern), nu doar succesul                                                       |
| 26  | `PLAN_FAZA4.5D_FREE_TIER_SIGURANTA_2026-09-11.md`     | ARHIVEAZĂ                  | **cele 3 datorii tehnice (§3 mai jos) se extrag ÎNAINTE de arhivare**                                                                               |
| 27  | `PLAN_FAZA4_AUDIT_REAL_2026-09-09.md`                 | ARHIVEAZĂ                  | Faza 4 ÎNCHISĂ                                                                                                                                      |
| 28  | `PLAN_FISE_TEXT_ONLY_2026-08-09.md`                   | ARHIVEAZĂ                  | LIVRAT                                                                                                                                              |
| 29  | `Plan_in_Lucru.md`                                    | **NU SE ATINGE ca fișier** | rămâne, dar se golește de itemii închiși + primește §3                                                                                              |
| 30  | `PLAN_MASTER.md`                                      | vezi §1.2                  | decizia ta pe mecanism                                                                                                                              |
| 31  | `PLAN_PROGRAM_2026-09-07.md`                          | ARHIVEAZĂ                  | predă `Fazele.md`, verificat că nu mai e referit activ nicăieri                                                                                     |
| 32  | `PLAN_SCOLARE_2026-08-07.md`                          | ARHIVEAZĂ                  | 112/112 LIVRAT                                                                                                                                      |
| 33  | `PLAN_SCOLARE_DESEN_2026-08-09.md`                    | ARHIVEAZĂ                  | LIVRAT                                                                                                                                              |
| 34  | `PROMPT_SESIUNE_NOUA.md`                              | ACTIV                      | utilitar canonic, referit din `CLAUDE.md`                                                                                                           |
| 35  | `PROMPT_SESIUNE_NOUA_REPARATIE.md`                    | ARHIVEAZĂ                  | superseded de #34 (propriul header al #34 spune „un singur fișier canonic"); NU e referit din `CLAUDE.md` — verificat                               |
| 36  | `RAPORT_F5_AUDIT_2026-09-07.md`                       | ARHIVEAZĂ                  | **coliziune de nume**: „F5" vechi (audit butoane), NELEGAT de „Faza 5" curentă — `Fazele.md` îl marchează deja „verdicte NEVERIFICATE"              |

Rânduri fără verdict clar din partea mea (#4, #8, #11, #20) — le rezolv cum spui tu; restul
sunt recomandări ferme, dar TOT rămân neexecutate până confirmi lista în bloc (poți tăia/muta
rânduri individual).

---

## 3. Cele trei datorii tehnice — de adăugat EXPLICIT în `Plan_in_Lucru.md`, NU de reparat acum

Extrase din `docs/PLAN_FAZA4.5D_FREE_TIER_SIGURANTA_2026-09-11.md` (sursă primară, nu din
parafraza trunchiată a mesajului tău). Text propus pentru inserare:

```
### ⏳ Datorii tehnice deschise (identificate 4.5c-4.5e, NEREZOLVATE, cu bună știință)

- 🟡 **Mistral OCR/traducere — retestare ONESTĂ a limitei „2 req/min" NEFĂCUTĂ**: cereri
  spațiate ≥30s (sub 2/min), testate separat pe fiecare cheie a proiectului. Afirmația „429
  persistent" a fost infirmată ANALITIC în Faza 4.5c (sonda anterioară trăsese 6 cereri în
  ~20s — 429-urile veneau de la sondă, nu de la cont) — dar testul EMPIRIC, promis ca „primul
  task al fazei următoare" (commit `605d4f8`), nu s-a făcut nici la 4.5d, nici la 4.5e.
  Disponibilitatea reală a Mistral ca fallback rămâne NEDETERMINATĂ.

- 🟡 **Groq — risc de 429 pe auto-continuare în aceeași fereastră de 60s**: `maxTokens:6000`
  (4.5d/4.5e) e dovedit sub plafonul de 8000 TPM pt O SINGURĂ cerere (live, `total_tokens`
  ~2500-2800). Dar `continueGenerate`/`continueCorrect` pot declanșa un AL DOILEA apel Groq
  în același minut (auto-continuare pe răspuns trunchiat) → cele două cereri se cumulează pe
  aceeași fereastră → al doilea apel poate lovi din nou plafonul, chiar dacă fiecare cerere
  individuală respectă limita. Cunoscut, lăsat deliberat nerezolvat (`PLAN_FAZA4.5D_FREE_TIER_
  SIGURANTA_2026-09-11.md`, PUNCTUL 5).

- ⏸️ **OCR — capacitate opțiunea B, amânată conștient**: cablarea `GOOGLE_AI_API_KEY_
  TRADUCERI_2` ca a doua cheie liberă în `ocr_structured.py` ar duce capacitatea de la
  ~520 la ~1040 pagini/zi. Marcată [RELEVANT, nu necesar] — 520/zi e deja confortabil pentru
  o singură utilizatoare. De reconsiderat doar la un motiv concret de volum mai mare.
```

Acești 3 itemi devin parte din `Plan_in_Lucru.md` la execuție (după confirmarea ta), NU se
repară în Faza 5.

---

## 4. Pași de execuție (ordinea contează — siguranță întâi)

- [x] **0. Baseline poartă** — `tsc 0 · jest 447/447 · build OK · pytest 121/121` (identic cu
      închiderea 4.5e).
- [x] **1. Confirmarea ta** pe §1.1/§1.2/§1.3 + cele 4 rânduri FLAG din §2 (CHANGELOG.md→
      absorbit+arhivat, jpg→dovezi/, Export_chat_sesiune_Carla→arhivat+indexat Planșe,
      OPTIUNI_API_AI→activ) + restul listei, confirmate în bloc.
- [x] **2. `docs/arhiva/`** creat.
- [x] **3. `docs/Plan_Finalizat.md`** — draft complet scris de un fork (citire integrală a
      celor ~20 documente sursă + `git log` pt hash-uri reale, auto-corecție a unui hash
      fabricat găsit și repartă de fork), revizuit și corectat de mine (referințe interne
      către `docs/arhiva/*`, nota de traceabilitate §7/§9 PLAN_MASTER).
- [x] **4. Mutare `git mv`** — 21 fișiere în `docs/arhiva/` + 3 poze în `docs/dovezi/`.
      Verificat: 0 fișiere șterse, doar `R` (renamed) în `git status`.
- [x] **5. Absorbție `PLAN_MASTER.md` + `CHANGELOG.md`** — §7 backlog (7 itemi) + §8
      verificări umane (V1-V4) → `Plan_in_Lucru.md` §⏸️ amânat conștient; §9 verificat
      punct-cu-punct (7 din 9 deja duplicate/stale — inclusiv „Groq prioritar la chat" fals
      acum, Chat eliminat; doar regula CORS lipsea real) → CORS migrat în `CLAUDE.md`
      Conventions; restul → rezumat în `Plan_Finalizat.md`.
- [x] **6. Cei 3 itemi tehnici** (§3) adăugați în `Plan_in_Lucru.md` §⏳ Datorii tehnice.
- [x] **7. `CLAUDE.md`** — 6 locuri actualizate (Status ×2, PRIMA ACTIUNE, Key Files ×2,
      flow §9, Important) să citeze `Plan_in_Lucru.md`+`Plan_Finalizat.md`, nu `PLAN_MASTER.md`.
- [x] **8. `HANDOFF_SESIUNE.md`** curățat: 1809→~90 linii. Păstrat integral §CONTEXT
      OPERAȚIONAL + §CUM RELUEZI (cu 2 corecții de-acum-stale găsite pe drum: „matematică
      Unicode, NU LaTeX" — fals, KaTeX de la 2026-07-26; „git log -1 = commit editor-tiptap" —
      fals, ține de o fază închisă de mult).
- [x] **9. Poartă finală** — re-rulat `tsc`(0) + `pytest`(121/121) direct; `jest`/`build`
      neschimbate (confirmat prin `git diff --stat -- frontend/ api/` = gol, zero fișiere
      de cod touch-uite).
- [x] **10. Cei trei auditori** — lansați în paralel (`auditor-dovezi`, `auditor-regresie`,
      `auditor-cerinte`), verdicte în raportul final către Roland.
- [x] **11. CERINȚA 1 (trecere prin referințe)** — 24 fișiere de memorie + `CLAUDE.md`
      corectate. **7 referințe erau DEJA moarte** înainte de Faza 5 (din curățenia din iulie,
      neconstatate anterior): `docs/PLAN_RUNDA_MODULE_2026-08-04.md`,
      `docs/PROMPT_SESIUNE_NOUA_2026-08-05.md`, `docs/PROMPT_SESIUNE_NOUA_2026-08-08.md`,
      `docs/PROMPT_SESIUNE_NOUA_2026-08-09.md`, `docs/PLAN_math_curriculum_2026-07-27.md`,
      `docs/PLAN_editor_tiptap_2026-07-23.md`, `docs/PLAN_math_academic_2026-07-26.md` — toate
      adnotate pe loc (2 din ele au putut fi corectate spre succesorul lor real,
      `docs/PROMPT_SESIUNE_NOUA.md`; restul marcate „fișier șters, conținut deja în rezumat").
- [ ] **12. Handoff + memorie + commit + push** — mesaj de commit scris în fișier
      (`scratchpad/commit_msg_faza5.txt`), apoi `git commit -F`.
- [ ] **13. STOP** — raportez „Faza 5 închisă", nu pornesc Faza 6 în aceeași sesiune
      (R-STOP-FAZA).

---

## 5. Capcane specifice acestei faze (din mesajul tău, ca să nu le redescopăr)

- **Risc HIGH — mutare de fișiere.** Nimic nu se mișcă până nu confirmi lista de la §2.
- **Documentele de care depinde procesul** (`HANDOFF_SESIUNE.md`, `Plan_in_Lucru.md`) nu se
  rup la mijlocul fazei — dacă sesiunea pică, următoarea trebuie să poată relua din git,
  fără gol.
- **`PLAN_MASTER.md` §CURENT e sursă suspectă** — nu-l cred pe cuvânt, verific în cod/git tot
  ce migrează din el.
- **Commit:** mesaj în fișier + `git commit -F` (diacritice/emoji pică pe heredoc).
- **Fork-uri/subagenți NU comit, NU fac push.** Dacă unul simte nevoia, îl opresc și fac eu,
  coordonatorul, commit-ul. (Recurență de 2 ori până acum — vezi
  `finding_fork_discipline_si_generator_drift_2026_09_10` +
  `finding_parallel_session_naming_collision_2026_09_11`.)

---

## 6. Jurnal execuție

1. Baseline: `tsc 0 · jest 447/447 · build OK · pytest 121/121`.
2. Grep referințe `docs/*.md` în memorie/`CLAUDE.md`/`project_rules.md` — `project_rules.md`
   curat (0 referințe către fișiere ce se arhivează); `CLAUDE.md` 8 locuri; memorie ~24 fișiere.
3. Fork lansat pentru draftul `Plan_Finalizat.md` (citire integrală surse + `git log`), în
   paralel cu fix-urile de referințe din memorie (sed pe pattern-uri literale — prima tentativă
   cu escapare dinamică în bash a picat silențios, `\\&` a devenit `&` prin shell; diagnosticat
   și corectat cu comenzi `sed` explicite, verificate cu grep de control după fiecare).
4. 6 fișiere de memorie cu conținut special (nu doar cale) editate manual după citire:
   `finding_runda_module_2026_08_04`, `project_improve_audit_2026_08_07` (+ corecție „coada §6b
   consumată" — era deja stale), `project_scolare_curriculum_scope_2026_08_07`,
   `finding_math_fit_and_backlog_2026_07_27`, `project_editor_tiptap_rewrite_2026_07_23`,
   `project_math_academic_katex_2026_07_26`. Plus `MEMORY.md` + `project_plan_master_2026_07_30`
   (descriere + body — nu mai e „sursă unică").
5. Fork a raportat draftul `Plan_Finalizat.md` (456 linii) + o auto-corecție a unui hash fabricat
   găsit de el însuși. Revizuit: 13 referințe interne către fișiere ce se arhivează fixate spre
   `docs/arhiva/*`; adăugată nota de traceabilitate §7/§9 la secțiunea PLAN_MASTER.
6. `CLAUDE.md`: citit integral din context (fără re-citire, fișier neschimbat de altcineva),
   6 edituri (Status ×2, PRIMA ACTIUNE, Key Files ×2, flow §9, Important) + 1 adăugare (CORS în
   Conventions).
7. Citit `PLAN_MASTER.md §7/§8/§9` integral pt absorbție precisă — 7/9 din §9 erau deja
   duplicate în `CLAUDE.md`/`project_rules.md` sau stale (Chat AI eliminat); doar CORS lipsea
   real. §7 (7 itemi backlog) + §8 (V1-V4) migrate în `Plan_in_Lucru.md`.
8. `git mv` — 21 fișiere → `docs/arhiva/`, 3 poze → `docs/dovezi/`. Verificat cu `git status`
   (toate `R`, zero `D`).
9. `Plan_in_Lucru.md`: fixate cele 2 referințe la pozele Faza 1 (→ `dovezi/`) + Erata (→
   `arhiva/`); adăugate secțiunile „⏳ Datorii tehnice deschise" + „⏸️ Amânat conștient"; Faza 5
   marcată 🟡 ÎN EXECUȚIE, Faza 6 cu nota de linie F5/F6.
10. `HANDOFF_SESIUNE.md`: citit header (1-6) + secțiunea operațională (1790-1809) direct din
    fișier; secțiunile intermediare (istoric fazelor) NU re-citite integral (deja verificate ca
    absorbite corect în `Plan_Finalizat.md` de fork) — rescris complet (`Write`) la <100 linii,
    cu 2 corecții de staleness găsite pe drum (matematică Unicode→KaTeX, referință commit stale).
11. Re-gate: `tsc 0` (rulat direct) · `pytest 121/121` (rulat direct) · `jest`/`build` confirmate
    neschimbate prin `git diff --stat -- frontend/ api/` = gol.
12. Cei trei auditori lansați în paralel — verdicte în raportul final.
