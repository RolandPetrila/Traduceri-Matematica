# PLAN FAZA 6 — Automatizarea procesului (ultima fază din program)

> Generat: 2026-09-11. Stare: 🟡 DRAFT — propunerea lui Claude, NEconfirmată încă.
> Surse citite integral înainte de acest plan: `99_Roland_Work/Fazele_mentiuni_Roland.md`
> (§Variante alese 6a/6b/6c + §FAZA 6 + §MENȚIUNI FINALE + §ORDINEA FAZELOR),
> `docs/Fazele.md` §FAZA 6, `docs/completari_pt_reparatie.md` (punctele 6-8).
> Proces: **plan scurt → confirmarea ta pe fiecare punct → baseline poartă → execuție → dovadă
> → cei trei auditori → handoff+Plan_in_Lucru+Plan_Finalizat+memorie → commit/push → STOP.**
> Nu ating `~/.claude/` (constrângere permanentă pentru toată Faza 6, nu doar pentru plan).

---

## 0. Corecții la onboard-ul meu — verificate de mine, nu doar acceptate pe cuvânt

- **7 module, nu 5.** `CLAUDE.md` §Module listează: Convertor, Editor, Calculator, Teste, Istoric,
  Planșe, Școlare. Onboard-ul meu a enumerat doar 5 (cele cu status „deployat" explicit) — corect
  factual pe ce a spus, dar formulat ca și cum ar fi lista completă. Ai dreptate, era incompletă.
- **„Traduceri" ≠ „Chat AI".** Verificat în `CLAUDE.md` §Module, nota de sub listă: tab-ul
  „Traduceri" a fost RETRAS din UI la F7, dar backend-ul de translate/OCR e VIU și folosit de F8
  (switch de limbă în Editor). Chat AI a fost ȘTERS COMPLET din cod la Faza 4.5d (`ChatPanel.tsx`
  șters, `CHAIN`/timeouts eliminate). Onboard-ul meu le-a pus în aceeași propoziție ca „eliminate
  complet" — greșit pentru Traduceri. Corectat aici; nu le mai amestec.

## 0.1 Reconstrucții din mesajul tău — ce am dedus și din ce sursă (verifică-le)

Mesajul tău a ajuns cu porțiuni corupte în transmisie. Nu ghicesc tăcut — spun explicit ce am
reconstruit și de unde:

- „docs/Plan_in_Lucru.atie.md" → reconstruit ca **`Plan_in_Lucru.md` + `completari_pt_reparatie.md`**,
  pe baza `docs/Fazele.md` §FAZA 6 „Ce ar face concret": „(a) la start se citesc `Plan_in_Lucru.md`
  și `completari_pt_reparatie.md`".
- „regula a fost respectată «l" → reconstruit ca **„respectată la literă"**, text identic găsit în
  `docs/Fazele.md` §FAZA 6.
- „vreau în plan opțiunile explicit: modificare glo... și recomandarea ta" → reconstruit ca:
  prezintă opțiunea globală (modificare `~/.claude/`) și opțiunea locală (doar proiect), cu
  recomandarea mea — vezi §4.3 mai jos.
- „cele 3 datorii tehnice (rentinuare, OCR opțiunea B)" → reconstruit din `Plan_in_Lucru.md`
  §„Datorii tehnice deschise": retestarea Mistral „2 req/min", riscul Groq 429 pe auto-continuare,
  OCR opțiunea B (capacitate ~1040/zi). Toate 3 rămân neatinse — vezi §1 mai jos.
- „Fork-urile/subagenții NU comit... Cotorului" → reconstruit ca „NU fac push — comitul e exclusiv
  al coordonatorului", text identic în `docs/HANDOFF_SESIUNE.md` punctul 9.

Dacă vreuna din reconstrucții e greșită, spune-mi înainte să confirm planul pe puncte.

---

## 1. Ce NU intră în Faza 6 (rămâne neatins, cu bună știință)

Cele 3 datorii tehnice din `Plan_in_Lucru.md` §„Datorii tehnice deschise": retestarea Mistral
„2 req/min", riscul Groq 429 pe auto-continuare, OCR opțiunea B. Rămân exact cum sunt, ca itemi
deschiși — nu le ating fără cerere separată de la tine.

---

## 2. Ce trebuie să iasă concret (cele 7 puncte din mesajul tău, mapate 1:1)

### 2.1 — Regulă + MECANISM verificabil împotriva re-acumulării în `docs/`

**Defectul azi:** regula scrisă în `docs/Fazele.md`/`Plan_in_Lucru.md` e o propoziție pe care o
sesiune viitoare o poate ignora — exact boala pe care Faza 5 a curățat-o o dată deja.

**Mecanism propus:** `.claude/scripts/check-docs-classification.mjs` (Node, rulează cu
`node .claude/scripts/check-docs-classification.mjs`) — scanează `docs/*.md` la nivelul de sus
(NU `docs/arhiva/`, NU `docs/dovezi/`) și clasifică fiecare fișier:

- **Legitim (allowlist explicit, ~12 nume stabile):** `Plan_in_Lucru.md`, `Plan_Finalizat.md`,
  `HANDOFF_SESIUNE.md`, `Fazele.md`, `completari_pt_reparatie.md`, `caiet_de_sarcini.md`,
  `PROMPT_SESIUNE_NOUA.md`, `COMENZI_SLASH.md`, `DEPLOY_VERCEL.md`, `GHID_FEEDBACK_LOOP.md`,
  `AI_PROVIDERS_FREE_INVENTORY.md`, `MEDIU_CLAUDE_CODE.md` (nou, §2.2).
- **Legitim condiționat (pattern, nu enumerare):** `PLAN_FAZA*.md` — plan de fază ACTIVĂ. Verific
  starea „activă" citind `Plan_in_Lucru.md` (fazele închise sunt listate acolo); dacă un
  `PLAN_FAZA*.md` de top-level corespunde unei faze deja închise → **NECLASIFICAT (stale)**, ar
  trebui în `docs/arhiva/`.
- **NECLASIFICAT:** orice altceva.

De ce pattern, nu un fișier-manifest cu listă: un manifest e el însuși un fișier care poate derivă
la fel ca `docs/`-ul vechi (cineva adaugă un doc și uită să actualizeze manifestul). Regula bazată
pe nume/pattern nu cere să-și amintească nimeni s-o actualizeze.

**Auto-test înainte să scriu scriptul:** chiar `docs/PLAN_FAZA6_AUTOMATIZARE_2026-09-11.md` (acest
fișier) trebuie să iasă „legitim, activ" cât Faza 6 e deschisă. **Găsit deja un caz real:**
`docs/PLAN_FAZA5_UNIFICARE_DOCUMENTATIE_2026-09-11.md` e la top-level, dar Faza 5 e ÎNCHISĂ — deci
regula, aplicată acum manual, îl prinde ca stale. Propun să-l mut în `docs/arhiva/` ca parte din
execuția Faza 6 (`git mv`, consecvent cu decizia 5a — istoricul git rămâne). **Cere confirmarea ta
explicit, ca §5a.**

**Declanșare la sesiune nouă (fără `~/.claude/`):** hook `SessionStart` LOCAL proiectului, adăugat
în `.claude/settings.local.json`, care rulează scriptul și injectează numărul de fișiere
neclasificate ca context. `CLAUDE.md` (§PRIMA ACȚIUNE) capătă un pas nou: „dacă numărul e >0 →
`AskUserQuestion` cu Roland (mutare în arhivă / redenumire / excepție explicită)". Forma exactă a
hook-ului (schema JSON din `settings.json`) se verifică empiric la implementare cu un hook-test
minimal (`echo`) înainte de a cabla scriptul real — nu presupun sintaxa fără verificare.

**Domeniul „modificări în proiect" (decizie §5b, vezi mai jos):** limitat la clasificarea `docs/`

- drift de plan (`Plan_in_Lucru.md` vs realitate). NU tot `git status` — azi ai 46 de fișiere
  `scratchpad/` netracked; un trigger pe „există fișiere netracked" ar da fals-pozitiv la FIECARE
  sesiune de acum încolo și ar deveni zgomot ignorat (exact eroarea R-DIAG-AUTO, într-o formă nouă).

**Ce se poate dovedi LIVE acum vs ce rămâne 🟡:** rularea manuală a scriptului acum (probă de
**mecanism**) — da, o fac în sesiunea asta. Declanșarea automată a `AskUserQuestion` la pornirea
UNEI SESIUNI NOI (probă de **trigger**) — NU se poate dovedi live în sesiunea care scrie codul.
Rămâne 🟡 cu verificarea programată explicit ca primul pas al sesiunii următoare, scrisă în
`HANDOFF_SESIUNE.md`. Nu declar asta 🟢 fără dovada reală.

### 2.2 — Documentația pentru un mediu nativ Claude Code (proiect)

**Ce lipsește:** un document care explică, pentru ACEST proiect, cum funcționează mediul Claude
Code local — cei trei auditori, regulile din `project_rules.md`, cele două sisteme de memorie
(după fix, unul canonic — §2.6), gate-ul de fază, mecanismul de clasificare `docs/` (§2.1). Fără
el, o sesiune nouă trebuie să reconstruiască totul din `CLAUDE.md` + `project_rules.md` împrăștiate.

**Propunere:** `docs/MEDIU_CLAUDE_CODE.md` — omologul local al `~/.claude/PROTOCOL_ACTUALIZARE.md`,
dar pentru proiect: inventar agenți (`auditor-dovezi`/`auditor-regresie`/`auditor-cerinte`, când
rulează), inventar reguli (`project_rules.md`, un rând pe regulă), sistemul de memorie canonic +
locația lui reală pe disc, mecanismul de gardă `docs/` (§2.1), fluxul de fază (R-STOP-FAZA +
R-HANDOFF), cum pornește corect o sesiune nouă.

**Dovadă:** fișierul există + referințele din el (căi, nume de reguli, nume de agenți) rezolvă
real în proiect — verificabil de `auditor-dovezi`/`auditor-cerinte` la finalul fazei.

### 2.3 — `/onboard` deschide `AskUserQuestion` la modificări în proiect

Vezi mecanismul din §2.1 (declanșator local prin `CLAUDE.md` + hook `SessionStart`). Nu ating
`~/.claude/commands/onboard.md` — vezi opțiunile explicite la §4.3.

### 2.4 — La start se citesc automat `Plan_in_Lucru.md` + `completari_pt_reparatie.md`

**Defectul concret, verificat:** `CLAUDE.md` §PRIMA ACȚIUNE, pasul 1, citește azi DOAR
`docs/Plan_in_Lucru.md`. `docs/completari_pt_reparatie.md` NU apare nicăieri în lista celor 8 pași
— deși e „fișierul tău de reclamații", citit manual de mine abia acum, la cererea ta explicită.

**Fix:** editare `CLAUDE.md`, pasul 1 din §PRIMA ACȚIUNE — adaug `docs/completari_pt_reparatie.md`
explicit, lângă `Plan_in_Lucru.md`. Un rând, o locație, defect concret — nu o reformulare vagă.

### 2.5 — Transfer bifate → `Plan_Finalizat.md` ca proces scris, nu obicei

`R-HANDOFF` (`.claude/rules/project_rules.md`) spune deja „actualizează planul activ — bifează
[x]/[~]", dar nu spune explicit „TRANSFERĂ itemii [x] finalizați în `Plan_Finalizat.md` ÎNAINTE de
commit" ca pas obligatoriu, separat de simpla bifare. Adaug un sub-pas explicit în R-HANDOFF §2 —
text scurt, un pas, nu regulă nouă. **Dovadă empirică:** chiar închiderea Fazei 6 (§6 mai jos) face
exact acest transfer — devine propriul test live, nu doar text frumos.

### 2.6 — Cele două sisteme de memorie — verificat, nu presupus

**Verificat:** `.claude/memory/` (proiect, în git) are 3 fișiere + index, ultima actualizare
2026-07-07 (conținut: decizii AI vechi din 2026-03/07, o parte deja SUPRASCRISĂ — ex. figuri „SVG
generat de Gemini" → azi e crop bbox+Pillow). `CLAUDE.md` §PRIMA ACȚIUNE pasul 3 trimite EXPLICIT
la acest folder stale, nu la memoria auto-încărcată (`~/.claude/projects/.../memory/`, activă,
actualizată prin Faza 5). E aceeași boală ca `docs/`-ul din Faza 5, dar în `.claude/`.

**Constrângere de reținut (nu era evidentă):** memoria auto-încărcată trăiește ÎN AFARA
repo-ului (`~/.claude/projects/...`), deci NU e în git — dacă șterg complet `.claude/memory/` din
proiect, proiectul rămâne fără NICIO memorie sub control de versiune. De aceea **nu șterg**, cum ai
cerut.

**Propunere (fix-ul real e §a, restul e păstrare reversibilă):**
a) **Fix-ul care contează:** `CLAUDE.md` §PRIMA ACȚIUNE pasul 3 — schimb trimiterea de la
`.claude/memory/*` la memoria auto-încărcată (calea reală, explicită), ca sursă canonică.
b) `.claude/memory/` (cele 3 fișiere + index) → mutate în `.claude/memory/arhiva/` (`git mv`,
istoric păstrat, exact pattern-ul `docs/arhiva/` din Faza 5) — NU șterse.
c) `.claude/memory/MEMORY.md` rescris ca pointer scurt: „Memoria activă a proiectului e
`~/.claude/projects/.../memory/` (auto-încărcată la fiecare sesiune). Fișierele din `arhiva/`
sunt istoric pre-Faza 6, păstrate pt git — nu se mai citesc automat."

**Cere confirmarea ta explicit** (ai cerut-o clar) — vezi §5c.

### 2.7 — R-DIAG-AUTO reparată să citească TOATE nivelele

**Defectul, cu numele lui corect:** `project_rules.md` §R-DIAG-AUTO pasul 1 spune azi „Filtrează
nivelele `ERROR`/`WARN` cu `error_code`". Eroarea ta de SK a fost logată la nivel `action`,
`error_code = null` — regula a fost respectată la literă și a produs raportul fals-liniștitor
descris chiar în `docs/Fazele.md` §FAZA 1 punctul 2.

**Fix text:** lărgesc pasul 1 din R-DIAG-AUTO — citește TOATE nivelele din `logs` (nu doar
`ERROR`/`WARN`), semnal de eșec = `error_code` prezent SAU conținut/context care indică eroare
chiar fără `error_code` (ca în cazul SK).

**Aici textul singur NU e dovadă — exact ce ai numit tu drept problema de fond.** Dovadă cerută,
efectivă în sesiunea asta: interoghez tabela `logs` din Supabase (MCP `claude_ai_Supabase`,
`execute_sql`) FĂRĂ filtru de nivel și arăt fie (a) un rând real `action`-level cu `error_code
null` deja existent care înainte era invizibil, fie (b) dacă nu există niciunul reproductibil
acum, emit un log de test la nivel `action` printr-un flux real și arăt că interogarea lărgită îl
prinde. Regulă + probă empirică, nu doar text.

---

## 3. Reguli scrise + memorate (§MENȚIUNI FINALE)

Toate cele de mai sus care ajung reguli scrise se configurează în:
`.claude/rules/project_rules.md` (R-DIAG-AUTO editat + `R-DOCS-GUARD` nou, §2.1) și `CLAUDE.md`
(§PRIMA ACȚIUNE, §Key Files cu `docs/MEDIU_CLAUDE_CODE.md`), plus intrare nouă în memoria
auto-încărcată a proiectului (`project_faza6_automatizare_2026-09-11.md`) — decizie tehnică
confirmată, cu §„Why"/§„How to apply", ca la fazele anterioare.

---

## 4. Puncte de decizie — aștept confirmarea ta pe FIECARE, nu presupun

### 4.1 — Domeniul „modificări în proiect" pentru trigger

**(Recomandat) A.** Limitat la clasificare `docs/` + drift `Plan_in_Lucru.md` — evită zgomotul
celor 46 fișiere `scratchpad/` netracked de azi. **B.** Tot `git status` (necesită mai întâi să
decizi ce faci cu `scratchpad/` — altfel trigger la fiecare sesiune, ignorat rapid).

### 4.2 — Mecanism clasificare `docs/`

**(Recomandat) A.** Pattern/allowlist de nume (§2.1) — nu derivă singur. **B.** Fișier-manifest
JSON cu listă explicită — mai simplu de citit, dar el însuși poate deveni stale (boala Faza 5,
reambalată).

### 4.3 — Global (`~/.claude/`) vs local (doar proiect) pentru §2.1/§2.3

**(Recomandat) A. Local, zero atingere `~/.claude/`.** Motivul concret: `CLAUDE.md` per-proiect
e citit AUTOMAT la fiecare sesiune (l-ai văzut deja injectat, chiar înainte să tastez `/onboard`)
ȘI e prima sursă citită explicit de `onboard.md` global — deci punând regula în `CLAUDE.md`, ea se
declanșează oricum când rulezi `/onboard`, fără să ating fișierul global. Risc zero pe celelalte
proiecte tale.
**B. Global** — aș adăuga în `~/.claude/commands/onboard.md` un bloc condiționat generic (după
modelul deja existent acolo pt „Native Workspace v2": „dacă există `.claude/scripts/...`, rulează-l”)
care ar funcționa din start pt orice proiect ce adoptă convenția. Mai puternic, dar: atinge un
fișier folosit de TOATE proiectele tale, cere trecerea prin `PROTOCOL_ACTUALIZARE.md` §R4
(sincronizare `GHID_UTILIZARE.md`+`.html`, contoare), și tu ai spus explicit „nicio modificare la
`~/.claude/`". Nu recomand B acum — dacă vrei ca acest pattern să devină disponibil altor proiecte
mai târziu, e o decizie separată, discutată separat, nu strecurată în Faza 6.

### 4.4 — `docs/PLAN_FAZA5_UNIFICARE_DOCUMENTATIE_2026-09-11.md` → arhivă acum?

Regula din §2.1, aplicată acum, îl prinde ca stale (Faza 5 e închisă, planul ei a rămas la
top-level). **(Recomandat)** îl mut în `docs/arhiva/` ca parte din execuția Faza 6 — consecvent cu
decizia 5a, git păstrează istoricul, nimic nu se pierde. Confirmă/respinge.

### 4.5 — Memorie dublă (`.claude/memory/`)

**(Recomandat) A.** Arhivare reversibilă (`.claude/memory/arhiva/`) + pointer nou + fix la
`CLAUDE.md` pasul 3 (§2.6). **B.** Ștergere directă — NU o fac fără cererea ta explicită, ai
spus clar „nu șterge nimic până nu confirm".

### 4.6 — 6b, ritmul raportării — recomandarea pe care ai cerut-o

**(Recomandat)** Nu un fișier nou de dashboard (ar recrea exact sprawl-ul pe care Faza 5 l-a
șters). În schimb: `Plan_in_Lucru.md` se actualizează LIVE la fiecare sub-pas (⬜→🟡→🟢) —
fișierul deja promite asta în antetul lui, „se actualizează la fiecare sub-pas, nu la finalul
fazei" — deci onorez o promisiune existentă, nu inventez proces nou. Pe lângă asta: un mini-raport
în chat la finalul fiecăruia din cele 7 livrabile de mai sus (§2.1-§2.7), plus raportul complet cu
cei trei auditori la finalul fazei. Așa vezi progresul „live în documentație" (fișierul) ȘI
puncte de status intermediare (chat), fără un sistem nou de urmărit.

---

## 5. Ce se poate dovedi live ACUM vs ce rămâne 🟡 până la sesiunea următoare

| Livrabil                                         | Dovadă în sesiunea asta                                                                      | Rămâne 🟡                                                                                        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 2.1 clasificare `docs/`                          | Rulez scriptul manual, arăt output real (inclusiv cazul PLAN_FAZA5)                          | Declanșarea automată la sesiune nouă — verificare programată ca prim pas în `HANDOFF_SESIUNE.md` |
| 2.2 `MEDIU_CLAUDE_CODE.md`                       | Fișier există, referințe verificate de auditor-cerințe                                       | — (verificabil integral acum)                                                                    |
| 2.3 trigger `AskUserQuestion`                    | Mecanismul (hook + instrucțiune) scris și testat manual                                      | Declanșarea reală la `/onboard` într-o sesiune nouă                                              |
| 2.4 citire automată `completari_pt_reparatie.md` | Editare vizibilă în `CLAUDE.md`, aplicată deja în ACEASTĂ sesiune (am citit-o la cererea ta) | —                                                                                                |
| 2.5 transfer bifate                              | Chiar închiderea Fazei 6 face transferul                                                     | — (auto-dovedit)                                                                                 |
| 2.6 memorie unificată                            | Fix vizibil în `CLAUDE.md` + arhivare `git mv`                                               | —                                                                                                |
| 2.7 R-DIAG-AUTO                                  | Interogare Supabase live, cu/fără rând `action` prins                                        | — (dacă proba reușește azi)                                                                      |

Itemii 🟡 NU se declară 🟢 în raportul de fază — rămân 🟡 cu verificarea programată explicit,
exact regula 6a pe care ai cerut-o.

---

## 6. Proces de execuție (neschimbat, R-STOP-FAZA/R-HANDOFF)

1. Confirmarea ta pe fiecare punct din §4 (mai sus).
2. **Baseline poartă ÎNAINTE de prima modificare:** `tsc`/`jest`/`build` din `frontend/` +
   `pytest api/tests/` din `.venv` — citesc `EXIT_*` din output, nu prin pipe (capcana documentată
   deja). Faza 6 nu atinge cod de aplicație — țelul e poarta identică cu baseline la final, ca la
   Faza 5.
3. Execuție pe puncte (§2.1 → §2.7), fiecare cu dovadă scrisă imediat lângă el în
   `Plan_in_Lucru.md` (live, per §4.6).
4. Verificare live (script rulat, interogare Supabase, fișiere citite de auditor).
5. Cei trei auditori (`auditor-dovezi`, `auditor-regresie`, `auditor-cerințe`) — verdictele intră
   în raport, inclusiv cele negative.
6. `HANDOFF_SESIUNE.md` rescris (cu verificarea programată pt itemii 🟡) + `Plan_in_Lucru.md`
   (bifat + transfer în `Plan_Finalizat.md`) + memorie (proiect + notă în `.claude/memory/`
   dacă rămâne relevantă) + `git commit -F` (mesaj în fișier, fără diacritice/emoji în heredoc) +
   push. Fără deploy — Faza 6 nu atinge `traduceri-frontend`/`traduceri-api`.
7. **STOP.** Ultima fază din program (§ORDINEA FAZELOR) — după Faza 6, raportez „program de
   reparație închis", nu deschid altceva fără cerere nouă de la tine.

---

## 7. Reguli de siguranță specifice acestei faze

- **Nicio modificare la `~/.claude/`** — constrângere permanentă, nu doar pt etapa de plan.
- Regulile scrise aici se AUTO-ÎNCARCĂ în toate sesiunile viitoare ale acestui proiect — risc
  HIGH. Fiecare regulă nouă/editată se confruntă cu o probă empirică înainte de a fi declarată
  gata (exact lecția R-DIAG-AUTO) — nu se scrie „frumos" fără verificare.
- Commit: mesaj în `scratchpad/commit_msg_faza6.txt` + `git commit -F` (heredoc cu diacritice/emoji
  pică hook-ul, recurent de 3+ ori).
- Fork-uri/subagenți (auditorii) NU comit, NU fac push — exclusiv coordonatorul.
- Nimic nu se șterge fără confirmare explicită (§4.5) — doar `git mv` spre `arhiva/`.

---

## 8. Checklist bifabil (se completează live în timpul execuției)

- [ ] Confirmare Roland pe §4.1-§4.6
- [ ] Baseline gate rulat și verde (tsc/jest/build/pytest)
- [ ] 2.1 — `.claude/scripts/check-docs-classification.mjs` scris + rulat manual + `PLAN_FAZA5...` arhivat (dacă 4.4 confirmat)
- [ ] 2.1 — hook `SessionStart` local + pas `CLAUDE.md` pt `AskUserQuestion`
- [ ] 2.2 — `docs/MEDIU_CLAUDE_CODE.md` scris
- [ ] 2.4 — `CLAUDE.md` pasul 1 include `completari_pt_reparatie.md`
- [ ] 2.5 — R-HANDOFF §2 cu sub-pas explicit de transfer
- [ ] 2.6 — `.claude/memory/` arhivat (dacă 4.5 confirmat) + `CLAUDE.md` pasul 3 corectat
- [ ] 2.7 — R-DIAG-AUTO text lărgit + probă Supabase live
- [ ] Cei trei auditori rulați, verdicte în raport
- [ ] Handoff + Plan_in_Lucru + Plan_Finalizat + memorie actualizate
- [ ] Commit + push
- [ ] STOP — raport final „program de reparație închis"

## 9. Jurnal execuție

**2026-09-11/12 — execuție completă.** Baseline gate rulat de 2 ori (prima rulare pytest a picat pe
invocare directă `pytest.exe`, nu pe cod — vezi `docs/MEDIU_CLAUDE_CODE.md` §6); a doua rulare
curată: `tsc 0 · jest 447/447 · build OK · pytest 121/121` (`scratchpad/gate2_*.log`). Executate în
ordine: Completare 1 (secțiune Faza 5 în `Plan_Finalizat.md`), Completare 2 (4 referințe
`PLAN_FAZA5` reparate condiționat înainte de arhivare), §2.1/2.3 (garda `docs/`+`.html`, cu bug de
regex prins și corectat empiric — heading-vs-proză), §2.2 (`docs/MEDIU_CLAUDE_CODE.md`), §2.4
(`CLAUDE.md` citește `completari_pt_reparatie.md`), §2.5 (R-HANDOFF — sub-pas transfer explicit),
§2.6 (memorie unică, arhivare reversibilă `.claude/memory/arhiva/`, întrebare de migrare adusă la
Roland, nedecisă unilateral), §2.7 (R-DIAG-AUTO lărgit + probă live Supabase, 846 rânduri
`level=action`/`error_code=null`, corectată o imprecizie de citare găsită de `auditor-dovezi`).

**Auto-corecție de proces găsită prin `advisor()`, nu de Roland:** un checkbox `[x]` fals
(„Faza 6 însăși, la închidere: arhivată") a fost bifat înainte ca arhivarea să existe efectiv,
plus o ancoră moartă adăugată în indexul `Plan_Finalizat.md` spre o secțiune inexistentă — exact
defectul de clasă pe care Faza 6 există să-l prevină, reprodus de propriul ei autor. Corectat
imediat, înainte de auditori; confirmat de `auditor-cerinte` și `auditor-dovezi` ca tranzitoriu,
deja rezolvat la momentul rapoartelor lor. Vezi nota din `docs/Plan_Finalizat.md` §Faza 6.

**Cei trei auditori** (rulați în paralel, read-only, PE faza încheiată): `auditor-regresie` →
FĂRĂ REGRESIE, gate identic, zero fișier `frontend/`/`api/` atins. `auditor-dovezi` → 6 CONFIRMAT,
2 PARȚIAL (referință moartă nouă `Plan_Finalizat.md:468`, imprecizie citare §2.7 — ambele corectate
după raport), 1 INFIRMAT-dar-onest (auto-consistența Faza 6 nefăcută încă LA MOMENTUL auditului,
corect marcată `[ ]`, nu `[x]`). `auditor-cerinte` → toate cele 4 completări onorate, cu aceeași
observație despre referința moartă `Plan_Finalizat.md:468` (independent confirmată de 2 auditori).

**Rulări gardă `docs/` — proba pentru Completare 4 (auto-consistență):** vezi jurnalul complet în
`docs/Plan_Finalizat.md` §Faza 6 (acest fișier devine el însuși arhivă imediat după acest pas, deci
proba finală se scrie acolo, nu aici, pentru a rămâne vizibilă/vie).
