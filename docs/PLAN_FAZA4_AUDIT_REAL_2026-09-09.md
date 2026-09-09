# PLAN — Faza 4: Audit real în browser, modul cu modul, cu fișiere reale

> Creat: 2026-09-09. Respectă R-PLAN (task cu >5 sub-operații, risc real de a rata defecte dacă
> se face pe fugă). **Nu se începe execuția (testarea live) până Roland confirmă acest plan** —
> cerut explicit în acest mesaj și consecvent cu „vei începe rularea doar după ce îți confirm eu"
> din `99_Roland_Work/Fazele_mentiuni_Roland.md` §ORDINEA FAZELOR.

## Ce cere Roland (sursa exactă)

Din `Fazele_mentiuni_Roland.md`:

- **4a — date de test**: „Fisiere reale de la Cristina" → `99_Roland_Work/Teste_Input`, rezultate
  în `99_Roland_Work/Teste_Output`.
- **4b — ordinea modulelor**: „De la cel mai folosit la cel mai rar" (Roland a delegat ordinea
  exactă mie, în mesajul curent: „propune-mi tu ordinea").
- **4c — la defect**: „Notez și continui, reparăm la final" — Faza 4 NU repară nimic pe loc.

Din mesajul curent al lui Roland (prioritizare peste ordinea generală 4b):

1. Riscul de pierdere silențioasă din **Școlare → „➕ În editor"** — verific dacă se reproduce.
2. **Istoric cu date reale** — era netestabil în Faza 3 din lipsă de date.

Din `docs/completari_pt_reparatie.md` (pct. 5, motivul pentru care există caietul de sarcini):
caietul trebuie să permită să testăm și auditam funcție cu funcție, buton cu buton — acesta e
exact rolul lui în Faza 4 (ghid, nu doar inventar).

## Ce NU face Faza 4

- Nu repară niciun defect pe loc (4c) — notează în jurnalul de defecte de mai jos și continuă.
- Nu modifică `frontend/`/`api/` (read-only pe cod; scrie doar în `docs/caiet_de_sarcini*`,
  `99_Roland_Work/Teste_Output/`, acest fișier și, la final, handoff+memorie+`Plan_in_Lucru.md`).
- Nu redeschide Faza 3 (inventarul e considerat corect — dacă un buton lipsește sau e greșit
  descris, se notează ca defect al caietului, nu se rescrie tot modulul).

## De ce acest risc e mai mare decât un rând izolat din caiet

Citind caietul de sarcini integral la secțiunile relevante, același defect pe care Roland l-a
cerut verificat în Școlare **nu e izolat**. `insertEditorText`/`insertEditorImage`
(`frontend/src/lib/editor-commands.ts:49-63`) sunt no-op silențioase dacă handler-ul TipTap nu
s-a înregistrat încă în fereastra de 150ms folosită de fiecare buton „→ Editor". Același tipar
(`setTimeout(..., 150)` + inserare) e folosit de:

| Modul      | Buton                              | Rând caiet                                           |
| ---------- | ---------------------------------- | ---------------------------------------------------- |
| Școlare    | „➕ In editor"                     | linia 347 — **prioritatea 1 explicită a lui Roland** |
| Chat AI    | „➕ In editor"                     | linia 163                                            |
| Teste      | „Trimite testul in Editor"         | linia 219                                            |
| Teste      | „➕ Trimite corectarea in Editor"  | linia 228                                            |
| Calculator | „+ Insereaza rezultatul in editor" | linia 193                                            |
| Calculator | „+ Insereaza graficul in editor"   | linia 199                                            |

**Propunere:** verific riscul o dată, temeinic, la Școlare (pasul 1 — comutare rapidă de tab chiar
în momentul în care handler-ul TipTap ar putea nu fi montat), documentez exact scenariul care îl
reproduce (dacă se reproduce), apoi la fiecare din celelalte 5 butoane repet DOAR acel scenariu
minimal de reproducere (nu un audit complet încă o dată) — ca să nu tratez identic 6 rânduri
independent, când e o singură cauză de cod.

## Ordinea modulelor propusă

**Prioritate explicită (peste ordinea generală, cerută în acest mesaj):**

1. **Școlare** (5 butoane) — risc cunoscut, verificare țintită + audit complet al modulului
   (e mic, îl termin integral cât sunt acolo).
2. **Istoric** (6 butoane) — cu date reale; vezi mai jos limitarea „Istoric traduceri" (legacy).

**Ordinea generală pentru restul (4b, „cel mai folosit → cel mai rar"), motivată prin rolul
Cristinei (profesoară de matematică, secția slovacă) — marcată [PROBABIL], nu am date de
telemetrie per-modul în Supabase (tabela `logs` nu ține un contor de utilizare pe modul, doar
erori/acțiuni punctuale) ca să o marchez [CERT]:**

3. **Editor** (import/OCR + traducere F8 + export, 38 butoane) — modulul central: „Flow unic"
   descris chiar în `CLAUDE.md`, singurul prin care trece fiecare document al Cristinei.
4. **Teste** (Corectare-Generare, 7 butoane) — generare/corectare e o sarcină didactică de rutină.
5. **Chat AI** (7 butoane) — asistent folosit la nevoie, dar frecvent ca sprijin rapid.
6. **Convertor** (5 butoane) — utilitate de conversie, folosită situațional; îl las după ce
   Istoric (pasul 2) a rulat deja butonul principal „Proceseaza" o dată ca sa semene date.
7. **Calculator** (15 butoane) — folosit probabil des, dar fiecare interacțiune e scurtă/simplă;
   complexitate mică, risc mic (exceptând cele 2 butoane „→ Editor" tratate la §risc sistemic).
8. **Planșe** (21 butoane) — fișe interactive suplimentare (offline), probabil cea mai rar
   accesată dintre cele 8 pentru profilul „profesoară de matematică gimnaziu/liceu".

Dacă ai alt clasament real de uz (de exemplu Școlare/Chat AI sunt de fapt mai folosite decât
presupun), spune-mi și rearanjez — ordinea de mai sus e recomandarea mea, nu un fapt verificat.

## Date de test (4a) — mapare fișiere → scenarii

| Fișier (`Teste_Input/`)           | Natură                                        | Folosit la                                                                                                                          |
| --------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `1.2_Unghiuri. Bisectoare.pdf`    | PDF matematică (figuri geometrice + enunțuri) | Editor: import/OCR figuri+LaTeX, traducere RO→SK pe conținut geometric                                                              |
| `limite_matematica.jpeg`          | Imagine cu limite matematice                  | Editor: regresie directă pe bug-ul `\lim` fixat anterior ([[project_lim_display_style_bug_2026_08_08]])                             |
| `2.1_romana.png`                  | Imagine text românesc simplu                  | Editor: OCR text simplu + traducere RO→SK/EN/DE                                                                                     |
| `IMG-20250914-WA0001.jpg`         | Poză reală (telefon, calitate WhatsApp)       | Teste: „📎 Ataseaza poza lucrarii" (corectare) · Chat AI: „📎" (OCR atașare) — testează robustețea OCR pe input „murdar" real       |
| `2.0_test_page_1.jpeg`            | Imagine test generică                         | Rezervă / al doilea input OCR unde e nevoie de un al doilea fișier                                                                  |
| `1.0_Analyse CettaClear 2026.pdf` | PDF non-matematică (raport tehnic)            | Convertor: conversie/compress/split; Editor: import document non-matematic (verifică R-MATH nu e afectat de conținut non-matematic) |
| `1.1_Analyse Filtrasan 2026.pdf`  | PDF non-matematică, al 2-lea document         | Convertor: **Merge** (are nevoie de 2+ PDF-uri) cu `1.0_...`                                                                        |

**Naming rezultate** (extinde convenția existentă din
[[feedback_test_workflow_2026_07_11]] — `D_`/`G_` e specific exportului din Editor cu motorul de
traducere; pentru celelalte module folosesc `<modul>_<scenariu>_<prefix-input>.<ext>`, ex.
`convertor_merge_1.0+1.1.pdf`, `teste_corectare_IMG-20250914-WA0001.txt`):

- Fișiere deja existente în `Teste_Output/` (`1.0_Analyse CettaClear 2026.pdf`,
  `limite_matematica.pdf`) sunt dintr-o sesiune anterioară — **nu le șterg/suprascriu**; ies noi
  fișiere cu nume distincte dacă repet aceleași scenarii.

**Limitare onestă — „Istoric traduceri" (legacy):** fluxul F8 curent NU mai scrie în
`localStorage["sistem_traduceri_history"]` (confirmat în caiet, linia 238). Nu pot produce „date
reale" noi pentru acele 3 butoane (Sterge tot / HTML / PDF Print / DOCX din detaliu) fără o
intrare legacy deja existentă în profilul de browser folosit. Verific dacă profilul curent are
vreo intrare veche; dacă nu, marchez acele rânduri **⬜ nedovedit — limitare structurală, nu
defect** (ca la Faza 3), nu inventez date.

## Metodologie per modul

Pentru fiecare modul, în ordinea de mai sus:

1. Deschid aplicația LIVE pe `https://traduceri-frontend.vercel.app` (nu local — testare pe prod,
   per [[feedback_testing_on_prod.md]]).
2. Parcurg rândurile din `docs/caiet_de_sarcini.md` ale acelui modul, cu fișierele reale mapate
   mai sus (sau input minim direct în UI, pentru butoane fără fișier, ex. Calculator).
3. Pentru fiecare rând: rulez pasul „Cum se testează" din caiet; notez rezultatul.
4. Actualizez `docs/caiet_de_sarcini/data.json` → status: 🟢 (confirmat cum e descris) / 🔴
   (defect — comportament diferit de ce spune caietul sau de ce ar trebui) / 🟡 (parțial/ambiguu)
   / rămâne ⬜ (nu s-a putut forța scenariul, ex. cele „NECUNOSCUT" cu buget mare de efort) — apoi
   regenerez `.md`+`.html` cu `generate.mjs` (ca să rămână fișierul viu, fără drift).
5. Orice defect nou (comportament greșit, nu doar cele deja semnalate în caiet din citire de cod)
   → intră în jurnalul de mai jos, cu dovadă (captură/fișier din `Teste_Output`/log Supabase).
   **Nu repar pe loc (4c).**
6. După fiecare modul: raportez lui Roland un rezumat scurt (progres live, per §6b din
   `Fazele_mentiuni_Roland.md`), nu aștept finalul întregii Faze 4.

Execuție: eu, direct, secvențial, modul cu modul (decizia veche a lui Roland: „subagenți
secvențiali per modul, NU fan-out paralel" — aici nu delegă la subagenți decât dacă volumul unui
modul specific o cere, caz în care rămân tot secvențiali, unul singur activ, cu handoff prin acest
fișier + caiet, nu prin context tacit).

## Jurnal defecte Faza 4 (se completează live — 4c: notez și continui)

| #   | Modul   | Buton/rând                                                     | Ce am observat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Severitate propusă                                                                                                                                                         | Dovadă                                                                                                                                                        |
| --- | ------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Școlare | „Genereaza fisa" (Exercitii)                                   | Am cerut 4 exerciții (Gimnaziu/Clasa a V-a/Matematică, Standard) și fișa generată a avut 5 exerciții + barem. Numărul din dropdown nu e o limită strictă respectată de AI.                                                                                                                                                                                                                                                                                                                                                                        | MICĂ — inconsecvență, nu pierdere de date; poate deruta la generare țintită pe număr exact de itemi.                                                                       | Observat live 2026-09-09, testare Faza 4, modul Școlare.                                                                                                      |
| 2   | Școlare | „➕ In editor" — risc no-op 150ms                              | Riscul e REAL în cod (`editor-commands.ts:49-63`) dar NU s-a reprodus în 2 tentative live (editor nemontat/prima vizită + fișă grea de 20 exerciții/10 pagini imediat după randare KaTeX). Nu am putut simula throttling CPU/rețea cu uneltele de browser disponibile — condiția de cursă rămâne neconfirmată, nu infirmată.                                                                                                                                                                                                                      | NECLASIFICAT — risc de cod confirmat, reproducere live neconcludentă; recomand test cu throttling explicit înainte de a-l considera închis.                                | Testat live 2026-09-09; vezi nota detaliată în `docs/caiet_de_sarcini/data.json` (`scolare-in-editor`).                                                       |
| 3   | Istoric | Lista „Istoric conversii" NU se actualizează live              | Am făcut 2 conversii reale în Convertor (succes confirmat, fișiere descărcate) — Istoric a arătat imediat „(0)", „Nicio conversie in istoric". `localStorage` avea corect ambele intrări. **Cauza confirmată în cod:** `HistoryList.tsx:27-30`, `useEffect(() => { setEntries(getHistory()); setConvEntries(getConversionHistory()); }, [])` — citește localStorage O SINGURĂ DATĂ, la montare; nu re-citește la comutare de tab (SPA, nu re-montează) și nu ascultă evenimente `storage`. Doar un reload complet de pagină aduce datele corecte. | MARE — Cristina ar vedea „nicio conversie" imediat după o conversie reușită, în fluxul ei natural (Convertor → Istoric, fără reload); pare pierdere de date, nu e.         | Reprodus determinist de 2 ori (o dată per conversie); confirmat cu reload → „(2)" apare corect. Cod: `frontend/src/components/history/HistoryList.tsx:27-30`. |
| 4   | Istoric | „PDF (Print)" — eșec silențios la popup blocat, CONFIRMAT live | Documentat deja din citire de cod (Faza 3); confirmat live acum: `window.open` suprascris să returneze `null` (simulează popup blocat) → click pe „PDF (Print)" → 2s, ZERO feedback vizibil (nici mesaj, nici schimbare pe ecran).                                                                                                                                                                                                                                                                                                                | MICĂ-MEDIE — utilizatorul crede că nu s-a întâmplat nimic la un click, fără nicio explicație (nu e pierdere de date, e o acțiune de re-print pe o traducere deja salvată). | Testat live 2026-09-09 cu `window.open` suprascris; vezi `docs/caiet_de_sarcini/data.json` (`istoric-detaliu-print-pdf`, status `live_defect_confirmed`).     |

## Pași

1. [x] **Confirmare Roland pe acest plan** — confirmat 2026-09-09, inclusiv ordinea propusă
       (Școlare → Istoric → Editor → Teste → Chat AI → Convertor → Calculator → Planșe), fără
       completări. Roland a cerut explicit: raport scurt după FIECARE modul (nu doar la final) și
       să semnalez dacă un modul durează mult sau are multe defecte — nu forța finalizarea "dintr-o
       suflare".
2. [x] Școlare — 5/5 butoane trecute prin test live (3 🟢, 1 🟡 parțial, 1 ⬜ deliberat neexersat).
       Risc „➕ In editor": confirmat în cod, NEREPRODUS în 2 tentative live (fără throttling
       disponibil) — rămâne 🟡, nu se declară închis. 1 defect minor nou (4 exerciții cerute → 5
       livrate). Detalii: jurnal defecte #1-#2 + `docs/caiet_de_sarcini.md` (secțiunea Școlare).
3. [x] Istoric — 6/6 butoane testate live (5 🟢, 1 🔴 defect confirmat). „Istoric traduceri" nu
       avea date legacy reale (confirmat: `localStorage` gol) — am injectat manual 1 intrare de
       test minimă, marcată explicit ca sintetică, ca să pot exersa butoanele de export. **Defect
       major nou găsit** (jurnal #3): lista de conversii nu se actualizează fără reload complet
       de pagină (cauză confirmată în cod: `useEffect` cu deps `[]` în `HistoryList.tsx:27-30`).
       Defect deja documentat din Faza 3 confirmat live (jurnal #4): „PDF (Print)" eșuează
       silențios la popup blocat.
4. [ ] Editor — import/OCR (toate cele 4 tipuri de fișier din Teste_Input relevante) + F8
       traducere (RO→SK/EN/DE, inclusiv pe documentul geometric și pe cel cu limite) + document
       (salvare/redenumire/recuperare) + export PDF/DOCX/HTML + toolbar formatare/tabel + inserare
       matematică/figuri + dictare + găsește-înlocuiește (38 butoane — cel mai mare modul).
5. [ ] Teste — generare test + corectare lucrare (cu `IMG-20250914-WA0001.jpg`) + „→ Editor"
       (repet scenariul de risc de la pasul 2) — 7 butoane.
6. [ ] Chat AI — trimitere mesaj + testează + continuă + atașare imagine OCR + gestiune
       conversație + „➕ In editor" (repet scenariul de risc) — 7 butoane.
7. [ ] Convertor — conversie/merge (cu cele 2 PDF-uri non-matematice)/split/compress/editare PDF
       — 5 butoane (Proceseaza deja parțial confirmat la pasul 3).
8. [ ] Calculator — științific/funcții/control-rezultat/grafic + cele 2 butoane „→ Editor" (repet
       scenariul de risc) — 15 butoane.
9. [ ] Planșe — cele 6 generatoare (Numere/Integramă/Labirint/Unește/Dictare/Căutare) + coșul
       multi-fișă — 21 butoane.
10. [ ] Sintetizez jurnalul de defecte: grupez pe cauză reală (nu pe modul — ex. cele 6 butoane
        „→ Editor" devin UN singur grup de reparație, nu 6), propun lista pentru **Faza 4.5**.
11. [ ] Rulez cei trei auditori (R-AUDIT-FAZA) pe rezultatul Faza 4.
12. [ ] Actualizez `HANDOFF_SESIUNE.md` + `Plan_in_Lucru.md` (bifează Faza 4) + memorie +
        commit/push (R-HANDOFF).
13. [ ] STOP (R-STOP-FAZA) — raportez lui Roland; Faza 4.5 (reparațiile) într-o sesiune nouă.

## Reguli de siguranță

- Read-only pe `frontend/`/`api/` — Faza 4 produce dovezi și documentație, nu fix-uri.
- Nu suprascriu fișiere existente în `Teste_Output/` dintr-o sesiune anterioară.
- Un rând rămâne ⬜ dacă scenariul nu poate fi forțat determinist din UI (ex. eșecul unui provider
  AI la mijlocul unui lanț) — nu invoc mesaje de eroare fără să reproduc efectiv cauza.
- Testare pe LIVE (`traduceri-frontend.vercel.app`), nu local — comportamentul de producție e
  singurul relevant pentru Cristina.
- Raport de progres după fiecare modul (pasul din §Metodologie 6), nu doar la final.

## Jurnal execuție

- **2026-09-09:** Roland confirmă planul + ordinea, fără completări. Cere raport după fiecare
  modul (nu doar la final) și semnalare dacă un modul e mare/lent sau cu multe defecte. Pornire
  execuție: pasul 2 (Școlare).
- **2026-09-09:** Pasul 3 (Istoric) **BLOCAT** — extensia Chrome pentru Claude Code nu e conectată
  (`tabs_context_mcp` → "Browser extension is not connected", confirmat și în sesiunea principală,
  nu doar în fork). Nicio modificare, niciun test executat pe Istoric. Faza 4 e în pauză până
  Roland repornește/reconectează extensia (Chrome + login claude.ai cu același cont).
- **2026-09-09:** Roland confirmă reconectarea extensiei. Pasul 3 (Istoric) reluat și dus la
  capăt: 6/6 butoane testate live pe producție. Descoperit 1 defect major nou (lista de conversii
  nu se actualizează fără reload — jurnal #3) + confirmat live 1 defect deja documentat din Faza 3
  (jurnal #4, „PDF (Print)" eșec silențios la popup blocat). „Istoric traduceri" (legacy) testat
  cu 1 intrare sintetică injectată manual, marcată explicit ca atare (profilul nu avea date reale).
  2 fișiere reale salvate în `Teste_Output/` (via Convertor, folosite și ca seed). Fără blocaje
  majore în afară de întreruperea inițială a extensiei; un `window.confirm()` declanșat accidental
  a blocat scurt automatizarea, recuperat prin navigare (fără pierdere de date).
