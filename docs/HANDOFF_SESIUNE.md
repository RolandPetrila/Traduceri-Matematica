# HANDOFF SESIUNE — reluare context 100% (editor TipTap + stare proiect)

> Ultima actualizare: 2026-07-26. Scop: o sesiune NOUĂ reia exact de unde am rămas, cu tot contextul operațional.

---

## ⚡ PROMPT DE RELUARE (lipește-l ca PRIMUL mesaj în sesiunea nouă)

```
/onboard

Apoi citește INTEGRAL, în ordine:
1. docs/HANDOFF_SESIUNE.md — secțiunea „📋 BACKLOG MATEMATICĂ (2026-07-26)" de sus = munca ACTIVĂ; secțiunile „SESIUNE 2026-07-26 (3)/(2)" = ce e deja făcut + LIVE.
2. docs/PLAN_math_academic_2026-07-26.md (KaTeX M1–M5) + docs/PLAN_editor_tiptap_2026-07-23.md (editor F0–F6)
3. git log --oneline -20 (jurnalul fazelor)

Context: editorul matematic (branch faza-g-editor) e LIVE pe traduceri-frontend.vercel.app. Deja făcute + LIVE: formule EDITABILE (click pe formulă → dialog), PALETĂ simboluri one-click în constructor + editare, fix radical în limită, persistența schiței. Datele bibliotecii: frontend/src/components/editor/math-data.json (214 formule, clase V–XII + 103 simboluri). Acum EXTINDEM.

Execută BACKLOG-ul matematică (detaliat mai jos în handoff), în ordinea priorității:

1. GHID DE SINTAXĂ / HINT-URI în „Construiește" + „Editează formula": panou de ajutor (pliabil) cu sintaxa pentru TOATE construcțiile — putere a^{1}→a¹, indice a_{1}→a₁, fracție \frac{a}{b}, radical \sqrt{}/\sqrt[n]{}, integrală \int, sumă \sum, limită \lim, produs \prod, trig, matrice, sisteme etc. — fiecare „ce scriu → ce obțin", ca Cristina să poată genera ORICE, nu doar ce e în paletă.

2. FORMULE LUNGI: la editare + pe foaie o formulă lungă IESE DIN CHENAR și se afișează deformat (screenshot 232). Repară: nodul math pe foaie să se încadreze (wrap/scroll/scalare, fără să spargă A4); dialogul „Editează formula" responsiv + previzualizare scrollabilă.

3. EXPLICAȚII la formule (toate clasele): fiecare formulă din bibliotecă să aibă o EXPLICAȚIE, dar explicația să NU se scrie pe foaie la inserare — doar formula. Explicația e pentru profesor (în meniu / tooltip / rând extensibil). CONEXIUNE cheie: unele intrări actuale au proza stocată CHIAR în `latex` (ex. „se înmulțesc ca numere naturale…") → de-aia se afișează deformat (screenshot 232/233); auditează cele 214, separă formula curată de explicație (câmp `explicatie` nou).

4. EXTINDERE PROGRAMĂ 5–12 (cercetare exhaustivă): module/grupuri care acoperă TOATĂ materia RO clasele 5–12 — algebră, geometrie (+ figuri geometrice), analiză, trigonometrie, teoreme (cu explicații) etc. Cercetează exhaustiv (~95% acoperire), grupează cu cele existente, totul editabil + ușor de folosit. Fă întâi o TAXONOMIE + plan (clase × domenii) și cere confirmarea ÎNAINTE de a autor sute de formule; fiecare formulă = LaTeX validat KaTeX + corect matematic (R3, ca la M4). Extinde funcțiile existente să fie mai interactive/smart.

Respectă §17 (clarifică FORMA per funcție cu mock înainte de cod), gate-ul de non-regresie (tsc 0 · build · probă 390px+desktop · 28+ teste), R-MATH (0% pierdere notație), R-COST (gratuit), R-HANDOFF (ține fișierele la zi + commit/push; deploy prod DOAR cu confirmarea lui Roland). Începe confirmând ce ai înțeles + ce e deja posibil vs de construit, cu mock-uri.
```

---

## 📋 BACKLOG MATEMATICĂ (2026-07-26) — MUNCA ACTIVĂ pentru sesiunea următoare

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
