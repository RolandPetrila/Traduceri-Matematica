# HANDOFF — Editor Documente Matematic (predare către sesiune nouă)

> **Pentru Opus, deschis în `C:\Proiecte\Traduceri_Matematica`.**
> Acest fișier descrie un **editor de documente HTML standalone** construit într-o sesiune
> anterioară (Claude Sonnet, 2026-07-06 → 2026-07-07) și mutat acum în acest folder.
> Utilizatorul (Roland) vrea ca tu să-l **adaptezi/integrezi în proiectul curent** Traduceri_Matematica.
> Citește acest fișier ÎNAINTE să atingi editorul. NU e cod din proiectul Next.js — e un artefact
> separat, portabil, care urmează să fie integrat.

---

## 0. TL;DR — ce citești și în ce ordine

1. Secțiunea **1** (ce e bundle-ul) + **2** (cum îl rulezi și testezi).
2. Secțiunea **5** (CAPCANE TEHNICE) — obligatoriu înainte de orice editare; sunt 6 capcane reale, fiecare descoperită prin bug efectiv.
3. Secțiunea **6** (starea muncii întrerupte) + **7** (ce mai era de făcut).
4. Secțiunea **9** (INTEGRARE în acest proiect) — nepotriviri de arhitectură de discutat cu userul înainte să scrii cod.

**Regula de aur descoperită empiric:** testarea prin `sel.dispatchEvent(new Event('change'))` NU reproduce furtul de focus al unui click real pe `<select>`. Vezi secțiunea 8.

---

## 1. Ce este acest bundle

Un **editor de documente A4 tip Word + Excel + Equation Editor**, într-un SINGUR fișier HTML
self-contained (fără build, fără dependențe externe, funcționează offline, deschis direct în browser).
Construit inițial pornind de la un mock cu brand „Mösslein", curățat de brand și transformat într-un
editor generic, apoi extins masiv pe partea de matematică (gimnaziu + liceu, clasele V–XII).

### Inventar fișiere (toate la rădăcina acestui folder)

| Fișier                                       | Rol                                                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **`Editor_Documente.html`**                  | Editorul complet (~120 KB, ~3100 linii). Fișierul principal.                                               |
| `manifest.json`                              | Manifest PWA (nume, culori temă, iconițe).                                                                 |
| `sw.js`                                      | Service worker (cache offline). Înregistrat automat din HTML (doar pe http(s)/localhost, NU pe `file://`). |
| `icon.svg`                                   | Iconiță sursă vectorială (pagină + semnul radical √, albastru + violet).                                   |
| `editor-icon-192.png`, `editor-icon-512.png` | Iconițe PWA raster (generate cu Python/Pillow — vezi capcana 5).                                           |
| `editor-apple-touch-icon.png` (180×180)      | Pentru „Add to Home Screen" pe iPhone.                                                                     |
| `Porneste_Editor.bat`                        | Dublu-click → pornește server local pe :8791 + deschide editorul în browser. Portabil (`%~dp0`).           |
| `editor-documente-demo.ORIGINAL-backup.html` | Versiunea INIȚIALĂ (cu brand Mösslein), păstrată ca referință istorică. NU e livrabilul.                   |

> **Notă:** fișierele au fost **COPIATE** din `C:\Users\ALIENWARE\Downloads\` (originalele încă există acolo
> ca backup). După ce confirmi că totul merge aici, userul poate șterge copiile din Downloads.

---

## 2. Cum îl rulezi și îl testezi

- **Rulare rapidă:** dublu-click pe `Porneste_Editor.bat` → deschide `http://127.0.0.1:8791/Editor_Documente.html`.
  Fereastra neagră = serverul; se lasă deschisă cât se lucrează.
- **De ce server local și nu `file://`:** click pe `file://...` merge pentru favicon, DAR:
  - PWA install (butonul „Instalează ca aplicație") cere context „sigur": `https://` sau `http://localhost`. Pe `file://` Chrome NU oferă instalarea.
  - Service worker-ul nu se înregistrează pe `file://` (guard în cod: `location.protocol !== "file:"`).
- **Verificare sintaxă JS** (fără browser), utilă după orice edit:
  ```bash
  node -e "const fs=require('fs');const h=fs.readFileSync('Editor_Documente.html','utf8');const m=h.match(/<script>([\s\S]*)<\/script>/);fs.writeFileSync('_ck.js',m[1])" && node --check _ck.js && echo OK && rm _ck.js
  ```

---

## 3. Arhitectura `Editor_Documente.html`

Structură: `<head>` (CSS inline + link-uri PWA) → `<body>` (topbar cu ribbon + foaie A4) → `<script>` (toată logica).

### Zone UI (în `<body>`)

- `.topbar` (sticky) conține:
  - `.titlerow`: buton Înapoi, titlu, contor pagini, buton 🎤 Dictare, input „Nume" document.
  - `.ribbon-tabs`: taburi — **Acasă**, **Inserare**, **Tabel**, **Matematică**, **Fișier**.
  - `.toolbar.tabpanel[data-panel=...]`: câte un panou per tab (doar unul vizibil, restul `hidden`).
  - `.findbar` (Găsește/Înlocuiește, ascuns implicit).
  - `.status`: linia de status (auto-save, mesaje).
- `.sheet-wrap > .page-stack > .page#page[contenteditable]`: foaia A4 editabilă.

### Taburi și ce conțin

- **Acasă:** undo/redo, font, mărime pt, B/I/U/S̶, culoare text, evidențiere, șterge format, stil paragraf, aliniere, liste, indent, buton „Găsește".
- **Inserare:** link, imagine, linie orizontală, dată, întrerupere pagină, tabel nou.
- **Tabel (unelte tip Excel):** +/− rând, +/− coloană, rând titlu, unește/desparte celule, sortare ↑/↓, Σ Total, culoare celulă, dungi zebra.
- **Matematică:** x₂/x² (indice/exponent), select **„Σ Simbol ▾"** (103 simboluri, 9 grupuri), select **„⚟ Structură ▾"** (20 structuri editabile), select **„Clasă ▾"** → select **„Σ Formulă ▾"** (214 formule cascadate pe clase V–XII).
- **Fișier:** Pagină nouă, Salvează, PDF, Word (.doc), HTML.

### Funcții JS cheie

- `cmd(command, value)` — wrapper peste `document.execCommand` (bold, undo, aliniere etc.).
- `block(tag)`, `setFontSize(pt)` — formatare bloc / mărime font.
- `insertSymbol(sel)` — inserează un simbol Unicode (deleagă la `cmd("insertText", v)`).
- `STRUCTURI` (obiect) + `insertStructure(sel)` — generatoarele de structuri matematice editabile (vezi mai jos).
- `FORMULE` (obiect cheie=clasă 5..12) + `onClasaChange(sel)` + `insertFormula(sel)` — catalogul de formule cascadat.
- `applyColor`, `openPalette` — paletarul de culori.
- Tabele: `buildGrid`, `mergeCells`, `splitCell`, `sortTable`, `sumRow`, `addRow/addCol/delRow/delCol`, `toggleHeaderRow`, `toggleZebra`.
- `cleanHTML()` — curăță documentul la export (scoate `contenteditable`, clase de selecție, placeholder, find-highlights).
- `styles()` — CSS-ul injectat în fișierele exportate (HTML/Word). **ATENȚIE:** e un STRING separat de CSS-ul din `<head>` — orice regulă vizuală nouă trebuie adăugată în AMBELE locuri ca exportul să arate la fel.
- Export: `exportPDF()` (= `window.print()`), `exportWord()` (.doc), `exportHTML()`.
- `doAutoSave()` / `scheduleSave()` — auto-save în `localStorage` (cheie `editor_documente_v1`), debounce 500ms.
- Dictare live (Web Speech API, `ro-RO`), paginare A4 (`updatePages`).

### Structurile matematice editabile (`STRUCTURI` + CSS `.eq-*`)

20 tipuri: fracție, radical (cu index), sumă/produs/integrală (cu limite), 4 paranteze, 6 funcții (sin/cos/tg/ctg/ln/log-cu-bază), limită (cu subscript), 2 accente (bară/vector), matrice 2×2 și 3×3.

- Fiecare = un `<span class="eq-struct" data-eq="1" contenteditable="false">` care conține „căsuțe" `<span class="eq-slot" contenteditable="true">` (locurile editabile) + decor.
- Placeholder gol = pseudo-element `▢` (`.eq-slot:empty::before`).
- **Tab / Shift+Tab** navighează între căsuțele aceleiași structuri (handler pe `page` keydown).
- Stivuire verticală (fracție, sumă, limită, accent) = `.eq-stack` cu `display:inline-flex;flex-direction:column`. Matricea = `.eq-matrix-grid` cu `display:inline-grid`.

---

## 4. Jurnal complet — ce s-a executat în această sesiune (cronologic)

1. **Curățare brand:** eliminat tot ce era „Mösslein" (titlu, meniu Antet cu logo/adresă/ISO ROCERT, path-uri imagini, cheie localStorage). Editor 100% neutru.
2. **Reorganizare toolbar în ribbon pe taburi** (Acasă/Inserare/Tabel/Fișier) — ocupă mai puțin spațiu vertical, grupare clară.
3. **Tabele tip Excel:** unire/desparte celule (click + Shift+Click pt selecție bloc), sortare ↑/↓ după coloană, rând Σ Total cu însumare automată, culoare fundal celulă, dungi zebra.
4. **Găsește & Înlocuiește** (Ctrl+F) — funcție Word care lipsea.
5. **Modul Matematică — simboluri:** de la ~55 la **103 simboluri** Unicode, 9 grupuri (aritmetică/relații, puteri/radicali, analiză, mulțimi, logică, geometrie, vectori, combinatorică/statistică, litere grecești).
6. **Modul Matematică — catalog formule:** **214 formule** cascadate pe clasele **V–XII**, grupate pe capitole. Acoperire completă programa RO (aritmetică, fracții, puteri, radicali, identități remarcabile inclusiv grad 3, ecuații gr. I/II, geometrie plană + corpuri, trigonometrie triunghi dreptunghic + oarecare, vectori, progresii, funcții, numere complexe + Moivre, logaritmi, geometrie analitică, combinatorică, binom Newton, matrice + Cramer, limite + nedeterminări, continuitate, asimptote, derivate + aplicații, primitive + integrale, probabilități + variabile aleatoare, structuri algebrice, polinoame). Distribuție: V:30, VI:27, VII:24, VIII:27, IX:25, X:27, XI:29, XII:25.
7. **Verificare matematică independentă (de 2 ori, agenți separați fără context):** găsite și corectate erori REALE — ex.: ecuație vs inecuație cu modul, punct de extrem fără condiția de derivabilitate (despărțit corect în Teorema Fermat = condiție necesară + condiție suficientă), asimptotă verticală formulată ca limită bilaterală (excludea 1/x), asimptotă oblică fără n finit, cazul CU lipsă la congruența triunghiului dreptunghic + ~20 condiții de valabilitate omise (a≠0, x,y>0, g≠0, P(B)>0 etc.). **Toate corectate.**
8. **Structuri matematice editabile** (paleta „Structures" din Word) — cele 20 de tipuri descrise la secțiunea 3.
9. **PWA:** iconiță (pagină + √), manifest.json, service worker, apple-touch-icon, `Porneste_Editor.bat`.
10. **Fix cod (audit + review):** `onClasaChange` folosea `groups = {}` (risc coliziune cu `Object.prototype`) → schimbat în `Object.create(null)`.
11. **[ÎNTRERUPT] Fix selecție (Step A)** — vezi secțiunea 6.

---

## 5. CAPCANE TEHNICE (citește OBLIGATORIU înainte să editezi)

Fiecare a fost un bug real, prins prin testare. Sunt subtile și se repetă ușor.

1. **`<table>` NU e valid în interiorul `<p>`/`<span>`** (regulile HTML5 de content model). Dacă generezi o structură inline (fracție, matrice) cu `<table>`, browserul o restructurează silențios la inserare și o golește. → Toate structurile folosesc DOAR `<span>` + flex/grid.
2. **`execCommand("insertHTML")` șterge atributul `contenteditable`** din conținutul inserat (sanitizare Chrome, ca la lipire). Structurile editabile trebuie inserate cu **Range API direct** (`range.insertNode`), care păstrează atributele. Vezi `insertStructure`.
3. **`contenteditable` imbricat:** o `.eq-slot` (editabilă) trebuie să fie în interiorul unei carcase `contenteditable="false"` (`.eq-struct`), altfel moștenește editabilitatea paginii și `.focus()` pe ea nu creează un „editing host" separat. Carcasele au explicit `contenteditable="false"`.
4. **`page.focus()` orb rupe inserția în căsuțe:** când selecția era într-o `.eq-slot` și userul dă click pe un `<select>` din toolbar, focusul pleacă; un `page.focus()` mută cursorul în pagină și inserția (ex. →) aterizează greșit. → Fix: `savedRange` + `restoreEditableSelection()` (Step A, secțiunea 6).
5. **Descărcarea programatică din browser e blocată de Chrome** (necesită „user gesture" real). Generarea PNG prin canvas + `<a download>` NU salvează fișierul din automatizare. → Iconițele au fost desenate direct în **Python/Pillow**, scrise pe disc.
6. **Neconcordanță de coordonate la testarea în browser:** spațiul de click al tool-ului diferă de `innerWidth` (raport ≈0.92, `devicePixelRatio` 1.125). Coordonatele din `getBoundingClientRect()` trebuie scalate cu `1568/window.innerWidth` (și `726/window.innerHeight`) înainte de click. Altfel click-urile ratează ținte mici.

**Bonus (proces):** un linter reformatează `Editor_Documente.html` între Read și Edit → **re-citește imediat înainte de fiecare Edit**, altfel primești „File has been modified since read". Fișierul e în afara `G:\My Drive`, deci NU e sync Google Drive — e doar linter.

---

## 6. Starea muncii ÎNTRERUPTE (Step A — fix selecție)

Utilizatorul m-a oprit în mijlocul implementării fix-ului de selecție. Stare exactă:

- **Cod: COMPLET. Testat în browser: NU (întrerupt fix înainte de test).** Sintaxă JS validată cu `node --check` (OK).
- Ce am adăugat în `<script>` (înainte de `/* comenzi */`):
  - `let savedRange = null;`
  - Listener `document.addEventListener("selectionchange", ...)` care salvează ultimul Range aflat în pagină (`if (isInPage(r.startContainer)) savedRange = r.cloneRange();`).
  - `restoreEditableSelection()` — dacă `savedRange` e valid și `isConnected`, focusează cel mai apropiat `[contenteditable="true"]` host și restaurează range-ul; altfel fallback `page.focus()`. Wrap în try/catch pentru range detașat.
- Am înlocuit `page.focus()` cu `restoreEditableSelection()` în: `cmd`, `block`, `setFontSize`, `applyColor` (ramura text/hl), `insertStructure`, `insertFormula`. (`insertSymbol` deleagă la `cmd`, deci e acoperit automat.)

**De ce contează:** ăsta e fix-ul pentru bug-ul raportat de user — „în căsuța de jos [a structurii lim] nu pot să scriu → pentru că îl poziționează în alt loc". După Step A ar trebui să meargă, DAR trebuie testat cu metodologia corectă (secțiunea 8), pentru că testul greșit dă fals-pozitiv.

**Primul lucru de făcut în sesiunea nouă:** testează Step A cu scenariul literal al userului (structura lim → cursor în căsuța sub → inserează → din select Simbol → verifică că → e în căsuță, nu în pagină).

---

## 7. Ce mai era de făcut (TODO rămas, prioritizat)

Cererea completă a userului din ultimul mesaj (înainte de întrerupere), plus ce reieșise:

**Prioritate 1 — verifică Step A** (fix selecție, cod gata, netestat). Vezi secțiunea 6 + 8.

**Prioritate 2 — Quickbar persistent (Step B, NEÎNCEPUT):**

- Un rând mereu-vizibil (nu în tabpanel-uri) cu: 🗎 Nou, ↶ Anulează, ↷ Refă, 💾 Salvează, 🖨 Print, ⬇ PDF/Word/HTML + indicator auto-save.
- Scoate tabul **Fișier** și butoanele undo/redo din **Acasă** (devin persistente în quickbar).
- **NU reimplementa undo** cu stivă proprie — `execCommand('undo')` e scoped pe editing host-ul focusat; cu `contenteditable` imbricat undo nu traversează host-urile. Butoanele persistente = doar VIZIBILITATE. Acceptă limitarea (cazul 99% = scris în pagină = OK) și menționeaz-o.
- **Actualizează textul placeholder** din foaie — încă listează „Acasă / Inserare / Tabel / Fișier" (după ce scoți Fișier).
- Asigură-te că `newFile()` are un loc în quickbar.

**Prioritate 3 — Search math cu autocomplete (Step C, NEÎNCEPUT):**

- Un input de search în tabul Matematică care, după primele litere, arată instant funcții/categorii/formule.
- Index din: cele 103 simboluri (text+valoare), cele 20 structuri, toate cele 214 formule (grup+nume+html, pe clase).
- Rezultatele = `<div>`-uri clickabile (click = inserare prin ACELAȘI `restoreEditableSelection()`).
- **Bonus important:** rezolvă și plângerea „Varianta rapidă (formulă gata făcută) NU o găsesc" — cu search, userul scrie „limita" și găsește direct.
- **Bonus test:** rezultatele fiind `<div>`-uri clickabile (spre deosebire de `<select>` native), pot fi click-uite în automatizare → devin harnașamentul de test pentru toată mașinăria de selecție (vezi secțiunea 8).

**Prioritate 4 — Polish front-end (Step D, NEÎNCEPUT):**

- „smart, inovativ, ușor de utilizat, complet pe matematică, front-end calitativ și frumos, adaptat pt editor fișiere matematic".
- Stilizare quickbar + dropdown search, placeholder căsuțe mai vizibil, coerență vizuală.
- (`/improve` și `/imbunatatiri` — userul le-a cerut „aplicate în fișier". Sunt skill-uri de cercetare web = unealtă greșită pt un fișier HTML offline self-contained. Aplică îmbunătățirile DIRECT, nu invoca skill-urile.)

**Alt punct deschis (discoverability):** „Σ Formulă ▾" e `disabled` până alegi clasa — poate deruta. Search-ul (Step C) atenuează asta; opțional un hint vizual.

---

## 8. Metodologie de testare (insight critic de la advisor)

**Capcana #1 a testării:** validarea prin `sel.value = X; sel.dispatchEvent(new Event('change'))` NU mută focusul — deci NU reproduce furtul de focus al unui click real pe `<select>` native. Un test așa dă VERDE fals despre exact bug-ul de selecție pe care-l repari.

**Cum testezi corect fix-ul de selecție:**

- Simulează explicit pierderea focusului ÎNAINTE de inserare: `document.querySelector('select').focus()` (sau `blur()` pe slot), APOI declanșează inserarea, APOI verifică că simbolul a aterizat în `slot.textContent`, nu în pagina principală.
- Rulează scenariul literal al userului cel puțin o dată: structura `lim` → cursor în căsuța `eq-limit-sub` → inserează `→` → assert că e în căsuță.
- `<select>` native nu-s clickabile fiabil prin coordonate (de-aia s-a folosit dispatch). Search palette-ul (Step C), fiind `<div>`-uri reale, e clickabil → folosește-l ca harnașament de test pentru selecție.

**Alte note testare:**

- Scalează coordonatele: `x_click = round(rect.centerX * 1568/innerWidth)`, `y_click = round(rect.centerY * 726/innerHeight)` (capcana 6).
- Datele base64/cookie sunt uneori blocate de filtrul de siguranță al tool-ului browser → verifică prin `textContent`/`length`/flag-uri boolean, nu prin dump de base64.
- După fiecare structură inserată, verifică `cleanHTML()` NU conține `contenteditable` (export curat).

---

## 9. INTEGRARE în proiectul Traduceri_Matematica — de discutat cu userul înainte de cod

Editorul e un artefact **standalone vanilla**; proiectul e **Next.js 14 + Tailwind + MathJax/LaTeX**. Sunt nepotriviri reale de decis ÎNAINTE de a scrie cod (nu presupune o cale — întreabă userul):

1. **Formule: Unicode/HTML vs LaTeX.** Editorul folosește simboluri Unicode + structuri `contenteditable` (span-uri). Pipeline-ul proiectului e **LaTeX + MathJax** (`math_protect.py`, protejare formule la traducere). Cele două modele de reprezentare a matematicii sunt DIFERITE. De clarificat: editorul produce LaTeX? sau rămâne Unicode/HTML și se convertește? Impact major asupra modulului „traducere" (formulele trebuie să rămână intacte la switch RO→SK).
2. **Formă de integrare:** (a) rută/pagină standalone (iframe sau `<div dangerouslySetInnerHTML>` cu HTML-ul editorului), sau (b) port real în componente React + Tailwind. (a) e rapid dar izolat; (b) e curat dar reimplementezi contenteditable-ul în React (muncă mare). De ales cu userul.
3. **Temă vizuală:** proiectul are temă „tablă verde (#2d5016) + text cretă (alb/galben)". Editorul e albastru/violet/gri-închis. La integrare, adaptează paleta la tema proiectului.
4. **Rol în cele 6 module:** editorul se potrivește cel mai natural la **„Calculator matematic"** (modul 4) sau ca editor îmbunătățit pentru **pașii 2–3 editabili** din fluxul de traducere (unde Cristina corectează OCR-ul/traducerea). Confirmă cu userul unde îl vrea.
5. **Sursa unică de adevăr a proiectului:** `99_Plan_vs_Audit/PLAN_v3.md`. Orice integrare trebuie reconciliată cu planul + convențiile din `CLAUDE.md` (commit+push după modificări, servicii gratuite, docs în RO / cod în EN).
6. **PWA:** proiectul e deja PWA (Next.js). `manifest.json`/`sw.js`/iconițele mele sunt pentru editorul standalone — la integrare în Next.js NU le folosi ca atare (Next are propriul manifest); reține doar iconița `icon.svg` ca posibil asset dacă se dorește.

---

## 10. Rezumat acoperire matematică (pentru referință rapidă)

- **103 simboluri** Unicode, 9 categorii.
- **20 structuri editabile** (fracție, radical, Σ/∏/∫ cu limite, paranteze ×4, funcții ×6, limită, accente ×2, matrice 2×2 & 3×3).
- **214 formule** verificate matematic (2 runde independente), pe clasele V–XII, grupate pe capitole conform programei RO.
- **x₂ / x²** (indice/exponent) în tabul Matematică.
- Export păstrează formatarea matematică (CSS `.eq-*` inclus în `styles()` pentru HTML/Word).

---

_Autor handoff: sesiune Claude Sonnet, 2026-07-07. Editorul e funcțional și testat până la punctul 10 din jurnal; Step A (fix selecție) e cod-complet dar netestat în browser; Step B/C/D neîncepute. Succes la integrare._
