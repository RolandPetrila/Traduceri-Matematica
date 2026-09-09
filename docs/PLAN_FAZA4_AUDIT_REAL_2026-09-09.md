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

| #   | Modul      | Buton/rând                                                                                     | Ce am observat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Severitate propusă                                                                                                                                                               | Dovadă                                                                                                                                                           |
| --- | ---------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Școlare    | „Genereaza fisa" (Exercitii)                                                                   | Am cerut 4 exerciții (Gimnaziu/Clasa a V-a/Matematică, Standard) și fișa generată a avut 5 exerciții + barem. Numărul din dropdown nu e o limită strictă respectată de AI.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | MICĂ — inconsecvență, nu pierdere de date; poate deruta la generare țintită pe număr exact de itemi.                                                                             | Observat live 2026-09-09, testare Faza 4, modul Școlare.                                                                                                         |
| 2   | Școlare    | „➕ In editor" — risc no-op 150ms                                                              | Riscul e REAL în cod (`editor-commands.ts:49-63`) dar NU s-a reprodus în 2 tentative live (editor nemontat/prima vizită + fișă grea de 20 exerciții/10 pagini imediat după randare KaTeX). Nu am putut simula throttling CPU/rețea cu uneltele de browser disponibile — condiția de cursă rămâne neconfirmată, nu infirmată.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | NECLASIFICAT — risc de cod confirmat, reproducere live neconcludentă; recomand test cu throttling explicit înainte de a-l considera închis.                                      | Testat live 2026-09-09; vezi nota detaliată în `docs/caiet_de_sarcini/data.json` (`scolare-in-editor`).                                                          |
| 3   | Istoric    | Lista „Istoric conversii" NU se actualizează live                                              | Am făcut 2 conversii reale în Convertor (succes confirmat, fișiere descărcate) — Istoric a arătat imediat „(0)", „Nicio conversie in istoric". `localStorage` avea corect ambele intrări. **Cauza confirmată în cod:** `HistoryList.tsx:27-30`, `useEffect(() => { setEntries(getHistory()); setConvEntries(getConversionHistory()); }, [])` — citește localStorage O SINGURĂ DATĂ, la montare; nu re-citește la comutare de tab (SPA, nu re-montează) și nu ascultă evenimente `storage`. Doar un reload complet de pagină aduce datele corecte.                                                                                                                                                                                                                                                                                    | MARE — Cristina ar vedea „nicio conversie" imediat după o conversie reușită, în fluxul ei natural (Convertor → Istoric, fără reload); pare pierdere de date, nu e.               | Reprodus determinist de 2 ori (o dată per conversie); confirmat cu reload → „(2)" apare corect. Cod: `frontend/src/components/history/HistoryList.tsx:27-30`.    |
| 4   | Istoric    | „PDF (Print)" — eșec silențios la popup blocat, CONFIRMAT live                                 | Documentat deja din citire de cod (Faza 3); confirmat live acum: `window.open` suprascris să returneze `null` (simulează popup blocat) → click pe „PDF (Print)" → 2s, ZERO feedback vizibil (nici mesaj, nici schimbare pe ecran).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | MICĂ-MEDIE — utilizatorul crede că nu s-a întâmplat nimic la un click, fără nicio explicație (nu e pierdere de date, e o acțiune de re-print pe o traducere deja salvată).       | Testat live 2026-09-09 cu `window.open` suprascris; vezi `docs/caiet_de_sarcini/data.json` (`istoric-detaliu-print-pdf`, status `live_defect_confirmed`).        |
| 5   | Editor     | Traducere F8 — spații lipsă la marginea unui termen **bold**                                   | Document geometric OCR (`1.2_Unghiuri. Bisectoare.pdf`, Forțează OCR), tradus RO→SK și RO→EN. Sursa RO: „**adiacente** dacă:" / „**suplimentare** dacă..." (spații vizibile). După traducere: SK arată „priliehavé**ak**:" și „sú**doplnkové**ak săčet" — spațiile de la marginea termenului bold DISPAR, cuvintele se lipesc. Reprodus identic pe EN. Confirmat: NU există în sursa RO, apare STRICT după traducere.                                                                                                                                                                                                                                                                                                                                                                                                                | MEDIE — nu e pierdere de date, dar textul devine greu de citit/derutant („priliehavéak" nu e un cuvânt real).                                                                    | Testat live 2026-09-09, RO→SK→EN; `docs/caiet_de_sarcini/data.json` (`editor-translate-switch-lang`, status `live_defect_confirmed`).                            |
| 6   | Editor     | Traducere F8 — cuvinte scurte/punctuație izolate pe linie proprie lângă formule LaTeX inline   | Același test ca #5: propoziții cu formule inline ($O_1$, $O_2$...) separate prin virgulă/conjuncție scurtă ("și"/"a"/"and") ies, DUPĂ traducere, cu virgula sau conjuncția pe o linie PROPRIE, izolată de restul frazei; punctul final după o formulă ajunge și el singur pe propria linie. RO (sursa) NU are acest defect — fraza curge normal pe un rând continuu. Reprodus identic SK și EN.                                                                                                                                                                                                                                                                                                                                                                                                                                      | MICĂ-MEDIE — cosmetic/lizibilitate, nu pierdere de conținut; dă impresia de text „stricat" la prima vedere.                                                                      | Testat live 2026-09-09, aceleași capturi ca #5; `docs/caiet_de_sarcini/data.json` (`editor-translate-switch-lang`).                                              |
| 7   | Editor     | „TEST XI" (titlu) apărut duplicat la import OCR imagine                                        | La importul `limite_matematica.jpeg` (regresie \lim), titlul „TEST XI" a apărut de DOUĂ ori consecutiv în rezultatul OCR. Nu am putut determina dacă imaginea sursă avea titlul scris de două ori (fapt real) sau e un artefact al reconstrucției Gemini — necesită comparație directă cu imaginea originală, neefectuată în acest lot.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | INCERT — necunoscut încă dacă e defect real sau fidelitate corectă a unui titlu dublu din sursă.                                                                                 | Observat live 2026-09-09; `docs/caiet_de_sarcini/data.json` (`editor-import-buton-menu`).                                                                        |
| 8   | Editor     | „Export PDF" — popup blocat în mod consecvent, calea de fallback (iframe) funcționează         | În acest mediu de test, `window.open()` a fost blocat de Chrome inclusiv pentru codul REAL al aplicației (nu doar pentru un monkey-patch de test) — calea principală (fereastră nouă + print) nu s-a putut exersa. S-a exersat automat calea de FALLBACK (iframe ascuns 0×0 + `iframe.contentWindow.print()`): a produs un preview de print funcțional (thread-ul tab-ului s-a blocat scurt, semn de print() real reușit). Recuperat curat prin reload, fără pierdere de conținut (autosave localStorage intact). **Clarificare** față de comentariul din cod (`editor-export.ts:219-236`, „ieșire complet mută"): acel caz e mai restrâns decât pare — necesită ȘI popup blocat ȘI iframe blocat; aici doar popup-ul a fost blocat, iar iframe-ul a funcționat, deci utilizatorul chiar vede un preview de print, nu tăcere totală. | INFORMATIV — nu e defect, e o clarificare/corecție a descrierii din caiet; utile pentru Faza 4.5 dacă se decide să se investigheze de ce popup-ul e blocat în anumite medii.     | Testat live 2026-09-09; `docs/caiet_de_sarcini/data.json` (`editor-export-pdf`, status `live_ok`).                                                               |
| 9   | Teste      | „Genereaza testul" — eșec total (timeout) la teste mari (18-35 itemi, greu+barem)              | Testul cu 10 itemi (implicit, fără barem) a mers instant. La 18 itemi și la 35 itemi (greu + cu barem), AMBELE tentative au picat prin calea de eroare totală: „Niciun provider AI n-a răspuns. Detalii: Gemini Flash: timeout · Gemini Flash (2): timeout · buget lanț depășit (cod E-TEST-001)". Lanțul epuizează tot bugetul de timp pe 2 încercări Gemini și NU mai ajunge la Groq/Mistral (spre diferență de Chat AI, care are toți 5 providerii în lanț) — pentru cereri mari, Teste are de facto doar 2 din 5 provideri utili. Un test de 3 itemi cu barem a reușit instant — deci nu e strict corelat cu „cu barem", pare mai degrabă marime/complexitate totală a promptului + starea providerului Gemini în acel moment.                                                                                                   | MEDIE-MARE — Cristina ar putea genera un test complex (mult folosit didactic) și primi eroare totală în loc de un test parțial util; lanțul de fallback nu ajută la cereri mari. | Reprodus determinist de 2 ori (18 și 35 itemi); testul mic a reușit de 3 ori. `docs/caiet_de_sarcini/data.json` (`teste-genereaza-test`, status `live_partial`). |
| 10  | Teste      | Markdown bold (`**...**`) apare LITERAL (asteriscuri vizibile) în previzualizarea baremului    | În previzualizarea KaTeX/randată a baremului generat de „Genereaza testul", etichetele de răspuns corect apar ca „**b) $6\sqrt{3}$**" — cu asteriscurile Markdown vizibile literal pe ecran, nu convertite în text bold. Formulele LaTeX din interior se randează corect (KaTeX); doar wrapper-ul `**...**` nu e procesat.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | MICĂ — cosmetic, nu afectează corectitudinea conținutului, dar pare neterminat/neîngrijit pe un document destinat printării pentru elevi.                                        | Observat live 2026-09-09 (captură de ecran), testul de 3 itemi cu barem, Clasa VII/Radicali. `docs/caiet_de_sarcini/data.json` (`teste-genereaza-test`).         |
| 11  | Convertor  | Split — mesaj de eroare BRUT (excepție Python), nu cel documentat/generic                      | La un interval de pagini invalid (`abc`) în Split, ecranul arată direct textul intern al excepției Python — „invalid literal for int() with base 10: 'abc' (cod E-CONV-001)" — în loc de mesajul generic documentat în caiet („Eroare interna a serverului..."). Codul E-CONV-001 e anexat corect, dar mesajul principal expune un detaliu de implementare, în engleză, neinteligibil pentru Cristina.                                                                                                                                                                                                                                                                                                                                                                                                                               | MICĂ-MEDIE — nu e pierdere de date, dar mesajul confuz/tehnic contrazice și documentația proprie a proiectului (caietul presupunea mesaj generic).                               | Reprodus determinist 2026-09-09; `docs/caiet_de_sarcini/data.json` (`convertor-proceseaza-split`, status `live_defect_confirmed`).                               |
| 12  | Convertor  | Câmpul „Pagini" păstrează valoarea DINTR-O ALTĂ operație (Split → Editare PDF)                 | Am introdus `abc` în „Pagini de extras" la Split (a produs eroarea #11). La comutarea pe operația **Editare PDF** (complet diferită) → acțiunea „Rotire pagini", câmpul ei „Pagini" a apărut deja completat cu `abc` (nu gol/„all"), producând aceeași eroare bruscă la primul click pe Proceseaza, până am rescris manual valoarea. State-ul paginii nu se resetează la schimbarea operației Convertor.                                                                                                                                                                                                                                                                                                                                                                                                                             | MICĂ — necesită o secvență specifică (eroare la Split, apoi comutare la Editare PDF fără a șterge selecția); confuz dacă apare la Cristina fără explicație.                      | Reprodus 2026-09-09, confirmat prin citirea directă a `input.value` din DOM; `docs/caiet_de_sarcini/data.json` (`convertor-proceseaza-editare-pdf`).             |
| 13  | Calculator | Caiet greșit: `log(100)` documentat cu rezultat „3", live dă „2"                               | Caietul (Faza 3, din citire de cod) spunea „verifica rezultat 3 (logaritm zecimal)" pentru `log(100)`. Testat live: rezultatul REAL e „2" — corect matematic (log10(100)=2). E o eroare de documentație din Faza 3, nu un defect al aplicației; corectată direct în `data.json`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | INFORMATIV — corecție de documentație, nu defect de cod.                                                                                                                         | Testat live 2026-09-09; `docs/caiet_de_sarcini/data.json` (`calculator-functii-suplimentare`).                                                                   |
| 14  | Calculator | Ramura „Expresie incompletă" pare NEATINGIBILĂ din UI — caietul o descrie greșit pentru „sin(" | Caietul spunea: scrie „sin(", apasă „=" → afișează „Expresie incompletă". Testat live: apare mesajul BRUT math.js „Unexpected end of expression (char 5)", nu „Expresie incompletă". Verificat în `calculator-eval.ts:44-48`: ramura „Expresie incompletă" se declanșează DOAR când `evaluate()` reușește și returnează o funcție/undefined (ex. tastat un nume de funcție FĂRĂ paranteză) — dar orice buton din UI inserează funcțiile CU paranteză („sin("), deci acel scenariu nu e atins de niciun buton, doar prin tastare manuală directă în câmp.                                                                                                                                                                                                                                                                             | MICĂ — cosmetic/documentație; codul funcționează ca proiectat, doar exemplul din caiet nu reproduce mesajul pe care îl citează.                                                  | Testat live 2026-09-09; `docs/caiet_de_sarcini/data.json` (`calculator-egal`, status `live_partial`).                                                            |

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
4. [x] Editor — 38 butoane testate live, în 3 loturi (cel mai mare modul din Faza 4). **Lot 1/3**
       (Import/OCR + F8 + Document, 16 butoane, commit `3a6da33`): R-MATH CONFIRMAT (figuri
       geometrice + LaTeX intacte la traducere RO→SK/EN, cache RO instant); regresia `\lim`
       CONFIRMATĂ fără regresie; 2 defecte noi de traducere (jurnal #5-#6: spații lipsă la
       marginea unui termen **bold**; cuvinte scurte/punctuație izolate pe linie proprie lângă
       formule LaTeX inline — ambele doar SK/EN, absente în RO); 1 observație incertă (#7: titlu
       OCR dublat, cauză neclarificată). **Lot 2/3** (Export PDF/DOCX/HTML + toolbar formatare +
       inserare matematică/figuri, ~15 butoane, commit `85a07f2`): toate confirmate live, R-MATH
       ținut și la export; 1 clarificare (jurnal #8, informativ, nu defect): „Export PDF" a
       folosit calea de fallback (iframe) fiindcă popup-ul a fost blocat în mediul de test pentru
       codul REAL al aplicației, nu doar în test — utilizatorul vede totuși un preview real, nu
       tăcere totală. **Lot 3/3** (Dictare vocală + Găsește-înlocuiește, 6 butoane): toate 6
       confirmate live, fără defecte noi; Dictare — toggle Dictează/Oprește + dialogul de
       confidențialitate confirmate funcțional (mediul de test are un dispozitiv audio virtual,
       fără eroare), „Testează microfonul" a rămas ⬜ (bannerul de eroare care îl conține nu s-a
       declanșat niciodată); Găsește-înlocuiește — navigare ▲/▼, „Inlocuiește" (o singură
       potrivire) și „Toate" (toate deodată), toate 3 confirmate exact cum descrie caietul.
       **Total Editor (verificat exact în `data.json`): 29/38 cu o formă de confirmare live** (25
       🟢 clar, 1 🟢 indirect, 2 🟡 parțial, 1 🔴 defect confirmat live pe rândul de traducere) și
       9 rămase ⬜, fiecare cu limitarea de mediu care a blocat-o documentată explicit (PDF
       multi-pagină, 2 ferestre pt coliziune, date legacy, rețea blocată, eroare audio de forțat).
5. [x] Teste — 7/7 butoane testate live. 5 🟢 confirmate (Genereaza testul cu itemi puțini,
       Trimite testul in Editor, 📎 Ataseaza poza lucrarii cu `IMG-20250914-WA0001.jpg`,
       Corecteaza textul, ➕ Trimite corectarea in Editor), 2 ⬜ (Continua raspunsul la generare
       și la corectare — precondiția de trunchiere nu s-a putut forța). Ambele butoane „→ Editor"
       din acest modul NEREPRODUC riscul (grup de risc: 4/6 nereproduse până acum în Faza 4).
       2 defecte noi (jurnal #9-#10): eșec total la teste mari (18-35 itemi) prin timeout pe ambii
       Gemini fără a ajunge la Groq/Mistral; markdown bold literal (`**...**`) în previzualizarea
       baremului.
6. [x] Chat AI — 7/7 butoane confirmate live (Trimite, Testează, Continua răspunsul, 📎 atașare
       OCR — succes cu `IMG-20250914-WA0001.jpg` + eroare fără cod pe fișier non-imagine —,
       Șterge, Copiază, ➕ In editor). Riscul „➕ In editor": al 5-lea test din Faza 4 (după 2×
       Școlare + 2× Teste) — din nou NEREPRODUS, cu o corecție metodologică notată explicit
       (eroare proprie de identificare a butonului „ultimul mesaj", nu defect al aplicației).
       Fără defecte noi. Fișiere: `docs/caiet_de_sarcini/data.json`, `.md`, `.html` (regenerate).
7. [x] Convertor — toate 5 operațiile confirmate live: Conversie (2 conversii reale + gardă .xyz
       DISABLED), Merge (2 PDF-uri reale + gardă format), Split (extras corect + defect nou),
       Compress (~11% reducere reală), Editare PDF (toate 5 acțiuni: rotire/ștergere/reordonare/
       optimizare/watermark, verificate cu pypdf pe un PDF real de 2 pagini). **2 defecte noi**
       (jurnal #11-#12): (11) Split cu interval invalid arată mesajul BRUT al excepției Python
       (`invalid literal for int()...`), nu mesajul generic documentat; (12) câmpul „Pagini" NU se
       resetează la comutarea Split→Editare PDF, păstrează valoarea din operația anterioară.
       Eroarea >4MB nedovedită (niciun fișier din Teste_Input trece de ~300KB, nu s-a inventat unul).
8. [x] Calculator — 15/15 butoane testate live (Științific 11 + Grafic 1 + Matrice/Sisteme 3 —
       ultimele 3, pe sub-tabul „Matrice/Sisteme", nu erau incluse explicit în directiva inițială
       a lotului, dar existau în inventarul caietului; descoperite și testate în plus). Toate 🟢,
       exceptând „=" (🟡 parțial — vezi jurnal #14). **3 butoane „→ Editor"** din acest modul
       (Științific, Grafic, Matrice), toate NEREPRODUS — al 6-lea, 7-lea și 8-lea test al riscului
       sistemic din toată Faza 4. 2 corecții de documentație (jurnal #13-#14, nu defecte de cod).
       Notă metodologică: click-uri sintetice CDP rapide pot insera caractere în ordine inversată
       pe secvențe multi-token (artefact al uneltei de automatizare, INFIRMAT ca bug real prin
       clickuri `.click()` directe în JS, care au dat ordinea corectă de fiecare dată) — semnalat
       inline în `data.json` ca notă pentru testări viitoare, nu ca defect.
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
- **2026-09-09:** Pasul 4 (Editor, 38 butoane) — **modulul cel mai mare, împărțit în 3 loturi**
  pentru actualizări intermediare. **Lotul 1/3 (Import/OCR + Traducere F8 + Document, 16 butoane)
  DUS LA CAPĂT:** 10 🟢 confirmate live (import PDF fără OCR → text brut onest, import cu Forțează
  OCR → figură+LaTeX corecte, „Adaugă la sfârșit", „Vezi originalul", RO→SK→EN cu figuri/formule
  INTACTE, revenire RO instant din cache, Document nou, Redenumește, Salvează indirect confirmat),
  1 incert (badge DeepL — click neconcludent în network log), 5 rămase ⬜ documentat onest (Anulează
  — fără PDF multi-pagină în Teste_Input; ramura „Înlocuiește documentul"; dropdown „scris în";
  „Încearcă din nou"; banner-ele legacy „Adu-l"/„Reîncarcă" — necesită date/ferestre pe care acest
  lot nu le-a avut). **2 defecte noi găsite** (jurnal #5, #6): traducerea F8 pierde spațiul la
  marginea unui termen **bold** („priliehavéak" în loc de „priliehavé ak") ȘI izolează virgula/
  conjuncția scurtă de lângă o formulă LaTeX inline pe o linie proprie — ambele reproduse identic
  pe SK și EN, absente în sursa RO. Regresia `\lim` (fix vechi) confirmată **FĂRĂ regresie**. +1
  observație incertă (jurnal #7, titlu „TEST XI" dublat la un import OCR — cauză neclarificată).
  Extensia Chrome s-a deconectat încă o dată, scurt, în mijlocul lotului — reconectată fără
  pierdere de progres (același tab, stare păstrată). Loturile 2/3 (Export+Toolbar+Matematică+
  Figuri) și 3/3 (Dictare+Găsește-înlocuiește) urmează.
- **2026-09-09:** **Lotul 2/3 (Export + Toolbar + Matematică + Figuri) DUS LA CAPĂT** (commit
  `85a07f2`): toate confirmate live, inclusiv R-MATH la export (formule+figuri corecte în
  PDF/DOCX/HTML). 1 clarificare informativă (jurnal #8): „Export PDF" a mers pe calea de fallback
  (iframe) fiindcă popup-ul a fost blocat chiar pentru codul REAL al aplicației în acest mediu —
  utilizatorul vede un preview real, nu tăcere totală, contrar unei citiri pesimiste a caietului.
  2 capcane de automatizare (coordonate stale la re-deschiderea dialogului „Editează formula",
  timeout de captură CDP) verificate riguros prin DOM și infirmate ca defecte reale.
- **2026-09-09:** **Lotul 3/3 (Dictare vocală + Găsește-înlocuiește) DUS LA CAPĂT** — ultimul lot
  al modulului Editor. 6/6 butoane confirmate live, fără defecte noi. Dictare: toggle
  Dictează/Oprește + dialogul de confidențialitate funcționale (mediul de test are un dispozitiv
  audio virtual, deci fără eroare reală de forțat — „Testează microfonul" rămâne ⬜, motiv
  documentat). Găsește-înlocuiește: navigare ▲/▼, „Inlocuiește" (o potrivire) și „Toate" — toate 3
  confirmate exact ca în caiet, pe un document cu 3 potriviri reale („TEST"→„VERIF"). **Modulul
  Editor (38 butoane) e COMPLET** — 29/38 cu o formă de confirmare live, 9 ⬜ documentate cu
  motivul exact. Pasul 4 bifat cu rezumatul agregat al celor 3 loturi. Următorul: pasul 5 (Teste).
