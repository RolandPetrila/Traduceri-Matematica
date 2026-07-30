# Autorare bibliotecă matematică (#4) — pattern repetabil + unelte

Sursă de adevăr: `docs/PLAN_MASTER.md` §5 (restanțe math; taxonomia din fostul PLAN_math_curriculum e în git la `54fac8f`) și
`docs/HANDOFF_SESIUNE.md` (decizii + progres). Deciziile Roland (2026-07-27): TOATE
profilurile, exhaustiv, ~65–95 formule noi + explicații la TOATE, ordine V→XII lot cu lot,
interactiv A+C+B (B=figuri SVG, fază separată).

## STARE: ✅ AUTORARE V→XII COMPLETĂ (bibliotecă 213→276, toate cu explicație)

8 loturi (`clasa_5.js` … `clasa_12.js`), toate committed+pushed, NEDEPLOYATE. Vezi tabelul
din `docs/HANDOFF_SESIUNE.md`. Uneltele de mai jos rămân pentru referință / întreținere.

## Unelte persistente (în `scratchpad/`)

- **`lot_engine.js`** — engine-ul: `applyLot({CLASA, LATEX_FIX, EXPL, NEW, REMOVE})`.
  Aplică fix-uri de latex, adaugă explicații, adaugă/șterge intrări, regenerează `html`
  din latex (`output:"html"`), scrie DOAR dacă totul randează (throwOnError). Guard
  anti-typo pe `nume` + anti-dublură. Ordine chei canonică: grup, nume, html, latex, explicatie.
- **`clasa_<N>.js`** — datele per clasă (require `./lot_engine`). Model complet: `clasa_12.js`.
- **`eyeball.js <clasa>`** — dump latex + glifele RANDATE curat (fără MathML annotation),
  pentru verificare manuală. **OBLIGATORIU** — gate-ul NU prinde proza fără explicatie.
- **`gate_check.js`** — validează KaTeX + invarianți (NO_LATEX=0, proză_în_html=0, script fit).

## Pași per clasă/lot (pattern)

1. **Dump** intrările existente: `node scratchpad/eyeball.js <N>` — vezi ce proză amestecată
   a mai rămas + nu dubla.
2. **Copie** `clasa_12.js` → `clasa_<N>.js`; completează cele 3–4 dicționare:
   - `LATEX_FIX{nume}` — curăță proza/formulele sudate. **Proza RO cu diacritice merge în
     `explicatie`, NU în `\text{}`** (vezi capcane). Reprezentare simbolică + verbal în explicatie.
   - `EXPL{nume}` — explicație (text profesor) pt FIECARE intrare existentă.
   - `NEW[{grup,nume,latex,explicatie}]` — formule noi din golurile ➕ (plan §2).
   - `REMOVE[nume]` — opțional, pt formule mutate la altă clasă (ex. combinatorică XI→X).
3. **Aplică:** `node scratchpad/clasa_<N>.js` (scrie doar dacă render_fail=0).
4. **Gate:** `node scratchpad/gate_check.js` → **GATE: PASS**.
5. **EYEBALL (obligatoriu):** `node scratchpad/eyeball.js <N>` — citește FIECARE latex + RANDAT.
   Gate PASS ≠ gata; gate nu vede proza-ca-litere. Verifică corectitudinea matematică la sursă (R3).
6. La schimbări de COD (interactiv A/C/B): `npx tsc --noEmit` (0) + `npm test` (jest 28) + `npx next build`.
7. **Commit** `feat(#4 clasa <N>): …` + actualizează `docs/HANDOFF_SESIUNE.md` (progres + următoarea) + push.
   **Deploy grupat** (după mai multe clase), cu confirmarea Roland + bump `CACHE_VERSION`.

## Capcane R3 (dovedite empiric în această sesiune)

- **Gate ≠ corectitudine matematică.** PASS validează doar KaTeX + invarianți. Verifică la sursă;
  Cristina = expert final. (Prinse la eyeball: 2 erori matematice în XI — `\ln\frac{1+x}{x}` și asimptota oblică.)
- **Diacritice RO în `\text{}`:** NU randează curat (`ă â î` se descompun în bază+accent; `ș ț`
  se păstrează dar font-fallback). → proza cu diacritice DOAR în `explicatie` (HTML). `\text{}`
  doar pt etichete scurte FĂRĂ diacritice (`\text{compl.}`, `\text{cazuri favorabile}`).
- **`%` în latex = comentariu KaTeX** (mănâncă restul liniei) → mereu `\%`.
- **`log`/`\Sigma`/`\surd` fără `\`** randează greșit → `\log`, `\sum`, `\sqrt`.
- **`\overparen` NEsuportat** în KaTeX 0.16.11 → arc de cerc cu `\overset{\frown}{AB}`.
- **`′`/`″` raw (U+2032/2033)** → `f'`/`f''` (ASCII; altfel avertisment „No character metrics").
- **Divizibilitate = convenția RO `a \vdots b`** (⋮ = „a se divide cu b"), NU `b \mid a`.
- **Litru `\ell`** (nu `\text{l}`); **zecimale `{,}`** (`2{,}35`).
- **`.katex` inline** → măsoară cu `getBoundingClientRect`, nu `scrollWidth` (vezi math-fit.ts).

## Formule care apar INTENȚIONAT la mai multe clase (revizitări — NU „repara" ca duplicate)

Thales (VII+VIII), panta dreptei (VIII/IX/X), `sin²+cos²=1` (VIII+X), probabilitate (V/VIII/XII),
aria pătrat/dreptunghi/triunghi (V+VI). Sunt revizitări curriculare per clasă, corecte.

## Interactiv rămas (după formule)

- **A** filtrare pe domeniu în meniu · **C** constructor extins (matrice n×n, sistem n,
  ∑/∫ cu limite editabile) · **B** figuri geometrice SVG inserabile (efort mare, NodeView).
  §17: clarifică FORMA cu mock înainte de cod. Non-regresie: tsc 0 · jest 28 · next build · probă 390px+desktop.
