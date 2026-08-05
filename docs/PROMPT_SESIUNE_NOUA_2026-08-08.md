# PROMPT SESIUNE NOUĂ — Traduceri Matematică (creat 2026-08-07, extins 2026-08-07 seara)

> Lipește ACEST fișier (sau referința lui) ca PRIM mesaj în sesiunea nouă, după `/onboard`.
> Regim de lucru cerut explicit de Roland: **raportează LIVE statusul fiecărei implementări** (nu doar la final) — mini-status după fiecare pas semnificativ, nu doar la sfârșit de fază.

## STAREA LA ZI (2026-08-07)

- Modulul **Planșe e COMPLET pe cod ȘI DEPLOYAT: 6/6 generatoare + P4 (coș→PDF)**. **v39 LIVE pe prod**, verificat pe alias (`traduceri-frontend.vercel.app`), gate verde 9/9, smoke E2E confirmat.
- Rămas din runda anterioară: **eyeball Roland pe telefon** (print real + offline) pt integramă, coș P4, dictare, numere, căutare, unește.
- **Cerințe NOI de la Roland (2026-08-07 seara)**, patru fire distincte, detaliate mai jos: (A) integramă cu MAI MULTE forme + control de complexitate; (B) extinde varietatea la CELELALTE generatoare din Planșe; (C) modul „Școlare 🌐" — materiale pt TOATĂ programa școlară din România (grădiniță→liceu); (D) investigație OCR („limite" — formulare nepăstrată, semnalat de Roland, NEreprodusă de mine — vezi §D).

Branch `faza-g-editor`.

---

## A) Integramă — mai multe forme, aleatoriu după dificultate, complexitate selectabilă

**Cerința lui Roland:** nu doar „moara de vânt" (topologia unică livrată în 2026-08-07) — vrea mai multe forme, alese aleatoriu în funcție de dificultate, și posibilitatea de a alege cât de complex vrea exercițiul.

**Context tehnic important (reduce riscul perceput):** motorul de aritmetică + verificatorul independent (`evalOp`/`solveSecond`/`solveFirst`/`countSolutions`/`canForcePropagate` din `generators/integrama.js`) sunt DEJA independente de topologie — au fost scrise generic, nu hardcodate pt „moară". Adăugarea de forme noi e în mare parte o problemă de GEOMETRIE (poziții celule + ecuații), nu o problemă nouă de design de solver. Asta reduce mult efortul față de prima rundă.

**Recomandare de design (de confirmat cu Roland via mock, NU de implementat orbește):**

- Catalog de 2-4 topologii noi (candidați: „stea" — un centru cu mai multe brațe decât 4; „scară" — două lanțuri paralele legate încrucișat; „cruce dublă"), reutilizând exact modelul catalog-de-forme deja dovedit la `dictare.js` (17 forme) și `uneste.js` (7 forme) — NU un generator de layout liber (ar fi o problemă combinatorică separată, evitată explicit și la designul „moară" din runda trecută).
- Per dificultate: alege ALEATORIU o formă din subsetul eligibil pt acea dificultate (exact modelul `dictare.js` — bandă de dificultate → subset de forme).
- Control „cât de complex": recomand un selector „Formă" (Amestecat / nume formă) PARALEL cu „Dificultate" — exact pattern-ul deja existent la `mountDictare` (formă + dificultate = axe independente). Mai multe brațe/mai multe mori = mai complex, deci alegerea formei ÎNSEAMNĂ deja controlul de complexitate cerut — nu inventa o a treia axă fără să confirmi cu Roland întâi.

**OBLIGATORIU înainte de cod (lecția „3 respingeri" din istoricul proiectului — vezi memoria `finding_integrama_windmill_and_p4_history_2026_08_07`):** mock ASCII cu numere reale + AskUserQuestion pt FIECARE formă nouă, confirmare explicită înainte de a scrie generatorul. Rundă advisor pe design înainte de cod (ca la moara de vânt).

**Gate:** fiecare formă nouă = propriul selftest (oracol + seed-uri × dificultăți + round-trip HTML + control negativ) — aceeași rigoare ca la moara de vânt, NU relaxată pt că „motorul e deja testat".

---

## B) Extinde varietatea și la celelalte generatoare din Planșe

Roland vrea extinderi similare (mai multă varietate) la TOATE opțiunile din modul, nu doar integramă. Ordine recomandată — cele ieftine/aditive ÎNTÂI, cele scumpe/riscante LA URMĂ (ritmul deja stabilit în proiect):

- **Unește** (`uneste.js`) — crește catalogul de forme (7→mai multe). RISC MIC: pur aditiv, fără logică nouă de solver.
- **Dictare** (`dictare.js`) — crește catalogul de forme (17→mai multe). RISC MIC: aditiv; reduce și frecvența mesajului „doar N forme distincte" deja notat în memorie ca gol minor.
- **Căutare** (`cautare.js`) — crește temele/băncile de cuvinte (5→mai multe). RISC MIC: mai ales conținut, nu algoritm.
- **Numere** (`numere.js`) — variază DIMENSIUNEA grilei (4×4/5×5, nu doar 3×3). RISC MEDIU: geometrie nouă, dar trucul „set ascuns aciclic" se generalizează direct la grile pătrate mai mari (graf bipartit K_{n,n}).
- **Labirint** (`labirint.js`) — variație de formă/ieșiri multiple. RISC MAI MARE: invarianții „arbore perfect + BFS" trebuie păstrați exact; probabil ULTIMUL din listă.

Fiecare extindere = propriul ciclu mock (dacă schimbă forma vizual) → cod → selftest → probă live → commit. UN livrabil câte unul, ca până acum.

---

## C) Modul „Școlare 🌐" — toată programa școlară din România (grădiniță → liceu)

**Cerința lui Roland (extinsă, 2026-08-07):** materiale pt TOATE grupele de grădiniță + clasa pregătitoare (clasa 0) + clasele I-XII (Cristina predă la clasele V-XII; grădinița + clasele 0-IV sunt necesare pt copiii lui Roland). Vrea identificarea manualelor aprobate pe categorie/clasă și folosirea conținutului lor — extins apoi în Planșe, Editor, Asistent AI, Calculator, Teste și orice implementare viitoare. **Cerință fermă: acoperire 100% a tuturor claselor/categoriilor cerute — pilotul de start e la alegerea sesiunii noi, dar ținta finală NU se negociază la o parte din clase.**

### Decizie de arhitectură REZOLVATĂ cu Roland (risc de copyright discutat explicit, 2026-08-07)

Cererea inițială zicea literal „descarcă manualele și include-le în documentația proiectului" — **am verificat la sursă (edu.ro, rocnee.eu) și am semnalat risc real de copyright**: `manuale.edu.ro` e o platformă LEGALĂ și GRATUITĂ a Ministerului Educației, dar „gratuit de consultat" ≠ „liber de redistribuit" într-un alt produs/repo. Roland a acceptat argumentul (manualele statice devin oricum învechite; o sursă live e mai bună) — **decizia finală:**

1. **Sursa de adevăr pt CONȚINUT (teme, ordine, competențe) = programa școlară OFICIALĂ**, document public fără autor privat: [rocnee.eu](https://rocnee.eu) (Centrul Național pentru Curriculum și Evaluare) — secțiunea „Programe școlare" pt primar/gimnazial/liceal.
2. **Manualele aprobate MEN (`manuale.edu.ro`) = DOAR referință de aliniere** în timpul dezvoltării (citite, nu descărcate/stocate în masă) — pt terminologie, nivel de dificultate, stil de formulare a exercițiilor.
3. **Conținutul NOU (planșe/teste/exerciții/explicații) = ORIGINAL, generat AI, aliniat programei** — NU copiat din vreun manual. Exact modelul deja FOLOSIT ȘI DOVEDIT în acest proiect: `project_curriculum_audit_2026_07_28` (audit editor vs 13 manuale → 4 goluri completate cu conținut original aliniat curricular, NU copiat).
4. **Dacă e nevoie de PDF-uri complete ca referință de dezvoltare** (opțional, nu obligatoriu): descarcă-le de pe `manuale.edu.ro`, ține-le LOCAL într-un folder **gitignored** (pattern deja folosit în proiect: `99_Roland_Work`) — NICIODATĂ committed în git, NICIODATĂ în `docs/` urcat pe repo.
5. **ATENȚIE — timing:** la data verificării (2026-08-07), edu.ro anunța **175 de programe școlare NOI pt liceu „în transparență"** (proces activ de reformă curriculară) — sursa: `edu.ro/press_rel_38_2026`. Verifică LIVE statusul curent al reformei la începutul sesiunii — nu presupune că programele de liceu din 2026 sunt cele finale. Construiește pipeline-ul DATA-DRIVEN (ușor de resincronizat), nu hardcodat pe presupunerea că programa actuală e stabilă.
6. **Grădinița NU are manuale aprobate** în sensul clasic (clasa I-XII) — curriculumul e „Curriculum pentru educație timpurie" (MEN), organizat pe „domenii de dezvoltare", nu pe manual+materie. Nu pierde timp căutând „manuale de grădiniță" — caută curriculumul de educație timpurie.

### Scop și fazare

- **Acoperire finală cerută (fermă):** grupa mică/mijlocie/mare (grădiniță) + clasa pregătitoare (clasa 0) + clasele I-XII, cel puțin matematică (materia aplicației). Dacă Roland vrea și alte materii pt clasele copiilor lui (I-IV), clarifică explicit la începutul sesiunii — nu presupune.
- **Pilot recomandat de sesiunea nouă** (Roland: „configurează cum vrei, dar asigură-te că completezi 100%"): o clasă gimnazială de mijloc (a VI-a sau a VII-a, matematică) — programă STABILĂ (spre deosebire de liceu, în reformă), destul de complexă pt a valida pipeline-ul (fracții, ecuații, geometrie) fără complicația profilului de liceu.
- **Task complex, multi-sesiune, risc real** → respectă **R-PLAN**: la începutul lucrului pe Școlare, creează `PLAN_SCOLARE_[data].md` cu checklist bifabil (o linie per clasă/categorie/materie), reguli de siguranță (nimic copiat verbatim din manual, nimic PDF committed), jurnal de execuție. NU începe implementarea până Roland nu confirmă planul de fazare (măcar prima fază/pilot).
- **Rundă AskUserQuestion la start** (înainte de cod): confirmă cu Roland (1) materia/materiile exacte pt clasele 0-IV (doar matematică sau mai mult, dat fiind că sunt pt copiii lui), (2) ordinea de rollout pe clase după pilot, (3) formatul concret al conținutului „Școlare" (planșe printabile ca restul modulului? pagini interactive? amândouă?).
- **Consumatori, în ordine:** 1) tab-ul „Școlare 🌐" din Planșe (placeholder deja existent, Faza 4 din planul original) 2) Editor (bibliotecă matematică) 3) Asistent AI / Chat 4) Calculator 5) Teste — propagă conținutul curricular aliniat pe măsură ce fiecare clasă/materie e gata, nu aștepta să fie totul gata.

---

## D) Investigație OCR — „limite" (formulare nepăstrată) — VERIFICAT, NEREPRODUS

Roland a semnalat: la OCR-ul fișierului `limite_matematica.jpeg`, formularea originală nu se păstrează în output. **Verificare făcută AZI (2026-08-07):**

- Am randat `99_Roland_Work/Teste_Output/limite_matematica.pdf` (fișier din 2026-08-06, recent) ca imagine și l-am comparat vizual, formulă cu formulă, cu `99_Roland_Work/Teste_Input/limite_matematica.jpeg`.
- **Toate cele 9 limite (a-i) se potrivesc exact** — aceiași coeficienți, aceiași radicali, aceleași funcții (sin, rădăcină cubică etc.), aceeași structură. NU am reprodus defectul descris în ACEST fișier.
- Asta e CONSISTENT cu memoria `finding_ocr_test_scorecard_2026_07_31` care scora deja acest fișier **math 10/10**.

**Concluzie onestă: nu presupune bug-ul ca dovedit.** Posibile explicații: (a) Roland a văzut o versiune DIFERITĂ de output (poate din alt flux — ex. Teste-AI „Corectează" în loc de OCR-traducere legacy, sau o rulare mai veche/alta) (b) defectul e pe alt fișier și „limite" a fost doar exemplul dat din memorie, nu neapărat exact. **Sesiunea nouă:** cere-i lui Roland un exemplu PRECIS (ce text anume s-a schimbat, din ce fișier exact, prin ce buton/flux a fost generat) înainte de a începe să „repari" — repro exactă înainte de fix, ca la orice alt bug din acest proiect (R-RECOVERY).

---

## REGULI FERME (neschimbate + una nouă)

- Gate = selftest (harness Node `scratchpad/planse_*.js`, UNTRACKED) + `selftest.html` (`__SELFTEST_OK__===true`), oracolul labirint Python NEATINS.
- NU deploya fără „execută" explicit din partea lui Roland.
- R-COST (tot gratis), R-THEME (tablă verde + cretă, Patrick Hand).
- **NOU — R-COPYRIGHT (Școlare):** programă oficială = sursă de conținut; manuale = referință de citit, NU de stocat/redistribuit; conținut nou = original, aliniat curricular. Niciun PDF de manual committed în git.
- **NOU — raportare live:** status scurt după fiecare pas semnificativ (nu doar la finalul fazei) — cerință explicită Roland, 2026-08-07.

## ORDINE RECOMANDATĂ (de negociat cu Roland la începutul sesiunii, nu impusă)

1. Eyeball restant (rapid, încheie runda anterioară) — sau amână dacă Roland vrea să sară direct la ce-i nou.
2. D) investigație OCR (repro precisă întâi — poate fi rapid dacă Roland dă exemplul exact, sau se închide „nereprodus" dacă nu mai apare).
3. A) integramă multi-formă (motorul e deja construit — cel mai ieftin „win" mare).
4. B) extindere varietate celelalte generatoare (ieftine întâi: unește/dictare/căutare, apoi numere, apoi labirint).
5. C) Școlare — cel mai mare, cere PLAN_SCOLARE separat + AskUserQuestion propriu înainte de cod.

## PROMPT SCURT

> `/onboard`. Continuăm Traduceri Matematică. Planșe e complet + deployat (v39, 6/6 generatoare + coș P4). Roland a cerut 4 lucruri noi (2026-08-07): **A)** integramă cu mai multe forme (nu doar „moară"), aleatoriu după dificultate, complexitate selectabilă — motorul de solver e deja topologie-agnostic, doar geometria e nouă; mock+AskUserQuestion ÎNAINTE de cod (lecția „3 respingeri"). **B)** aceeași extindere de varietate la celelalte generatoare (unește/dictare/căutare = ieftin, numere/labirint = mai scump). **C)** modul „Școlare" — toată programa RO (grădiniță→liceu, Cristina predă V-XII, Roland are nevoie de grădiniță+0-IV pt copiii lui); sursă de conținut = programa oficială (rocnee.eu), manualele (`manuale.edu.ro`, legale/gratuite dar NU de redistribuit) doar ca referință, conținut nou generat original — NICIUN PDF de manual committed în git; cere PLAN_SCOLARE separat (R-PLAN) + AskUserQuestion propriu; acoperire 100% cerută explicit, pilot la alegerea ta. **D)** am verificat „limite_matematica" azi — NU am reprodus bug-ul de formulare semnalat de Roland (9/9 limite corecte); cere-i un exemplu precis înainte de fix. Raportează LIVE statusul fiecărei implementări. Efort: **xhigh**.
