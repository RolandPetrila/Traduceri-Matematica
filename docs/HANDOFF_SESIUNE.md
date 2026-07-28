# HANDOFF SESIUNE — reluare context 100% (editor TipTap + stare proiect)

> Ultima actualizare: 2026-07-27. Scop: o sesiune NOUĂ reia exact de unde am rămas, cu tot contextul operațional.

## ✅✅ STARE #4 — COMPLET (2026-07-27)

**Autorare V→XII (213→276 formule, toate cu explicație) + interactiv A (chips domeniu) + C (constructor Matrice/Sistem/Σ/∫) + B (paletă 16 figuri SVG).**

- **TOT LIVE pe `traduceri-frontend.vercel.app` (cache v15, `dpl_h6VhYCxdAk1qqvAzPq4eAiLJyKvP`):** autorarea + A + C + B (figuri + fix export Word). Verificat: aliasul servește `v15-20260727d`.

### 🔵 RĂMAS DESCHIS (pt sesiunea următoare — consolidat)

1. **Eyeball Roland (manual, nu se automatizează):** PDF/.docx real cu o figură + o formulă (mecanica dovedită, perceptualul nu); redimensionarea figurii (acum fixă 120px).
2. **Verificare de domeniu (Cristina):** corectitudinea matematică/notațională a formulelor noi (gate+eyeball garantează KaTeX + curățenie, NU semantica).
3. **Paritate mobilă:** meniul Matematică (formule + A/B/C interactiv) e **desktop-only**; pe mobil (Sheet) nu există math. Decizie separată dacă se adaugă.
4. **Opțional:** figuri EDITABILE pe foaie (NodeView parametric — amânat conștient la B); redimensionare figuri (handles Image).

---

## 🆕 CERINȚE NOI (Roland, 2026-07-28) — prompt pt sesiunea următoare

> ⚠️ #4 e GATA. Pentru sesiunea nouă folosește **acest** prompt (nu cel de la „PROMPT DE RELUARE" de mai jos, care e istoric pt #4).

**Decizii confirmate (Roland, nu le re-întreba):**

1. **Redimensionare chenar Matematică** (Screenshot (238).png = popover-ul `EditorMathMenu`): prinzi marginea/colțul cu mouse-ul → mai mare/mic; funcțiile dinăuntru se rearanjează automat după lățime; dimensiunea se ține minte (localStorage).
2. **Verificare + completare vs manuale oficiale** (manuale.edu.ro). Roland a **DESCĂRCAT deja** manualele (13 PDF-uri) în `99_Roland_Work/Carti_descarcate_EDU/` (GITIGNORED — NU se committează). DOAR clasele din folder erau disponibile pe site; restul = conținut indisponibil (→ pt ele rămâne programa deja folosită).
   - Agentul: (a) inventariază folderul (identifică pt fiecare PDF clasa + editura din copertă/cuprins → `INDEX.md`); (b) extrage CUPRINSUL din fiecare; (c) compară materiile din manualele oficiale cu materiile din editor (`math-data.json`) — **nu doar clasa, ci și COMPLETITUDINEA**: respectă documentarea din editor programa oficială? e completă? (d) remediază: formulă în clasă GREȘITĂ → **mut-o automat**; temă/formulă din manual LIPSĂ din editor → **adaug-o** (latex+explicatie, gate+eyeball); îmbunătățiri sesizate → **aplică-le**. (e) raport final (mutări + adăugiri + îmbunătățiri, cu manualul-sursă).
   - A1739/A1740 = clasa VII (Booklet + art Klett) — verificate deja ca format.

**Prompt gata de lipit (primul mesaj în sesiunea nouă):** vezi mesajul din chat 2026-07-28 (v2, cu folderul local). Efort: **xhigh**.

---

## 🆕 SESIUNE 2026-07-28 — EXECUȚIE cerințe noi

### ✅ CERINȚA 1 — chenar „Matematică" REDIMENSIONABIL + responsive (LIVRAT, NEDEPLOYAT)

Formă confirmată de Roland (§17, mock): **grip custom** (margine dreaptă + margine jos + colț jos-dreapta) — NU `resize:both` nativ (care prinde doar colțul) + **Formule auto 1→2→3 coloane** (nu doar grilele).

Implementat în `frontend/src/components/editor/`:

- **`EditorMathMenu.tsx`:** popover-ul e acum `flex flex-col` cu `width/height` din state (init default 380×540, încărcat din localStorage în `useEffect` — fără hydration mismatch, cf. [[finding_hydration_tab_and_deploy_verify_2026_07_26]]). 3 grip-uri absolute (est/sud/colț) cu `onPointerDown`; **drag prin listeneri pe `window`** (`pointermove`/`pointerup`/`pointercancel`) — NU `setPointerCapture` (capcană: `setPointerCapture` arunca pe pointer-ul CDP → dragRef nu se seta; window-listeners e robust și nu depinde de capture). Clamp `[320..760]×[380..min(900,vh-80)]`. Persistă în `localStorage["editor_math_menu_size_v1"]` la pointerup. Grilele: Simboluri/Figuri/Formule → `grid-cols-[repeat(auto-fill,minmax(...,1fr))]` (Formule minmax 230px → 1/2/3 coloane; Simboluri 2.5rem; Figuri 4rem). ScrollArea/TabsContent → `flex-1 min-h-0` (înălțimea se distribuie la resize); TabsContent activ = `data-[state=active]:flex` (ca `[hidden]` să câștige pe cele inactive).
- **`EditorMathBuilder.tsx`:** grila „Construcții gata" `grid-cols-4` → `grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))]`.

**Verificat LIVE (localhost:3311, Chrome MCP):** resize colț 380×540→580×604 + grip est →clamp 320; popover NU se închide la drag (grip inside + pointermove/up pe window; Radix se închide doar la pointer-DOWN outside); persistă la Escape+reopen (580×604); reflow: Construiește 4→8, Formule 1→2, Simboluri 6→11, Figuri 8/7 col; KaTeX se re-fit-ează (AutoFitKatex are ResizeObserver). **Non-regresie: tsc 0 · jest 28 · next build 11 rute · consolă curată.** NEDEPLOYAT (Roland confirmă; bump v15→v16 la deploy).

### ⏳ CERINȚA 2 — audit vs manuale oficiale (AUDIT GATA + safe-fixes aplicate; BLOCAT pe 4 decizii Roland)

Inventar (13 PDF-uri, GITIGNORED verificat) → `docs/manuale/INDEX.md`. Clase acoperite: V,VI,VII,VIII,XI,XII. FĂRĂ manual: IX,X. ⚠️ XI–XII = manuale 2006–2007 → PREZENȚĂ nu absență. A1260 (Art Klett V) TOC eșuat → V pe 2 manuale.

**Audit făcut** (6 subagenți, citat-dovadă din `scratchpad/toc_*.txt` vs `scratchpad/editor_dump.txt`). RAPORT: `docs/manuale/AUDIT_RAPORT.md` + sinteză `scratchpad/AUDIT_FINDINGS.md`.

**DESCOPERIREA-CHEIE:** offset SISTEMATIC pre-2017 la gimnaziu — calcul prescurtat VII→VIII, radicali/sisteme/trig VIII→VII, patrulatere/cerc VI→VII (~20 formule = O realiniere coerentă, de aplicat ca un tot). Liceu XI/XII: 0 misplasări (curat).

**APLICAT deja** (neambiguu, gate PASS, 276→275, NEDEPLOYAT): VIII −„Raport de arii" (duplicat VII); VI „Proporție derivată"→„Proprietatea fundamentală a proporției". Script: `scratchpad/apply_safe.js`. Unelte engine: `lot_engine.js` (REMOVE class-scoped), `gate_check.js`, `eyeball.js`.

**DECIZII ROLAND (2026-07-28, confirmate):** (1) DA realiniere gimnazială; (2) probabilitate V→înlocuiesc cu Frecvența (mut prob. la VI); (3) trig VIII→mut definițiile la VII, păstrez sin²+cos²=1+tg=sin/cos la VIII; (4) autorez TOATE ~40 goluri, ordine VII→VIII→VI→V→XI→XII (sesiune separată).

**✅ REALINIERE APLICATĂ (Decizia 1+2+3, commit pending, gate PASS 275→272, NEDEPLOYAT).** Script `scratchpad/realign.js` (mută obiecte întregi, păstrează latex+explicatie). Mutări: VI→VII (Proprietăți paralelogram/romb/trapez + Suma unghiuri patrulater + Lungimea cercului; șters ariile duplicate din VI); VIII→VII (Raționalizare, Introducere sub radical, Sistem 2×2, Linia mijlocie, def. sin/cos/tg/ctg + valori 30/45/60); VII→VIII ([Calcul algebric] 9 formule); V→VI (Probabilitatea) + NEW Frecvența relativă la V. **Counts: V40 VI28 VII34 VIII37 IX33 X37 XI32 XII31 = 272.** Grup nou [Trigonometrie] la VII. Rămas minor (VIII [PROBABIL] neincluse în lista Deciziei 1: Proprietăți paralelogram-diagonale, Inegalitatea triunghiului — de tratat la autorarea VIII, coliziune nume la VII).

**✅✅ Decizia 4 — GOLURI TOATE CLASELE AUTORATE (2026-07-28) — COMPLETĂ, NEDEPLOYAT.** Bibliotecă **276 → 334** formule, toate cu explicație. Ordine executată VII→VIII→VI→V→XI→XII, R3 verificat la TOC-ul/corpul manualelor (am PDF-urile local), gate PASS + eyeball la fiecare lot, commit per clasă.

| Lot     | Clasă | Δ     | Noi                                       | Sursă TOC      | Commit    |
| ------- | ----- | ----- | ----------------------------------------- | -------------- | --------- |
| gaps_7  | VII   | 34→41 | +7                                        | A1739/40/42    | `80ca79b` |
| gaps_8  | VIII  | 37→51 | +16 (+2 mutări la VI/VII)                 | A1983          | `5d6f6b5` |
| gaps_6  | VI    | 29→38 | +9 (+fix Înălțimea +rename Aria discului) | A1497          | `eaac23a` |
| gaps_5  | V     | 40→45 | +5                                        | A1254          | `bf3b96c` |
| gaps_11 | XI    | 32→45 | +13                                       | A178/A196 (M1) | `407042d` |
| gaps_12 | XII   | 31→43 | +12                                       | A197/A264 (M1) | `911090e` |

- **Counts finale:** V45 VI38 VII42 VIII51 IX33 X37 XI45 XII43 = **334** (toate cu explicație).
- **MUTĂRI [PROBABIL] rezolvate (gaps_8, geom. plană misplasată la VIII spațială):** „Inegalitatea triunghiului" VIII→VI (A1497 p.185, grup nou VI „Triunghiuri"); „Proprietăți paralelogram (diagonale)" VIII→VII (intrare distinctă, Roland „VII cu redenumire").
- **CAT.5 aplicate:** VI „Înălțimea" latex era A=a·h/2 (ARIA!) → def. corectă `AD⊥BC`; VII „Aria cercului"→„Aria discului"; XI Cramer generalizat n×n + Kronecker-Capelli. Semnalat, NEATINS (decizia Roland): VIII funcția liniară `(a≠0)` vs `a,b∈ℝ`.
- **ABANDONAT (R3, gate TOC):** VIII „fracții algebrice" (scoase din gimnaziu prog. 2017, absent din TOC); V „baza 2" (algoritm, fără formulă); VI „modul rațional" (near-dup cu VI[5] Modulul întreg).
- **DEDUP XII (advisor):** FTC autorat ca `G(x)=∫ₐˣ⇒G'=f` (NU dublează Primitivă-def F'=f); „lege de compoziție/parte stabilă" (NU re-listare axiome Grup).
- **⚠️ Onestitate R3:** XI/XII = manuale M1 2006-07 → golurile probează PREZENȚA temei în M1, NU apartenența la programa curentă. Gate+eyeball garantează KaTeX+curățenie; **corectitudinea semantică rămâne verificarea de domeniu a Cristinei**.
- **Non-regresie (2026-07-28):** `tsc 0 · jest 28/28 · next build OK (11 rute)`. Unelte: `scratchpad/gaps_<N>.js` + `lot_engine.js` (acum cu `RENAME`) + `gate_check.js` + `eyeball.js`.

**✅ DEPLOYAT v16 (2026-07-28, confirmat Roland „Deploy acum"):** `vercel deploy --prod` pe `traduceri-frontend`; `CACHE_VERSION` v15→**v16-20260728a**. Verificat: aliasul `traduceri-frontend.vercel.app/sw.js` servește v16 (Age:0). Deployment `traduceri-frontend-o8pi8ckhp`. Cele 62 formule noi + mutări + CAT.5 = LIVE.

**RĂMAS (neblocant):** verificare de domeniu Cristina (semantica celor 62 formule noi — gate+eyeball garantează DOAR KaTeX+curățenie) + eyeball Roland PDF/.docx. **Decizie deschisă Roland:** VIII funcția liniară `(a≠0)` vs `a,b∈ℝ` (semnalat, neatins).

---

## ⚡ PROMPT DE RELUARE (lipește-l ca PRIMUL mesaj în sesiunea nouă)

```
/onboard

/effort xhigh

Apoi citește INTEGRAL, în ordine, ÎNAINTE de a acționa:
1. docs/HANDOFF_SESIUNE.md — secțiunea „SESIUNE 2026-07-27" + blocul „#4 ▶️ ÎN EXECUȚIE" (decizii + progres + ȘABLON de continuare).
2. docs/PLAN_math_curriculum_2026-07-27.md — taxonomia (clase × domenii × goluri ➕) + §7 CONFIRMAT.
3. scratchpad/README_autorare_math.md — pattern-ul repetabil per clasă + capcanele R3.
4. git log --oneline -15 (jurnalul; ultimul lot = „feat(#4 clasa V)").

CONTEXT: editorul matematic e LIVE pe traduceri-frontend.vercel.app (cache v15). #4 COMPLET + TOT DEPLOYAT: autorare Clasele V…XII (bibliotecă 213→276, TOATE cu explicație) + interactiv A (chips domeniu) + C (constructor Matrice/Sistem/Σ/∫) + B (tab „Figuri", 16 figuri SVG, export Word reparat). Datele: frontend/src/components/editor/math-data.json (276 formule + 103 simboluri).

DECIZII CONFIRMATE (Roland, nu le re-întreba): toate profilurile · implementare exhaustivă · ~65–95 formule noi + explicație la TOATE · ordine V→XII lot cu lot · interactiv A+C+B (B = figuri geometrice SVG, fază separată).

EXECUTĂ CONTINUAREA #4, în ordine:
1. ✅ AUTORARE V→XII — COMPLETĂ (8 loturi, bibliotecă 213→276, toate cu explicație). Vezi tabelul din secțiunea „AUTORARE V→XII COMPLETĂ". NU relua.
2. ✅ INTERACTIV A + C — LIVRAT (commit `ced8cf8`, verificat live, NEDEPLOYAT). A = chips domeniu; C = constructor 2 rânduri (Matrice/Sistem/Σ/∫). NU relua.
3. ✅ INTERACTIV B — LIVRAT + DEPLOYAT LIVE (paletă SVG-ca-imagine, tab „Figuri", 16 figuri, export Word reparat, cache v15). #4 COMPLET + TOT LIVE. RĂMAS opțional: eyeball PDF/.docx real + verificare domeniu Cristina + paritate mobilă.

REGULI OBLIGATORII:
- R3 corectitudine: gate_check.js validează DOAR KaTeX + invarianți (NO_LATEX=0, proză_în_html=0), NU corectitudinea matematică/semantica. Verifică FIECARE formulă la sursă; NU inventa. Capcane cunoscute: divizibilitate = convenția RO `a \vdots b` (⋮ = „a se divide cu b", NU internaționala `b \mid a`); litru = `\ell` (nu `\text{l}`); zecimale RO = `{,}` (ex. `2{,}35`); `.katex` e inline → măsoară cu getBoundingClientRect, nu scrollWidth.
- R-MATH (0% pierdere notație) · R-COST (gratuit) · R-EDIT.
- R-HANDOFF: ține HANDOFF + plan + memoria la zi + commit/push după FIECARE clasă. Deploy prod DOAR cu confirmarea mea (grupat, după mai multe clase; bump CACHE_VERSION v12→v13 la deploy).
- Non-regresie pt cod (interactiv A/C/B): tsc 0 · npm test (jest, 28) · npx next build · probă 390px+desktop.

#4 e COMPLET (autorare V→XII + interactiv A+C+B, toate verificate live). RĂMAS opțional: deploy B (v14→v15), eyeball export Word/redimensionare figuri, paritate mobilă math, verificare de domeniu Cristina. Confirmă în 2–3 rânduri ce ai înțeles, apoi întreabă-mă ce urmează.
```

---

## 📋 BACKLOG MATEMATICĂ (2026-07-26) — STARE la 2026-07-27

> **#1 ✅ · #2 ✅ · #3 ~ (parțial) — DEPLOYATE LIVE 2026-07-27** (`dpl_DyPf8jS5`, target production, `CACHE_VERSION v12`; verificat pe alias `traduceri-frontend.vercel.app`: sw.js=v12 + 24 construcții + „Construcții gata"). **#4 ⏳ ÎN CURS (taxonomie).** Commise `c37f22b`, `adaaaa8`, `969af17`, `5efc9b6`. RĂMAS de decis de Roland: (a) #3-extins (explicații ~157 formule) — Roland a ales să le autorez în #4, la același standard; (b) confirmarea TAXONOMIEI #4 înainte de autorare.

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

## 🆕 SESIUNE 2026-07-27 — backlog math #1/#2/#3 (DEPLOYAT LIVE) + #4 în curs

Branch `faza-g-editor`. Commit-uri: `c37f22b` (#1), `adaaaa8` (#2+#3), `5efc9b6` (fix html fallback + cache v12). Gate fiecare: **tsc 0 · build 11 rute · 28 teste · 213/213 KaTeX · verificat LIVE local + prod**. **DEPLOYAT prod 2026-07-27** (`dpl_DyPf8jS5`, `CACHE_VERSION v12`; Roland a aprobat; verificat pe alias). Roland a ales apoi **#4 taxonomie** ca următorul pas, iar #3-extins (explicații pt restul formulelor) să fie autorat în #4 la același standard.

**#1 ✅ — Construcții gata-făcute (REFRAME Roland).** Roland la §17: NU vrea „ghid cum să scrii", ci **structuri gata, toate vizibile, un click = pe foaie**. Livrat: grilă de **24 construcții** (xⁿ, xₙ, x²ₙ, a/b, √, ⁿ√, |x|, lim, Σ, Π, ∫, ∫ᵃᵇ, f′, sin/cos/tg, vector, overline, binom, ∠, grade, sistem, matrice) în tab-ul „Construiește" (deasupra constructorului cu câmpuri), fiecare randată KaTeX, un click → `insertInlineMath` → editabilă la click. `math-input.ts` (`MATH_CONSTRUCTIONS`) + `EditorMathBuilder.tsx` + `AutoFitKatex.tsx` (nou). Verificat LIVE: grila randează, click inserează fracția academic.

**#2 ✅ — Formule lungi se încadrează (nu ies din chenar).** Roland: „să cuprindă în casetă, calibrată corect" → **scale-to-fit (zoom)**, NU scroll (scroll nu supraviețuiește la print). `math-fit.ts` (`installMathAutoFit`): micșorează cu `zoom` nodurile `.katex` care depășesc lățimea foii; MutationObserver (re-randare) + ResizeObserver; **măsoară cu `getBoundingClientRect` — `.katex` e inline → `scrollWidth`=0 (BUG prins la verificare live)**. Montat în `EditorTiptap` robust (`editor.on('create')`, capcana view-lipsă). Export: script de fit (zoom) în PDF/HTML + **cap 658px pe imaginea DOCX** (aceeași lățime A4 în editor/PDF/Word). `MathEditDialog` responsiv (`max-w-2xl` + `Textarea` + preview scroll). Verificat LIVE: matrice/integrală se micșorează (zoom 0.61/0.77) și încap exact.

**#3 ~ parțial — Explicații (audit + chevron).** `math-data.json`: cele **16 intrări proză-pură** auditate → **15 primesc `latex` REAL corect (R3) + câmp `explicatie`; 1 ștearsă** (înmulțirea zecimalelor — procedură fără formulă). **213/213 valide KaTeX** (era 214, −1 ștearsă). UI: `EditorMathMenu` — **rând extensibil (chevron)** arată explicația; click pe formulă inserează **DOAR** latex, NICIODATĂ explicația. `type Formula + explicatie?`. Verificat LIVE (mediana: chevron → „centrul de greutate").

- **RĂMAS #3-extins (DECIZIE Roland):** restul de ~157 formule (116 curate + ~42 condiții/„sudate") **NU au încă `explicatie`**. Backlog-ul cerea explicație pt TOATE. De autorat separat — **înainte sau după taxonomia #4?** (În #4 oricum se autoreaza formula+explicatie la un standard.) NU se pliază tacit în #4.

**#4 ▶️ ÎN EXECUȚIE — taxonomie confirmată, autorare V→XII pe loturi.** Cercetare la sursă (OMEN 3393/2017 + Matematică_TC 2025 edu.ro + Real XI–XII); TAXONOMIE în **`docs/PLAN_math_curriculum_2026-07-27.md`**.

**DECIZII ROLAND (2026-07-27, confirmate):** (1) **TOATE profilurile** (Cristina predă la toate) — implementare **exhaustivă**; (2) **complet** (~65–95 formule noi + explicații la TOATE, inclusiv cele ~198 fără); (3) ordine **V→XII**, lot cu lot, gate+commit după fiecare clasă; (4) interactiv **A + C + B** (filtrare pe domeniu + construcții extinse + **figuri geometrice SVG** — B = feature mare, fază separată). Grupuri noi distincte unde e firesc.

**PROGRES: Clasa V ✅ (lot 1, commit `56afebd`)** — +11 formule noi (arii, unități de măsură, probabilitate, ecuații simple, divizor/multiplu) + explicații la toate cele 40 + curățat proza rămasă (ordinea operațiilor, criterii divizibilitate, zecimale, modul→`\begin{cases}`). **Bibliotecă 213→224.** Gate: 224/224 KaTeX, NO_LATEX=0, proză_în_html=0. **NEDEPLOYAT** (deploy grupat, după mai multe clase, cu confirmarea Roland).

**PROGRES: Clasa VI ✅ (lot 2, commit `feat(#4 clasa VI)`)** — 27→36 (+9 noi: șir rapoarte egale, mărimi direct/invers proporționale, mărire/micșorare cu p%, ecuația gr. I, arii paralelogram/romb/trapez, frecvența relativă). Explicații la toate cele 36. **Curățat proza sudată** (14 latex): procente (**fix `%` = comentariu KaTeX** → `\%`), modul→`\begin{cases}`, unghiuri compl./supl./paralele+secantă (simbolic + verbal în explicatie), regula semnelor, rotunjire (exemplu numeric), proprietăți paralelogram/romb (simbolic `\parallel`/`\cong`/`\perp` + verbal). Grupuri noi: „Ecuații", „Organizarea datelor". **Bibliotecă 224→233.** Gate PASS (233/233 KaTeX, NO_LATEX=0, proză_în_html=0) **+ eyeball manual 36/36** (nu doar gate). Script persistent: `scratchpad/clasa_6.js` + unealtă `scratchpad/eyeball.js <clasa>`. **NEDEPLOYAT.**

**REGULĂ NOUĂ dovedită empiric (R3):** diacriticele RO **NU** randează curat în `\text{}` KaTeX (`ă â î` se descompun în bază+accent; `ș ț` se păstrează dar font-fallback) → proza RO cu diacritice merge **DOAR în `explicatie`** (text HTML), latex = pur simbolic; `\text{}` doar pt etichete scurte fără diacritice (`\text{compl.}`, `\text{din}`). Capcana `%` = comentariu KaTeX (mănâncă restul liniei) → mereu `\%`.

**PROGRES: Clasa VII ✅ (lot 3, commit `feat(#4 clasa VII)`)** — 24→32 (+8 noi: pătratul trinomului, descompunere factor comun, **Teorema lui Thales**, triunghiuri asemenea + raportul ariilor (k²), media geometrică, aria+înălțimea triunghiului echilateral). Grupuri noi: „Asemănare", „Triunghi echilateral". Explicații la toate cele 32. Curățat 5 latex: direct proporț. (proză), teorema înălțimii/catetei (proiecțiile → explicatie), unghi la centru/înscris (proză pură → simbolic `m(\angle)=m(\overset{\frown}{})`; `\overparen` NU e suportat în KaTeX 0.16.11, folosit `\overset{\frown}{}`). **Bibliotecă 233→241.** Gate PASS (241/241) + eyeball 32/32. **NEDEPLOYAT.**

**PROGRES: Clasa VIII ✅ (lot 4, commit `feat(#4 clasa VIII)`)** — 27→35 (+8 noi: raționalizarea numitorului, introducerea sub radical, panta prin 2 puncte, intersecția cu axele (gr. I), diagonala cubului/paralelipipedului, **relația fundamentală sin²+cos²=1**, tangenta ca raport). Explicații la toate cele 35. Curățat **15 latex** grav sudate: sistem cu acolade literale (invizibile!) → `\begin{cases}`; sin/cos/tg/ctg complet rupt → forme cu litere a/b/c + legendă în explicatie; **tabel trigonometric 3×3** (`\begin{array}` sin/cos/tg × 30°/45°/60°); probabilitate/frecvență rupte → `\text{}`/`f_r`; **fix `%` la Frecvența relativă**; `A_{bază}`→`A_{b}`, `(\frac{1}{3})`→`\dfrac{1}{3}`. **Bibliotecă 241→249.** Gate PASS (249/249) + eyeball 35/35. **NEDEPLOYAT.**

**PROGRES: Clasa IX ✅ (lot 5, commit `feat(#4 clasa IX)`)** — 25→33 (+8 noi: logică — negarea cuantificatorilor + De Morgan; geom. analitică — ecuația dreptei (pantă-punct), paralelism/perpendicularitate, distanța punct-dreaptă; produsul scalar; formula lui Heron). Grup nou: „Logică". Explicații la toate cele 33. Curățat **16 latex**: `\surd`→`\sqrt` (formula rădăcinilor, distanța), **teorema sinusurilor MALFORMATĂ** (`\frac{a}{\sin } A`) → `\dfrac{a}{\sin A}`; vectori `u⃗`/`v⃗` raw → `\vec{}`; sin/cos/tg rupt → forme cu litere; monotonia proză → `\nearrow`/`\searrow`; inj/surj/bij blob → `\begin{aligned}`. **Bibliotecă 249→257.** Gate PASS (257/257) + eyeball 33/33. **NEDEPLOYAT.**

**PROGRES: Clasa X ✅ (lot 6, commit `feat(#4 clasa X)`)** — 27→37 (+10 noi: **combinatorică** completă — permutări/aranjamente/combinări/complementare/binom Newton/sumă=2ⁿ (grup nou „Combinatorică"); compunerea + inversa funcțiilor; modul&argument (formă trig); dobânda compusă (grup nou „Matematici financiare")). Explicații la toate cele 37. Curățat **19 latex**: `log`→`\log` (7 intrări, altfel randa ca variabile italice!); `z̄`→`\bar{z}`; `∥`/`⊥` raw→`\parallel`/`\perp`; `\surd`→`\sqrt` (înjumătățire); `\cdot` separatori→`,\quad` (adunare/dublare); `ℤ`→`\mathbb{Z}`; inecuații proză „dacă"→`\begin{cases}`. **Bibliotecă 257→267.** Gate PASS (267/267) + eyeball 37/37. **NEDEPLOYAT.**

**PROGRES: Clasa XI ✅ (lot 7, commit `feat(#4 clasa XI)`)** — 29→32 (**−5 combinatorică mutată la X** conform plan §2 + **8 noi**: teoremele **Rolle/Lagrange/l'Hôpital**, limita fundamentală tg x/x, transpusa, det(AB)=detA·detB, inversa 2×2, (aˣ)'=aˣln a). Explicații la toate cele 32. Curățat **22 latex** (cel mai mare lot): `′`/`″` raw→`f'`/`f''` (ASCII prime — **avertismentul `″` rezolvat**); reguli derivare `\cdot`→`\begin{aligned}`; determinant→`\begin{vmatrix}`, inversa→`\begin{pmatrix}`; monotonia/Fermat/concavitate proză→simbolic; **2 ERORI MATEMATICE reparate**: `\ln\frac{1+x}{x}`→`\frac{\ln(1+x)}{x}` (limita e) și `m = \lim f\frac{x}{x}`→`\lim\frac{f(x)}{x}` (asimptota oblică). **Bibliotecă 267→270** (+8−5). Gate PASS (270/270, fără avertisment `″`) + eyeball 32/32. **NEDEPLOYAT.** Engine: `applyLot` acceptă acum `REMOVE`.

**PROGRES: Clasa XII ✅ (lot 8 — ULTIMA, commit `feat(#4 clasa XII)`)** — 25→31 (+6 noi: lungimea graficului, media unei funcții pe interval, morfism de grupuri, relațiile Viète grad 3, congruențe (aritmetică modulară), abaterea standard). Explicații la toate cele 31. Curățat **19 latex**: `\int [a,b]` literal→`\int_{a}^{b}` (Leibniz-Newton, arii, volum); `′` raw→`'`; probabilitate condiționată/Laplace malformate; Bézout/inel proză→simbolic (`P(x)\vdots(x-a)` convenția RO, `(A,+,\times)`); `grad`→`\operatorname{grad}`. **Bibliotecă 270→276.** Gate PASS + eyeball 31/31.

## ✅✅ AUTORARE V→XII COMPLETĂ + DEPLOYAT LIVE (2026-07-27) — bibliotecă 213→276, TOATE cu explicație

**8 loturi (V…XII), committed+pushed, ✅ DEPLOYAT prod 2026-07-27** (`dpl_9RqRLBqj3ovWL5CpZ48jMgR2kvro`, READY, `CACHE_VERSION v12→v13` = `v13-20260727b`; verificat: aliasul `traduceri-frontend.vercel.app/sw.js` servește v13). Roland a confirmat deploy „Acum". Rezumat:

| Lot | Clasă | Δ intrări | Noi                                     | Fix latex         | Commit      |
| --- | ----- | --------- | --------------------------------------- | ----------------- | ----------- |
| 1   | V     | 29→40     | +11                                     | proză             | `56afebd`   |
| 2   | VI    | 27→36     | +9                                      | 14 (fix `%`)      | `c568c99`   |
| 3   | VII   | 24→32     | +8 (Thales/asemănare)                   | 5                 | `114eb65`   |
| 4   | VIII  | 27→35     | +8 (tabel trig)                         | 15                | `cf142ff`   |
| 5   | IX    | 25→33     | +8 (logică)                             | 16                | `45a37e8`   |
| 6   | X     | 27→37     | +10 (combinatorică)                     | 19 (`log`→`\log`) | `c8ca4bc`   |
| 7   | XI    | 29→32     | +8 (Rolle/Lagrange/l'Hôpital), −5 comb. | 22 (2 erori mat.) | `b495287`   |
| 8   | XII   | 25→31     | +6                                      | 19                | (acest lot) |

- **Bibliotecă: 213 → 276 formule.** `cu_explicatie = 276/276` (obiectivul #3-extins + #4 atins: TOATE au explicație).
- **Grupuri noi:** Unități de măsură, Organizarea datelor (V); Ecuații (VI); Asemănare, Triunghi echilateral (VII); Logică (IX); Combinatorică, Matematici financiare (X).
- **Capcane R3 dovedite:** diacritice RO nu randează curat în `\text{}` (→ explicatie); `%`=comentariu KaTeX (→`\%`); `\surd`/`\Sigma`/`log` fără `\` randează greșit; `\overparen` nesuportat (→`\overset{\frown}{}`); `′`/`″` raw→`'`/`''`; convenția RO divizibilitate `\vdots`.
- **Unelte persistente:** `scratchpad/lot_engine.js` (`applyLot`), `clasa_5..12.js`, `eyeball.js <clasa>`, `gate_check.js`.
- **INTERACTIV A + C ✅ (commit `ced8cf8`, ✅ DEPLOYAT LIVE v13→v14 `v14-20260727c`, verificat pe alias):** A = rând de chips de domeniu (Toate + grupurile clasei) → filtrează lista plată pe `f.grup`, reset la schimbarea clasei, chevron intact (`EditorMathMenu.tsx`). C = constructor pe 2 rânduri (`EditorMathBuilder.tsx`): Kind-uri noi `matrix` (n×n≤5, grilă → `\begin{pmatrix}`), `system` (n≤6 → `\begin{cases}`), `sum` (limite editabile → `\sum_{}^{}`), `integral` (limite + `\,dx` → `\int_{}^{}`); celule goale = `\square`; draft persistat. **Verificat LIVE** (localhost:3300): A filtrează 40→8 Geometrie; Matrice randează pmatrix (4 celule 2×2); Σ cu limite k=1→n; insert end-to-end → nod `data-latex` pe foaie. Non-regresie: tsc 0 · jest 28 · next build 11 rute.
- **INTERACTIV B ✅ (figuri geometrice SVG — commit pending, NEDEPLOYAT).** Formă confirmată de Roland (§17): **paletă SVG-ca-imagine** (NU NodeView parametric — amânat). `editor-figures.ts` = 16 figuri hand-drawn (9 plane: triunghi oarecare/dreptunghic/echilateral, pătrat, dreptunghi, paralelogram, romb, trapez, cerc; 7 corpuri: cub, paralelipiped, cilindru, con, sferă, piramidă, prismă) cu notații A/B/C(/D), muchii ascunse punctate. Tab nou „Figuri" în `EditorMathMenu` (popover lărgit 340→380px, 4 taburi), un click → `setImage({src: data-URI SVG base64})` (extensia Image, `allowBase64`). **Verificat LIVE**: toate 16 randează corect în paletă; click Cub → `<img>` cu `data:image/svg+xml;base64` + alt pe foaie. tsc 0 · jest 28 · build OK.
  - **Export Word REZOLVAT** (nu mai e caveat): `renderFiguresToPng` (în `lib/math-render.ts`, apelat în `exportDocx`) rasterizează figurile SVG → PNG înainte de turbodocx (Word nu embed-uiește SVG). Mecanism = identic cu math-to-PNG (Image→canvas→`toDataURL`, ne-tainted — dovedit live: PNG 15KB, tainted=false). PDF/HTML lasă SVG (browserul randează). tsc 0 · jest 28 · build OK.
  - **Caveat rămas (eyeball Roland):** (a) figura se inserează la 120px, **NU e redimensionabilă** pe foaie (Image nu-i configurat resizable) — de decis dacă adăugăm handles; (b) figurile NU sunt editabile (etichete/dimensiuni) = NodeView-ul parametric amânat; (c) eyeball vizual PDF/.docx real cu o figură (mecanica e dovedită, perceptualul rămâne la ochiul tău).
- **✅ #4 COMPLET + TOT DEPLOYAT LIVE (autorare V→XII + interactiv A+C+B, cache v15).** Notă: meniul Matematică e desktop-only — A/C/B apar doar pe desktop; paritatea mobilă = decizie separată.
- **De verificat de Cristina (R3, expert final):** corectitudinea matematică/notațională a formulelor noi (gate+eyeball garantează KaTeX + curățenie, NU semantica).
- **Duplicate INTENȚIONATE (revizitări per clasă — NU le „repara"):** Thales (VII+VIII), panta dreptei (VIII/IX/X), `sin²+cos²=1` (VIII+X), probabilitate (V/VIII/XII), arii pătrat/dreptunghi/triunghi (V+VI). Corecte — aceeași formulă revizitată la clase diferite.
- **Baseline non-regresie post-autorare (2026-07-27):** `tsc 0 · npx next build OK (11 rute) · jest 28/28`; `math-data.json` = un singur consumator (`EditorMathMenu.tsx`, grupare dinamică pe `f.grup`, fără whitelist). Bază curată pt interactiv A/C/B.

**Refactor unelte:** engine-ul de autorare e acum în `scratchpad/lot_engine.js` (`applyLot({CLASA,LATEX_FIX,EXPL,NEW})`); fiecare `clasa_<N>.js` doar furnizează datele. Model: `clasa_8.js`.

**URMĂTORUL: Clasa IX** (apoi X…XII), apoi interactiv A/C, apoi B (figuri).

**ȘABLON de continuare (repetabil per clasă):** script Node ca `scratchpad/clasa_v.js` — `LATEX_FIX` (curăță proza/formulele sudate rămase), `EXPL` (explicație la fiecare intrare existentă), `NEW` (formule noi din golurile ➕ ale clasei din plan); `html` regenerat din latex cu `katex.renderToString`; apoi rulează `scratchpad/gate_check.js` (trebuie PASS: KaTeX 0 fail, NO_LATEX=0, proză_în_html=0) → commit → update handoff. Înainte de fiecare clasă, dump intrările existente (`python`) ca să NU dublezi + să vezi ce proză a mai rămas (bucket-c prinde doar proza pură; multe au proză AMESTECATĂ cu `\frac`/`^`).

### DE PIPĂIT MANUAL de Roland (nu se pot automatiza)

1. **Export PDF/DOCX cu o formulă LUNGĂ** — verifică vizual că se încadrează (scriptul de fit + cap-ul de imagine sunt în cod, dar `window.print` blochează Chrome MCP; DOCX = eyeball).
2. **Mobil** — meniul Matematică rămâne desktop-only (gap cunoscut); #1/#3 nu apar pe telefon încă. De decis dacă intră paritatea mobilă.
3. **Verificare de domeniu (Cristina)** pe cele 15 latex-uri noi (corecte matematic, dar expertul confirmă).

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
