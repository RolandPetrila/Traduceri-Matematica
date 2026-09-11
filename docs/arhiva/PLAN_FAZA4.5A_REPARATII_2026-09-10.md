# PLAN — Faza 4.5a: reparații contenite, risc redus, verificabile determinist

> Creat: 2026-09-10. Respectă R-PLAN (task cu >5 sub-operații, risc de regresie pe module
> deja auditate). **NU se începe implementarea până Roland confirmă acest plan.**
> Continuă direct din `docs/PLAN_FAZA4_AUDIT_REAL_2026-09-09.md` (16 defecte găsite, grupate
> P1-P7 + riscul „→ Editor") și din decizia lui Roland din acest chat (2026-09-10).

## Decizia lui Roland — scop și motiv (sursa exactă, acest chat)

Faza 4.5 se împarte în două, **pe criteriu de risc, nu de severitate**:

- **Faza 4.5a (acest plan)** — fixuri contenite, verificabile determinist: P1, riscul „→ Editor",
  P4, P5, P6, P7.
- **Faza 4.5b (sesiune separată, NU acum)** — P3 (traducere F8 — atinge pipeline-ul R-MATH) și P2
  (timeout lanț AI la Teste mari — defect LATENT, cere măsurare pe providerul real). Motivul lui
  Roland: „pipeline-ul de traducere [merge] singur, într-o fază proprie, ca o regresie acolo să
  fie izolabilă."

Reguli impuse de Roland pentru 4.5a (vezi §Reguli de execuție mai jos): plan scris + confirmare
înainte de cod; dovadă live per item (nu doar poartă verde); bump `CACHE_VERSION`; deploy
auto-autorizat după poartă verde; output-uri text din verificări salvate în `Teste_Output`;
disciplină explicită de commit doar la coordonator, în orice prompt de fork.

## R-DIAG-AUTO — ce a confirmat jurnalul Supabase (rulat 2026-09-10, înainte de acest plan)

Interogat direct `logs` din proiectul Supabase `tenders-ro` (`ywlykyyivthpsxfkdwzl`), ultimele
7 zile, toate nivelele (388 rânduri: 179 action · 147 info · 33 error · 29 warn). Pe scurt:

| Cod                         | N (7z)    | Ultima apariție  | Verdict                                                                                                                                                          |
| --------------------------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `E-CONV-001`                | 4         | 2026-09-10 08:13 | **Corobat P5** — `invalid literal for int() with base 10: 'abc'` la split/edit-pdf, exact din timpul auditului live                                              |
| `E-PLAN-001`                | 4         | 2026-09-10 08:14 | **Corobat P6** — `dictare`/`uneste`, `produced:0-1` din `requested:2`, formă fixă                                                                                |
| `E-TEST-001` + `E-NET-001`  | 2+4       | 2026-09-09 19:36 | **Corobat P2** (deja în 4.5b) — „Gemini Flash: timeout ×2 · buget lanț depășit", reprodus real, nu doar de auditor                                               |
| `E-NET-003`                 | 29 (warn) | azi              | Cunoscut, RECUPERAT automat (framing Vercel la cold start) — zgomot de fond acceptat, nimic de făcut                                                             |
| `E-EDIT-003`                | 10        | 2026-09-07 14:58 | Istoric, NU recurent din 09-07 — cluster de testare „memorie plină" (Faza 2, deja închisă); vezi observația de mai jos                                           |
| `E-TRANS-001`/`E-TRANS-005` | 5+2       | 2026-09-07       | Istoric — dinainte de fix-urile Faza 1/2 (retry button, `readJson`); nerecurente de atunci                                                                       |
| `E-APP-001`                 | 1         | 2026-09-07 11:39 | `ChunkLoadError` (tab vechi după un deploy) — clasă SPA cunoscută, o singură apariție, neactionabil fără o strategie de retry-pe-chunk (scop separat, nu 4.5a)   |
| `(fără cod)`                | 1         | 2026-09-03       | Eroare instalare Service Worker, o singură apariție, fără context salvat (SW-level, în afara pâlniei `reportFailure`) — semnalez ca gol de diagnostic, nu ca bug |

**Observație nouă, nu era pe lista P1-P7:** clusterul `E-EDIT-003` (2026-09-07, 10 evenimente)
conține 3 cauze distincte — quota `localStorage` depășită (2×, cea documentată și reparată în
Faza 2 cu eviction+alarmă), plus `"Access to storage is not allowed from this context"` (4×) și
`"The operation is insecure."` (2×), ambele simptome tipice de storage blocat într-un context
restricționat (privat/automatizat), NU de utilizare normală. Toate 10 sunt din aceeași fereastră
de 30 min, pe `/editor-nou` și `/editor` — coincide cu testarea live a itemului 2.A/„memorie
plină" din Faza 2. **Nu a mai recidivat în 3 zile** → nu îl adaug la scope-ul 4.5a; îl notez aici
ca reper, de revizitat dacă reapare.

**Concluzie R-DIAG-AUTO: niciun defect nou de prioritate ridicată. Jurnalul confirmă exact P1-P7

- riscul „→ Editor", nimic altceva de adăugat la scope.**

## Baseline poartă — măsurat 2026-09-10, ÎNAINTE de prima modificare

Cerut explicit de Roland: „fără el, «fără regresie» la final e o afirmație, nu o măsurătoare."

```
tsc --noEmit         → 0 erori
jest                  → 26 suite, 428/428 teste, PASS
next build            → Compiled successfully, 10/10 pagini statice, OK
pytest api/tests -q   → 83 passed, 20 warnings (Pillow getdata deprecation, preexistent)
```

Verdictul de „fără regresie" la finalul fazei se raportează prin comparație directă cu acest
rând, nu ca afirmație separată.

## Ce NU face Faza 4.5a

- Nu atinge `translation_router.py`, `math_protect.py` sau orice cod de pe calea de traducere F8
  (P3 — Faza 4.5b).
- Nu atinge lanțul AI / bugetul de timp din Teste (P2 — Faza 4.5b).
- Nu redeschide caietul de sarcini sau auditul Fazei 4 altfel decât notând rezultatul reparațiilor.

## Itemii Fazei 4.5a — diagnostic confirmat în cod + fix propus + verificare

### 1. P1 — Istoric: lista de conversii nu se actualizează live

**Cauza confirmată:** `HistoryList.tsx:27-30` citește `localStorage` o singură dată,
`useEffect(() => {...}, [])`. Dar `page.tsx:172-174` montează `<HistoryList/>` PERMANENT (ca toate
modulele — `display:none`/`block`, nu unmount/remount la schimbare de tab) → efectul rulează o
singură dată, la încărcarea aplicației, nu la fiecare vizită a tab-ului Istoric. Convertorul scrie
o intrare nouă prin `addConversionToHistory` (`storage.ts:57-75`), dar nu anunță pe nimeni — nu
există niciun eveniment/listener. Rezultatul: lista pare înghețată la starea de la load, deși
datele din `localStorage` sunt corecte (confirmă handoff-ul: „pare pierdere de date, nu e").

**Fix propus:**

- `storage.ts`: după `localStorage.setItem` reușit în `addToHistory` (linia 22) și
  `addConversionToHistory` (linia 62), `window.dispatchEvent(new Event("history-updated"))`.
- `HistoryList.tsx`: în `useEffect` existent, extrage citirea într-o funcție `refresh()`, apel-o
  la mount ȘI la `window.addEventListener("history-updated", refresh)`, cu cleanup la unmount.

**Fișiere:** `frontend/src/lib/storage.ts`, `frontend/src/components/history/HistoryList.tsx`.

**Verificare live:** conversie reușită în Convertor → comută pe Istoric FĂRĂ reload → intrarea nouă
apare imediat. Captură + `docs/dovezi/`.

**Teste:** test nou pe `HistoryList` (React Testing Library, dacă infrastructura de test există
pentru componente — altfel test unitar pe `storage.ts` care verifică dispatch-ul evenimentului) +
un test care simulează `history-updated` și verifică re-render.

---

### 2. Riscul „→ Editor" — fix defensiv (coadă de comenzi)

**Cauza confirmată:** `frontend/src/lib/editor-commands.ts` e un registru simplu —
`insertEditorText`/`insertEditorImage` apelează `textInserter?.(...)`/`imageInserter?.(...)`; dacă
`EditorTiptap` nu și-a înregistrat încă inserter-ul (`setEditorTextInserter`/
`setEditorImageInserter`, în `EditorTiptap.tsx:189-272`) în momentul apelului, `?.()` face NO-OP
TĂCUT — conținutul se pierde, fără eroare, fără log. Apelanții (`page.tsx:119,128,133,141,152-168`
pentru Chat/Calculator/Teste/Școlare) compensează cu `setTimeout(..., 150)` înainte de apel, pe
prezumția că 150ms sunt suficiente ca `EditorTiptap` să se fi montat — un număr magic, nu o
garanție. (Notă: fișierul chiar există la calea numită în handoff — corectez doar detaliul că
insert-urile în sine NU sunt în el, ci în `EditorTiptap.tsx`; registrul e punctul corect de reparat.)

**Fix propus (coadă, nu throttling):**

- `editor-commands.ts`: adaugă cozi `pendingText: string[]` / `pendingImages: {src,alt}[]`. Când
  `insertEditorText`/`insertEditorImage` e apelat și inserter-ul curent e `null`, împinge în coadă
  în loc să renunțe. Când `setEditorTextInserter(fn)`/`setEditorImageInserter(fn)` primește un `fn`
  non-null (editorul tocmai s-a montat), golește coada imediat prin `fn`.
- Plasă de siguranță: dacă un item stă în coadă peste un prag (ex. 4000ms — editorul nu s-a montat
  niciodată, bug real în altă parte), scoate-l din coadă și raportează vizibil (`reportFailure`,
  cod nou sau `E-APP-001`, `userHint`: „Conținutul nu a putut fi inserat în Editor. Deschide manual
  tab-ul Editor și reîncearcă.").
- Apelanții (`page.tsx`, cele 6 locuri din caietul de sarcini) scapă de `setTimeout(..., 150)` —
  apelează direct după `handleTabChange("editor")`; coada absoarbe orice întârziere de montare.

**Fișiere:** `frontend/src/lib/editor-commands.ts` (miezul fix-ului — un singur loc pentru toate
cele 6 butoane), `frontend/src/app/page.tsx` (elimină cele 4 `setTimeout` proprii).

**Verificare live:** comutare rapidă cross-tab (Chat/Calculator/Teste/Școlare → Editor) repetată de
mai multe ori, inclusiv pe conexiune lentă (throttling DevTools) ca să crească șansa montării
târzii a editorului — confirmă că textul/imaginea ajunge mereu, sau că apare mesajul vizibil dacă
nu ajunge niciodată (nu mai există al treilea rezultat: „nimic, tăcut").

**Teste:** test unitar pe coada din `editor-commands.ts` (apel înainte de înregistrare → flush la
înregistrare; apel care depășește pragul → `reportFailure` chemat).

---

### 3. P4 — popup blocat silențios (Istoric „PDF Print")

**Cauza confirmată:** `HistoryDetail.tsx:99-111`, `handlePrintPdf`: `window.open("", "_blank")` →
dacă `win` e `null` (popup blocat), `if (win) {...}` nu face NIMIC — și `logAction("Re-print PDF
din istoric", ...)` tot se apelează, necondiționat, la linia 110, deci telemetria RAPORTEAZĂ succes
pe un eșec. Editorul are deja un tipar mai robust (`editor-export.ts:186-234`: fallback iframe +
`reportFailure` cu `userHint` dacă și iframe-ul eșuează), dar Roland a indicat explicit tiparul
Planșe (`frontend/public/planse/app.js:421-435` + `render.js:36-40`): `openPrintWindow` întoarce
`null` la blocare, apelantul creează un `Blob`+`URL.createObjectURL` și inserează un link vizibil
„Fereastra de print a fost blocată. Deschide foaia de print →" lângă acțiuni.

**Fix propus:** în `HistoryDetail.tsx`, la `win === null`:

- Construiește `Blob([sanitizeHtml(entry.html)], {type: "text/html"})` + `URL.createObjectURL`,
  afișează o notă inline cu link (mirror Planșe), similar ca poziție cu eroarea DOCX existentă
  (`docxError`, linia ~85-95) — adaugă un state `printFallback: string | null` (URL-ul) în loc de
  boolean, curățat (`URL.revokeObjectURL`) la următoarea tentativă/unmount.
- Mută `logAction("Re-print PDF din istoric", ...)` STRICT în ramura de succes (`if (win) {...}`),
  nu în afara ei.
- **OBLIGATORIU, nu opțional (corecție Roland 2026-09-10):** ramura de eșec cheamă
  `reportFailure({code: "E-HIST-001", flow: "istoric.reprint.pdf", context: {popupBlocked: true, entryId: entry.id}})`
  simetric cu ramura DOCX (linia ~85-95). Defectul original era exact „telemetria raportează
  succes pe un eșec" — jumătate din fix e link-ul de rezervă vizibil pentru Cristina, cealaltă
  jumătate e codul de eroare vizibil pe `/diagnostics` (R-DIAG: fiecare eroare are cod și ajunge
  în jurnal). Fără `reportFailure`, defectul rămâne pe jumătate reparat.

**Fișiere:** `frontend/src/components/history/HistoryDetail.tsx`.

**Verificare live:** blochează pop-up-urile pentru domeniu în Chrome → apasă „PDF (Print)" →
apare linkul de rezervă, clic pe el deschide documentul într-un tab nou, imprimabil.

**Teste:** extinde testele existente pe `HistoryDetail` (dacă există) sau adaugă unul care simulează
`window.open` întorcând `null` și verifică apariția link-ului + că `logAction` de succes NU se
apelează.

---

### 4. P5 — Convertor: mesaj Python brut + câmpul „Pagini" nu se resetează

**Cauza confirmată (backend):** `api/convert.py:473-489`, `_parse_page_range`, apelează `int()`
direct pe fragmente din input-ul utilizatorului fără try/except local. Când utilizatorul scrie ceva
non-numeric (`"abc"`), Python aruncă `ValueError("invalid literal for int() with base 10: 'abc'")`
— un mesaj de librarie, NU un text scris deliberat. Handler-ul de excepții
(`api/convert.py:770-792`, decizia „H2" din 2026-08-10) tratează ORICE `ValueError` ca „validare
așteptată" și trimite `str(e)` neschimbat la client — corect pentru mesaje scrise de mână
(„PDF-ul nu are pagini"), greșit pentru cel scurs din `int()`.

**Fix propus (backend):** în `_parse_page_range`, învelește parsarea fiecărui `part` într-un
try/except care prinde `ValueError` de la `int()` și-l re-aruncă cu un mesaj românesc dedicat:
`ValueError(f"Interval de pagini invalid: '{part}'. Folosește cifre și virgule/liniuțe (ex:
1,3,5-8).")`. Păstrează comportamentul H2 (ValueError tot trece la client) — doar mesajul devine
intenționat.

**Cauza confirmată (frontend):** `convertor/page.tsx:348-362`, butoanele de operație:
`onClick` face `setOperation(op.id); setPdfAction("")` — dar NU `setPageRange("")`. La schimbarea
operației (ex. split → edit-pdf), valoarea rămasă din „Pagini" (semantică diferită per operație:
„Pagini" la split vs „Pagini de extras" la altă operație) se refolosește tacit.

**Fix propus (frontend):** adaugă `setPageRange("")` în același `onClick`, lângă `setPdfAction("")`.

**Fișiere:** `api/convert.py`, `frontend/src/app/convertor/page.tsx`.

**Verificare live:** (a) scrie „abc" în câmpul Pagini la Split → mesaj românesc, nu textul Python;
(b) completează Pagini la Split, schimbă operația la Rotire → câmpul e gol.

**Teste:** test nou pentru `_parse_page_range` (`api/tests/test_convert_page_range.py` sau extins
în `test_convert_pdf_to_image.py`) — input valid, litere, interval gol, liniuță fără capăt. Test
frontend (dacă există infra) pentru reset-ul câmpului la schimbare de operație.

---

### 5. P6 — Planșe: avertisment ÎNAINTE de click la formă fixă + N>1

**Cauza confirmată:** `frontend/public/planse/app.js`, `mountUneste` (linia 830) și `mountDictare`
(linia 1062): `if (forma !== "aleator") break;` — o formă FIXĂ produce o semnătură constantă, deci
bucla se oprește deliberat după prima planșă reușită. Cu N (`un-np`/`di-np`) > 1, lotul e
**garantat incomplet, determinist, de fiecare dată** — nu ocazional. Codul deja știe asta (comentariu
linia 829, notă `.adv-note` liniile 746/978) dar avertismentul e un text static, needucat, sub
câmpul „Număr planșe" — ușor de ratat înainte de a apăsa „Generează".

**Fix propus:** în ambele forme (`un-forma`/`un-np`, `di-forma`/`di-np`), adaugă listener pe
`change`/`input` care, când `forma !== "aleator" && np > 1`, comută nota existentă (`id="un-note"`/
`id="di-note"`, adăugat la elementul `.adv-note`) într-o stare vizibil de avertisment (culoare/
icon ⚠, text explicit: „O formă fixă dă mereu O SINGURĂ planșă — cu N={np} vei primi un lot
incomplet."), altfel revine la textul informativ neutru curent. Nu blochează submit-ul (Roland n-a
cerut asta) — doar avertizează proactiv, înainte de click.

**Fișiere:** `frontend/public/planse/app.js` (funcțiile `mountUneste`, `mountDictare` — identice
structural, fix replicat 1:1).

**Verificare live:** selectează o formă specifică (nu „Amestecat") + N=2 în Unește → avertisment
vizibil ÎNAINTE de „Generează"; revino la „Amestecat" → avertismentul dispare; repetă pe Dictare.

**Teste:** modulul Planșe nu are jest — verificare prin `frontend/public/planse/selftest.html`
(extinde cu un caz pentru cei doi generatori) + verificare live (singura formă de „poartă" reală
pt acest modul, conform convenției existente).

---

### 6. P7 — markdown `**bold**` neconvertit în previzualizarea barem (Teste)

**Diagnostic REFĂCUT (2026-09-10, corectat de Roland — diagnosticul inițial era greșit).**
Defectul observat live în Faza 4 (jurnal #10) era `**b) $6\sqrt{3}$**` — bold ÎN JURUL unei
FORMULE, pe o SINGURĂ linie, nu bold întins pe două linii.

**Cauza reală, confirmată în cod:** `renderMathText` (`math-html.ts:48-57`) taie textul la
DELIMITATORII DE MATEMATICĂ (regexul `re`), nu la `\n`. Pentru `**b) $6\sqrt{3}$**`:
`src.slice(last, m.index)` = `"**b) "` intră în `plain()` ca apel separat, apoi KaTeX randează
formula, apoi `src.slice(last)` = `"**"` intră în ALT apel `plain()`. Cele două `**` ajung în
**apeluri `plain()` diferite** → regexul `\*\*([^*]+?)\*\*` din `inlineMd` (linia 35) nu vede
niciodată o pereche în ACEEAȘI invocare → asteriscurile rămân literale. Fixul din varianta
anterioară a acestui plan (aplică `inlineMd` înainte de `split("\n")`) repară un bug real, DAR
diferit (bold întins pe rând nou) — n-ar fi reparat cazul din jurnal; ar fi trecut cu poarta
verde și asteriscurile ar fi rămas.

**Fix corect:** protejează matematica cu placeholdere ÎNAINTE de trecerea de markdown — același
tipar folosit deja de proiect la traducere (`api/lib/math_protect.py`: extrage spanurile
`$...$`/`$$...$$` într-un token opac, procesează textul din jur, apoi restaurează). În
`renderMathText`:

1. Un singur pas peste `src` cu regexul de matematica existent: pentru fiecare potrivire,
   randeaza KaTeX (ca acum) si pune rezultatul HTML intr-un array `tokens[]`; inlocuieste
   potrivirea din text cu un placeholder opac, fara secventa de linie noua si fara
   caractere de markdown - un marker unic per index (doua caractere Unicode din zona
   Private-Use-Area ca delimitatori, cu indexul numeric intre ele). Supravietuieste la
   `escapeHtml` (care atinge doar `&<>`) si nu poate aparea in text normal introdus de
   utilizator.
2. `escapeHtml` + `inlineMd` (bold/cod) rulează pe TOT textul cu placeholdere, dintr-o bucată —
   regexul de bold vede acum perechea `**...**` din jurul unui placeholder ca pe orice alt text.
   (Asta repară GRATUIT și cazul bold-peste-linie-nouă din diagnosticul inițial — aceeași
   trecere, verificare live separată mai jos, dar nu e cazul obligatoriu.)
3. `split("\n")` + `markdownLine` rămân DOAR pentru heading/listă per linie — fără re-apel
   `inlineMd` (deja aplicat la pasul 2, ca să nu proceseze de două ori).
4. Substituie placeholderele înapoi cu HTML-ul din `tokens[]`.

**Fișiere:** `frontend/src/lib/math-html.ts` (funcție partajată Chat+Teste — fix unic, beneficiază
ambele module).

**Verificare live OBLIGATORIE (cazul real din jurnal):** un barem cu `**b) $6\sqrt{3}$**` (sau
echivalent, generat/corectat printr-un test real) → previzualizarea arată **b) [formulă KaTeX]**
bold, fără asteriscuri vizibile. Cazul bold-peste-linie e verificare secundară, nu blocantă.

**Teste:** extinde `frontend/src/lib/math-html.test.ts` cu (a) cazul REAL `**b) $formulă$**` pe o
linie — obligatoriu, (b) cazul bold multi-linie — secundar.

---

## Reguli de execuție pentru această fază

- **Dovadă live obligatorie per item** (decizia 6a, valabilă din Faza 2) — un item rămâne 🟡 dacă
  n-are dovadă live, indiferent cât de verde e poarta. Lecția Fazei 2: 4 comenzi verzi peste un
  modul rupt.
- **`CACHE_VERSION` în `frontend/public/sw.js`** (valoare curentă: `"v71-" + "20260908"`) — bump
  obligatoriu înainte de deploy, altfel fix-urile nu ajung la Cristina (cache-lag PWA).
- **Deploy:** autorizat automat după poartă verde („mereu live", decizia lui Roland) — DOUĂ
  comenzi, fiindcă P5 atinge și backend-ul. **Corecție in-flight (memoria
  `deploy-vercel-python-gotchas`, confirmată live 2026-09-10):** `--cwd DIR` rezolvă proiectul
  din `DIR/.vercel`, dar tot citește `vercel.json` din CWD-ul procesului (rădăcina) → eroare
  `pattern "api/*.py" doesn't match`. Corect: `cd "C:/Proiecte/Traduceri_Matematica/frontend" &&
vercel deploy --prod --yes` (forward slashes, FĂRĂ `--cwd`) pt frontend; `cd
"C:/Proiecte/Traduceri_Matematica" && vercel deploy --prod --yes` din rădăcină pt API.
- **Output-uri text din verificări live** (decizia 3, acest chat) — dacă verificarea unui item
  (P7, eventual P6) produce conținut AI (test/barem generat), salvează rezultatul ca `.md`/`.txt`
  în `99_Roland_Work/Teste_Output/`.
- **Disciplina sub-agenților** (decizia 4, acest chat) — orice prompt de fork include explicit:
  „Commit/push e EXCLUSIV treaba coordonatorului. Dacă simți nevoia să comiți, OPREȘTE-TE și
  raportează." + verificare `git log` după fiecare fork pentru commit-uri neautorizate.
- **La final:** cei trei auditori (`auditor-dovezi`, `auditor-regresie`, `auditor-cerinte`) prin
  Agent tool → salvează handoff + `Plan_in_Lucru.md` + memorie + commit/push → **STOP**. Faza 4.5b
  (P3 + P2) într-o sesiune nouă cu `/onboard`.

## Checklist bifabil

- [x] P1 — fix `storage.ts` + `HistoryList.tsx` + test + dovadă live
- [x] Riscul „→ Editor" — coadă în `editor-commands.ts` + curățare `setTimeout` din `page.tsx` + test + dovadă live
- [x] P4 — fallback Blob+link ÎN `HistoryDetail.tsx` + `reportFailure` obligatoriu pe eșec (nu opțional) + test + dovadă live
- [x] P5 backend — `_parse_page_range` mesaj românesc + test
- [x] P5 frontend — reset `pageRange` la schimbare operație + dovadă live (ambele jumătăți)
- [x] P6 — avertisment `mountUneste` + dovadă live
- [x] P6 — avertisment `mountDictare` (fix replicat) + dovadă live
- [x] P7 — `math-html.ts` bold în jurul formulei (diagnostic corectat) + test + dovadă live
- [x] Poartă completă: `tsc` · `jest` · `build` · `pytest`
- [x] `CACHE_VERSION` bump în `sw.js` (v71 → v72)
- [x] Deploy frontend (`cd frontend && vercel deploy --prod --yes`) + deploy API (din rădăcină) + verificare live pe fiecare item de mai sus
- [x] Cei trei auditori (Agent tool, în paralel) — vezi §R-AUDIT-FAZA; 1 abatere găsită și corectată (`E-HIST-002`)
- [ ] Handoff + `Plan_in_Lucru.md` + memorie + commit/push
- [ ] STOP — raport către Roland, Faza 4.5b într-o sesiune nouă

## Jurnal execuție

**2026-09-10, sesiunea de implementare (după confirmarea planului cu cele 3 corecții):**

- **Baseline poartă** măsurat înainte de orice modificare (vezi §Baseline): `tsc 0 · jest 428/428
· build OK · pytest 83/83`.
- **P1** — `storage.ts`: `addToHistory`/`addConversionToHistory` dispatch `history-updated` după
  scriere (inclusiv pe calea de eviction, fix mic: `return` din buclă înlocuit cu flag `saved` ca
  dispatch-ul să ruleze mereu). `HistoryList.tsx`: listener pe eveniment + cleanup. 3 teste noi
  (`storage.test.ts`).
- **Riscul „→ Editor"** — `editor-commands.ts`: coadă `pendingText`/`pendingImages`, flush la
  înregistrare, prag `PENDING_TIMEOUT_MS=4000` cu `reportFailure` (cod nou `E-EDIT-004`, adăugat
  în `config/error_codes.json` + oglindit în `error-catalog.ts`). `page.tsx`: eliminat cele 4
  `setTimeout(...,150)`. 5 teste noi (`editor-commands.test.ts`, `jest.useFakeTimers`).
- **P4** — `HistoryDetail.tsx`: la `win===null`, Blob+`URL.createObjectURL` + link vizibil (mirror
  Planșe) ȘI `reportFailure` obligatoriu (`E-HIST-001`, `context.popupBlocked:true`);
  `logAction` de succes mutat strict în ramura `if(win)`. Fără test jest — proiectul nu are infra
  de testare componente React (verificat: zero `@testing-library/*` în `package.json`, zero
  `.test.tsx` existente) — verificare doar live.
- **P5** — backend `_parse_page_range` (`api/convert.py`): try/except pe `int()`, mesaj românesc.
  6 teste noi (`test_convert_page_range.py`). Frontend `convertor/page.tsx`: `setPageRange("")`
  la schimbarea operației.
- **P6** — `planse/app.js`: `updateFormaWarning()` în `mountUneste` + `mountDictare` (fix identic,
  replicat), avertisment reactiv pe `change`/`input` + butoanele stepper. CSS `.adv-note.warn` nou
  în `style.css`. Fără selftest.html extins (verificare doar live, prin manipulare directă a
  `<select>`-ului din iframe + citire `note.className`/`textContent`).
- **P7** — diagnostic REFĂCUT după corecția lui Roland (bold în jurul formulei, nu peste linie
  nouă). `math-html.ts`: placeholdere opace pt matematică înainte de trecerea de markdown, apoi
  restaurare (tipar `math_protect.py`). 2 teste noi, inclusiv cazul REAL din jurnal
  (`**b) $6\sqrt{3}$**`).
- **Poartă finală** (după toate modificările, înainte de deploy): `tsc 0 · jest 438/438 (28 suite,
+10 teste) · build OK · pytest 89/89 (+6 teste)`. **Fără regresie** — toate deltele sunt teste
  noi, nimic șters/stricat.
- **Deploy** — corecție in-flight: comanda din plan (`--cwd`) nu funcționează (memoria
  `deploy-vercel-python-gotchas` avea deja documentată capcana — `--cwd` rezolvă proiectul dar tot
  citește `vercel.json` din rădăcină). Corect: `cd` în folder + `vercel deploy --prod --yes`, fără
  `--cwd`. Frontend → `traduceri-frontend.vercel.app` (READY, production). API →
  `traduceri-api.vercel.app` (READY, production).
- **Dovadă live, toate 6 itemi + riscul „→ Editor"**, pe producție, în browser real (Claude in
  Chrome, profil de automatizare izolat — NU dispozitivul Cristinei):
  - P1: conversie reală (upload `.md`→HTML) → comutare pe Istoric FĂRĂ reload → intrarea nouă
    apare imediat, în capul listei.
  - P4: `window.open` interceptat temporar (simulare popup blocat) → link de rezervă vizibil +
    `E-HIST-001` confirmat în Supabase (`context.popupBlocked:true`) la 2 secunde după clic;
    clicul anterior (popup NEBLOCAT) a logat DOAR acțiunea de succes, fără eroare — cele două căi
    sunt mutual exclusive, cum trebuia.
  - P5: „abc" în Pagini la Split pe un PDF real (3 pagini, generat cu `pypdf`) → mesaj „Interval
    de pagini invalid: 'abc'...(cod E-CONV-001)", NU textul Python; schimbare operație → câmpul
    revine gol.
  - P6: selectat o formă fixă („stea"/„patrat") + N=2 în Unește ȘI Dictare (manipulare directă a
    select-ului din iframe, eveniment `change` real) → avertismentul galben apare ÎNAINTE de
    click; revenire la „aleator" → dispare.
  - P7: test real generat cu Gemini Flash (temă Radicali, clasa VII, cu barem) → injectat
    `**b) $6\sqrt{3}$**` direct în textarea editabilă → previzualizarea arată **b) 6√3** bold,
    KaTeX randat, zero asteriscuri. Specimen salvat:
    `99_Roland_Work/Teste_Output/Faza4.5a_P7_verificare_barem_Radicali_2026-09-10.md`.
  - Riscul „→ Editor": click real pe „Trimite testul în Editor" din Teste (cross-tab, fără
    `setTimeout`) → documentul din Editor a crescut de la 1 la 4 pagini A4, cu tot conținutul
    (inclusiv formulele) inserat corect. Calea de timeout/eșec (E-EDIT-004) e verificată prin
    jest (`jest.useFakeTimers`, deterministă) — nereproductibilă la cerere pe producție, exact
    motivul pentru care fix-ul e defensiv, nu o reparație a unei reproduceri.

## R-AUDIT-FAZA — verdictele celor trei auditori (2026-09-10, rulați în paralel, Agent tool)

- **auditor-regresie: FĂRĂ REGRESIE.** A rulat el însuși poarta, în worktree propriu, cu coduri de
  ieșire reale (nu pipe către `tail`): `tsc 0 · jest 28 suite/438 teste · build 10/10 · pytest 89
passed`. Delta reconciliată exact cu testele noi (428→438 = +3 storage +5 editor-commands +2
  math-html; 83→89 = +6 page-range). Confirmat: `translation_router.py`/`math_protect.py`
  neatinse. Bonus: eslint 14 probleme preexistente, toate în fișiere neatinse de fază — nu e
  regresie.
- **auditor-dovezi: 7/7 CONFIRMAT**, cu verificare live proprie (nu doar citire de cod): a
  reprodus P1 (upload propriu), P4 (capăt-la-capăt, inclusiv citire directă din Supabase), P5
  (curl direct pe `traduceri-api.vercel.app/api/convert` cu `page_range=abc` → 400 cu mesajul
  românesc, apoi `page_range=1,2` → 200 cu PDF valid), P6 (ambii generatori, live). Două note
  oneste de scop: n-a regenerat el însuși conținut Gemini pt riscul „→ Editor" (1→4 pagini) sau P7
  (motiv: cost de cotă nejustificat peste dovada deterministă deja fermă din jest) — cod
  CONSISTENT cu afirmația, dar nereprodus personal de acest auditor.
- **auditor-cerințe: aproape toate ONORATE, o abatere reală găsită.** Cele 3 corecții explicite
  ale lui Roland (diagnostic P7 refăcut, logare P4 obligatorie, baseline consemnat ÎNAINTE) —
  toate onorate, verificate independent (a rulat el însuși testele + a comparat cifrele). **Abatere
  găsită:** P4 reutiliza codul `E-HIST-001`, al cărui `message`/`cause`/`fix` din catalog descriu
  EXCLUSIV eșecul DOCX preexistent, nu popup-ul blocat — `reportFailure` se apela corect, dar
  cine citea `/diagnostics` primea cauză/fix greșite pt evenimentul real. **Corectat imediat**
  (înainte de acest STOP): cod nou dedicat `E-HIST-002` (`config/error_codes.json` +
  `error-catalog.ts`, mesaj/cauză/fix proprii pt popup blocat), `HistoryDetail.tsx` actualizat,
  `CACHE_VERSION` v72→v73, rebuild + redeploy frontend, re-verificat live: Supabase confirmă
  `error_code:"E-HIST-002"` pe un test nou (`entryId:"hist002-test"`, 2026-09-10 11:15). Poarta
  re-rulată după corecție: `tsc 0 · jest 438/438` (nicio schimbare de cifră — `E-HIST-002` e cod
  nou, nu test nou).

**Concluzie:** nimic nu rămâne 🟡. Toate 6 fixuri + riscul „→ Editor" sunt verificate independent
de trei perspective diferite (regresie/dovezi/cerințe), plus corecția post-audit a fost ea însăși
verificată live înainte de închiderea fazei.
