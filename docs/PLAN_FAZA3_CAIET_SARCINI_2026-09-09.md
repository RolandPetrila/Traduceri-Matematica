# PLAN — Faza 3: Caiet de sarcini (modul → submodul → funcție → buton)

> Creat: 2026-09-09. Respectă R-PLAN (task cu >5 sub-operații). **Nu se începe execuția până
> Roland confirmă acest plan** (per §„ORDINEA FAZELOR" din `99_Roland_Work/Fazele_mentiuni_Roland.md`:
> „vei începe rularea doar după ce îți confirm eu").

## Ce cere Roland (sursa exactă)

> „Ar trebui să avem un desfășurător sau un caiet de sarcini asupra fiecărui modul și a
> submodulelor aferente, funcție cu funcție, buton cu buton, să știm ce execută, să le putem
> testa și audita și, de asemenea, toate acestea ar trebui să poată fi diagnosticate în timp
> real de sistemul implementat." (`completari_pt_reparatie.md`, pct. 5)

Decizii deja confirmate (`Fazele_mentiuni_Roland.md`):

- **3a** — doar butoanele de EXECUȚIE (nu orice element UI decorativ)
- **3b** — construcție: inventar din cod **ȘI** confirmare live (ambele)
- **3c** — livrare în **`.md`** ȘI **`.html`** cu căutare, editabil ca `docs/Fazele.html`
- Mențiune: fișier **viu, auto-actualizabil** — se modifică odată cu codul
- **Preia A5** (decis 2026-09-09): fiecare rând include mesajul acționabil de eroare, nu doar
  ce execută butonul cu succes

## Scope — cele 8 module

Convertor · Editor (import/OCR + traducere F8 + export) · Chat AI · Calculator · Teste · Istoric ·
Planșe (6 generatoare, `public/planse/`, vanilla JS) · Școlare (112 noduri curriculum + desen)

## Structură propusă (o singură sursă → două ieșiri, ca să nu apară drift)

Motivul: proiectul are deja o capcană cunoscută de drift `config/error_codes.json` ↔
`error-catalog.ts`, rezolvată printr-un test anti-drift. Aceeași capcană ar apărea între `.md` și
`.html` dacă le scriu manual separat — **propun generarea ambelor dintr-o singură sursă**:

```
docs/caiet_de_sarcini/data.json        <- sursa unică (per modul → submodul → buton)
docs/caiet_de_sarcini/generate.mjs     <- script care produce .md + .html din data.json
docs/caiet_de_sarcini.md               <- generat (search prin Ctrl+F, versionat clar în git diff)
docs/caiet_de_sarcini.html             <- generat (temă verde, search live, ca Fazele.html)
```

Coloane per buton: **Modul · Submodul · Funcție/Buton (label exact din UI) · Ce execută ·
Cum se testează (pași) · Cod(uri) eroare posibile (din `config/error_codes.json`) · Mesaj
acționabil afișat la eroare · Sursă (fișier:linie) · Status** (⬜ neverificat live — se bifează
la Faza 4, nu acum).

„Auto-actualizabil" = practic, `generate.mjs` se rulează din nou după orice modificare de UI care
adaugă/schimbă un buton; `data.json` e fișierul de editat, nu cele generate direct.

## Interpretarea mea pentru 3b („inventar + confirmare live")

Propun să NU suprapun Faza 3 cu Faza 4 (care are deja decizie proprie: audit real, cu fișierele
din `Teste_Input`, modul cu modul). La Faza 3, „confirmare live" = trec prin fiecare modul în
browser o singură dată, ca să verific că butoanele identificate din cod chiar există, au labelul
scris în caiet și declanșează handler-ul presupus — **nu** un audit funcțional complet cu
documente reale (asta rămâne Faza 4). Dacă vrei altă delimitare, spune-mi înainte să pornesc.

## Execuție — 8 agenți SECVENȚIALI, unul per modul

Per decizia deja luată de Roland („subagenți secvențiali per modul, NU fan-out paralel"): rulez
câte un agent pentru fiecare modul, unul după altul (nu în paralel), care citește componentele +
handlerele de eroare ale acelui modul și scrie intrarea lui în `data.json`. După toate cele 8,
rulez `generate.mjs` și verific vizual (browser) rezultatul `.html`.

## Pași

1. [ ] Schelet `docs/caiet_de_sarcini/data.json` (schema goală) + `generate.mjs` (Markdown +
       HTML temă verde, cu search, din model `Fazele.html`)
2. [ ] Agent 1/8 — Convertor: inventar butoane + coduri eroare + mesaje
3. [ ] Agent 2/8 — Editor (import/OCR, F8 traducere, export PDF/DOCX/HTML)
4. [ ] Agent 3/8 — Chat AI
5. [ ] Agent 4/8 — Calculator
6. [ ] Agent 5/8 — Teste (generare/corectare)
7. [ ] Agent 6/8 — Istoric
8. [ ] Agent 7/8 — Planșe (6 generatoare)
9. [ ] Agent 8/8 — Școlare
10. [ ] Generez `.md` + `.html` din `data.json`; trec rapid prin fiecare modul live (sanity-check
        3b) — corectez orice buton lipsă/greșit găsit
11. [ ] Rulez cei trei auditori (R-AUDIT-FAZA) pe rezultat
12. [ ] Actualizez `HANDOFF_SESIUNE.md` + `Plan_in_Lucru.md` (bifează Faza 3) + memorie +
        commit/push (R-HANDOFF)
13. [ ] STOP (R-STOP-FAZA) — raportez lui Roland, Faza 4 într-o sesiune nouă

## Reguli de siguranță

- Read-only pe aplicație — Faza 3 NU modifică `frontend/`/`api/`, doar produce documentație în
  `docs/caiet_de_sarcini*`.
- Niciun agent nu rulează în paralel cu altul (decizia lui Roland).
- Un item rămâne ⬜ dacă agentul nu a putut confirma din cod ce face un buton — nu se ghicește.

## Jurnal execuție

- **Pas 1-9 (inventar):** 8 agenți secvențiali (unul per modul), rezultate asamblate manual în
  `data.json` după fiecare agent (JSON validat + `.md`/`.html` regenerate la fiecare pas). Total
  inițial: 109 butoane / 40 submodule.
- **Pas 10 (sanity-check live, decizia 3b):** trecere prin Chrome (`https://traduceri-frontend.vercel.app`)
  pe toate cele 8 module din bara laterală, 2026-09-09:
  - **Convertor** — confirmat: zona drag&drop „Trage fisierele aici...", tab-uri Conversie/Merge/Split/Compress/Editare PDF, buton „Proceseaza".
  - **Editor** — confirmat: meniu „Fisier", dropdown „scris în: RO", toggle RO/SK/EN/DE, „Dictează", „+Inserare", „Tabel".
  - **Calculator** — confirmat structura (Științific/Grafic/Matrice); **defect real confirmat live**: butonul „(" din grila Științific are label complet gol (capturat vizual — coincide exact cu ce raportase agentul din cod).
  - **Teste** — confirmat: tab-uri Generează/Corectează, formular clasă/temă/tipuri de item, buton „Generează testul".
  - **Istoric** — confirmat starea goală („Nicio conversie în istoric...") — profilul de test nu are intrări reale, deci butoanele de descărcare/ștergere din listă nu s-au putut vedea pe ecran (gate-ul `entries.length>0` există în cod, dar nu am produs o conversie reală ca să apară vizual). Rămâne **unverified** pentru submodulele cu date, de reluat la Faza 4 cu fișiere reale.
  - **Planșe** — confirmat: tab-urile Numere/Integramă/Labirint/Unește/Dictare/Căutare/Coș, formular Labirint (Nivel/Număr labirinturi/Avansat), buton „Generează".
  - **Școlare** — confirmat: Ciclu/Clasă/Materie/Exerciții, lista de teme cu checkbox-uri, buton „Generează fișa".
  - **Chat AI** — confirmat: lanțul de provideri afișat („Gemini Flash → ... → Mistral Small (2)"), butoane „Trimite"/„Testează", iconița 📎 (verificată prin zoom — e clar o agrafă, nu un microfon, cum documentase agentul).
  - Auditorul `auditor-dovezi` a extins independent verificarea live pe Chat AI, Teste, Planșe
    (a generat efectiv un labirint și a testat coșul) și Școlare — toate confirmate. Singurul gol
    rămas: **Istoric**, nedovedit vizual din lipsă de date reale (același gol pe care l-am semnalat eu mai sus).
- **Pas 11 (auditori R-AUDIT-FAZA):** rulați în paralel, verdicte:
  - `auditor-regresie`: **FĂRĂ REGRESIE** — `tsc 0 · jest 428/428 · pytest 83/83 · build OK`, identic cu baseline Faza 2; niciun fișier din `frontend/`/`api/` atins; `generate.mjs` idempotent (hash identic la rulări repetate, în afară de timestamp).
  - `auditor-dovezi`: **CONFIRMAT** pe eșantion >20 rânduri din toate cele 8 module (surse fișier:linie verificate exact, inclusiv mesajele de eroare citate cuvânt cu cuvânt); **NEDOVEDIT** submodulele Istoric cu date reale (vezi mai sus).
  - `auditor-cerinte`: a găsit 4 abateri reale față de mențiunile scrise ale lui Roland:
    1. **3a (granularitate)** — 5 rânduri nu erau cu adevărat „butoane de execuție" (grupul de
       formatare Bold/Italic/Aliniere — exemplul EXACT exclus explicit de Roland în `Fazele.md`;
       deschide/închide bara de căutare; selectare/ștergere fișier în Convertor — resetări locale
       de stare, fără rețea). **CORECTAT**: cele 5 rânduri eliminate din `data.json`
       (`editor-format-marcaje-text`, `editor-cautare-deschide`, `editor-cautare-inchide`,
       `convertor-zona-incarcare`, `convertor-sterge-selectie`) — total acum **104 butoane / 38 submodule**.
    2. **3b (dovadă scrisă)** — verificarea live se făcuse, dar nu era consemnată nicăieri.
       **CORECTAT**: acest bloc de jurnal.
    3. **3c („aplic modificări exact cum facem în acest html")** — `Fazele.html` are un mecanism
       complet de editare (textarea-uri, autosave `localStorage`, descărcare mențiuni ca `.md`
       nou); `caiet_de_sarcini.html` livrat avea DOAR căutare, fără nimic editabil. **NECORECTAT
       ÎNCĂ** — e o lipsă reală, nu o interpretare liberă; cere o decizie de scop de la Roland
       (vezi întrebarea pusă în chat) înainte de a construi mecanismul, ca să nu presupun ce
       anume trebuie să editeze/exporte.
    4. **„Fișier viu, auto-actualizabil"** — afirmația din antetul generat era mai tare decât
       realitatea (regenerare fără drift ≠ auto-detectare de butoane noi din cod). **CORECTAT**:
       textul din `generate.mjs` reformulat onest; construirea unui mecanism real de detectare
       automată rămâne opțională, de discutat cu Roland (posibil Faza 6 — automatizare).
- **Pas 12-13:** vezi restul handoff-ului/plan-ului + commit, mai jos.
