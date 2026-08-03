# PLAN MASTER — Sistem Traduceri Matematică

> **SURSA UNICĂ DE ADEVĂR.** Creat 2026-07-30 prin audit în cod (5 agenți paraleli, dovezi `fișier:linie`) al TUTUROR planurilor existente + cerințele Roland din `99_Roland_Work/cerinta_roland.md`.
>
> **A înlocuit** (ȘTERSE 2026-07-30, §11 executat): `99_Plan_vs_Audit/PLAN_v3.md`, `docs/PLAN_editor_tiptap_2026-07-23.md`, `docs/PLAN_math_academic_2026-07-26.md`, `docs/PLAN_math_curriculum_2026-07-27.md`, `docs/PLAN_modul_planse.md`, `docs/PROMPT_START_modul_planse.md`, `PLAN_OVERLAY_2026-07-10.md`, `deep_research_2026-03-24/ROADMAP_IMBUNATATIRI.md`, `99_Plan_vs_Audit/RECOMANDARI_IMBUNATATIRI.md`, `RESUME_DEPLOY_2026-07-09.md`, `99_Roland_Work/Arhiva_Proiect_Vechi/PLAN_PROIECT.md`.
> **SE PĂSTREAZĂ:** `99_Plan_vs_Audit/PLAN_DECISIONS.md` (log de decizii tehnice, nu plan) + `docs/HANDOFF_SESIUNE.md` (starea curentă).
>
> **Planurile vechi sunt intacte în git la commit `54fac8f`** — orice detaliu neacoperit aici se recuperează de acolo.

---

## §0. STARE VERIFICATĂ (2026-07-30, în cod — nu pe bife)

**LIVE pe `traduceri-frontend.vercel.app`** (`CACHE_VERSION v23-20260731a`, deployment `traduceri-frontend-nzchoo4l9` — R1/R2/R3/R5/R6), branch `faza-g-editor`.

| Zonă                     | Stare reală (cu dovadă)                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Editor nativ TipTap      | F1–F9: **13/15 complet**, 1 parțial (F5 polish), 1 neimplementat (F3b — retras conștient)                                                                                                        |
| Matematică               | **334 formule** V–XII, `334/334` cu `latex` **și** `explicatie`, 103 simboluri (`math-data.json`) — planurile ziceau 276, **doc era stale**                                                      |
| Paritate mobilă math     | **EXISTĂ** — `MobileToolbar.tsx:128` → `TiptapToolbar variant="sheet"`, iar `EditorMathMenu` la `TiptapToolbar.tsx:491` e **necondiționat**. ⚠️ Handoff-ul o lista greșit ca restanță — CORECTAT |
| Traducere în editor (F8) | LIVE, verificată e2e pe prod (RO→SK→EN, formule intacte)                                                                                                                                         |
| Import OCR (F9)          | LIVE v19; backend confirmat pe acest deploy (POST imagine reală → 200 în 21.5s, 8 secțiuni)                                                                                                      |
| Tab „Traduceri"          | RETRAS din UI intenționat (F7); backend traducere PĂSTRAT și refolosit                                                                                                                           |
| Modul Planșe             | **LIVE dar NETRACKED** — 2/8 faze, 1 generator din 6; absent din handoff de 8 zile                                                                                                               |
| Non-regresie             | `tsc 0 · jest 102/102 · next build OK (8 rute)` (57→102 după R3: +45 teste OMML/DOCX)                                                                                                            |

---

## §1. CERINȚELE ROLAND (2026-07-30) — SE EXECUTĂ PRIMELE

> Ordine confirmată de Roland: **cerințele întâi, securitatea (§2) după**. ⚠️ Cele 3 vulnerabilități HIGH din §2 rămân active în producție pe durata cerințelor (asumat conștient).
>
> **STARE:** R1 ✅ (v21) + R2 ✅ (v20) + **R3 ✅ + R5 ✅ (v22) + R6 ✅ (v23) — TOATE DEPLOYATE + verificate pe alias.** R6: `CACHE_VERSION v23-20260731a`, deployment `traduceri-frontend-nzchoo4l9`, alias servește v23 (Age:0, homepage 200, editor-nou 200). Gate: `tsc 0 · jest 102/102 · build OK`. **Cerințe R1–R6 = TOATE LIVRATE + DEPLOYATE.**
>
> **➡️ URMĂTORUL: R7** (upgrade calitate OCR — cerință NOUĂ Roland 2026-07-31, pe dovada a 3 fișiere reale testate; **înglobează + execută R4**). 4 goluri confirmate (tabele / forțează-OCR-pe-PDF-text-prost / ordine multi-coloană / figuri-pe-toate-căile) + provider Azure(docs)+Gemini(math) rutat pe tip. Vezi secțiunea **R7** de mai jos. Apoi §2 securitate (S1 npm audit cu capcana katex@0.16.11, S2 XSS `HistoryDetail.tsx:65`) → §3/§4/§5/§6. **RĂMAS: eyeball Roland pe prod** (import `.docx`, F8 sus, Ctrl+K pe telefon).
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

> ## ✅✅ R3 LIVRAT (2026-07-30) — gate verde + dovedit LIVE + **DEPLOYAT v22** (alias verificat)
>
> **Cod:** NOU `frontend/src/lib/omml-to-latex.ts` (parser OMML→LaTeX pur, recursiv) + `frontend/src/lib/docx-to-blocks.ts` (`docxXmlToBlocks` + `docxArrayBufferToBlocks`: unzip fflate + rels + media→base64) + integrat în `editor-import.tsx` (ramura `.docx` înlocuiește `mammoth`). **`mammoth` + shim `.d.ts` ȘTERSE** (schimb pt `fflate ^0.8.3`). **Gate: `tsc 0 · jest 102/102` (57→102, +45 suita OMML) · `next build OK`.**
> **DOVEDIT LIVE (Chrome MCP, `next start` :3320, import prin `onChange` real cu binarul .docx REAL):**
> · `test.multimi2.docx` → **20 formule KaTeX la locul lor** (`{2,3,7}⊂{0,1,2,3,5,7}`, `7∉{x∈ℕ|x≤8}` cu ℕ double-struck, `A∪B`/`A∩B`/`A\B`), banner „Am păstrat 20 formule la locul lor", **0 overflow**. Contrast: `Downloads/test.multimi2.pdf` avea matematica DISPĂRUTĂ.
> · `2.Unghiuri. Bisectoare.docx` → **6 formule + 1 figură JPEG REALĂ** (diagrama geometrică 512×244 decodată+randată la locul ei), bold păstrat („adiacente"/„suplimentare"), ∢/grade, dialogul §17 „înlocuiește/adaugă" funcțional.
> · `test5nr.naturale2025.docx` (fișierul din care e construit PDF-ul-dovadă al lui Roland) → **9 formule la locul lor** (`347+879=`, `765−236=`, `\overline{aa}` = zecimală periodică). Grija advisor „operand pierdut la `\cdot`" REFUTATĂ prin dump structural: `Efectuați 17·[12·(15·9−130)−59]` = toți operanzii în text, doar operatorii `·` în OMML, ordine corectă.
> · Invariant de numărare pe toate 3 fixture-urile reale: `inlineMath === OMML` (20/9/6) + imagine (1 la unghiuri) — aserție în jest, nu eyeball. Fiecare LaTeX emis validat cu `katex.renderToString(throwOnError:true)`.
> **ETAPA A atinsă pe toate 3.** ETAPA B (rămas, neblocant): liste numerotate native (azi paragrafe), tabele (azi aplatizate la paragrafe/celulă), spațiere fină; cosmetic: `și`→`si` italic în math (transliterat, R-MATH-safe), double-struck „bleed" pe cuvânt când profesoara a taguit tot runul.
> **RĂMAS:** deploy (grupat cu R5) + eyeball Roland pe prod + export PDF comparat (mecanica dovedită la F9, identic).

- [x] R3.1 Modul NOU `frontend/src/lib/omml-to-latex.ts` — funcție **pură** recursivă (primește `Element`/string XML, întoarce `{latex, unknown[]}`), unit-testabilă în jsdom. Acoperă `m:d`(begChr/endChr independente+sepChr+N×e), `m:f`, `m:rad`, `m:sSup/sSub/sSubSup/sPre`, `m:nary`, `m:acc`, `m:bar`, `m:groupChr`, `m:limLow/Upp`, `m:func`, `m:m`, `m:box/eqArr` + hartă simboluri Unicode VALIDATĂ (∈⊂⊄∉≤∪∩∢°· + greci) + escape literale + translit diacritice + `\mathbb` doar pe litere ASCII. Necunoscut→recursăm+raportăm
- [x] R3.2 Fixture-uri REALE: `word/document.xml` din toate 3 `.docx` → `frontend/src/lib/__tests__/fixtures/` (COMPLETE, nu trunchiate — invariantul cere toate OMML-urile). 41 teste: fiecare structură + cazuri degenerate (gol→literal, necunoscut→recursăm) + validare KaTeX + invariant numărare + integrare binar real (`docxArrayBufferToBlocks` din `zipSync`)
- [x] R3.3 Integrat în `editor-import.tsx` (ramura `.docx`): unzip `fflate` → `word/document.xml` → `docxXmlToBlocks` păstrând ORDINEA text↔formule + bold/italic din `w:rPr` + imagini block-level la locul lor. Progres „Se citește…"
- [x] R3.4 **DEVIERE MOTIVATĂ (Claude+advisor, 2026-07-30): NU refolosesc `parseInlineToNodes`.** Acela parsează STRING-ul `$latex$` emis de Gemini (OCR). DOCX-ul poartă matematica STRUCTURAT (noduri OMML), niciodată ca `$…$` în `<w:t>` → un round-trip prin string ar FABRICA exact capcana `$`-injection pe care R3.4 o avertizează. Construiesc nodul `inlineMath` **direct** din LaTeX (`docx-to-blocks.ts`), păstrând doar garda „latex gol → text literal" (portată explicit + unit-testată). Escapez `{ } $ % # & _` tastate literal în `<m:t>` (capcana acoladelor din set-builder). Intenția R3.4 (produce noduri `inlineMath` fără mangling) e ONORATĂ mai bine așa.
- [x] R3.5 **Onest (R3):** parserul întoarce `{ommlCount, emittedMathCount, imageCount, unresolvedImages, unknown[]}`. Bannerul raportează „N formule + M figuri la locul lor" + „K în format nesuportat (EMF/WMF)" + „construcții rare aproximate". Bug advisor evitat: `bruteNoMath` NU mai e setat pt `.docx` (altfel primul import reușit ar fi zis „matematica NU a fost transcrisă")
- [x] R3.7 **`mammoth` ȘTERS** (+ shim `types/mammoth-browser.d.ts`) via `npm uninstall`; adăugat `fflate ^0.8.3` (cititor zip, ~8KB MIT) — schimb net în minus. `mammoth` = 0 importatori rămași — a fost instalat ieri exact pentru calea `.docx` pe care R3 o înlocuiește. Scoate-l din `package.json` dacă nu mai e folosit; oricum ai nevoie de un cititor de zip (`fflate` sau `jszip`) → e un **schimb**, nu o dependință în plus
- [x] R3.6 Gate: `tsc 0 · jest 102/102 · build OK` + **eyeball LIVE pe `test.multimi2.docx`**: 20 formule la locul lor, banner corect, 0 overflow (screenshot). **Onest despre ce NU s-a rulat (advisor):** NU am chemat `editor.getHTML()` — am contorizat cele 20 `[data-latex]` din DOM-ul viu (sursa serializării getHTML; export-ul dovedit identic la F9, NU re-rulat aici). `Downloads/test.multimi2.pdf` NU există (doar `test5nr.naturale2025.pdf`) → **diff-ul de PDF NU s-a rulat**; compararea perceptuală + re-export .docx = eyeball Roland pe prod
- [ ] R3.8 **FIXTURE-URI REALE EXTINSE (Roland, 2026-07-30 r2):** pe lângă `test.multimi2.docx`, folosește ca test set și `C:\Users\ALIENWARE\Desktop\Cristina\Fisiere_Word\test5nr.naturale2025.docx` + `2.Unghiuri. Bisectoare.docx`. **Dovadă a bug-ului:** `Downloads/test5nr.naturale2025.pdf` (output actual al app-ului) are matematica DISPĂRUTĂ complet — „Calculați: (1,5 p)" fără calcul, „Se știe că , aflati ." fără ecuații, „numerelor de forma ." fără forma. Eyeball pe toate 3, formulă-cu-formulă.
      **✅ VERIFICAT LA SURSĂ (2026-07-30, `unzip -p … word/document.xml | grep m:oMath`):** `test.multimi2` = **20 OMML / 0 imagini** · `test5nr.naturale2025` = **9 OMML / 0 imagini** · `2.Unghiuri. Bisectoare` = **6 OMML / 1 IMAGINE** (`word/media/`). Toate au OMML → abordarea R3 e validă pe toate 3. ⚠️ `2.Unghiuri` are și 1 figură ca imagine → vezi R3.10
- [x] R3.10 **Imagini din .docx LIVRAT:** `<w:drawing>`/`<w:pict>`→`a:blip r:embed`/`v:imagedata r:id` mapat prin `word/_rels/document.xml.rels`→`word/media`→data-URI base64, inserat ca nod `image` (ResizableImage F3c) block-level la locul lui. **DOVEDIT LIVE:** `2.Unghiuri` → figura JPEG reală (512×244) randată la locul ei. EMF/WMF/TIFF → null → placeholder onest + contorizat (`unresolvedImages`), nu `<img>` gol (advisor)
- [x] R3.9 **FIDELITATE — ETAPA A ATINSĂ pe toate 3** (formule la locul lor editabile + text în ordine + bold + imagini la locul lor). **ETAPA B rămas (neblocant, iterativ):** liste numerotate native (azi = paragrafe), tabele (azi = aplatizate paragraf/celulă), spațiere/aliniere fină (ex. 2 paragrafe goale în jurul imaginii din `flush→image` — verificat: NU inflează nr. de pagini, unghiuri=2 pag ca originalul). Cosmetic declarat onest: `și`→`si` (italic în math; `\text{}` nu randează diacritice RO — cf. finding_katex_authoring_pitfalls); double-struck „bleed" pe cuvânt când OMML-ul profesoarei taguiește tot runul (fidel cu sursa, randează)

### R4 — OCR: alege pe DOVADĂ cel mai calitativ provider ⟹ **ÎNGLOBAT în R7 (2026-07-31)**

> **⚠️ R4 se execută PRIN R7.** Roland a testat 3 fișiere reale (2026-07-31) = dovada măsurată cerută de R4; decizia de provider e luată (**Azure docs + Gemini math, rutat pe tip**) + 4 goluri de calitate identificate. Vezi **R7** în §1. Detaliile R4 de mai jos rămân ca referință (candidați, cote, sub-pași).

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

- [x] R5.1 Găsit: F8 = componenta `LanguageSwitch.tsx` (nu `<button>` brute — `ToggleGroup` RO/SK/EN/DE + dropdown „scris în"), randată în `EditorTiptap.tsx` (`EditorShell` L129-132) pe un rând propriu sub toolbar, vizibil desktop+mobil
- [x] R5.2 Mutat în `TiptapToolbar` după grupul culori/clear, `<LanguageSwitch compact />` într-un grup nou, **DOAR varianta `bar`** (`!isSheet`). **Decizie fără regresie mobilă (Option B):** rândul separat din `EditorShell` devine `md:hidden` (rămâne always-visible pe mobil, NU se ascunde în Sheet, NU se dublează). Pe desktop: F8 urcă în toolbar, rândul separat dispare → un rând vertical eliberat
- [x] R5.3 Gate: **`tsc 0 · jest 102/102 · build OK`** + **LIVE (Chrome MCP):** DOM = 2 grupuri limbi (1 vizibil în toolbar `inMdHidden:false` + 1 `md:hidden` ascuns pe desktop); screenshot = „scris în: RO ▾ RO SK EN DE" pe rândul 2 al toolbar-ului, rândul separat dispărut; click SK → spinner „traduc…" (wiring `switchLanguage` OK; F8 deja prod-verificat 2026-07-29). RĂMAS: eyeball 390px Roland (mobilul = rândul separat neschimbat). **Deploy grupat cu R3**

### R6 — Search GLOBAL peste toată aplicația (Ctrl+K)

**CONFIRMAT (Roland r2), citat:** „pe lângă search existent[e] în matematică, vreau să adaugi unu global peste toată aplicația". Deci: search-ul din meniul Matematică (`EditorMathMenu`, pe taburi) **RĂMÂNE**; se **ADAUGĂ** un search GLOBAL, stil **command-palette (Ctrl+K)**, care caută în TOT: funcțiile editorului (formatare/inserare/tabel/matematică/traducere) + comută între module (Convertor/Editor/Asistent/Istoric/Planșe) + acțiuni globale.

**§17 — cere MOCK înainte de cod** (UI nou major).

> ## ✅✅ R6 LIVRAT (2026-07-30) — mock §17 aprobat + gate verde + dovedit LIVE + **DEPLOYAT v23** (alias verificat)
>
> **Fișiere NOI:** `lib/editor-commands.ts` (punte comenzi paletă↔editor), `components/command/CommandPalette.tsx` (paleta). **MODIFICATE:** `app/page.tsx` (state + listener Ctrl+K + render + prop Sidebar), `EditorTiptap.tsx` (EditorShell înregistrează handler-ul de comenzi), `Sidebar.tsx` (buton 🔍 + prop `onOpenSearch`).
> **⚠️ `cmdk`/shadcn `Command` NU erau în proiect** (onboard-ul greșea) → construită FĂRĂ pachet nou (R-COST), pe `Dialog` + input/listă/navigare custom + fuzzy diacritic-insensitiv.
> **Gate: `tsc 0 · jest 102/102 · build OK`.** **DOVEDIT LIVE (Chrome MCP):** Ctrl+K deschide (3 grupuri, 15 comenzi, „Editor" marcat activ); filtrare „tabel"→1 comandă; comutare module (istoric/planșe); **comandă editor comută pe Editor + execută** (`tablesInEditor:1`); buton 🔍 Sidebar deschide; **Ctrl+F NU deschide paleta** (fără conflict); **centrat desktop + 390px, 0 overflow**.
> **⚠️ BUG de centrare prins + reparat scoped:** animația `enter` (tailwindcss-animate) hijack-uiește `transform` la identity → `translate-x-[-50%]` NU se aplică → paleta descentrată (jumătate off-screen la 390px). Fix: `!translate-x/y-[-50%]` (author `!important` bate animația). **Corectat cu MĂSURARE (advisor):** NU e universal — `MathEditDialog` măsurat = centrat CORECT; bug-ul e SPECIFIC paletei (re-randează frecvent → ține animația la `from`/identity). Fix scoped suficient. Vezi [[finding_dialog_transform_animation_2026_07_30]].
> **✅ Runda advisor (3 goluri tratate):** (1) **BLOCANT reparat** — Ctrl+K în timpul scrisului: nimic preselectat (`selected=-1`), Enter pe query gol = no-op → nu mai comută modulul accidental (verificat live). (3) import ținit prin `id` unic (nu querySelector pe accept) + declar onest: „Formulă matematică" inserează o formulă-început editabilă (`x`, click→editare), biblioteca completă rămâne pe butonul Matematică.
> **⚠️ LIMITĂ ONESTĂ (cross-module insert):** comenzile de INSERARE (tabel/formulă) rulate din paletă când ești pe ALT modul (Convertor/Planșe/…) comută pe Editor dar **pot să nu insereze** (ProseMirror are nevoie de un settle incert după `display:none→block` — best-effort cu poll rAF + settle). **Cazul COMUN (deja în editor) MERGE fiabil** (verificat: tabel 9→10). Modulele/găsește/traducere merg din orice modul. Utilizare reală: inserezi din editor. Follow-up backlog dacă se dorește 100% cross-module.
> **RĂMAS:** deploy + eyeball Roland pe prod (Ctrl+K pe telefon).

- [x] R6.1 Mock command-palette aprobat de Roland (AskUserQuestion §17, 2026-07-30): input + grupuri Module / Acțiuni editor / Acțiuni + comportament (Ctrl+K global + buton 🔍, comenzile editor comută pe Editor întâi)
- [x] R6.2 Index comenzi: 5 module din `TABS` + 9 acțiuni editor (bold/italic/tabel/formulă/import/traducere SK/EN/DE/găsește) + 1 globală (tot ecranul). `lucide-react` pt iconițe. Fuzzy match diacritic-insensitiv (NFD). Punte cross-tab prin `editor-commands.ts` (EditorShell înregistrează handler; e mereu montat, taburile `display:none`)
- [x] R6.3 Ctrl+K global la nivel `page.tsx` (window keydown, preventDefault, toggle) + buton 🔍 „Caută… Ctrl K" în Sidebar. Escape închide (Dialog), ↑↓ navighează (index global peste grupuri), Enter execută
- [x] R6.4 Gate + LIVE 390px+desktop: Ctrl+K deschide, „tabel"→inserează tabel (dovedit `tablesInEditor:1`), module comută, „bold" wired. **Fără conflict Ctrl+F** (verificat: Ctrl+F NU deschide paleta). Paletă centrată la 390px (0 overflow) după fix-ul de transform

### R7 — Upgrade calitate OCR/conversie (cerință NOUĂ Roland, 2026-07-31; ÎNGLOBEAZĂ + EXECUTĂ R4)

> **De unde vine:** Roland a testat 3 fișiere reale prin OCR (`99_Roland_Work/Teste_Input` → `Teste_Output`, 2026-07-31). Verificate vizual input↔output de Claude. **Decizii stabilite prin AskUserQuestion (2026-07-31):** toate 4 golurile de mai jos = cerințe; provider = **Azure Document Intelligence pt documente + Gemini pt math, rutat pe tip de conținut**. Aceste teste = și dovada măsurată cerută de R4 → **R7 execută R4** (decizia de provider e luată pe dovadă, nu pe reputație).

**📊 SCORECARD teste (dovadă, verificat vizual):**

| Fișier                           | Tip                | Scor        | Constatare                                                                                                                                                                        |
| -------------------------------- | ------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `limite_matematica.jpeg`         | imagine math       | **10/10**   | Toate 9 limitele (fracții cu radicali, `∛`, `sin13x`, `∞`) capturate + randate perfect. **Math OCR (Gemini) = excelent, NU-l atinge.**                                            |
| `IMG-20250914-WA0001.jpg`        | poză rotită manual | **~8.5/10** | Tot conținutul (fracții+text) capturat din poză rotită/mototolită. **Cusur:** ordine multi-coloană greșită (`a,d,b,c,e,f` în loc de `a,b,c,d,e,f`).                               |
| `1.1_Analyse Filtrasan 2026.pdf` | PDF lab (Mösslein) | **~3/10**   | **Tabelul PIERDUT** (→ text-run); logo/semnătură/sigiliu absente; erori text din sursă. Cauza: PDF cu **strat-text prost** → app-ul a extras text-brut (garbaj) în loc de re-OCR. |

**Cele 4 goluri = cerințe (toate confirmate de Roland):**

- [x] **R7.1 — Reconstrucție TABELE — LIVRAT (2026-08-01, NEDEPLOYAT).** Azure `prebuilt-layout` → tip nou de secțiune `table` (`ocr-map.ts` `tableToBlocks` → noduri `table/tableRow/tableHeader/tableCell`). **Dovadă la sursă:** Filtrasan real → tabelul de rezultate 7×4 reconstruit (`Parameter | Einheit | Untersuchungs-erg | Untersuchungs-ver` + pH/Säurekapazität/Aluminium/Chlorid/Kieselsäure/Dichte). Unit test grilă+antet+rânduri neuniforme. **[CERT] `getHTML()`:** test cu Editor TipTap real (jsdom) → `<table>` + toate celulele + `<th>` (sursa exportului). RĂMAS: doar aspectul VIZUAL al exportului = eyeball prod.
- [x] **R7.2 — PDF cu strat-text prost → forțează OCR — LIVRAT.** NOU `pdf-text-quality.ts` (`assessPdfText`): semnal de CALITATE `cleanWordRatio` (măsurat pe fișiere reale: Filtrasan 0.49 / CettaClear 0.49 = rău vs Unghiuri 0.61 = bun; prag 0.55) + floor caractere/tokenuri. AMBII poli unit-testați pe text REAL (fixture-uri, negative control — nu overfit). **ȘI buton „Forțează OCR"** (§17 mock aprobat) în `EditorInsertMenu`. Înlocuiește euristica veche `compact>=numPages*10`.
- [x] **R7.3 — Ordine corectă multi-coloană — LIVRAT.** DIAGNOSTIC ÎNTÂI (advisor): OCR real IMG-WA0001 → problema 9 iese `two_column` stânga=[a,d] dreapta=[b,c,e,f] → aplatizarea dădea `a,d,b,c,e,f`. **Cauza = aplatizarea, NU promptul.** Fix `ocr-map.ts` `orderReadingSequence`: reordonez itemii etichetați `a)/b)/1./2.` în ordine naturală DOAR când toți copiii sunt etichetați de același fel (pași `$P_1$`/figuri/proză = neatinși → regresie-test verde). Azure dă deja reading-order nativ (span offsets).
- [~] **R7.4 — Figuri/logo-uri — LIVRAT pe calea Azure (business PDF).** Azure `figures[].boundingRegions.polygon` → bbox fracțional → refolosesc `figure_crop.embed_crops_in_sections` cu `snap=False` (bbox-ul Azure e tight; snap-ul Gemini ar decupa logo-ul). **Dovedit vizual pe Filtrasan real:** logo „Institut Dr. Nuss" + sigiliu „DAkkS D-PL-14084" decupate curat (înainte: absente). ⚠️ **JUMĂTATE onestă NEATINSĂ:** calea PDF-cu-text-BUN (`rawTextToBlocks`) tot NU extrage imagini — nu era în cele 3 fișiere; backlog dacă apare cazul.
- [x] **R7.5 — Provider rutat pe tip — LIVRAT.** **Sub-pas 1 confirmat LA SURSĂ (docs Microsoft Learn):** Azure `features=formulas` DĂ LaTeX [CERT] DAR e add-on PLĂTIT (nu free F0) → **exclus prin R-COST, nu prin absență**; math rămâne Gemini. Azure base (gratis F0): tabele+figuri+reading-order. NOU `api/lib/azure_layout.py` (async submit→poll, deadline 45s < 60s Vercel, span-offset reading order, polygon→bbox). Rutare `api/ocr.py` (`engine` param): imagine→Gemini, PDF→Azure. **Gardă R-MATH:** 0 tabele SAU eroare Azure → revin la Gemini (pagina nu se pierde). Env SET local; ⚠️ **de adăugat în Vercel prod înainte de deploy.** Cost: ~3 pag F0 în dev.
- [~] **R7.6 — Gate + eyeball — LIVRAT (server + mapare + figuri), RĂMAS eyeball prod.** Gate: `tsc 0 · jest 116/116 · next build OK · pytest 49`. **Dovedit la SURSĂ pe fișiere reale:** Filtrasan → tabel 7×4 + logo+sigiliu decupate (PNG verificate vizual) + text curat; IMG-WA0001 → ordine `a,b,c,d,e,f` (structura reală); limite_matematica → 10/10 neatins. Raport `docs/OCR_COMPARATIE_2026-07-31.md` (scoruri înainte/după + onestitate). **✅ DEPLOYAT (2026-08-01):** frontend v24 (`traduceri-frontend`, alias verificat) + API Python (`traduceri-api`, env Azure adăugat + `.vercelignore` fix bundle). **SMOKE PROD la sursă:** POST Filtrasan `engine=azure` → 200/6.2s, `source=azure-layout`, **5 tabele + tabel rezultate 7×4**. **RĂMAS:** eyeball CLIENT Roland pe prod (render tabel + export vizual).

### R8 — Fidelitate export (rundă 2026-08-01; ✅ 3 fix-uri DEPLOYATE v25 + 2 DEFERATE)

> **Context:** Roland a testat pe prod (merge Teste_Input → export PDF 14 pag). Claude a verificat exhaustiv toate paginile. R7 (tabele/logo-uri lab) confirmat vizual OK. Vezi memoria `finding_truncated_math_unicode_2026_08_01` + `docs/HANDOFF_SESIUNE.md` „RUNDĂ FIDELITATE EXPORT".

- [x] **R8.1 — Garbaj Hangul în loc de formule → REPARAT + DEPLOYAT v25.** Litere Math-Alphanumeric (U+1D400+) trunchiate la 16 biți → Hangul (U+D400) în stratul-text al PDF sursă. `fixTruncatedMathAlnum` (+0x10000 NFKC) în `ocr-map.ts`.
- [x] **R8.2 — `$latex$` brut în caption figură → REPARAT v25** (parsat prin `parseInlineToNodes`).
- [x] **R8.3 — Cifre-zgomot izolate (limite „1" fantomă) → REPARAT v25** (filtru `^\d$` în `textToParagraphs`).
- [x] **R8.4 — Figuri Gemini supra-decupate → ATENUAT (2026-08-01, decizia Roland „reduc+cap", NEDEPLOYAT).** În `figure_crop.py` `crop_figure`: (1) expansiune verticală snap `0.35→0.15` (bbox-ul mic Gemini + 0.35 înghițea o linie de text adiacentă → duplicare poză+text); (2) **cap creștere**: crop-ul final clamp-at să nu depășească bbox-ul Gemini cu mai mult de `0.12·dim + pad` (recuperare a bazei clipate, DAR nu o linie de text întreagă), păstrând tightening-ul snap-ului când e mai strâns. **F9-safe DOVEDIT:** fixture-ul `test_figure_and_list` (snap + recuperare figură + excludere text) rămâne verde + 1 test nou R8.4 (bbox strâns nu prinde text din amonte). Gate: `pytest 51/51`. ⚠️ **Onest:** e o ATENUARE — cazul text CONTIGUU cu figura rămâne parțial; verificarea perceptuală pe pagini de construcție = **eyeball Roland pe prod**. Backend (deploy separat pe `traduceri-api`).
- [x] **R8.5 — Layout „umflat" la export → REPARAT (2026-08-01, NEDEPLOYAT).** CSS în `editor-export.ts DOCUMENT_CSS`: `.doc tr { page-break-inside: avoid }` (un rând nu se rupe peste pagină), `.doc table { page-break-inside: auto }` (tabelul se rupe ÎNTRE rânduri, nu împins gol pe pagină nouă), padding celule `6→4px` + `line-height 1.3` (compactare, evită 1 pag→3). Gate: `gate_check PASS · tsc 0 · jest 126/126 · build OK`. ⚠️ Onest: greu de verificat headless (fără LibreOffice/Word) → **eyeball export = Roland pe prod**. Frontend (grup cu §3).

---

## §2. SECURITATE — se face DUPĂ §1 (decizia Roland)

> ⚠️ **Toate verificate personal la 2026-07-30**, nu preluate din documente. Vulnerabilitățile sunt **active în producție** până la execuție.

- [x] **S1 — `npm audit fix` (non-force) — LIVRAT (2026-08-01, NEDEPLOYAT).** `npm audit --omit=dev` **5 vulnerabilități → 3**. FIXATE: `dompurify` 3.3.3→**3.4.12** (low, calea randare OCR/AI) + `katex` 0.16.11→**0.16.47** (moderate, calea randare) + `next` 15.5.20→**15.5.22** (patch). **RESIDUU ONEST [NEGĂSIT fix non-breaking]:** 3 HIGH rămân — `sharp 0.34.5` (nevoie ≥0.35.0) + `postcss 8.4.31` nested sub `next` + `next` care depinde de ele. Singurul „fix" npm = `--force → next@9.3.3` (**downgrade de 6 ani**, absurd); fix real = Next 15→16 (§7 backlog, exclus de Roland) sau `overrides` riscant pe pipeline-ul de imagini/build. Reachability neconfirmată (sharp/libvips doar via Image-Optim API; postcss doar la build). Lăsat documentat.
      **⚠️ CAPCANĂ `katex` REZOLVATĂ (dovadă la sursă):** peer dep-ul real al `@tiptap/extension-mathematics@3.28.0` = `katex: "^0.16.4 || ^0.17.0"` (citit din `node_modules`, nu din memorie) → 0.16.47 satisface peer-ul. Pin-ul „exact 0.16.11" era supra-precaut. **DOVADĂ non-regresie katex:** `scratchpad/gate_check.js` = **334/334 KaTeX_OK** pe 0.16.47 + compat export CSS verificat empiric (toate 12 font-families din runtime 0.16.47 prezente în `katex-inline-css.ts` 0.16.11; clasele-atom `mord/mbin/…` absente în AMBELE versiuni = structurale, fără regresie). package.json NEATINS (versiunile intră în range-urile `^` existente) — schimbă doar `package-lock.json` (Vercel instalează din lock → committat). Gate: `tsc 0 · jest 123/123 · next build OK (8 rute)`.
- [x] **S2 — XSS viu în istoric → REPARAT (2026-08-01, NEDEPLOYAT).** `HistoryDetail.tsx:65` `win.document.write(entry.html)` → `win.document.write(sanitizeHtml(entry.html))` (același `sanitizeHtml` folosit deja la preview). **Fratele `editor-export.ts:179` VERIFICAT = risc scăzut, lăsat intenționat:** `bodyHtml = editor.getHTML()` e ieșire ProseMirror **schema-constrânsă** (TipTap parsează orice import/paste în noduri de schemă → `<script>`/`on*` nu supraviețuiesc), randată în fereastra PROPRIE a userului, NU HTML stocat de la atacator re-redat. Un `sanitizeHtml` naiv acolo ar rupe exportul: strip `data-latex` (config `ALLOW_DATA_ATTR:false` → math nu se re-randează) SAU wrapper-ul `<html>/<head>/<style>` (doc full self-built cu KATEX_INLINE_CSS de încredere). Gate: `tsc 0 · jest 123/123`.
- [x] **S3 — `pypdf==4.3.1` → `6.14.2` — REPARAT (2026-08-01, NEDEPLOYAT).** Bump în `requirements.txt`. **⚠️ pytest NU atinge pypdf** (advisor) → am rulat cele 5 căi REALE din `convert.py` pe PDF-uri reale (Filtrasan + Unghiuri, `scratchpad/s3_pypdf_smoke.py`): `pdf_to_docx`, `pdf_to_html`, `merge_pdfs` (2 pag = 1+1 verificat), `split_pdf`, `compress_pdf` — TOATE OK pe 6.14.2. API modern (`PdfReader/.pages/.extract_text/PdfWriter.add_page/.write`) stabil 4→6. Gate: `pytest 50/50`.
- [x] **S4 — timeout > maxDuration → ALINIAT (2026-08-01, NEDEPLOYAT).** OCR Gemini `ocr_structured.py:116` `180→45` + `max_retries 2→0` (un timeout ridică imediat, nu ×3; 429 cascadează rapid pe modele) — **F9 bounded ~45s**. Mistral fallback `120→timeout_s`. Claude `translation_router.py:468/522` `120→55`. NLLB `313` `90→25` + `max_retries 2→1` (25+3+25=53<60). **Gap advisor (Azure+Gemini stack):** `ocr_structured(timeout_s=…)` parametrizat + `api/ocr.py` trece bugetul rămas la fallback-ul Gemini (`min(45,max(10,48-elapsed))`); Azure `_TOTAL_DEADLINE 45→35`, `_ANALYZE_TIMEOUT 30→20`. **⚠️ Residuu ONEST:** `gemini_request`(56)/`ocr_with_mistral`(163) au `timeout=55` (single<60) DAR retry-multiplicare pe erori tranzitorii (55×3); sunt PARTAJATE cu OCR-ul legacy → nu le-am atins (risc rupere pagini lente). Bound complet per-request = deadline în `retry.py` = follow-up efort-mediu. Gate: `pytest 50/50` (incl. `test_azure_layout`).
- [x] **S5 — `/api/logs` plafonat → REPARAT (2026-08-01, NEDEPLOYAT).** POST public în `logs/route.ts`: (1) **plafon body** `content-length` + re-check pe `raw.length` (32KB) → 413; (2) **rate-limit per IP** best-effort in-memory (120/min, portat din `proxy.js:69-91`, IP din `x-real-ip`→ultimul `x-forwarded-for`) → 429; (3) **caps câmpuri** înainte de insert (message deja 4000; adăugat stack 4000, context 8000 via `capJson`, device 2000, source 200, page 500). ⚠️ **Onest:** rate-limit-ul e per-instanță warm (nu distribuit) — oprește flood dintr-o singură sursă, nu botnet; e fail-open (nu blochează app-ul). Distribuit ar cere Upstash (env deja există) — refinabil. Gate: `tsc 0 · jest 123/123`.
- [x] **S6 — corpul erorii providerului nu mai ajunge la client → REPARAT (2026-08-01, NEDEPLOYAT).** Fix CENTRAL în `exceptions.py:error_response()`: pt excepțiile ne-`AppError`, întoarce mesaj GENERIC (nu `str(exc)`, care putea conține `error_body[:200]` de la provideri) + păstrează `error_code` (pe care se bazează `/diagnostics`). Detaliul real rămâne server-side (handler-ul face `print`/`traceback` + `supabase log_error(code, str(e))`). Verificat: clientul (`diagnostics/page.tsx`, `monitoring.ts`) NU parsează string-ul `error` (doar `error_code`/`level`). Acoperă TOți apelanții (`ocr.py`, `translate_text.py`, `overlay.py`). 2 teste noi (`test_exceptions.py`: mesaj generic + non-leak provider body). Gate: `pytest 50/50`.
- [x] **S7 — `ALLOWED_ORIGIN` fail-open → DECIZIE: RISC ACCEPTAT (Roland, 2026-08-01, AskUserQuestion).** NEIMPLEMENTAT conștient. Ratiune: app-ul NU are auth/cookies/credentials → CORS `"*"` **nu expune date**, doar permite apeluri cross-site care ar consuma cota AI — deja limitate de `rate_limiter.py` (per IP). Fail-closed ar risca ruperea CORS pe app-ul LIVE (frontend↔api e cross-origin) + ar rupe PWA-ul instalat de pe proiectul VECHI `traduceri-matematica` dacă lipsește vreo origine din allowlist (vezi [[finding_two_vercel_projects_2026_07_23]]). Refinabil LATER (setează allowlist cu AMBELE origini frontend pe `traduceri-api` + flip default) dacă apare nevoia. **NU „fixa" autonom în viitor** — e o decizie, nu o scăpare.
- [x] **S8 — afirmație falsă în config → CORECTAT (2026-08-01, NEDEPLOYAT).** Comentariul din `next.config.js` care pretindea „CI/pre-push runs lint" = fals (verificat: `.git/hooks` doar `*.sample`, fără `.husky`/`.github/workflows`; ȘI `npm run lint` are **12 erori pre-existente** — unescaped-entities + no-explicit-any în dictare). Ales branch-ul „corectează comentariul" (nu „adaugă CI") fiindcă CI-ul enforcing ar fi roșu imediat + cere curățarea celor 12 erori (disproporționat pt „efort mic"). Comentariul spune acum adevărul: lint = manual/advisory, gate-ul real = tsc+jest+build; CI = backlog (după curățare lint). Value neschimbat (`ignoreDuringBuilds:true` rămâne). `next.config.js` parsează OK

---

## §3. REGRESII — promisiuni rupte, verificate în cod

- [x] **G1 — Contor DeepL reintrodus → LIVRAT (2026-08-01, NEDEPLOYAT).** NOU `DeepLQuotaBadge.tsx` (fetch `/api/deepl-usage` GET simplu, cache la nivel de modul cu TTL 60s ca cele 2 instanțe `LanguageSwitch` să facă UN fetch; culoare pe `level` ok/warning/critical; click = reîmprospătare; render `null` inițial → 0 hydration). Cablat în `LanguageSwitch` (apare lângă F8 în toolbar desktop + rândul mobil), reîmprospătat pe frontul `isTranslating` true→false (după o traducere). **Verificat pe endpoint-ul LIVE:** `{character_count:1023, character_limit:1000000, percent:0.1, level:ok}` (2 chei DeepL = 1M) → badge „DeepL 0.1% (1K/1000K)". Gate: `tsc 0 · jest 123/123`.
- [x] **G2 — Cache traduceri PERSISTENT → CABLAT (2026-08-01, decizia Roland „cablez", NEDEPLOYAT).** Confirmat că documentul editorului SE persistă (localStorage) → persistarea cache-ului aduce valoare reală (reopen + switch limbă = instant + NU reconsumă cota DeepL). `translation-cache.ts` era File-based (nepotrivit pt editor) → am ADĂUGAT API content-based: `getCachedDocTranslation`/`cacheDocTranslation` (cheie SHA-256 pe conținutul-sursă + perechea de limbi, refolosesc loadStore/saveStore/evicție + versionare). Cablat în `editor-translate-state.tsx switchLanguage`: verifică persistent înainte de a traduce (hit = instant, `cached:1` telemetrie), persistă după traducere (fail-open). Capcană rezolvată: `TextEncoder` lipsește în jsdom → `utf8Bytes` fallback (UTF-8 manual) + tip concret `Uint8Array<ArrayBuffer>` (TS 5.7 `BufferSource`). Onest: editările per-limbă rămân in-sesiune; cache-ul persistă traducerea-mașină. 3 teste noi. Gate: `tsc 0 · jest 126/126 · build OK`.
- [x] **G3 — Notificare browser la import lung → LIVRAT (2026-08-01, NEDEPLOYAT).** NOU `lib/import-notify.ts` (`requestNotifyPermission` + `notifyIfHidden`, guard-at pt SSR/jsdom/iOS-fără-PWA). Cablat în `editor-import.tsx`: cere permisiunea în GESTUL utilizatorului (start import), notifică la finalizare (succes SAU eroare) DOAR dacă importul a fost lent (`usedOcr || >8s`) ȘI tabul e ascuns (`document.hidden` — altfel bannerul in-app ajunge). Limită onestă: iPhone cere PWA instalat (iOS 16.4+). Gate: `tsc 0 · jest 123/123`. Live = eyeball Roland (import lung + comută tab).
- [x] **G4 — Verificare vizuală original↔rezultat → LIVRAT (2026-08-01, mock §17 aprobat: thumbnail+lightbox, NEDEPLOYAT).** Capturez imaginile-SURSĂ trimise la OCR (poză + pagini PDF rasterizate, plafon 12 pt memorie) prin pipeline (`ProcessResult.sourceBlobs` → object URL-uri gestionate în provider, revocate la import nou/închidere banner/unmount → fără scurgeri). NOU `SourcePreview` în `ImportUI.tsx`: miniatură + „Vezi originalul (N)" → lightbox Dialog cu poza la mărime + navigare pagini. Randat în bannerul de rezultat ȘI în dialogul replace/append (Cristina compară înainte de a alege). DOCX/TXT (fără poză) → nu randează. Gate: `tsc 0 · jest 126/126 · build OK`. ⚠️ Live eyeball (thumbnail+lightbox) = pe deploy prod (proxy dev 30s complică OCR-ul local end-to-end); risc mic centrare lightbox (Dialog standard, nu paleta re-randată — cf. [[finding_dialog_transform_animation_2026_07_30]]).
- [x] **G5 — Overlay pixel-perfect: ABANDON CONFIRMAT** (Roland, 2026-07-30). Se șterge și backend-ul → vezi §4 C1

---

## §4. CURĂȚENIE — cod mort verificat (0 importatori)

- [x] **C1 — Overlay ȘTERS (2026-08-03, abandon confirmat G5):** `git rm api/overlay.py api/lib/overlay.py api/tests/test_overlay.py` + curățat rutele din `dev_server.py` (import + ROUTES). Fără rewrite overlay în `vercel.json`. **PyMuPDF PĂSTRAT** (folosit de `api/ocr.py` pt rasterizare PDF). Gate: `pytest 46/46 · dev_server parsează`. ⚠️ Endpoint-ul `/api/overlay` (live pe prod) va da 404 după deploy-ul backend — OK (G5 abandon + clientul curent NU-l cheamă).
- [x] **C2 — `pdf-rasterize.ts` ȘTERS (2026-08-03):** `git rm` — 0 importatori (`editor-import.tsx` re-implementează rasterizarea inline). Fără test. Gate: `tsc 0 · jest 115 · build OK`.
- [x] **C3 — Orfani ȘTERȘI (2026-08-03):** `git rm` `figure-payloads.ts`(+test), `export-naming.ts`(+test), `config/languages.json`, `config/math_terms_ro_sk.json`, `config/math_terms_ro_en.json` — toate 0 importatori (verificat repo-wide). **⚠️ `translation-cache.ts` EXCLUS** — acum e FOLOSIT de G2 (cablat la F8). `config/error_codes.json` PĂSTRAT (referință pt codurile `E-*` din `/diagnostics`+S6). CLAUDE.md Key Files actualizat. Gate: `tsc 0 · jest 115/115 · build OK`.
- [x] **C4 — `api/translate.py` ȘTERS (2026-08-03):** pipeline-ul vechi (395 linii), unic importator = `dev_server.py` (curățat). R4→R7 NU-l refolosește. **Verificat la sursă:** clientul CURENT NU cheamă `/api/translate` (doar `/api/translate-text`→`translate_text.py` prin rewrite vercel.json); 0 alți importatori. Fără test dedicat. Gate: `pytest 46/46 · dev_server parsează`. ⚠️ **Endpoint `/api/translate` (live) → 404 după deploy backend** — risc stale-client SCĂZUT (UI Traduceri retrasă la F7/v18, SW auto-update); deploy-ul removal = cu confirmarea Roland (outward-facing).
- [x] **C5 — Dependințe + exporturi moarte curățate (2026-08-03):** `npm uninstall react-dropzone react-markdown` (0 importuri). Șters `getHistoryEntry()` (`storage.ts`) + type `ConversionRequest` (`types.ts`). **⚠️ CORECȚIE plan: `import re as _re` NU e mort** — e FOLOSIT de `_sanitize_error` (`translation_router.py:39-42`, pe care S6 se bazează pt redactarea cheilor server-side). NEATINS. Gate: `tsc 0 · jest 115 · build OK`.
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
