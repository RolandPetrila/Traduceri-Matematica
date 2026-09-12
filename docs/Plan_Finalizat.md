# PLAN FINALIZAT — istoricul complet al implementărilor (Traduceri Matematica)

> **Fișier VIU.** Actualizat după fiecare sesiune/fază închisă — itemii bifați `[x]` din
> `docs/Plan_in_Lucru.md` migrează aici, ca rezumat (nu ca jurnal complet de commit-uri), cu
> linkuri către commit-uri reale (hash scurt din `git log`). Ordonare **cronologică**; index pe
> module mai jos, pentru căutare rapidă „ce s-a făcut la X".
>
> **Sursă:** citit integral din documentele originale (`docs/PLAN_*.md`, `docs/*AUDIT*.md`,
> `docs/arhiva/Erata_dovezi_2026-09-08.md`, `docs/arhiva/CHANGELOG.md`, `git log --oneline --all`)
> — nu parafrazat din memorie. Unde n-am putut identifica sigur un commit exact, e marcat
> `[NEGĂSIT]`, nu ghicit. Documentele sursă au fost mutate în `docs/arhiva/` la Faza 5
> (2026-09-11) — linkurile de mai jos țintesc deja calea nouă.
>
> ⚠️ **Atenție la numerotări — trei scheme diferite folosesc litera „F"/„R", NELEGATE între
> ele, din epoci diferite ale proiectului:**
>
> 1. **F0-F9** = milestone-uri vechi ale rescrierii Editorului TipTap (2026-07-22→07-30, ex.
>    „Editor F6" = paritate iframe→nativ). Vezi `docs/arhiva/GHID_VERIFICARE_EDITOR_F6.md`.
> 2. **R1-R12** apar de DOUĂ ori, cu conținut total diferit: (a) rundă de deploy/chat inițială
>    (2026-07-09, Render→Vercel); (b) cerințele lui Roland din `PLAN_MASTER.md §1` (2026-07-30,
>    R1=sidebar, R3=DOCX OMML, R7=OCR upgrade etc.).
> 3. **F1-F6** = programul curent de reparație (`docs/Fazele.md`, din 2026-09-08), cel mai recent
>    și singurul încă activ. `docs/arhiva/RAPORT_F5_AUDIT_2026-09-07.md` („F5 audit butoane") e din
>    numerotarea VECHE (b) de mai sus — **nu** are legătură cu „Faza 5" curentă (unificare
>    documentație). La fel, „Faza 4.5d" a absorbit un document numit inițial cu presupunerea unei
>    „Faze 4.5e" separate care nu s-a mai întâmplat ca fază distinctă (a devenit corecție de proces
>    în cadrul aceleiași — vezi cronologia 2026-09-11).

---

## Index pe module

- **Editor (matematică, TipTap, import/OCR, traducere F8, export)** → [Rescriere TipTap F0-F9](#editor-tiptap-native-2026-07-22-→-07-30) · [R1/R3/R5/R6/R8 (sidebar, DOCX OMML, F8 sus, Ctrl+K, fidelitate export)](#cerințele-r1-r8-2026-07-30-→-08-01) · [G2/G4 (cache traduceri, verificare vizuală)](#regresii-g1-g5-2026-08-01) · [Faza 1/2 (bug SK, orbire diagnostică)](#faza-1-—-repară-orbirea-diagnostică-2026-09-08) · [Faza 4.5b (spații pierdute la traducere)](#faza-45b-—-p3-traducerea-f8-pierde-spații-2026-09-10)
- **OCR / Traducere (backend, provideri AI)** → [R4→R7 (Azure+Gemini rutat pe tip)](#r7-upgrade-calitate-ocrconversie-2026-07-31-→-08-01) · [S4 (timeout-uri)](#securitate-s1-s8-2026-08-01) · [OCR 503/timeout fallback](#plan-program-general-f0-f6-2026-09-07) · [Faza 4.5d/4.5e (free tier, A/B Lite, RECITATION, bbox, mesaj cotă)](#faza-45d—45e-—-free-tier--siguranță-ocr-2026-09-11)
- **Chat AI** → [creat (Sprint 3)](#istoric-pre-v40-render-2026-03-→-07) · [nativ + robustețe](#cerințele-r1-r8-2026-07-30-→-08-01) · [reînviat 3 vendori](#plan-program-general-f0-f6-2026-09-07) · **ELIMINAT** la [Faza 4.5d](#faza-45d—45e-—-free-tier--siguranță-ocr-2026-09-11)
- **Teste (Corectare/Generare)** → [creat (Runda Module)](#runda-module--calculator-chat-teste-2026-08-04) · [Faza 4/4.5a/4.5c (timeout lanț, bold barem)](#faza-4-—-audit-real-în-browser-2026-09-09-→-10) · [Provider plătit corectare (4.5d)](#faza-45d—45e-—-free-tier--siguranță-ocr-2026-09-11)
- **Calculator** → [creat](#runda-module--calculator-chat-teste-2026-08-04)
- **Convertor** → [PDF→JPG/PNG real, diacritice, framing binar](#faza-45a-—-6-reparații-contenite-2026-09-10)
- **Istoric** → [actualizare live, PDF print fallback](#faza-45a-—-6-reparații-contenite-2026-09-10)
- **Planșe** → [P0-P4 + variantă A/B (multi-formă, catalog extins)](#planșe-p0-p4--ab-2026-07-→-08-08) — origine: [conversația Carla](#origine-planșe--școlare-conversația-carla)
- **Școlare** → [F0-F5 (skeleton 112 noduri + toate ciclurile)](#școlare-f0-f5-2026-08-07-→-08) · [motor de desen determinist](#școlare—motor-de-desen-determinist-2026-08-09) · [autonomie text (fără referințe la imagini)](#școlare—autonomie-text-2026-08-09) — origine: [conversația Carla](#origine-planșe--școlare-conversația-carla)
- **Securitate** → [S1-S8](#securitate-s1-s8-2026-08-01) · [audit /audit full](#re-audit--curățenie-2026-08-10)
- **Infra/Deploy (Vercel, Supabase, CI)** → [migrare v4.0](#migrare-vercel--supabase-v40-2026-07)· [CI GitHub Actions](#cerințele-r1-r8-2026-07-30-→-08-01) · [curățare cod mort C1-C7](#curățenie-c1-c7-2026-08-03)
- **Proces / Auditori / Documentație** → [consolidare PLAN_MASTER](#consolidare-plan_master-2026-07-30) · [cei trei auditori (R-AUDIT-FAZA)](#faza-2-—-bug-sk-2026-09-08-→-09) · [R-STOP-FAZA](#faza-3-—-caiet-de-sarcini-2026-09-09) · [Faza 5 — unificare documentație (`Plan_Finalizat.md`+`docs/arhiva/`)](#faza-5-—-unificarea-documentației-în-două-fișiere-vii-2026-09-11) · [Faza 6 — automatizarea (gardă `docs/`, memorie unică, R-DIAG-AUTO lărgit)](#faza-6-—-automatizarea-procesului-2026-09-11) · [Mentenanță hook SessionStart confirmat live (2026-09-12)](#mentenanță-post-program-—-hook-sessionstart-r-docs-guard-tăcut-2026-09-12) · [Mentenanță retestare Mistral (2026-09-12)](#mentenanță-—-retestare-mistral-2026-09-12)

---

## Cronologie

### Istoric pre-v4.0 (Render, 2026-03 → 07)

Prima variantă a aplicației: pipeline imagine→Gemini OCR→Markdown→DeepL→HTML A4, deploy pe
**Render** (nu Vercel). Sprint 1-4: DeepL + toggle RO/SK/EN (`88baf70`), OCR structurat + crop
figuri prin bbox (`18aa9ed`, `1367846`), BatchPanel multi-fișier (`8e5fdf3`), Claude Sonnet ca
provider principal apoi suspendat pt cost, revenire pe Gemini (`1bafa0f`), upgrade Gemini
2.0→2.5 Flash + Groq Llama 3.1→3.3 (`230fafa`, `79041e0`). Migrare Render (`334de62`, `826f68a`).
**Stare finală (superseded):** arhitectură complet înlocuită de migrarea v4.0 de mai jos — nimic
din stack-ul Render nu mai e live. Detaliu în `docs/arhiva/CHANGELOG.md` §v1.0.0/v2.0.0.

### Migrare Vercel + Supabase v4.0 (2026-07)

Migrare completă Render→**Vercel** (frontend Next.js + backend Python serverless) +
**Supabase** (log-uri diagnostic cross-device, coduri de eroare centralizate). OCR per-pagină
(rasterizare `pdf.js` în browser), editare inline persistentă, export PDF vectorial+DOCX/HTML din
conținut editat, contoare Gemini + rate-limiting adaptate la serverless stateless.
Commit-uri reprezentative: `e2cc4ae`, `26713c4`, `8eb05ed`. Detaliu: `docs/arhiva/CHANGELOG.md` §v4.0.0.

**Rundă R1-R12 (chat/deploy, 2026-07-09 — numerotare VEchE, nelegată de R1-R8 din PLAN_MASTER):**
integrare Asistent AI ca iframe (`a9a1a6c`), fix CORS `text/plain` pe `translate-text` (`d0eeb67`,
`4c551dc` — SEV1), overlay pixel-perfect PDF (`e55419c`, `a4bd02a` — abandonat mai târziu, vezi
Curățenie C1), limbă germană adăugată (`bb02de0`), naming export D(eepL)/G(emini) (`f009b05`),
labirint Planșe Faza 0-1 (`f07ef71`, `af34d07`), deploy Vercel funcțional end-to-end (`0656b5f`,
`d070803`).

### Editor TipTap nativ, F0-F9 (2026-07-22 → 07-30)

Rescriere completă a editorului matematic: de la iframe la **componentă React nativă**
(TipTap 3 + shadcn/ui, temă tablă verde+cretă). F0 fundație (`036fce4`), F1 toolbar (`54511f8`),
F2 tabele+inserare (`52d873d`), F3 bibliotecă matematică 214→334+ formule (`01bf4f7` + rundele
`#4`/`#cerinta2` ulterioare, per clasă V-XII), F4a export PDF/DOCX/HTML din conținut editat
(`8025d3d`), F4b autosave+restore (`c10106c`), F4c dictare vocală ro-RO (`f421b00`), F4d pagini
A4 cu ghidaje print (`aff346e`), telemetrie always-on (`15456ef`), paritate G1-G9 + **retragere
iframe vechi** (`9b7b5c5` — acesta e „Editor F6"), F7 retragere tab „Traduceri" din UI
(`2891d00`), F8 traducere-în-editor RO|SK|EN|DE cu cache (`bffc930`), F9 import OCR drag&drop
(`08cae4a`). Verificat LIVE end-to-end (traducere + OCR) și **DEPLOYAT v18** (`11694e1`).

**Matematică academică KaTeX (M1-M5):** migrare MathJax→KaTeX, constructor fracție/limită/radical
(`1aee5b7`), formule editabile + paletă one-click + fix radical vinculum (`2cad818`), figuri
parametrice editabile (`9a22e9b`), export PDF/HTML(KaTeX)+Word(math-ca-imagine) (`82fd475`).
Bibliotecă extinsă la 334 formule V-XII cu audit vs 13 manuale oficiale (`fcd2eeb`,
`a5679e3`→`911090e`).

### Consolidare `PLAN_MASTER.md` (2026-07-30)

Toate planurile fragmentate (11 fișiere) unificate într-un singur document „sursă unică de
adevăr", prin audit în cod cu 5 agenți paraleli (dovezi `fișier:linie`). 9 planuri vechi tracked
șterse (recuperabile la `54fac8f`), `PLAN_DECISIONS.md`+`HANDOFF_SESIUNE.md` păstrate.
Commit-uri: `486d906`, `e38e067`, `2a93465`. **Notă retrospectivă (2026-09-11):** acest document
a rămas la rândul lui stale din 2026-08-09 — motivul exact al Fazei 5 (unificare documentație)
care produce acest fișier. **Absorbție la Faza 5:** §7 backlog → migrat în `docs/Plan_in_Lucru.md`
§⏳ amânat conștient; §9 decizii încă valabile → migrate în `CLAUDE.md` (restul §9 erau deja
duplicate acolo sau stale — vezi Faza 5 mai jos); §0-§6/§8/§10-§11 → rezumate în acest fișier
(cronologie de mai sus/jos); fișierul original → `docs/arhiva/PLAN_MASTER.md`.

### Cerințele R1-R8 (2026-07-30 → 08-01)

Cerințe explicite ale lui Roland, executate pe rând (ordine aleasă: R3→R5→R6→R4→securitate):

- **R1** — meniu icon-rail colapsabil, înlocuiește bara de sus. `997da0d`. DEPLOYAT v21.
- **R2** — eliminat selectorul global de limbi (F8 din editor rămâne). `0fa03ff`. DEPLOYAT v20.
- **R3** — DOCX cu matematică: parser OMML→LaTeX propriu (nu mammoth), fidelitate 100% pe 3
  fixture-uri reale (`test.multimi2.docx` 20 formule, `2.Unghiuri...` 6 formule+1 figură,
  `test5nr.naturale2025.docx` 9 formule). `1b366ed`→`c05b119` (DEPLOYAT v22).
- **R4** — înglobat în R7 (decizie pe dovadă, nu reputație).
- **R5** — mutat F8 în rândul de sus al toolbar-ului. `cf8d5e5`. DEPLOYAT v22 (grupat cu R3).
- **R6** — command palette global Ctrl+K (module + acțiuni editor). `8c633fe`, `910e270`.
  DEPLOYAT v23.
- **R7** — upgrade calitate OCR: Azure Document Intelligence (tabele/figuri/reading-order) +
  Gemini (math), rutat pe tip de conținut, pe dovadă măsurată (3 fișiere reale, scorecard
  3/10→8.5/10 pe PDF lab). `f33c745`, `e79fc5d`, `1c96cd9`. DEPLOYAT v24. Detaliu:
  `docs/arhiva/OCR_COMPARATIE_2026-07-31.md`.
- **R8** — fidelitate export: fix garbaj Hangul (litere Math-Alphanumeric truncate 16-bit),
  `$latex$` brut în caption, cifre-zgomot izolate. `a4b4801`. DEPLOYAT v25. R8.4 (figuri
  supra-decupate, atenuat) + R8.5 (layout umflat la export) rămase NEDEPLOYATE separat, grupate
  ulterior cu §3.

CI minimal (GitHub Actions: tsc+jest+build+pytest) livrat `2026-08-07` (`aa184aa`).

### Securitate S1-S8 (2026-08-01)

Toate verificate personal în cod, nu preluate din documente — active în producție până la
execuție. S1 `npm audit fix` non-force (katex/dompurify/next patch, 5→3 vulnerabilități, 3 HIGH
reziduale documentate onest — fix real = Next 16, exclus de Roland). S2 XSS viu în
`HistoryDetail.tsx` (`win.document.write` fără sanitizare). S3 `pypdf` 4.3.1→6.14.2 (verificat pe
5 căi reale din `convert.py`). S4 timeout-uri alineate sub `maxDuration`. S5 `/api/logs` plafonat
(body cap + rate-limit per IP). S6 corpul erorii providerului nu mai scurge la client. S7
`ALLOWED_ORIGIN=*` → **risc acceptat conștient** (Roland, AskUserQuestion — app fără auth/cookies,
CORS deschis nu expune date). S8 comentariu fals despre CI corectat. Commit-uri: `70d1430` →
`08b42c4`. Toate NEDEPLOYATE separat, grupate în deploy-ul ulterior.

### Regresii G1-G5 (2026-08-01)

G1 contor DeepL reintrodus (badge lângă F8). G2 **cache traduceri persistent** (SHA-256 pe
conținut+pereche limbi, `translation-cache.ts`) — decizia Roland „cablez" (documentul editorului
se persistă deja, deci cache-ul persistent aduce valoare reală). G3 notificare browser la import
lung. G4 verificare vizuală original↔rezultat (`SourcePreview`, thumbnail+lightbox). G5 overlay
pixel-perfect **abandonat conștient** (Roland) → șters la Curățenie C1. Commit-uri: `4c97834`→
`1fa1d86`.

### Curățenie C1-C7 (2026-08-03)

Cod mort verificat cu 0 importatori, șters (nu arhivat, per R-MINIMAL): overlay complet
(`api/overlay.py`+lib+teste, C1: `2b77b93`), `pdf-rasterize.ts` (C2), orfani diverse (`figure-
payloads.ts`, `export-naming.ts`, config-uri math_terms — C3: `6dcd1a9`), `api/translate.py`
pipeline vechi 395 linii (C4: `d2749d7`), `react-dropzone`+`react-markdown` (C5), clarificare
rute `/editor` vs `/editor-nou` (C6), capcană respectată — fișiere hot-path neatinse (C7).

**Restanțe M1-M6:** teoreme lipsă adăugate (bisectoare/Menelaus/Ceva, M1), constructor matematic
nested recursiv (M2, `e503028`, DEPLOYAT v29), **dark-mode respins definitiv** (M3, decizie
fermă Roland — tema rămâne verde+cretă), a11y `aria-live` pe bare de stare (M4), figuri
parametrice editabile (M5, `9a720e8`, DEPLOYAT v29), contradicție SVG-vs-crop decisă (M6: crop
bbox cu Pillow, nu SVG generat).

### Runda Module — Calculator, Chat, Teste (2026-08-04)

Trei module noi livrate în aceeași sesiune: **Calculator** (științific+grafic+matrice, math.js,
`8657ad5`, DEPLOYAT v30), **Chat AI nativ** (înlocuiește iframe Asistent, `d935625`, DEPLOYAT
v31), **Teste** (Corectare/Generare cu AI+OCR, `d190549`, DEPLOYAT v32). Chat AI: lanț 6
provideri gratis reînviat + instrumentare + timeout (`a52628d`), randare formule fallback +
markdown (`94ceddf`), răspunsuri complete 8192 tokeni + buton Continuă (`405af0a`).

### Planșe P0-P4 + A/B (2026-07 → 08-08)

Modul de fișe interactive offline, cod determinist (nu AI) — vezi originea în
[conversația Carla](#origine-planșe--școlare-conversația-carla). P0 schelet (`f07ef71`). Faza 1
Labirint + oracol MT19937 byte-exact (`af34d07`). P3 (2026-08-05→07): Căutare cuvinte
(`0f897ae`), Unește punctele (`32f4360`), Dictare grafică (`6ed8364`), Numere/crossmath cu
solver-unicitate (`d7d92ed`), Integramă cu solver (`bca987c`). P4 coș multi-fișă → PDF unic +
unicitate persistentă (`aa9c49a`). **DEPLOYAT v39** (6/6 generatoare).

**Rundă A — Integramă multi-formă (2026-08-08):** 3 forme noi (Zigzag, Cruce, Scară), motorul
solver topologie-agnostic reutilizat, geometrie proprie per formă, coliziune reală descoperită
la Cruce (WIDE_GAP respins după probă live, înlocuit cu bănzi collision-free). DEPLOYAT v40.

**Rundă B — Varietate extinsă la celelalte 5 generatoare (2026-08-08):** Unește 7→12 forme,
Dictare 17→23, Căutare 5→8 teme, Numere generalizat 3×3→{3,4,5} parametrizabil, Labirint
generalizat n×n→rows×cols + ieșire selectabilă (păstrând compatibilitate byte-exact cu oracolul
Python MT19937). DEPLOYAT v41.

### Origine Planșe + Școlare — conversația Carla

`docs/arhiva/Export_chat_sesiune_Carla.md` (3459 linii) e transcriptul sesiunii în care
Roland a cerut prima dată „o aplicație cu AI integrat care să genereze instant planșe" din
folderul lui de lucru `G:\My Drive\Roly\...\Carla`. Discuția a clarificat: (a) generatoarele de
planșe sunt cod Python determinist, portabil 1:1 în PWA, fără nevoie de AI; (b) materialele
„Școlare" (grădiniță→liceu) sunt generate de AI pe bază de `regulament.md`, o categorie complet
diferită. Ambele concluzii au condus direct la arhitectura celor două module native separate
descrise mai sus/mai jos.

### Școlare F0-F5 (2026-08-07 → 08)

Modul nativ React (nu iframe, nu sub-tab Planșe — decizie D8) pentru fișe curriculare AI,
grădiniță→liceu. **F0** (2026-08-07): skeleton COMPLET 16 nivele/112 noduri (schemă dual-shape
materii/domenii) + verificator de completitudine INDEPENDENT + pilot Gimnaziu Clasa 5 Matematică
cap-coadă. `7916156`. **F1** (2026-08-08): regulamente proprii Gimnaziu Cl.6/7/8 Matematică,
sursate din PDF oficial OMEN 3393/2017; bug fals-pozitiv `verify-fisa.ts` pe „⋅" (dot operator)
prins și corectat. `98d0da5`, DEPLOYAT v46. **F3** (2026-08-08): Primar Cl.0-4, 21 regulamente
proprii toate materiile. `60236fa`, DEPLOYAT v47. **F4** (2026-08-08): Grădiniță, toate 4
domeniile, 12 regulamente (OMEN 4694/2019), interdicție absolută pe ecuații „+/-/=". `327d9d3`.
**F2+F5** (2026-08-08, „finalizare completă" la cererea explicită a lui Roland — scope extins
dincolo de planul inițial D52): Gimnaziu toate materiile non-mate (35 regulamente) + Liceu toate
materiile (40 regulamente, inclusiv Matematică care nu exista), verificare la sursă cu 10+10
subagenți paraleli pe materie. `bb27a5f`, `3e82b0d`. **112/112 noduri au `regulament_ref`** —
acoperire 100% conținut, nu doar skeleton. Descoperire critică: reforma Liceu Clasa IX (Ordinul
6.930/2025) intră în vigoare 2026-2027, risc de staleness mai mare pe acele regulamente. Toate
DEPLOYATE grupat **v48** (2026-08-09), verificat end-to-end pe alias.

### Școlare — motor de desen determinist (2026-08-09)

Fișele la grădiniță/domenii vizuale erau 100% text — copilul nu avea vizual pe care să
coloreze/traseze. Motor nou: AI alege o **primitivă+parametri dintr-un enum fix** (marker text
`[[DESEN tip=... obiect=... culoare=...]]`), randat determinist în SVG (5 primitive: colorează-
cu-model, traseu, unește-punctele, simetrie, baloane-cu-etichetă), NU AI desenând SVG brut
(nefiabil). Scope confirmat: Grădiniță toate grupele + Primar Cl.0-1, toate materiile. Probă LIVE:
23/23 markere emise valide pe 4 noduri×2 mostre. `022d49b`. DEPLOYAT (2026-08-09, confirmat
Roland).

### Școlare — autonomie text (2026-08-09)

Bug arhitectural găsit invers: fișele (inclusiv la nivele FĂRĂ motorul de desen de mai sus)
conțineau exerciții care presupuneau un vizual pre-tipărit inexistent („Privește fluturele din
imagine"). Cauză dublă: `prompt.ts` fără interdicție + ~26 regulamente care chiar MODELAU acest
tip de exercițiu. Fix: `IMAGE_AUTONOMY_RULE` (copilul creează vizualul din text, nu operează pe
unul inexistent) + rescrierea a 37 fișiere de regulament (145 edit-uri). Verificat prin
regenerare reală: 32/32 mostre curate. Decizie explicită: emoji/Unicode inline (🍎🍎🍎) rămân
text-autonom, nu bug. `d3decfb`. DEPLOYAT v49.

### Research upgrade-uri + code review whole-repo (2026-08-09)

Upgrade Gemini 2.5→3.6-flash (4 locații, verificat empiric) + fix fallback OCR mort
(`gemini-2.5-flash-lite` retras de Google). Convertor PDF→JPG/PNG implementat REAL cu PyMuPDF
(fix-ul anterior doar ascunsese opțiunea din UI). `npm audit fix` (3 vulnerabilități). Code
review whole-repo (workflow, 24 agenți, efort max): 13 găsiri, 6 fixate — inclusiv un bug CRITIC
(`verify-fisa.ts` afișa corecturi false pe fișe printabile, separator RO de mii tratat greșit ca
zecimal). `519fb01`, `d54836a`, `d5d8a5a`. DEPLOYAT grupat **v48** (împreună cu Școlare F2/F4/F5).

### `/improve` — 16/26 executate (2026-08-07, re-auditat 2026-08-10)

Raport de recomandări pe 26 itemi: 16 executate+deployate (curățenie cod mort backend, teste
handler HTTP, CI minimal, migrare proxy Pages→App Router, `maxDuration` 300s, DeepL default),
3 blocate (cer acces cont), 5 amânate conștient de Roland (Next 16, Tailwind v4, AI Gateway,
prompt PWA, persistență — migrate 2026-09-11 din `PLAN_MASTER.md §7` (acum `docs/arhiva/
PLAN_MASTER.md`) în `docs/Plan_in_Lucru.md` §⏳ amânat conștient). Re-verificat 2026-08-10: și mai
multe itemi erau deja rezolvate decât credea numărătoarea inițială.

### Re-audit + curățenie (2026-08-10)

`/audit full` (94/100) → 4 HIGH + 8 MEDIUM remediate (`5691caa`). `.gitattributes` (eol=lf) —
previne conversia CRLF pe checkout Windows (`6b02bd1`). `CLAUDE.md` + `project_rules.md`
corectate — descrieri stale ale modulului „Traduceri" (retras la F7) și iframe-ului `/asistent`
(retras la /improve #16). `main` adus la zi (fast-forward din `faza-g-editor`, 0 divergență,
`31413dc`).

### Plan Program General — F0-F6 (2026-09-07)

Cerere Roland: „totul funcțional + mereu live" pe un laptop nou (checkout de la zero,
`node_modules` lipsă). **F0** fundație gate (npm install, tsc 0·jest 356/356·build OK·pytest
67/67). **F1** R-DIAG-AUTO — fără erori active recurente. **F2** descoperire: deploy #1+#2 erau
deja live (adnotarea „NEDEPLOYAT" din handoff era stale). **F3** — **lanțul de chat era efectiv
RUPT** (doar Gemini viu; mistral 403, groq 404, cerebras 402 — toate moarte tăcut); fix: 3
vendori independenți (Google×2, Groq, Mistral×2), `6e305d6`. **F4** OCR: cauza reală a
nefidelității era **HTTP 503 „high demand"** care nu declanșa fallback (doar 429/404 o făceau);
fix 500/502/503/529→cascadă + `temperature:0`, `c3ecf3b`+`6b0b065`. **Descoperire onestă:**
premisa inițială „figurile sunt goale, trebuie Azure-merge" era un artefact de sondă — figurile
funcționau deja.

**F5 — Audit „fiecare buton executabil"** (6 subagenți inventar + probe live pe prod): ~73
butoane Editor ✓, restul modulelor ✓ cu câteva bug-uri pe căile de eroare. Fixate+deployate:
🔴 CRITIC Convertor diacritice RO/SK crăpau `send_header` (fix RFC 5987, `c140b5b`), scurgere
antet Convertor, 3 bug-uri Teste (try/catch lipsă, succes fals pe auto-continuare, „[Eroare OCR]"
tratat ca lucrare elev). Gate: `tsc 0·jest 356/356·build OK·pytest 75/75`. **Remediere secvențială
R1-R12** (docs stale, Școlare `parseParams`/loading/loadRegulament/„➕ În editor"/desen, Planșe
`remember()`, Editor Font/Mărime, buget OCR 60s→270s, framing binar Convertor mitigat client-side,
Chat context-document + Șterge/Copiază, V4 verificat live PDF multi-pagină cu marcaj eșec onest
per pagină). **TOATE R1-R12 rezolvate+deployate+verificate** (`a7304a2`). Gate final: `tsc
0·jest 357/357·pytest 75/75`, frontend v55.

> ⚠️ Acest raport (`docs/arhiva/RAPORT_F5_AUDIT_2026-09-07.md`, „F5" = numerotarea VECHE) a fost el
> însuși infirmat parțial de realitate 24h mai târziu — vezi Faza 1/Erata de mai jos: Roland a
> apăsat butonul SK „verificat ✓" și a primit eroare în 10 secunde.

### Faza 1 — „Repară orbirea diagnostică" (2026-09-08)

Deschide programul de reparație în 6 faze (`docs/Fazele.md`). Declanșator: Roland a apăsat SK pe
un document real → eroare; sistemul de verificare automată a raportat „zero erori active" —
eroarea era logată la nivel `action` (nu `error`/`warn`), invizibilă la filtrare. Fix: fiecare
eșec de flux capătă cod + cauză reală + loc, pe 22 de puncte instrumentate (21 fluxuri noi +
`E-PLAN-001`). `0b6e0c7`. **Erată onestă** (`docs/arhiva/Erata_dovezi_2026-09-08.md`, `216b1a1`): 3 din 5
„fapte verificate" inițiale din `Fazele.md` s-au dovedit FALSE la verificare live pe prod —
cererea de rețea PLECASE (eșecul era la parsarea răspunsului: `x-vercel-internal-timing` scurs în
corpul JSON la cold start), butonul SK NU se bloca, tabelul/întreruperea de pagină NU erau
vinovate. Cauza reală: framing Vercel scurs în JSON (aceeași clasă de bug ca R9 de la Convertor,
dar necurățată pe calea de traducere). Risc nou descoperit: traducerea+reload înlocuia definitiv
originalul (propus pentru Plan_in_Lucru, nu executat în fază).

### Faza 2 — „Bug SK: reparare + reîncercare" (2026-09-08 → 09)

Reparare la sursă: originalul nu se mai pierde + bug SK reparat (`576ff5a`). **5 runde de audit**
au găsit defecte reale pe care poarta verde nu le prinsese: cache-ul servea traducerea
ÎNVECHITĂ (`c33af54`), garda de memorie plină se prăbușea DUPĂ reload — exact traseul Cristinei
(`e360377`), pâlnia de eroare distrugea sfatul bun + Planșe nu spunea când lotul e incomplet
(`ba8b8da`), 3 defecte suplimentare + curățare framing binar în Istoric (`647a84b`), 4 abateri
găsite de auditorii de fază (`af6e1ae`). Un bug URGENT separat (Planșe rupt chiar de sesiune,
livrat în producție) a fost reparat imediat (`507b44d`). Alarmă de salvare eșuată pe mobil mutată
în bara slim (`e4c7519`). **FAZA 2 ÎNCHISĂ la v71**, gate verde, `8a13bf0`. Aici a fost formalizat
sistemul **celor trei auditori** (R-AUDIT-FAZA) care rulează la finalul fiecărei faze de atunci.

### Faza 3 — „Caiet de sarcini" (2026-09-09)

Document `docs/caiet_de_sarcini.md`+`.html` (generat dintr-o sursă unică `data.json`, ca să nu
apară drift între cele două formate): modul→submodul→funcție→buton, pentru fiecare: ce execută,
cum se testează, ce cod de eroare emite. 8 agenți secvențiali (unul per modul, per decizia lui
Roland „nu fan-out paralel”), inventar din cod + confirmare live. Rezultat: **104 butoane / 38
submodule** (5 rânduri eliminate — nu erau „butoane de execuție" per criteriul 3a). `f7ec15d`.
Aici a fost formalizat **R-STOP-FAZA** (o fază per sesiune, apoi stop explicit) — `33f15c0`.

### Faza 4 — „Audit real în browser, modul cu modul" (2026-09-09 → 10)

Auditul precedent (F5 vechi) citise cod și trimisese probe simple; Roland a spart un buton
„verificat ✓" în 10 secunde. Faza 4 = click real pe fiecare buton, cu fișiere reale de la
Cristina (`99_Roland_Work/Teste_Input`), modul cu modul, notând defectele fără să le repare pe
loc (decizia 4c). Ordinea: Școlare→Istoric→Editor(38 butoane, 3 loturi)→Teste→Chat→Convertor→
Calculator→Planșe. **16 defecte reale găsite**, grupate pe cauză (nu pe modul) în propunerea
pentru Faza 4.5: P1 Istoric nu se actualizează live (MARE), P2 timeout lanț AI la teste mari
(MEDIE-MARE, latent), P3 traducere F8 pierde spații la bold/formule (MEDIE), P4 popup blocat
silențios (MICĂ-MEDIE, 2 locuri), P5 Convertor validare/state pagini (MICĂ-MEDIE), P6 Planșe lot
incomplet la formă fixă (MICĂ-MEDIE), P7 markdown bold neconvertit în barem (MICĂ) + riscul
sistemic „→ Editor" (no-op silențios, testat 8× nereprodus). Auditorul de dovezi a INFIRMAT un
diagnostic inițial greșit (#9: nu „2/5 vs 5/5 provideri" — `CHAIN` e un array unic partajat).
Commit-uri lot: `56970af`→`eddc086`. Gate: `tsc 0·jest 428/428·build OK·pytest 83/83`, fără
regresie (`git diff --stat` = exclusiv `docs/`).

### Faza 4.5a — 6 reparații contenite (2026-09-10)

Din propunerea Fazei 4, alese pe criteriu de risc (contenite, verificabile determinist — P2/P3
amânate separat, „puse împreună, verdictul auditorilor devine tulbure"): **P1** Istoric —
dispatch eveniment `history-updated` la scriere + listener (fix determinist). **Riscul „→
Editor"** — coadă de comenzi (`pendingText`/`pendingImages`) în loc de `setTimeout(150)` fix, cu
prag+`reportFailure` la timeout real. **P4** — fallback Blob+link vizibil la popup blocat +
`reportFailure` obligatoriu (cod nou `E-HIST-002`, dedicat, nu reutilizat greșit — abatere prinsă
de `auditor-cerinte` și corectată în aceeași sesiune). **P5** — mesaj românesc la interval de
pagini invalid + reset câmp la schimbare operație. **P6** — avertisment ÎNAINTE de click la formă
fixă+N>1. **P7** — diagnostic REFĂCUT (bold în jurul unei formule pe o linie, nu peste linie
nouă) + fix cu placeholdere opace (tipar `math_protect.py`). `295f3d0`. Gate final: `tsc
0·jest 438/438 (+10)·build OK·pytest 89/89 (+6)`. Deploy frontend+API, verificat live pe toate 6
itemi + risc.

### Faza 4.5b — P3: traducerea F8 pierde spații (2026-09-10)

Cauza reală (NU cea presupusă de Roland la pornire — `protect_for_deepl`, infirmată prin
verificare): `.strip()` necondiționat pe fiecare secțiune tradusă, la granița dintre secțiuni
create de segmentarea pe marcaje (bold/italic), nu la marginea unei formule izolate. Reprodus
determinist 3/3 (cazuri A/B/C, cu control negativ). Fix (Opțiunea B, recomandată și confirmată):
`_reattach_boundary_whitespace` — spațiul de graniță vine ÎNTOTDEAUNA din sursă, niciodată din ce
decide providerul. 15 teste noi (cazuri de margine: spațiu insecabil, linie nouă, reziduu SEP
scurs). Dovadă live pe document real (bold+formulă+tabel), confirmată independent de
`auditor-dovezi`. `3e97d04`. Gate: `tsc 0·jest 438/438·build OK·pytest 104/104 (+15)`. Cache
invalidat: `translation-cache.ts` v3→v4, `sw.js` v73→v74.

### Faza 4.5c — P2: timeout lanț AI la Teste/Școlare (2026-09-10)

Defect **aritmetic**, nu statistic: bugetul total (58000ms) era la doar 6000ms peste timeout-ul
primului provider (52000ms) — de fiecare dată când Gemini atingea propriul timeout, restul
lanțului (4 din 5 provideri) nu avea NICIODATĂ șansă matematică (0 succese înregistrate din
2026-08-20 încoace pt gemini2/groq/mistral/mistral2). Roland a contestat corect premisa inițială
„zid de 60s pe tot lanțul" — verificat în cod: `maxDuration=60` mărginește FIECARE apel
`/api/proxy` individual, nu suma lor (lanțul rulează client-side, în browser). Fix: `GENERATION_
CHAIN` (array separat de `CHAIN`-ul Chat, neatins) cu plafon propriu per provider (gemini 45000ms/
groq 15000ms reordonat al doilea/gemini2 40000ms/mistral+mistral2 15000ms), buget total ridicat
la 110000ms (confirmat explicit de Roland via AskUserQuestion, după ce auditorul a prins o
abatere de cifră vs „~90000" citat din memorie). Monitorizare nouă `logGenerationResult` la toate
8 puncte de generare, direct în Supabase. `08de211`, `b452b85`. **Descoperire colaterală
corectată** (605d4f8): afirmația „Mistral 429 persistent" nu se susține — sonda proprie trăsese 6
cereri în ~20s, de câteva ori peste limita documentată (2 req/min) — retestarea onestă a rămas
NEFĂCUTĂ, notată ca datorie tehnică deschisă. Gate: `tsc 0·jest 444/444 (+6)·pytest 104/104`.
**Rămâne 🟡, cu bună știință** — traseul de realocare (fallback pe Groq cu fereastră reală) n-a
fost niciodată exercitat live, doar prin teste + aritmetică + contra-probă (`git stash` → 4/18
teste pică, inclusiv linia exactă „Expected: not 58000").

### Faza 4.5d—4.5e — free tier + siguranță OCR (2026-09-11)

**Context de proces, scris direct (cerut de Roland):** faza a pornit ca „4.5d" (trecere pe free
tier: 3 chei Google dedicate, provider plătit pentru corectarea lucrărilor elevilor, eliminare
Chat AI, Groq TPM) și s-a implementat prin un **fork lansat inițial strict pt un test A/B OCR**
(„NU implementa nimic din codul sursă"), care a fost **reluat extern** (probabil de Roland, de la
distanță) și a livrat toată faza — commit + push + deploy — FĂRĂ ca cele trei întrebări rămase
deschise să fi fost confirmate în conversația coordonatoare. Codul livrat s-a nimerit exact pe
opțiunile pe care Roland le-ar fi confirmat (verificat A POSTERIORI: `git show`, poartă re-rulată
independent), dar procesul „fără cod până nu confirm" a fost ocolit — a doua recurență a acestui
mecanism (prima: Faza 4, un fork a comis singur pe Calculator). Faza „4.5e" a fost deschisă
EXPLICIT de Roland ca **reparație de proces**, nu ca fază tehnică nouă separată.

**Ce s-a livrat, tehnic (commit `ba08994` + `963e780`):**

- **Test A/B OCR** (`gemini-3.6-flash` vs `gemini-3.5-flash-lite`, 7 fișiere reale, 14 apeluri):
  Lite PICĂ — bbox `y` pixel brut nu fracție 0-1 (2/2 fișiere cu figuri), corectează silențios
  typo-uri din sursă. 3.6-flash rămâne model principal.
- **Descoperire colaterală, defect real:** `finishReason: RECITATION` (filtru copyright Google,
  HTTP 200 cu conținut gol) nu era prins de lanțul de fallback → eroare dură pt utilizator. Fix:
  tratat ca tranzitoriu, cascadează la modelul următor. Dovadă live pe documentul real care
  bloca.
- **Fix scară bbox Lite:** valorile `y` >1.0 sunt pe scala nativă „grounding" a Gemini (0-1000),
  nu pixeli — împărțire ÷1000 per câmp înainte de clamp, nu ÷dimensiune pagină pe tot bbox-ul
  (propunerea inițială a lui Roland, testată și infirmată cu dovadă aritmetică+vizuală înainte de
  a implementa varianta corectă).
- **Selector de tier pe `/api/ocr`** (`free`/`paid`) — corectarea lucrărilor elevilor (poză+text)
  rutată integral pe cheie plătită (opțiunea A: și poza, nu doar textul — jumătate de măsură ar fi
  lăsat poza copilului pe tier human-reviewed), import Editor rămâne pe free.
- **`CORRECTION_CHAIN`** nou, dedicat, FĂRĂ Groq/Mistral (ar trimite lucrarea elevului la alți
  procesatori free — aceeași problemă de confidențialitate).
- **Eliminare completă Chat AI** (tab, `ChatPanel.tsx`, `CHAIN`-ul devenit obligatoriu la nivel de
  tip — TypeScript prinde orice apel viitor care omite `chain`).
- **Groq `maxTokens:6000`** pe pasul `groq` din `GENERATION_CHAIN` (sub plafonul 8000 TPM, cu
  marjă pt o eventuală a doua cerere în același minut — risc de auto-continuare notat, nerezolvat
  deliberat).
- **Corecție de capacitate a lui Roland:** 520 pagini/zi e capacitatea TOTALĂ (20 pe 3.6-flash +
  500 pe Lite, acum sigur), NU „per proiect" — verificat în cod (`api/ocr.py:50-57` are DOAR 2
  chei pe traseul OCR).

**„Faza 4.5e" propriu-zisă (2026-09-11, runda 3, CONFIRMATĂ explicit de Roland în conversația
coordonatoare — nu prin fork):** mesaj de eșec OCR pe **3 cazuri distincte** (`E-OCR-004` — tier
free, quota/unavailable; `E-OCR-005` — tier plătit, cheie de corectare indisponibilă, extindere
cerută explicit de Roland ca elevul/Cristina să știe sigur că poza n-a fost trimisă altundeva) +
cele două verificări live EXECUTATE efectiv (nu doar propuse) pentru Groq 6000 (200, 2484 tokeni,
fără 429) și bbox Lite (6/6 valide, crop-uri reale, verificate vizual) — ambele 🟡→🟢. Gate final:
`tsc 0·jest 447/447 (+3)·build OK·pytest 121/121 (+6)`. `963e780`, `af5e24b`.

**Verdicte auditori (runda 3):** regresie FĂRĂ REGRESIE (re-execuție independentă a ambelor
verificări live, rezultate noi consistente); cerințe toate 3 ONORATE (a prins 2 abateri de proces
la momentul auditului — capcană de mediu neconsemnată + `MEMORY.md` neactualizat — corectate
imediat); dovezi 7 CONFIRMAT + **1 NEDOVEDIT onest** (o verificare manuală de regresie post-deploy
n-a lăsat artefact, raportată ca atare, nu rotunjită).

**Datorii tehnice rămase deschise, deliberat NEREZOLVATE** (identificate în 4.5c-4.5e):
retestarea onestă a limitei Mistral „2 req/min" (promisă ca „primul task" al fazei următoare,
niciodată făcută); riscul de 429 pe Groq la auto-continuare în același minut (cunoscut, notat,
nerezolvat); opțiunea B de capacitate OCR (a doua cheie liberă cablată, ~1040/zi) — marcată
[RELEVANT, nu necesar].

### Faza 5 — „Unificarea documentației în două fișiere vii" (2026-09-11)

**Ce s-a livrat (commit `a8f3ff1`):** `docs/` avea 36+ fișiere de nivel top, o parte stale/mințind
(`CHANGELOG.md` zicea PROD v46 și „Chat AI livrat" — modul șters deja la 4.5d; `PLAN_MASTER.md`
numit „sursă unică" dar stale din 2026-08-09). Restructurare:

- **`docs/Plan_Finalizat.md`** (acest fișier) — nou, istoric complet cronologic + index pe module,
  hash-uri de commit reale, verificate în `git log`, nu inventate.
- **`docs/arhiva/`** — nou, 21 documente vechi mutate verbatim (`git mv`, istoric git păstrat),
  inclusiv `PLAN_MASTER.md` și `CHANGELOG.md` (absorbite: §7 backlog → `docs/Plan_in_Lucru.md`
  §⏳ amânat conștient, §9 decizii valabile → `CLAUDE.md`, restul → rezumat în acest fișier).
- 3 poze `dovada_faza1_*.jpg` mutate în `docs/dovezi/` (consistență de loc).
- Referințe fixate — 24 fișiere de memorie + `CLAUDE.md` (6 locuri) actualizate să nu mai arate
  spre căi moarte; 7 referințe deja moarte dinaintea Fazei 5 (din curățenia din iulie) corectate.
- `docs/HANDOFF_SESIUNE.md` trimis de la >1800 la <100 linii.
- Zero cod de aplicație touch-uit. Gate identic cu baseline: `tsc 0 · jest 447/447 · build OK ·
pytest 121/121`.
- Plan complet + listă exactă de fișiere: `docs/arhiva/PLAN_FAZA5_UNIFICARE_DOCUMENTATIE_2026-09-11.md`
  (arhivat la Faza 6, stale la top-level — vezi Faza 6 mai jos).

### Faza 6 — „Automatizarea procesului" (2026-09-11)

**Ultima fază din programul de reparație** (§ORDINEA FAZELOR, `99_Roland_Work/Fazele_mentiuni_Roland.md`).

**Ce s-a livrat:** zero cod de aplicație atins — doar `docs/`, `.claude/`, `CLAUDE.md` (confirmat de
`auditor-regresie`: niciun fișier sub `frontend/src/`, `api/*.py`, `api/lib/`).

- **R-DOCS-GUARD** (regulă nouă) + mecanism verificabil: `.claude/scripts/check-docs-classification.mjs`
  (pattern/titlu-H2 din `Plan_in_Lucru.md`, NU manifest separat) + hook `SessionStart` local
  (`.claude/settings.local.json`, zero modificări la `~/.claude/`) + `AskUserQuestion` la
  `de_revizuit > 0` (pas nou în `CLAUDE.md`). Extins la `.html` (Completarea 3): 2 companion legitimi,
  1 orfan real documentat explicit (`OPTIUNI_API_AI_2026-09-10.html`), niciunul tăcut. **Bug de regex
  găsit și corectat empiric** (proza confundată cu declarație de stare) — vezi `docs/MEDIU_CLAUDE_CODE.md`
  §3.
- **`docs/MEDIU_CLAUDE_CODE.md`** (nou) — mediul Claude Code nativ al acestui proiect: auditori,
  reguli, gardă `docs/`, memoria unică, fluxul de fază, capcane operaționale.
- **Memorie unică:** `.claude/memory/` (3 fișiere) arhivat în `.claude/memory/arhiva/` (`git mv`,
  nimic șters), `.claude/memory/MEMORY.md` rescris ca pointer către memoria canonică auto-încărcată
  (`~/.claude/projects/.../memory/MEMORY.md`), `CLAUDE.md` pasul 4 corectat.
- **R-DIAG-AUTO lărgit** la toate nivelele (`error`/`warn`/`action`/`info`), nu doar `ERROR`/`WARN`
  — motivul exact: regula veche a ratat bug-ul SK (Faza 1), logat la nivel `action` cu
  `error_code=null`. Probă empirică live pe Supabase (`tenders-ro`): 846 rânduri `level=action` cu
  `error_code=null`, din care 10 `editor:translate_error` (2026-08-20→09-06), 4
  `editor:ocr_import_error` (2026-07-30→09-02), 61 `editor:dictation_error` (din 2026-07-26) —
  toate invizibile regulii vechi. Nu a fost nevoie de log de test sintetic.
- **Completare 1:** secțiune Faza 5 lipsă din acest fișier, adăugată ca prim pas + notă
  retrospectivă despre golul de acoperire al celor trei auditori (mai sus).
- **Completare 2:** arhivarea `PLAN_FAZA5_...md` condiționată de repararea celor 4 referințe
  active (2 `HANDOFF_SESIUNE.md`, 2 `Plan_in_Lucru.md`) — făcută în această ordine.
- **Completare 4 (auto-consistență):** la închidere, `docs/PLAN_FAZA6_AUTOMATIZARE_2026-09-11.md`
  a devenit el însuși plan de fază închisă. Dovadă live, în ordine:
  1. Titlul H2 din `Plan_in_Lucru.md` flipat la `✅ ÎNCHISĂ` →
     `node .claude/scripts/check-docs-classification.mjs` → `{"de_revizuit":1, "PLAN_FAZA6_AUTOMATIZARE_2026-09-11.md":"STALE"}` (exit 1) — mecanismul și-a prins propriul autor.
  2. Referințe reparate repo-wide (nu doar `docs/`): comentariul din
     `.claude/scripts/check-docs-classification.mjs` + linia din `Plan_in_Lucru.md` care numea planul.
  3. Fișierul mutat în `docs/arhiva/PLAN_FAZA6_AUTOMATIZARE_2026-09-11.md`.
  4. Guard rulat din nou → `{"scanate":15,"de_revizuit":0,"detalii":[]}` (exit 0).
- **Întrebare deschisă, adusă lui Roland, NEDECISĂ unilateral:** memoria canonică
  (`~/.claude/projects/.../memory/`) trăiește ÎN AFARA git-ului — o viitoare migrare de laptop
  (deja pățită o dată) ar putea-o pierde dacă `.claude/memory/` a devenit doar un pointer.
  Recomandare (nu decizie): acceptă riscul conștient — Faza 5/6 au făcut deliberat din repo sursa
  de adevăr, iar un export manual periodic ar recrea exact fragilitatea „cineva trebuie să-și
  amintească" pe care R-DOCS-GUARD există s-o elimine. Dacă Roland vrea o plasă de siguranță, ar
  trebui să fie un hook automat, nu un obicei. Decizia rămâne a lui Roland.
- **Datorii tehnice** (Mistral „2 req/min", Groq 429 auto-continuare, OCR opțiunea B): NEATINSE,
  intenționat, în afara scopului Fazei 6 — rămân în `docs/Plan_in_Lucru.md` §amânat conștient.

**Notă de proces (auto-corecție găsită prin `advisor()`, nu de Roland):** în timpul execuției, un
checkbox `[x]` fals a fost bifat pentru Completarea 4 înainte ca arhivarea să existe efectiv, plus
o ancoră moartă a fost adăugată în indexul de mai sus spre această secțiune înainte ca ea să
existe — exact defectul de clasă pe care Faza 6 există să-l prevină, reprodus de propriul ei
autor. Corectat imediat, înainte de auditori. `auditor-cerinte` și `auditor-dovezi` au confirmat
independent starea tranzitorie (au prins-o falsă, apoi corectă, la citiri succesive) — vezi
verdictele lor mai jos.

**Verdicte auditori:**

- **`auditor-regresie`** → **FĂRĂ REGRESIE.** `tsc 0 · jest 447/447 (28 suite) · pytest 121/121 ·
build OK` (prima rulare de build a picat pe `ENOENT` — contenție `.next` cu 40+ procese `node`
  concurente pe mașină, nu regresie de cod; a doua rulare, fără nicio modificare, a trecut curat).
  Confirmat prin `git diff --stat`: zero fișiere `frontend/src/`/`api/*.py`/`api/lib/` atinse.
  Semnalat: la momentul auditului nu exista încă niciun commit pentru Faza 6 (corect — R-STOP-FAZA
  cere commit/push înainte de închidere, făcut după acest raport).
- **`auditor-dovezi`** → 6 CONFIRMAT direct (baseline gate, Completare 2, garda `docs/` cu test
  independent propriu, `MEDIU_CLAUDE_CODE.md`, `CLAUDE.md` pas 1, R-HANDOFF §2, arhivare memorie),
  2 PARȚIAL: Completarea 1 avea o referință moartă NOUĂ la linia 468 de mai sus („vezi Faza 6 mai
  jos" spre o secțiune care încă nu exista — **corectată prin scrierea acestei secțiuni**), iar
  §2.7 avea o imprecizie de citare a cifrelor Supabase (**corectată** — vezi mai sus). 1 INFIRMAT
  onest: auto-consistența Faza 6 nu era încă făcută LA MOMENTUL auditului, dar planul o marca deja
  corect `[ ]`, nu `[x]` — făcută imediat după, cu dovada de mai sus.
- **`auditor-cerinte`** → toate cele 4 completări onorate; a confirmat independent aceeași
  referință moartă la linia 468 (a doua sursă independentă pentru același defect) și a semnalat
  corect că la momentul auditului Faza 6 nu era încă închisă (zero commit) — adevărat atunci,
  închisă acum, după acest raport.

**Gate final, identic cu baseline:** `tsc 0 · jest 447/447 · build OK · pytest 121/121`.

**Verdicte auditori:** regresie — FĂRĂ REGRESIE de cod; a găsit 5 referințe suplimentare deja-moarte
în fișiere neatinse de Faza 5 (`.claude/agents/auditor-dovezi.md`, `docs/PROMPT_SESIUNE_NOUA.md`,
`README.md`, `99_Plan_vs_Audit/PLAN_DECISIONS.md`, `docs/Fazele.md`) — corectate imediat, înainte
de commit. dovezi — 6 CONFIRMAT, 1 PARȚIAL (o referință ratată în sampling, corectată), 1
CONFIRMAT-cu-rezervă (2 puncte operaționale minore, necritice, absente din noul HANDOFF — notă
rămasă în plan). cerințe — a găsit o **abatere reală majoră**: `docs/Plan_in_Lucru.md` NU fusese
încă golit de fazele închise cum promitea §0 al planului (dublură cu acest fișier, exact ce Faza 5
interzicea explicit) — **corectată imediat, ÎNAINTE de commit**; `CLAUDE.md` mai avea Chat AI
listat ca modul livrat, la 14 linii de propria notă că a fost eliminat — corectat.

**Notă retrospectivă (2026-09-11, scrisă la Faza 6):** această secțiune a lipsit din
`Plan_Finalizat.md` o fază întreagă — referința „vezi Faza 5 mai jos" din §Consolidare
`PLAN_MASTER.md` (mai sus în acest fișier) a țintit spre nimic, nedescoperită de niciunul din cei
trei auditori ai Fazei 5. Motivul, verificat: mandatul lor nu acoperă acest tip de defect —
`auditor-dovezi` verifică dovada per-item din `Plan_in_Lucru.md`, `auditor-regresie` verifică
poarta, `auditor-cerințe` compară livrarea cu mențiunile scrise de Roland. Niciunul nu verifică
**completitudinea internă a `Plan_Finalizat.md` însuși** — că o fază declarată închisă chiar are o
secțiune proprie aici, nu doar o referință către una. Reparat la cererea explicită a lui Roland, ca
prim pas al Fazei 6, înaintea oricărei alte modificări din acea fază.

### Mentenanță post-program — hook `SessionStart` R-DOCS-GUARD tăcut (2026-09-12)

**Nu e o fază nouă** — programul de reparație (Fazele 1-6) rămâne închis; asta e o reparație de
mentenanță normală, aceeași zi ca închiderea Fazei 6.

**Simptom:** hook-ul `SessionStart` local (`.claude/scripts/check-docs-classification.mjs`,
instalat la Faza 6) nu producea niciun mesaj vizibil în context la pornirea sesiunii, deși rula
fără eroare (`/hooks`, rulat de Roland, confirma hook-ul de proiect deja înregistrat corect, grup
`[User, Project, Plugin] (all)`, alături de cel global care rula sigur).

**3 runde de diagnostic (ipoteze excluse, în ordine):**

1. **Runda 1:** `matcher: ""` — EXCLUS (echivalent cu "match all"); shell-ul pe Windows (Git
   Bash, `;` valid) — EXCLUS. Ipoteza inițială „cale relativă fără `${CLAUDE_PROJECT_DIR}`" s-a
   dovedit **fals pozitivă** la runda 2 (testul care părea s-o confirme seta variabila inline pe
   aceeași linie cu comanda, nu cum o furnizează real Claude Code unui proces de hook).
2. **Runda 2:** excluse `disableAllHooks`/`allowManagedHooksOnly` (nesetate), un al doilea fișier
   de settings care ar fi umbrit proiectul (nu există), migrarea fișierului
   (`.claude/settings.local.json` → `.claude/settings.json`, ambele variante eșuau identic).
3. **Runda 3 (cauza reală, confirmată cu `/hooks` + documentația oficială Claude Code):** scriptul
   scotea `console.log(JSON.stringify(summary))` → stdout începe cu `{` → Claude Code îl
   interpretează ca JSON de control pt hook-uri (schema `hookSpecificOutput`/`decision`); JSON-ul
   nostru n-avea acele câmpuri → pică validarea → eroare non-blocking, dar notița de eroare apare
   DOAR în transcriptul lui Roland, niciodată ca și context pt Claude (citat exact din
   documentația oficială). **Fix:** output reformatat ca text simplu
   (`R-DOCS-GUARD scanate=N de_revizuit=M`, nu mai începe cu `{`), detaliile ca array separat doar
   dacă `de_revizuit>0`. Testat manual, ambele căi (0 și >0), exit code 0/1 neschimbat.

**🟢 CONFIRMAT LIVE (2026-09-12, sesiune `/onboard` reală, `session_id` nou — nu continuarea
sesiunii care a aplicat fixul):** mesajul `SessionStart:startup hook success: R-DOCS-GUARD
scanate=15 de_revizuit=0` a apărut vizibil în context la pornirea sesiunii, exact testul decisiv
pe care runda 3 îl ceruse explicit. Mecanismul funcționează end-to-end: script → hook → context
Claude, fără intervenție manuală.

**Verdict `auditor-dovezi` (runda 3, pe mecanica scriptului, înainte de confirmarea live):**
CONFIRMAT structural (testele A/B/C ale scriptului), a găsit o citare falsă (script de
investigație salvat greșit în scratchpad de sesiune, nu de proiect) — corectată imediat.

### Mentenanță — retestare Mistral (2026-09-12)

**Datorie tehnică din 4.5c, sărită de 2 ori (4.5d, 4.5e), rezolvată acum.** Promisă explicit ca
„primul task al fazei următoare" (commit `605d4f8`), retestarea EMPIRICĂ a limitei Mistral „2
req/min" (documentată în `~/.api-keys/catalog.md` pt `MISTRAL_API_KEY`/`MISTRAL_API_KEY_2`) nu se
făcuse — Faza 4.5c doar o infirmase ANALITIC (sonda de atunci trăsese 6 cereri în ~20s, primise
429, și raportase greșit „Mistral e mort"; memoria `feedback_verifica_limita_inainte_de_sonda`
codifică exact această capcană).

**2 corecturi de pornire, verificate în cod înainte de sondă (nu presupuse):**

1. Mistral e **OCR-only** azi, nu „OCR/traducere" cum scria planul (stale) — singurul punct de
   integrare activ e `api/lib/ocr_structured.py` → `_ocr_with_mistral_structured()` (model
   `mistral-ocr-latest`, `POST https://api.mistral.ai/v1/ocr`, cheie din `MISTRAL_API_KEY`).
   `translation_router.py` îl menționează DOAR într-un comentariu despre cod eliminat 2026-08-07
   (`d2749d7`) — corectat în plan.
2. Imaginile de test sunt în `99_Roland_Work/Teste_Input/` (nu `Teste_Input/` la rădăcină, cum
   presupunea vag planul) — folosită `limite_matematica.jpeg` (pagină reală de matematică).

**Sondă:** `scratchpad/mistral_rate_limit_probe_2026-09-12.mjs` (versionat, nu scratchpad de
sesiune — lecția citării false prinsă de auditor la runda hook-ului, aplicată direct aici). Cereri
REALE către endpoint-ul de producție, spațiate 35s (sub limita de 2/min = 30s/cerere), 6
cereri/cheie (~3min30s/cheie), ambele chei ale proiectului testate SEPARAT, în ferestre de timp
distincte (pauză 60s între ele) ca să nu se amestece eventuale 429 între conturi.

**Rezultat (`scratchpad/mistral_rate_limit_probe_output_2026-09-12.json`):** **12/12 cereri → HTTP
200**, OCR valid (`pages:1` fiecare), zero 429, zero erori, pe AMBELE chei
(`MISTRAL_API_KEY`, `MISTRAL_API_KEY_2`). Durată răspuns: 244-1046ms — cea mai lentă a fost prima
cerere globală (1046ms, probabil cold start de rețea), restul 244-611ms fără tipar clar (nu strict
descrescător per cheie — ex. a doua cerere de pe `MISTRAL_API_KEY_2`, 611ms, e mai lentă decât
prima ei, 273ms).

**Verdict [CERT]:** Mistral OCR e VIU, pe ambele chei, la un ritm sub limita documentată (35s
spacing = ~1.7 req/min < 2 req/min), susținut 6 cereri consecutive fără nicio degradare. Confirmă
exact ipoteza Fazei 4.5c: sonda de atunci lucra la ~18 req/min (6 cereri în ~20s) — de ~9× peste
limita documentată — iar 429-urile măsurau propria ei încălcare de plafon, nu o defecțiune a
providerului. Fallback-ul din `ocr_structured.py` e **legitim și rămâne neschimbat** — zero cod
de aplicație atins la acest task (doar sondă + documentație).

**Decizie:** conform mandatului, rezultatele au fost aduse lui Roland prin `AskUserQuestion`
înainte de orice schimbare la lanțul de fallback; verdictul nu a cerut nicio modificare de cod
(Mistral rămâne fallback-ul existent, neatins).

---

## Notă de proces — capcane recurente de reținut (nu re-descoperi)

- **Fork-uri/subagenți NU comit, NU fac push.** Recurență de 2 ori (Faza 4/Calculator, Faza
  4.5d/reluare externă) — vezi memoria `finding_fork_discipline_si_generator_drift_2026_09_10` +
  `finding_parallel_session_naming_collision_2026_09_11`.
- **Commit cu diacritice/emoji prin heredoc pică pe hook-ul de siguranță** — scrie mesajul într-un
  fișier + `git commit -F`. Recurent de 3+ ori.
- **„Nimic gata fără dovadă live"** — lecția centrală a Fazei 2 (5 runde de audit au găsit defecte
  pe care poarta verde nu le prinsese) și a Fazei 1 (auditul din 07.09 declarase „toate butoanele
  funcționează"; Roland a spart una în 10 secunde).
- **Cei trei auditori nu verifică completitudinea INTERNĂ a acestui fișier** — doar dovada
  per-item, poarta, și conformitatea cu mențiunile lui Roland. O fază poate fi „închisă corect" și
  totuși lăsa `Plan_Finalizat.md` fără secțiunea ei (Faza 5 — prins abia la Faza 6, prin cererea
  lui Roland, nu prin auditori). La finalul fiecărei faze, verifică manual că secțiunea ei există
  aici ÎNAINTE de a declara „istoric complet".
