# RAPORT AUDIT — editor matematic vs manuale oficiale (2026-07-28)

Metodă: 6 subagenți (V, VI, VII, VIII, XI, XII), fiecare a comparat `math-data.json` cu cuprinsurile
manualelor oficiale ale clasei sale (`scratchpad/toc_*.txt`), cu **citat-dovadă** pt fiecare afirmație.
Reguli: R3 (la conflict câștigă manualul), regula mutării asimetrice (nu mut în IX/X — n-au manual),
duplicate intenționate neatinse. Vezi `INDEX.md` pt inventarul manualelor.

---

## 🔴 DESCOPERIREA CENTRALĂ — un OFFSET SISTEMATIC, nu 30 de erori izolate

Cei 6 auditori au convers, independent, pe **o singură cauză**: **granițele de clasă la gimnaziu au
fost construite pe programa PRE-2017.** Programa OMEN 3393/2017 a mutat teme între clase, iar editorul
nu reflectă mutarea:

| Temă                                                                                                                  | Editor (acum) | Manual oficial 2017 | Dovadă                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Calcul prescurtat** ((a±b)², a²−b², cuburi…)                                                                        | VII           | **VIII**            | manualele VII n-au „calcul algebric"; A1983 (VIII) l.28 „Formule de calcul prescurtat" + l.29 „Descompuneri în factori"        |
| **Radicali** (raționalizare, introducere sub radical), **sisteme 2×2**, **trigonometrie** de bază, **linia mijlocie** | VIII          | **VII**             | A1983 (VIII) = doar geom. spațială + inecuații/pătratice/statistică; manualele VII au radicali/sisteme/asemănare/trigonometrie |
| **Patrulatere** (proprietăți paralelogram/romb/trapez), **cerc metric** (lungime/arie)                                | VI            | **VII**             | manualele VI n-au capitol patrulatere/cerc-metric; manualele VII le au (unitatea „Patrulaterul" + „Cercul")                    |

**Consecință:** aceste ~20 de formule nu sunt greșeli independente, ci **o realiniere coerentă**.
De aplicat ca UN TOT (VI→VII + VIII→VII + VII→VIII) sau deloc — jumătate ar lăsa biblioteca mai
incoerentă decât acum. **Blochează pe confirmarea ta** (Decizia 1).

> Liceu (XI, XII): axa „clasă greșită" = **curată** (0 misplasări) — corect, manualele confirmă că
> tot ce e la XI/XII aparține acolo. La liceu doar goluri + confirmări.

---

## ✅ APLICAT DEJA (neambiguu, independent de decizii; gate PASS, NEDEPLOYAT)

1. **VIII — șters duplicatul** „Raport de arii pt. triunghiuri asemenea" (`A₁/A₂=k²`): byte-identic cu
   VII „Raportul ariilor triunghiurilor asemenea"; asemănarea e temă VII (ambele manuale) → VII
   păstrează copia, VIII pierdea doar dublura. (VIII 35→34)
2. **VI — redenumit** „Proporție derivată" → **„Proprietatea fundamentală a proporției"**: latexul
   (`a/b=c/d ⇒ ad=bc`) ESTE proprietatea fundamentală; numele era greșit (manualele VI le tratează ca
   lecții distincte — A1497 „2. Proprietatea fundamentală" vs „3. Proporții derivate").

Bibliotecă 276 → **275**. Gate: 275/275 KaTeX, NO_LATEX=0, proză_în_html=0.

---

## 🟡 4 DECIZII PENTRU TINE (Roland) — cu recomandarea mea

### Decizia 1 — Realinierea gimnazială VI↔VII↔VIII (offset pre-2017). **DA/NU** (un tot)

~20 formule. Recomand: **DA** (manualele curente sunt clare, e o singură corecție coerentă). Detaliu:

- **VI→VII:** Proprietăți paralelogram, Proprietăți romb, Proprietăți trapez (=linia mijlocie trapez), Suma unghiurilor patrulaterului (360°), Lungimea cercului. (+ Aria cercului/paralelogram/romb/trapez la VI = duplicate cu VII → ștergere din VI.)
- **VIII→VII:** Raționalizarea numitorului, Introducerea sub radical, Sistem 2×2, Linia mijlocie în triunghi.
- **VII→VIII:** grupul **[Calcul algebric]** (9 formule) — golește algebra VII, umple algebra VIII (unde manualul o cere).

### Decizia 2 — „Probabilitate" la clasa V. **PĂSTREZ / MUT / ELIMIN**

Manualele V (A1254, A1259) au la organizarea datelor **DOAR frecvență/statistică/media**, NU probabilitate
(răspuns direct la întrebarea ta țintă). Convenția ta anterioară zicea „revizitare V/VIII/XII".
Recomand (R3, manualul câștigă): **înlocuiesc la V „Probabilitatea" cu „Frecvența"** (`f_r=n_i/N`) și
las probabilitatea la VIII+XII. (Manualele VI o AU la VI → o adaug și acolo — vezi goluri.)

### Decizia 3 — Trigonometria la VIII. **MUT TOT LA VII / PĂSTREZ REVIZIT MINIM LA VIII**

Definițiile sin/cos/tg/ctg + valorile 30/45/60 sunt temă VII (2017). Dacă le mut la VII, la VIII rămâne
`sin²+cos²=1` (revizitare) fără definițiile-suport. Recomand: **mut definițiile+valorile la VII**, iar
la VIII păstrez `sin²+cos²=1` + `tg=sin/cos` ca revizitare (ancorate de duplicatul intenționat).

### Decizia 4 — Autorarea golurilor: SCOP + ORDINE (sesiune separată)

Auditul a găsit **~40 de teme din manuale lipsă din editor** (listă completă mai jos). Fiecare cere
`latex` verificat **la corpul manualului** (nu doar la cuprins) + `explicatie` (R3 — nu iau latexul
propus de subagenți pe încredere). E o **sesiune separată** (autorare per clasă, lot cu lot, gate+eyeball).
Recomand ordinea: **VII → VIII → VI → V → XI → XII** (întâi unde e și realinierea). Confirmi lista/ordinea?

---

## 📋 GOLURI de autorat (temă în manual, LIPSĂ din editor) — cu dovadă, `latex` DE VERIFICAT la sursă

**V:** înmulțirea fracțiilor zecimale (are +/−/÷, nu ×); teorema împărțirii cu rest (Î=C·c+r, 0≤r<c);
p% dintr-un număr (=pN/100). _(+ opționale: fracție zecimală periodică→ordinară, baza 2, unghiuri grade/minute)_

**VI:** operații cu mulțimi + `n(A∪B)=n(A)+n(B)−n(A∩B)` (grup nou [Mulțimi] — LIPSEȘTE complet);
inecuații în ℤ; probabilitate `P(A)=fav/pos` (manual VI o are); unghi la centru; unghi exterior triunghi;
modulul rațional; putere cu exponent întreg negativ `a^{-n}=1/aⁿ`; adunare/scădere pe ℚ; inegalitatea
triunghiului; poziții relative dreaptă–cerc/două cercuri.

**VII:** `√(a²)=|a|`; modulul real; `x²=a ⇒ x=±√a`; distanța dintre 2 puncte; `a^{-n}=1/aⁿ`; tangente
dintr-un punct exterior (TA≅TB); criterii de asemănare (UU); poligoane regulate înscrise (l₆=R, l₄=R√2, l₃=R√3).

**VIII:** inecuația gr. I `ax+b≥0`; intervale (∪/∩, notație); mulțime `{x|P(x)}`; ecuația `ax²+bx+c=0`
(elementar, NU cu Δ — Δ e IX); **indicatori statistici: mediana, modul, amplitudinea** `A=x_max−x_min`
(LIPSESC din tot editorul); **trunchi de piramidă/con** (arii+volume — LIPSESC complet); A_total
piramidă/con/prismă; **teorema celor 3 perpendiculare**; fracții algebrice; grupare de termeni.

**XI (liceu — goluri clare):** semnul permutării `sgn(σ)=(−1)ⁱⁿᵛ`; dezvoltarea determinantului (Laplace)/ordin n;
înmulțirea matricei cu scalar; limita funcției în punct + laterale; criteriul cleștelui; rang + compatibilitate
(Kronecker-Capelli); derivarea funcției inverse; puncte de inflexiune; Weierstrass (șir monoton+mărginit⇒convergent);
puterea matricei Aᵏ; Stolz-Cesàro; șirul lui Rolle.

**XII (liceu — goluri clare):** descompunerea polinomului în factori ireductibili; teorema rădăcinilor raționale
(p|a₀, q|aₙ); rădăcini conjugate; ecuații bipătrate; limite de șiruri cu integrala (sume Riemann);
FTC (F'(x)=f(x)); integrarea funcțiilor raționale; proprietăți integrală (liniaritate+aditivitate);
axiomele legii de compoziție (neutru/simetric/asociativ); grupul simetric Sₙ; subgrup + ordinul elementului.

---

## 🔧 ÎMBUNĂTĂȚIRI notație/denumire (mici, aplic la confirmarea Deciziei 1)

- **VI „Înălțimea"** (linii importante) are `latex = A=a·hₐ/2` (aria!), greșit ca definiție a înălțimii → de refăcut (`hₐ⊥` latura opusă).
- **VIII funcția liniară** `(a≠0)`: manualul nu impune a≠0 (include constanta). _Nuanță: „funcția de gradul I" chiar cere a≠0 — de decis dacă e „de gradul I" (păstrez) sau „f(x)=ax+b" general (a,b∈ℝ)._ → semnalat, nu aplicat.
- **VII „Aria cercului"** → termenul din manual e „Aria discului".
- **XI** grup „Sisteme liniare" doar Cramer 2×2 → generalizează `xᵢ=Δᵢ/Δ` + rang.
- **XII** grup „Structuri algebrice" subdimensionat vs ponderea algebrei (3 capitole în manuale).
- **XII „Lungimea graficului"** nu apare în manualele M1 2007 — liceu → NU scot, doar semnalez.

---

## ✅ CONFIRMĂRI (ce e DEJA corect) — pe scurt

- **V:** puteri, fracții ordinare+zecimale (operații), divizibilitate, unități de măsură, geometrie de bază — corecte.
- **VI:** rapoarte/proporții, procente, regula de trei, numere întregi (modul), unghiuri, linii importante triunghi, congruență, ecuația gr. I — corecte.
- **VII:** radicali (parțial), Pitagora + teorema înălțimii/catetei, cerc (unghi înscris), Thales + asemănare, triunghi echilateral — corecte.
- **VIII:** corpuri geometrice (arii+volume — blocul central, foarte bine), funcția liniară, intervale/modul — corecte.
- **XI:** matrice, determinanți (ord. 2/3), Cramer, limite (e, l'Hôpital), derivate + aplicații (Fermat/Rolle/Lagrange), asimptote — **acoperire 1:1 cu manualul, 0 misplasări.**
- **XII:** primitive, metode de integrare, Leibniz-Newton, arii/volume de rotație, grup/inel/corp/morfism, polinoame (Horner/Bézout/Viète) — corecte, 0 misplasări.
