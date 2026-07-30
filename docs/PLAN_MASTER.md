# PLAN MASTER — Sistem Traduceri Matematică

> **SURSA UNICĂ DE ADEVĂR.** Creat 2026-07-30 prin audit în cod (5 agenți paraleli, dovezi `fișier:linie`) al TUTUROR planurilor existente + cerințele Roland din `99_Roland_Work/cerinta_roland.md`.
>
> **A înlocuit** (ȘTERSE 2026-07-30, §11 executat): `99_Plan_vs_Audit/PLAN_v3.md`, `docs/PLAN_editor_tiptap_2026-07-23.md`, `docs/PLAN_math_academic_2026-07-26.md`, `docs/PLAN_math_curriculum_2026-07-27.md`, `docs/PLAN_modul_planse.md`, `docs/PROMPT_START_modul_planse.md`, `PLAN_OVERLAY_2026-07-10.md`, `deep_research_2026-03-24/ROADMAP_IMBUNATATIRI.md`, `99_Plan_vs_Audit/RECOMANDARI_IMBUNATATIRI.md`, `RESUME_DEPLOY_2026-07-09.md`, `99_Roland_Work/Arhiva_Proiect_Vechi/PLAN_PROIECT.md`.
> **SE PĂSTREAZĂ:** `99_Plan_vs_Audit/PLAN_DECISIONS.md` (log de decizii tehnice, nu plan) + `docs/HANDOFF_SESIUNE.md` (starea curentă).
>
> **Planurile vechi sunt intacte în git la commit `54fac8f`** — orice detaliu neacoperit aici se recuperează de acolo.

---

## §0. STARE VERIFICATĂ (2026-07-30, în cod — nu pe bife)

**LIVE pe `traduceri-frontend.vercel.app`** (`CACHE_VERSION v19-20260730a`, deployment `dpl_6Qgs1YtxUNuxp3ZkUGsQpLtcuLJf`), branch `faza-g-editor`.

| Zonă                     | Stare reală (cu dovadă)                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Editor nativ TipTap      | F1–F9: **13/15 complet**, 1 parțial (F5 polish), 1 neimplementat (F3b — retras conștient)                                                                                                        |
| Matematică               | **334 formule** V–XII, `334/334` cu `latex` **și** `explicatie`, 103 simboluri (`math-data.json`) — planurile ziceau 276, **doc era stale**                                                      |
| Paritate mobilă math     | **EXISTĂ** — `MobileToolbar.tsx:128` → `TiptapToolbar variant="sheet"`, iar `EditorMathMenu` la `TiptapToolbar.tsx:491` e **necondiționat**. ⚠️ Handoff-ul o lista greșit ca restanță — CORECTAT |
| Traducere în editor (F8) | LIVE, verificată e2e pe prod (RO→SK→EN, formule intacte)                                                                                                                                         |
| Import OCR (F9)          | LIVE v19; backend confirmat pe acest deploy (POST imagine reală → 200 în 21.5s, 8 secțiuni)                                                                                                      |
| Tab „Traduceri"          | RETRAS din UI intenționat (F7); backend traducere PĂSTRAT și refolosit                                                                                                                           |
| Modul Planșe             | **LIVE dar NETRACKED** — 2/8 faze, 1 generator din 6; absent din handoff de 8 zile                                                                                                               |
| Non-regresie             | `tsc 0 · jest 57/57 · next build OK (8 rute)`                                                                                                                                                    |

---

## §1. CERINȚELE ROLAND (2026-07-30) — SE EXECUTĂ PRIMELE

> Ordine confirmată de Roland: **cerințele întâi, securitatea (§2) după**. ⚠️ Cele 3 vulnerabilități HIGH din §2 rămân active în producție pe durata cerințelor (asumat conștient).
>
> **STARE:** R1 ✅ (icon-rail, v21) + R2 ✅ (elimin limbi, v20) — DONE + DEPLOYAT + verificat live. **Cerințe NOI (Roland, 2026-07-30 runda 2):** R5 (mut butoanele de limbi în rândul de sus) + R6 (search GLOBAL Ctrl+K). Plus upgrade OCR/DOCX pe fișiere reale (extinde R3+R4).
>
> **⚙️ ORDINE DE EXECUȚIE (Roland: „alegi tu ordinea optimă") — aleasă de Claude, cu rațiune:**
> **1. R3** (DOCX OMML→LaTeX) — bug VIZIBIL pe prod (matematica dispare din .docx), durere principală a lui Roland, are fixture-uri reale → prioritar. **2. R5** (mut F8 sus) — trivial, se grupează la deploy cu R3 (ambele editor). **3. R6** (Ctrl+K global) — feature UX nou (§17 mock). **4. R4** (OCR imagine/scan pe dovadă) — exploratoriu, consumă cote API. **5. §2 securitate** (S1–S8). Apoi §3/§4/§5/§6.

### R1 — Meniu icon-rail colapsabil (înlocuiește bara de sus)

**Problema (screenshot `1.png`):** bara de module de sus + bara de limbi + titlul modulului consumă ~140px verticali din foaia de lucru.

**Formă CONFIRMATĂ de Roland (mock aprobat, tiparul Mosslein):**

- `<aside>` lateral stânga: **extins 240px** (iconiță + text) ↔ **colapsat 56px** (doar iconiță, cu `title` ca tooltip).
- Toggle prin chevron/hamburger; starea persistată în `localStorage` (ca `mosslein:sidebar:collapsed`).
- Item activ marcat cu bordură-stânga + fundal (ca `border-l-4 border-cyan-400 bg-cyan-500/15`, adaptat la tema cretă).
- **Bara de module de sus DISPARE complet**; modulul selectat ocupă tot restul lățimii și înălțimii.
- Pe mobil (<768px): același icon-rail, **default colapsat**; pe desktop default extins.

**Referință de citit înainte de cod:** `C:\Proiecte\Mosslein_Sistem_Gestiune - Copy\src\components\nav\Sidebar.tsx` (+ `MobileNav.tsx`, `BottomNav.tsx`, `src/lib/navigation.ts`).

**Fișiere de atins:** `frontend/src/components/layout/TopBar.tsx` (se transformă/înlocuiește), `frontend/src/app/page.tsx` (layout-ul cu taburi), NOU `components/layout/Sidebar.tsx`, `app/globals.css`.

**⚠️ Constrângere de arhitectură (NU o încălca):** taburile sunt **montate simultan** cu `display:none` (`app/page.tsx`) — asta păstrează starea editorului la comutare. Sidebar-ul schimbă doar CARE tab e vizibil; **NU** treci pe rute Next (ar reseta editorul). Vezi comentariul din `EditorTiptap.tsx` despre Ctrl+F prins pe container exact din acest motiv.

- [x] R1.1 `Sidebar.tsx` NOU — `<aside>` w-60↔w-14, `bg-chalkboard-dark`, brand+chevron, nav din `TABS` (comutare de stare NU rute), activ = `border-l-4 border-chalk-yellow bg-chalk-yellow/15`, footer ⚙+VersionBadge. Persistență `localStorage["mosslein:sidebar:collapsed"]`. **Init DEFAULT + `useEffect` (localStorage sau matchMedia<768) → 0 hydration mismatch** (cf. [[finding_hydration_tab_and_deploy_verify_2026_07_26]])
- [x] R1.2 `page.tsx` rescris: `<div flex><Sidebar/><main flex-1>{divurile display:none EXACT}</main></div>`; bara de sus scoasă; `git rm TopBar.tsx` (0 importatori)
- [x] R1.3 Titlul modulului rămâne în header-ul propriu al fiecărui modul (ex. editor „Editor Documente Matematic") — nu bară separată. Confirmat live
- [x] R1.4 Gate: **`tsc 0 · jest 57/57 · next build OK` ✓** + **LIVE local (`next start` :3320, Chrome MCP):** DESKTOP — toate cele 5 taburi comută+randează (incl. iframe Asistent+Planșe), activ evidențiat, collapse/expand persistă (`ls 1↔0`), consolă curată, 0 hydration warning, bară de sus dispărută. MOBIL — **iframe-probe 390px real** (viewport 386, `mqMobile:true`): **sidebar default COLAPSAT** (56px, calea matchMedia), comutare prin iconițe OK, expand arată etichete, **0 overflow orizontal**, „Format" Sheet-ul editorului intact. Module umplu înălțimea (`gap:-52`, min-h). **✅ DEPLOYAT v21-20260730c, verificat LIVE pe prod** (aside 240px, bara sus dispărută, 5 taburi comută). RĂMAS: eyeball Roland pe telefon real

### R2 — Eliminarea selectorului global de limbi (🇷🇴 RO / 🇸🇰 SK / 🇬🇧 EN, sus-dreapta)

**CONFIRMAT de Roland:** se elimină **DOAR** selectorul global (nefuncțional). Switch-ul de traducere din editor (`scris în: RO ▾ | RO SK EN DE`, F8) **RĂMÂNE** — e funcțional și verificat live.

**Ținte exacte (verificate):** `components/layout/LanguageToggle.tsx` (șterge), `lib/language-context.tsx` (șterge), consumatori de curățat: `app/layout.tsx` (scoate `LanguageProvider`), `components/layout/TopBar.tsx`.

- [x] R2.1 `git rm` LanguageToggle.tsx + language-context.tsx (2026-07-30, commit R2)
- [x] R2.2 Curățat importurile + JSX din `layout.tsx` (scos `LanguageProvider`) + `TopBar.tsx` (scos `<LanguageToggle/>` + comentarii „limbă"). Verificat: `git grep` = 0 referințe rămase în `frontend`. Cheia `localStorage["translate_lang"]` era owned DOAR de `language-context` → orfanată benign, F8 nu o folosește
- [x] R2.3 `metadata.description` actualizat: „…RO, SK, EN" → „…RO, SK, EN, DE" (adăugat DE, păstrat cadrul „Traducere" ca să nu contrazică titlul „Sistem Traduceri"; nu era chiar text mort — capacitatea de traducere există prin F8)
- [x] R2.4 Gate: **`tsc 0 · jest 57/57 · next build OK (8 rute)` ✓** + **LIVE pe prod verificat** (deploy `dpl_3ZdTuim2LS4GUbz56enS7hDQB91y`, CACHE v20, alias servește v20 Age:0): selectorul global de limbi ABSENT (DOM `globalFlagTogglePresent:false`), **F8 RO→SK→RO funcțional** (text real: „Lucrare de control"→„Kontrolná práca", revenire instant din cache), consolă fără erori, fără overflow orizontal. ⚠️ Viewport real 390px n-a putut fi forțat prin `resize_window` (a rămas 1254) → eyeball mobil final = Roland (scoaterea unui element din dreapta nu poate introduce overflow, doar eliberează spațiu)

### R3 — DOCX cu matematică: parsare OMML → LaTeX

**Problema DOVEDITĂ:** `test.multimi2.docx` conține **20 de ecuații OMML** native (`<m:oMath>`) și **0 imagini**. `mammoth.extractRawText` (folosit azi la `.docx` în `editor-import.tsx:186`) **ignoră complet OMML** → PDF-ul exportat (`Downloads/test.multimi2.pdf`) are propozițiile trunchiate: „Precizează valoarea de adevăr a propozițiilor:" urmat doar de „7"; „Fie multimile ," fără mulțimi; „Se consideră mulțimile . Determinati".

**Abordare CONFIRMATĂ de Roland:** parsare OMML → LaTeX **direct din XML-ul .docx** (fidelitate 100%, gratuit, offline, instant). NU calea vizuală docx→PDF→OCR.

**Semantica „afișează toți termenii matematici" — CONFIRMATĂ:** fiecare formulă apare **exact la locul ei în text**, randată și editabilă (nu panou-listă separat, nu glosar).

**Ce trebuie acoperit (structuri OMML → LaTeX):**

| OMML                                    | LaTeX                      | Exemplu din fișierul de test     |
| --------------------------------------- | -------------------------- | -------------------------------- |
| `<m:d>` cu `begChr`/`endChr`            | `\{…\}`, `(…)`, `[…]`      | `{2,3,7}` (delimitatori acolade) |
| `<m:f>` (num/den)                       | `\frac{}{}`                | fracții                          |
| `<m:rad>` (deg/e)                       | `\sqrt{}` / `\sqrt[n]{}`   | radicali                         |
| `<m:sSup>` / `<m:sSub>` / `<m:sSubSup>` | `x^{}`, `x_{}`, `x_{}^{}`  | puteri, indici                   |
| `<m:nary>` (Σ, Π, ∫ cu limite)          | `\sum_{}^{}`, `\int_{}^{}` | sume/integrale                   |
| `<m:r><m:t>`                            | text/simboluri             | conținut atomic                  |
| `<m:m>` (matrice)                       | `\begin{matrix}`           | dacă apare                       |
| `<m:acc>`, `<m:bar>`                    | `\vec{}`, `\overline{}`    | notații                          |

- [ ] R3.1 Modul NOU `frontend/src/lib/omml-to-latex.ts` — funcție **pură** (primește XML string, întoarce segmente text+latex), **unit-testabilă fără DOM**
- [ ] R3.2 Fixture de test REAL: extrage `word/document.xml` din `test.multimi2.docx` → `frontend/src/lib/__tests__/fixtures/` (trunchiat la ce trebuie). Teste pentru FIECARE structură din tabel + cazuri degenerate (OMML gol, nested, necunoscut→text literal)
- [ ] R3.3 Integrare în `editor-import.tsx`: la `.docx`, în loc de `mammoth.extractRawText` → citește `word/document.xml` (zip, ex. `jszip`/`fflate`) + păstrează ORDINEA text↔formule + `**bold**` unde e simplu
- [ ] R3.4 Reutilizează `parseInlineToNodes` din `ocr-map.ts` (deja tratat `$$…$$` înainte de `$…$` + latex-gol→literal) pentru a produce noduri `inlineMath`. ⚠️ **CAPCANĂ (advisor):** `parseInlineToNodes` interpretează `$` ca delimitator — dacă OMML→LaTeX emite `$` literal în text (preț, valută) sau `\{`/`\}` din `<m:d>` cu delimitatori, reuse-ul poate mângli output-ul. Emite LaTeX curat (fără `$` liber) SAU escape la `$` în textul non-matematic înainte de a-l trece prin parser
- [ ] R3.5 **Onest (R3):** dacă un .docx are formule ca IMAGINE (nu OMML), ele NU se transcriu → semnalează în banner. Detectează și raportează câte OMML + câte imagini a găsit
- [ ] R3.7 **`mammoth` devine dependință moartă** — a fost instalat ieri exact pentru calea `.docx` pe care R3 o înlocuiește. Scoate-l din `package.json` dacă nu mai e folosit; oricum ai nevoie de un cititor de zip (`fflate` sau `jszip`) → e un **schimb**, nu o dependință în plus
- [ ] R3.6 Gate: unit tests + **eyeball obligatoriu pe `test.multimi2.docx`**: import → toate cele 20 de expresii apar la locul lor → export PDF → **compară cu `Downloads/test.multimi2.pdf` (varianta ruptă)** și cu .docx-ul original
- [ ] R3.8 **FIXTURE-URI REALE EXTINSE (Roland, 2026-07-30 r2):** pe lângă `test.multimi2.docx`, folosește ca test set și `C:\Users\ALIENWARE\Desktop\Cristina\Fisiere_Word\test5nr.naturale2025.docx` + `2.Unghiuri. Bisectoare.docx`. **Dovadă a bug-ului:** `Downloads/test5nr.naturale2025.pdf` (output actual al app-ului) are matematica DISPĂRUTĂ complet — „Calculați: (1,5 p)" fără calcul, „Se știe că , aflati ." fără ecuații, „numerelor de forma ." fără forma. Eyeball pe toate 3, formulă-cu-formulă.
      **✅ VERIFICAT LA SURSĂ (2026-07-30, `unzip -p … word/document.xml | grep m:oMath`):** `test.multimi2` = **20 OMML / 0 imagini** · `test5nr.naturale2025` = **9 OMML / 0 imagini** · `2.Unghiuri. Bisectoare` = **6 OMML / 1 IMAGINE** (`word/media/`). Toate au OMML → abordarea R3 e validă pe toate 3. ⚠️ `2.Unghiuri` are și 1 figură ca imagine → vezi R3.10
- [ ] R3.10 **Imagini din .docx (`word/media/`):** `2.Unghiuri` are 1 figură ca imagine. Extrage și imaginile din zip, inserează-le ca noduri `ResizableImage` (F3c) la locul lor în text (parcurgi `document.xml` în ordine, mapezi `<w:drawing>`/`r:embed` → `word/media/imageN` prin `word/_rels/document.xml.rels`). Dacă e prea complex pt ETAPA A, măcar banner onest „N figuri ca imagine" (R3.5)
- [ ] R3.9 **FIDELITATE (Roland r2 — „matematica + ordinea întâi, apoi vizual"):** ETAPA A (fermă, obligatorie) = formulele apar la locul lor (OMML→LaTeX, editabile) + text în ordine + bold/liste simple. ETAPA B (iterativ după A) = apropiere de layout-ul vizual (spațiere, aliniere, tabele). NU bloca A pe B. Declară onest ce nivel s-a atins pe fiecare fișier

### R4 — OCR: alege pe DOVADĂ cel mai calitativ provider

**Abordare CONFIRMATĂ de Roland:** testare comparativă pe fișiere reale, decizie pe măsurătoare (nu pe reputație).

**⚠️ PRIMUL SUB-PAS OBLIGATORIU (R3-onestitate):** capabilitatea Azure „extragere formule ca LaTeX" e `[PROBABIL]` din memorie, **NU** din documentație citită. Confirmă la sursă ÎNAINTE de a construi comparația; dacă nu există, comparația se reduce la Mistral vs Gemini (mai ieftină).

**Candidați (din `~/.api-keys/catalog.md`, toți free tier — R-COST):**

| Provider                    | Env var                                            | Limită            | Relevanță math                                                                                    |
| --------------------------- | -------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| Azure Document Intelligence | `AZURE_DOC_INTEL_KEY` + `AZURE_DOC_INTEL_ENDPOINT` | 500 pag/lună (F0) | `prebuilt-layout` + `features=formulas` → LaTeX **[DE CONFIRMAT]**                                |
| Mistral OCR                 | `MISTRAL_API_KEY`                                  | 1B tokens/lună    | `mistral-ocr-latest` → markdown cu LaTeX; **deja integrat ca fallback** (`ocr_structured.py:201`) |
| Gemini 2.5 Flash            | `GOOGLE_AI_API_KEY`                                | ~1000 req/zi      | **actualul primary**; dovedit: 36 formule + 6 figuri din poza de manual                           |
| Google Document AI          | `GOOGLE_API_KEY`                                   | 1000 pag/lună     | OCR bun, formule = punct slab                                                                     |

- [ ] R4.1 Confirmă la sursă capabilitatea Azure (docs oficiale) — dacă lipsește, taie Azure din comparație și spune-o explicit
- [ ] R4.2 Set de test FIX (aceleași fișiere pentru toți) — **numai IMAGINI/PDF scanat**, fiindcă OCR-ul se aplică doar acolo (`.docx` merge prin OMML după R3, NU prin OCR): `99_Roland_Work/Teste_Input/2.0_test_page_1.jpeg` (construcție geometrică + 36 formule, referință cunoscută) + o **poză/scan** cu mulțimi (ex. printează pagina din `test.multimi2.docx` și fotografiaz-o, ca să ai aceeași materie pe ambele căi) + un PDF scanat multi-pagină
- [ ] R4.3 Rulează fiecare provider pe setul fix; **compară formulă-cu-formulă** (câte corecte / greșite / pierdute), plus: figuri detectate, timp, cost în cote
- [ ] R4.4 Raport `docs/OCR_COMPARATIE_2026-07-30.md` cu tabel + verdict motivat + **declară costul consumat** din cotele free
- [ ] R4.5 Implementează câștigătorul ca primary în `api/lib/ocr_structured.py`, păstrând lanțul de fallback (nu rupe F9)
- [ ] R4.6 Gate: F9 continuă să funcționeze end-to-end (non-regresie pe importul de imagine), + `MAX_PAGES=1` respectat
- [ ] R4.7 **CONFIRMAT (Roland r2):** upgrade-ul OCR acoperă și calea IMAGINE/scan (nu doar .docx-ul care merge prin R3). Testează pe **mai multe tipuri de fișiere** (poză de manual, PDF scanat multi-pagină, screenshot). ⚠️ Distincție: fișierele-exemplu ale lui Roland (`test5nr…`, `2.Unghiuri…`) sunt **.docx → merg prin R3 (OMML), NU prin OCR**; R4 = pentru poze/scanuri reale. Dacă vrea aceeași materie pe ambele căi: printează un .docx și fotografiază-l

---

### R5 — Mut butoanele de limbi (F8) în rândul de sus al toolbar-ului

**CONFIRMAT (Roland, 2026-07-30 runda 2), citat:** „păstrează cum e acum, doar mută butoanele lingvistice în partea superioară". Deci: **NU** redesign în module-panel (opțiunea respinsă explicit). Toolbar-ul rămâne cum e; se mută **DOAR** switch-ul de traducere („scris în: RO ▾ | RO SK EN DE", azi pe rând separat sub toolbar) în **rândul de sus**, imediat după grupul evidențiere + „Șterge formatarea" (`TiptapToolbar.tsx`, grupul culori/clear ~L306-371). Scop: bara să nu coboare și să nu acopere pagina.

**Unde e F8 azi:** randat separat (grep „scris în" / `EditorTranslate`/`editor-translate*`), sub `TiptapToolbar`. De integrat în `TiptapToolbar` (variant `bar`) compact, păstrat accesibil și în Sheet-ul mobil (variant `sheet`).

- [ ] R5.1 Găsește randarea actuală a F8 (`grep -r "scris în"` / componenta de traducere). **Selector confirmat live:** butoanele sunt `<button>` simple cu `textContent` = `RO`/`SK`/`EN`/`DE`, lângă label-ul „scris în:", pe un rând sub `TiptapToolbar` (NU în TiptapToolbar acum)
- [ ] R5.2 Mut-o în `TiptapToolbar` după grupul culori/clear (compact, `flex-wrap`, să nu spargă layout-ul)
- [ ] R5.3 Gate: `tsc·jest·build` + live: F8 pe rândul 1, funcțional (RO→SK cu o formulă + revenire), 390px + desktop. Deploy grupat cu R3

### R6 — Search GLOBAL peste toată aplicația (Ctrl+K)

**CONFIRMAT (Roland r2), citat:** „pe lângă search existent[e] în matematică, vreau să adaugi unu global peste toată aplicația". Deci: search-ul din meniul Matematică (`EditorMathMenu`, pe taburi) **RĂMÂNE**; se **ADAUGĂ** un search GLOBAL, stil **command-palette (Ctrl+K)**, care caută în TOT: funcțiile editorului (formatare/inserare/tabel/matematică/traducere) + comută între module (Convertor/Editor/Asistent/Istoric/Planșe) + acțiuni globale.

**§17 — cere MOCK înainte de cod** (UI nou major).

- [ ] R6.1 Mock command-palette (Ctrl+K): input + rezultate grupate (Acțiuni editor / Module / Navigare) + confirmarea Roland
- [ ] R6.2 Index de comenzi: din `TABS` (module) + comenzile toolbar-ului editorului (fiecare cu label + acțiune + icon) + fuzzy match. Iconițe: **`lucide-react` e DEJA dependință (`^0.363.0`)** + `shadcn/ui` (poți refolosi `Command`/`Dialog`) — NU adăuga pachete noi (R-COST)
- [ ] R6.3 Declanșare globală `Ctrl+K` (la nivel `app/page.tsx` sau `layout.tsx`, nu doar în editor) + buton vizibil (ex. în Sidebar sau header modul); Escape închide, săgeți navighează
- [ ] R6.4 Gate + live 390px+desktop: deschide cu Ctrl+K, „tabel"→inserează tabel, „planșe"→comută la modulul Planșe, „bold"→aplică. Atenție: nu intra în conflict cu Ctrl+F (find-ul editorului) sau Ctrl+K nativ

---

## §2. SECURITATE — se face DUPĂ §1 (decizia Roland)

> ⚠️ **Toate verificate personal la 2026-07-30**, nu preluate din documente. Vulnerabilitățile sunt **active în producție** până la execuție.

- [ ] **S1 — `npm audit fix` (3 HIGH).** Verificat: `npm audit --omit=dev` → **5 vulnerabilități, 3 HIGH**: `next` (SSRF în rewrites, cache confusion, DoS Image Optimization), `postcss<=8.5.17` (XSS + path traversal), `sharp<0.35.0` (CVE-uri libvips), plus `dompurify<=3.4.11` și `katex<=0.16.20` — **ultimele două sunt exact pe calea prin care se randează conținutul venit din OCR/AI**. Toate au `fix available via npm audit fix`. Efort **mic**. Gate: `npm audit` curat + `tsc/jest/build` + smoke live (KaTeX randează, exportul merge).
      **⚠️ CAPCANĂ pe `katex`:** `katex@0.16.11` a fost pinuit DELIBERAT ca să corespundă exact cu `@tiptap/extension-mathematics@3.28.0`. `npm audit fix` rupe acel match → **verifică întâi compatibilitatea versiunii rezultate cu extensia**, altfel S1 sparge randarea celor 334 de formule. Dacă nu sunt compatibile: fixează celelalte pachete individual și tratează `katex` separat (upgrade coordonat al ambelor, sau acceptă riscul documentat).
- [ ] **S2 — XSS viu în istoric.** `frontend/src/components/history/HistoryDetail.tsx:65` face `win.document.write(entry.html)` cu HTML **NESANITIZAT**, deși `sanitizeHtml` e importat în același fișier (linia 4) și folosit corect la linia 136. Fix = o linie. Frate mai slab de verificat: `lib/editor-export.ts:179`. Efort **mic**
- [ ] **S3 — `pypdf==4.3.1`** (`requirements.txt:1`) pe calea PDF-urilor încărcate de utilizator (`api/convert.py:38,58,357,389,403,419`) → urcă la `>=6.x`, rulează testele pytest. Efort **mic**
- [ ] **S4 — timeout > maxDuration.** `api/lib/ocr_structured.py:116` are `timeout=180` în `retry_with_backoff(max_retries=2)` → până la ~540s, față de `maxDuration: 60` din `vercel.json` → utilizatorul primește **504 opac de platformă** în loc de eroare cu cod `E-OCR-*`. Idem `ocr_structured.py:232`, `translation_router.py:468,522`. Aliniază timeout-urile sub 60s. Efort **mic** — **atinge direct F9**
- [ ] **S5 — `/api/logs` fără plafon.** `frontend/src/app/api/logs/route.ts:85` = POST public, fără rate-limit și fără limită de dimensiune pe body, scrie în Supabase cu service-role key, fail-open → flood necontrolat al tabelei `logs`. Model existent în casă: `frontend/src/pages/api/proxy.js:70-130`. Efort **mic**
- [ ] **S6 — corpul erorii providerului expus la client.** `api/lib/exceptions.py:error_response()` întoarce `str(exc)`, iar `error_body[:200/300]` de la provideri e cusut în mesaj (`translation_router.py:66,172,272,322`, `ocr_structured.py:237`, `deepl_client.py:124`). `_sanitize_error` se aplică doar în `api/translate.py:352`, **nu** în `translate_text.py` / `ocr.py`. Efort **mic**
- [ ] **S7 — `ALLOWED_ORIGIN` fail-open.** Default `"*"` în ~14 locuri (`api/convert.py:576`, `api/deepl_usage.py:24`, `api/ocr.py:74,217`…) → fă-l fail-closed în producție (păstrează `*` doar pentru localhost/dev). Efort **mic**
- [ ] **S8 — afirmație falsă în config.** `frontend/next.config.js` justifică `eslint.ignoreDuringBuilds: true` cu „CI/pre-push runs lint", dar `.git/hooks/` are **doar `.sample`**, fără `.husky`, fără `.github/workflows` → lint nu rulează automat nicăieri. Ori adaugi hook/CI, ori corectezi comentariul (o regulă care minte e mai periculoasă decât lipsa ei). Efort **mic**

---

## §3. REGRESII — promisiuni rupte, verificate în cod

- [ ] **G1 — Contorul DeepL a devenit invizibil.** Backend viu (`api/deepl_usage.py:24` + rewrite în `vercel.json`), dar componenta a fost ștearsă împreună cu tabul Traduceri (commit `2891d00`) → **Cristina nu vede nicăieri cât a consumat din cota de 500K caractere/lună**. Reintrodu un indicator discret (ex. în header-ul editorului sau lângă switch-ul de limbi). Efort **mic**
- [ ] **G2 — Cache-ul de traduceri NU persistă.** `frontend/src/lib/translation-cache.ts` (SHA-256, livrat ca M6) e **ORFAN — 0 importatori**; cache-ul real e `useRef<Map>` in-sesiune (`editor-translate-state.tsx:82`, care declară explicit „NU se persistă cross-reload"). Promisiunea documentată „revine a doua zi → totul e încă acolo" e ruptă. Fie cablezi `translation-cache.ts` la F8, fie ștergi modulul și corectezi documentația. Efort **mediu**
- [ ] **G3 — Import lung fără notificare.** La 20 pagini × ~21.5s = **până la ~7 minute** cu utilizatorul blocat pe tab (`editor-import.tsx:42`). Adaugă notificare de browser la finalizare (`Notification` API). Limită onestă: pe iPhone cere PWA instalat (iOS 16.4+). Efort **mic**
- [ ] **G4 — Nu există verificare vizuală original↔rezultat (R-MATH).** `ImportUI.tsx` nu afișează nicio previzualizare a originalului → nu există mecanism prin care Cristina să prindă o formulă/figură pierdută de OCR. (Legat: „Pasul 1 ORIGINAL read-only" din metoda 3-pași a dispărut la retragerea tabului Traduceri.) Propune split-view sau miniatură a paginii-sursă lângă rezultat. Efort **mediu**
- [x] **G5 — Overlay pixel-perfect: ABANDON CONFIRMAT** (Roland, 2026-07-30). Se șterge și backend-ul → vezi §4 C1

---

## §4. CURĂȚENIE — cod mort verificat (0 importatori)

- [ ] **C1 — Overlay (abandon confirmat):** `git rm api/overlay.py api/lib/overlay.py api/tests/test_overlay.py` + ruta din `dev_server.py:50,64` + rewrite-ul din `vercel.json` dacă există. ⚠️ **NU** scoate PyMuPDF din `requirements.txt` — e folosit de `api/ocr.py:42-49` pentru rasterizarea PDF server-side
- [ ] **C2 — Duplicare introdusă de mine la F9:** `frontend/src/lib/pdf-rasterize.ts` are **0 importatori**, fiindcă `editor-import.tsx:124,196-198` re-implementează rasterizarea pdf.js inline. Ori cablez modulul, ori îl șterg. (⚠️ Memoria `finding_ocr_import_editor_2026_07_29` afirma greșit „Reuse: pdf-rasterize.ts" — CORECTAT)
- [ ] **C3 — Orfani după retragerea tabului Traduceri** (fiecare cu 0 importatori în afara propriului test): `lib/figure-payloads.ts`, `lib/translation-cache.ts` (vezi G2 — decide întâi), `lib/export-naming.ts`, `config/languages.json`, `config/math_terms_ro_sk.json`, `config/math_terms_ro_en.json`. Șterge + testele lor
- [ ] **C4 — `api/translate.py`** (pipeline-ul vechi, 395 linii): singurul apelant e `dev_server.py:62`; **verificat: `api/convert.py` NU importă din el**. Șterge dacă R4 nu-l refolosește
- [ ] **C5 — Dependințe moarte:** `react-dropzone`, `react-markdown` (0 importuri). Exporturi moarte: `getHistoryEntry()` (`lib/storage.ts:39`), type `ConversionRequest` (`lib/types.ts:46`), `import re as _re` (`api/lib/translation_router.py:37`)
- [ ] **C6 — Rută duplicat:** `frontend/src/app/editor-nou/page.tsx` vs `app/editor/` — clarifică/unifică
- [ ] **C7 — ⚠️ CAPCANĂ (nu curăța orbește):** planul vechi marca `api/lib/figure_crop.py` drept „DEPRECIAT", dar modulul e pe **hot-path-ul OCR** (`api/ocr.py:28`). Un cleanup care urmează planul vechi RUPE figurile. La fel: `html_builder.py`, `ocr_structured.py`, `math_protect.py` = **VII** (folosite de F8/F9)

---

## §5. RESTANȚE editor / matematică

- [ ] **M1 — Teoreme lipsă din bibliotecă** (`math-data.json`, verificat): **teorema bisectoarei = 0 intrări**, Menelaus = 0, Ceva = 0, teorema catetei = 1. Plus: nu există grup „Teoreme" per clasă (cerut de planul de curriculum §3). Autorează cu `latex` + `explicatie`, R3 la manuale, apoi `scratchpad/gate_check.js` + eyeball. Efort **mic-mediu**
- [ ] **M2 — Constructor: nested radical-în-fracție.** Constructorul e mono-segment (`EditorMathBuilder.tsx:84`, un singur `kind`) → nu poți compune „radical în fracție" fluid. Restul (matrice/sistem/Σ/∫ + editare la click) **e făcut** — planul vechi era stale. Efort **mediu**
- [ ] **M3 — Dark-mode opțional** (F5 polish): `next-themes` absent, 0 clase `dark:`. Efort **mediu**
- [ ] **M4 — a11y aprofundat:** 54 `aria-label` în `components/editor` (bază bună), dar zero `role`/`aria-live` pe barele Găsește/Import/status; niciun test a11y. Efort **mic-mediu**
- [ ] **M5 — Figuri PARAMETRICE** (amânat conștient de 2 ori): `editor-figures.ts:11-14` = SVG-uri hardcodate → nu poți schimba etichetele A/B/C sau laturile. (Redimensionarea = LIVRATĂ la F3c.) Efort **mare** — candidat de backlog
- [ ] **M6 — Contradicție NEDECISĂ figuri: SVG vs crop.** Planul vechi declara SVG-ul generat de Gemini „metodă definitivă" și crop-ul „abandonat (bbox imprecis)", dar codul face **opusul**: `api/lib/ocr_structured.py:74` conține textual `"Do NOT generate SVG. Return ONLY the bounding box."`, iar figurile se decupează cu Pillow. Codul funcționează (6 figuri corecte pe poza de test) → **decizia practică e crop-ul**; de consemnat explicit ca decizie și de șters afirmația contrară. Efort **mic** (doc)

---

## §6. MODUL PLANȘE — live dar netracked

**Stare reală:** 2/8 faze (F0 schelet + F1 labirint), **1 generator din 6**; `frontend/public/planse/` + tab în `config/tabs.json`. Absent din `HANDOFF_SESIUNE.md` → nicio sesiune nu-l mai preia de la `af34d07` (22.07).

- [ ] **P1 — Reintrodu modulul în `HANDOFF_SESIUNE.md`** (o secțiune scurtă cu starea reală). Efort **mic**
- [ ] **P2 — Repară promisiunea „offline" a unei faze DEJA BIFATE:** `frontend/public/sw.js:5-9` are `STATIC_ASSETS` doar `[manifest, icon-192, icon-512]` — **`/planse/*` NU e precache-uit**, deci singurul generator livrat nu merge fără rețea, deși F1 e bifat „instant, offline". Adaugă în precache. Efort **mic**
- [ ] P3 — (backlog) Cele 5 generatoare rămase (numere/integramă/unește/dictare/căutare) + `data/*.json`. Efort **mare**
- [ ] P4 — (backlog) `lib/history.js` (istoric + coș → un singur PDF) + unicitate persistentă între sesiuni (azi doar în-lot, `app.js:213-227`). Efort **mediu**

---

## §7. BACKLOG — NU în execuție (decizia Roland: listate, nu implementate)

| Item                                                             | Stare                                                                                                                                   | Efort          |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Modul Chat AI                                                    | 0% — **substituit funcțional** de modulul Asistent AI (`public/asistent/` + `pages/api/proxy.js`, respectă și decizia „Groq prioritar") | mare           |
| Modul Calculator                                                 | 0% — lipsesc `app/calculator`, `CalculatorPanel`, `GraphPlot`, `math.js`                                                                | mare           |
| Modul Corectare/Generare teste                                   | 0%                                                                                                                                      | mare           |
| Next 15 → 16                                                     | `next: ^15.5.20`                                                                                                                        | mare           |
| Tailwind v3 → v4                                                 | `tailwindcss: ^3.4.0`                                                                                                                   | mediu          |
| **Merge `faza-g-editor` → `main`**                               | `main..faza-g-editor` = **169 commituri**; producția se deployează dintr-un branch de feature                                           | mediu (review) |
| Quota hard-cap + Upstash (rate-limit distribuit)                 | `rate_limiter.py` e in-memory per-instanță; precedent existent: `pages/api/proxy.js:72-74`                                              | mediu          |
| PDF >20 pagini în loturi                                         | azi = plafonare la 20 cu mesaj onest, nu batching                                                                                       | mediu          |
| Export HTML interactiv multi-limbă                               | `data-i` = 0 hituri                                                                                                                     | mediu          |
| SW auto-versioning                                               | `sw.js:3` încă manual                                                                                                                   | mic            |
| Logging JSON structurat / bundle analyzer / dicționar math în UI | —                                                                                                                                       | mic-mediu      |

---

## §8. VERIFICĂRI UMANE — nu se automatizează

- [ ] V1 — Eyeball PDF + .docx real cu o formulă ȘI o figură redimensionată (mecanica e dovedită; perceptualul nu)
- [ ] V2 — Verificare de domeniu **Cristina**: corectitudinea matematică/notațională a celor 334 formule (gate-ul garantează DOAR KaTeX valid + curățenie, **NU** semantica)
- [ ] V3 — OCR real end-to-end **din browser pe prod** cu o poză de manual (backendul și clientul au fost dovedite SEPARAT; proxy-ul dev de 30s a împiedicat legarea lor local)
- [ ] V4 — PDF multi-pagină scanat (bucla per-pagină + plafon 20 + marcajul `[Pagina N: OCR eșuat]` = scrise, **zero rulări**)
- [ ] V5 — Decizie deschisă: clasa VIII „funcția liniară" `(a≠0)` vs `f(x)=ax+b` general `a,b∈ℝ`

---

## §9. DECIZII MOȘTENITE ÎNCĂ VALABILE (migrate din planurile șterse)

1. **Metoda 3 pași** (era „D23, DEFINITIVĂ"): Original → RO editabil → tradus editabil. **Stare azi: 2 pași** — pasul „Original read-only" a dispărut. Vezi §3 G4.
2. **Editare live persistentă (R-EDIT):** tot ce se inserează e editabil, iar editările supraviețuiesc comutării de limbă și intră în TOATE exporturile.
3. **Export din conținutul EDITAT** (`editor.getHTML()`), nu din datele OCR brute (R-EXPORT).
4. **R-MATH:** 0% pierdere de notație matematică. Orice element pierdut = bug critic.
5. **Per-pagină pe serverless:** 1 pagină/cerere OCR (`MAX_PAGES=1`), cap body 4MB — impus de limita de 60s.
6. **Fallback AI în lanț:** Gemini Flash → Flash-Lite → Pro → Mistral (OCR); DeepL → Gemini/Groq/NLLB/OpenRouter (traducere). Groq prioritar la chat.
7. **CORS:** browser → API Python Vercel = `text/plain` sau `multipart`, **NICIODATĂ** `application/json` (preflight-ul primește 503 la edge).
8. **R-COST:** totul pe free tier, fără excepție.
9. **Figuri = crop bbox cu Pillow** (decizia practică, vezi §5 M6), poziționate inline la locul lor, inclusiv în perechi `two_column`.

---

## §10. REGULI DE EXECUȚIE (obligatorii la fiecare fază)

1. **Gate de non-regresie după FIECARE item:** `npx tsc --noEmit` (0 erori) · `npx jest` (toate verzi, acum 57) · `npx next build` (OK) · probă live la **390px + desktop**.
2. **§17 — formă înainte de cod:** pentru orice element de interfață NOU, arată un mock și cere confirmarea Roland. (R1 are deja mock aprobat; R3/R4 nu adaugă UI nou major.)
3. **Verificare live REALĂ, nu presupusă.** Capcane dovedite: `computer left_click` ratează butoanele mici → folosește `element.click()`; `[role=dialog]` prinde remnantul animației Radix → verifică `data-state` sau screenshot; `.katex` e inline → măsoară cu `getBoundingClientRect`, nu `scrollWidth`.
4. **Dev local:** proxy-ul Next dev are **timeout 30s** → OCR-ul real (~21-31s) poate da `ECONNRESET`→500. Pornește cu `NEXT_PUBLIC_API_URL=http://localhost:8000` (browserul lovește direct `dev_server.py`). NU rula `next build` în paralel cu dev (EPERM pe `.next/trace`).
5. **R-HANDOFF:** după fiecare fază → actualizează `HANDOFF_SESIUNE.md` + bifează aici + memoria + commit/push.
6. **Deploy = DOAR cu confirmarea Roland** (outward-facing). Bump `CACHE_VERSION` în `frontend/public/sw.js`, `vercel deploy --prod --yes --token="$VERCEL_API_KEY"` din `frontend/`, apoi **verifică aliasul**, nu doar URL-ul de deployment.
7. **Roland testează pe PROD**, nu local — nu amâna deploy-ul după ce gate-ul e verde.
8. **Onestitate (R3):** ce n-a fost rulat se declară nerulat. Nu scrie „verificat end-to-end" pentru două jumătăți dovedite separat.

---

## §11. ȘTERGEREA PLANURILOR VECHI — primul item al sesiunii următoare

> **De ce nu s-a făcut deja:** planurile au fost consolidate în aceeași sesiune în care au fost citite. Auditul a arătat că `PLAN_v3.md` e singurul loc unde trăiesc deciziile D1–D27 (migrate în §9) și că el conținea o contradicție nerezolvată despre figuri (§5 M6). Ștergerea rămâne primul pas executabil, **după ce Roland confirmă că acest MASTER acoperă tot** — comparația e mai ușoară cu ambele pe disc. Git are oricum totul la `54fac8f`.

- [x] **W1** — Roland a confirmat (2026-07-30, AskUserQuestion) că `PLAN_MASTER.md` acoperă tot
- [x] **W2** — `git rm` **9 fișiere tracked** (recuperabile din git la `54fac8f`); PĂSTRATE `PLAN_DECISIONS.md` + `HANDOFF_SESIUNE.md`. ⚠️ **2 erau gitignored** (`deep_research_2026-03-24/ROADMAP_IMBUNATATIRI.md`, `99_Roland_Work/Arhiva_Proiect_Vechi/PLAN_PROIECT.md`) → NU-s în git, ștergerea = ireversibilă; backup local făcut, ținute în așteptarea confirmării separate a lui Roland
- [x] **W3** — Referințe actualizate: `CLAUDE.md` (§Progres + §Key Files), `README.md`, `HANDOFF_SESIUNE.md`, `scratchpad/README_autorare_math.md`, comentarii cod `tab-config.ts` + `IframeModule.tsx`. `PLAN_DECISIONS.md:21` lăsat ca log istoric; `Export_chat_sesiune_Carla.md` = transcript untracked, neatins
- [x] **W4** — Commit: `docs: consolidare planuri in PLAN_MASTER (sterge 9 planuri vechi tracked)`
