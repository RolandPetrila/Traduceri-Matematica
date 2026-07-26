# Autorare bibliotecă matematică (#4) — pattern repetabil V→XII

Sursă de adevăr: `docs/PLAN_math_curriculum_2026-07-27.md` (taxonomie + goluri per clasă) și
`docs/HANDOFF_SESIUNE.md` (decizii + progres). Deciziile Roland (2026-07-27): TOATE
profilurile, exhaustiv, ~65–95 formule noi + explicații la TOATE, ordine V→XII lot cu lot,
interactiv A+C+B (B=figuri SVG, fază separată).

## Pași per clasă (ex. făcut pentru V în `feat(#4 clasa V)` — commit 56afebd)

1. **Dump** intrările existente ale clasei (nu dubla + vezi ce proză a mai rămas):

   ```
   python -c "import json;d=json.load(open('frontend/src/components/editor/math-data.json',encoding='utf-8'));[print(x['grup'],'::',x['nume'],'::',x.get('latex','')[:60]) for x in d['formule']['<CLASA>']]"
   ```

   Bucket-c (proză pură) a fost curățat la #3, DAR multe intrări au proză AMESTECATĂ cu
   `\frac`/`^`/`\cdot` (ex. „|a| = a, dacă a≥0 · …") — de curățat la clasa lor.

2. **Script Node per clasă** (model: cel folosit pt V) cu trei dicționare:
   - `LATEX_FIX{nume: latex}` — curăță proza/formulele sudate rămase (folosește
     `\begin{cases}` pt ramuri, exemplu numeric pt proceduri).
   - `EXPL{nume: explicatie}` — explicație (text profesor) pt FIECARE intrare existentă.
   - `NEW[{grup,nume,latex,explicatie}]` — formulele noi din golurile ➕ ale clasei (plan §2).
     Pt fiecare atins: `html = katex.renderToString(latex, {throwOnError:false,output:"html"})`
     (fallback curat — invariant NO_LATEX=0, fără proză în html).

3. **Gate:** `node scratchpad/gate_check.js` → trebuie **GATE: PASS**
   (KaTeX 0 fail, NO_LATEX=0, proză_în_html=0, script fit parsează).

4. `tsc` nu e necesar pt schimbări doar de date; dar la interactiv (A/C/B) rulează
   `npx tsc --noEmit` + `npm test` (jest, 28) + `npx next build`.

5. **Commit** (`feat(#4 clasa <N>): …`) + **update handoff** (progres + următoarea clasă)
   - push. **Deploy grupat** (după mai multe clase), cu confirmarea Roland + bump `CACHE_VERSION`.

## Capcane (R3)

- **Gate ≠ corectitudine matematică.** PASS validează doar KaTeX + invarianți, NU că formula
  e corectă sau că simbolul are sensul potrivit. Verifică fiecare la sursă; Cristina = expert final.
- **Divizibilitate:** convenția RO e `a \vdots b` (⋮ = „a se divide cu b"), NU internaționala
  `b \mid a`. Recurs în V/VI/VII/XII — păstrează convenția RO (de confirmat cu Cristina glif).
- **Litru:** `\ell` (ℓ), nu `\text{l}` (se confundă cu 1).
- **Zecimale RO:** virgulă cu `{,}` (ex. `2{,}35`).
- `.katex` e inline → măsoară cu `getBoundingClientRect`, nu `scrollWidth` (vezi math-fit.ts).

## Interactiv rămas (după formule)

- **A** filtrare pe domeniu în meniu · **C** constructor extins (matrice n×n, sistem n,
  ∑/∫ cu limite editabile) · **B** figuri geometrice SVG inserabile (efort mare).
