# AUDIT curriculum editor vs manuale oficiale — SINTEZĂ ACȚIONALĂ (2026-07-28)

Sursă: 6 subagenți (V,VI,VII,VIII,XI,XII), fiecare cu citat-dovadă din `toc_*.txt`.
Clase acoperite de manuale: V,VI,VII,VIII (curente 2022-2025) + XI,XII (2006-2007 → PREZENȚĂ nu absență).
IX, X = fără manual → NU se ating (regula mutării asimetrice).

Legendă încredere: [CERT]=2 manuale acord / duplicat identic · [PROB]=1 manual + logică · [DECIZIE]=judecată Roland.

---

## CAT. 1 — DEDUPE (duplicate exacte/interne → ștergere, ZERO risc semantic)

- **VI:** „Aria cercului" (VI l.20) — duplicat cu VII (are deja Lungimea+Aria cercului l.71-72). → REMOVE din VI.
- **VI:** „Lungimea cercului" (VI l.19) — duplicat cu VII l.71. → REMOVE din VI (dar vezi CAT.2: e temă VII, nu VI).
- **VI:** „Aria paralelogramului/rombului/trapezului" (VI) — duplicat cu VII. → REMOVE din VI.
- **VII intern:** arii patrulatere apar de DOUĂ ori în VII (l.93-95 grup + l.127-129 grup) + „Aria rombului" cu latex diferit (l.94 `d1·d2/2` vs l.129 `D·d/2`). → DE CONSOLIDAT (păstrează 1 set, notație unitară `d_1 d_2/2`).
- **VIII:** „Raport de arii k²" (VIII l.160) — byte-identic cu VII l.139. → REMOVE din VIII.

## CAT. 2 — MUTĂRI clare (ambele manuale acoperitoare acord: sursă absent + dest prezent) [CERT/PROB]

### VI → VII (manual VI NU are patrulatere/cerc-metric; manual VII le are)
- Proprietăți paralelogram (VI l.38) → VII. [CERT]
- Proprietăți romb (VI l.39) → VII. [CERT]
- Proprietăți trapez = linia mijlocie trapez (VI l.40, `l_m=(B+b)/2`) → VII. [CERT]
- Suma unghiurilor patrulater 360° (VI l.24) → VII. [PROB] (VI agent: borderline, „Aplicații în poligoane" la VI)
- Lungimea cercului (VI l.19) → deja la VII (dedupe, vezi CAT.1).

### VIII → VII (manual VIII = doar geom. spațială + inecuații/pătratice/statistică; manual VII are radicali/sisteme/asemănare)
- Raționalizarea numitorului (VIII) → VII. [CERT]
- Introducerea sub radical (VIII) → VII. [CERT]
- Sistem 2×2 (VIII l.146) → VII. [CERT] (VII: „Sisteme de două ecuații liniare")
- Linia mijlocie în triunghi (VIII) → VII. [CERT]

### VII → VIII — MARE, DECIZIE: grupul [Calcul algebric] (9 formule)
- (a±b)², a²−b², (a±b)³, a³±b³, pătratul trinomului, factor comun etc.
- VII manual: absent. VIII manual A1983 l.28 „Formule de calcul prescurtat" + l.29-31 „Descompuneri în factori". → sugerat VII→VIII.
- **[DECIZIE ROLAND]**: mutare structurală mare (golește algebra VII, umple VIII). Confirmare înainte.

## CAT. 3 — JUDECĂȚI (conflict manual vs convenția „revizitare"; le prezint, NU le aplic unilateral) [DECIZIE]

- **Probabilitate la V:** manualele V (A1254/A1259) au DOAR frecvență/statistică/media, NU probabilitate. Editor are „Probabilitatea" la V. README zice revizitare V/VIII/XII. → înlocuiesc la V cu „Frecvența" sau elimin? DECIZIE.
- **VIII trigonometrie:** definițiile sin/cos/tg/ctg + valori 30/45/60 sunt VII (2017). Editor le are la VIII. Dacă le mut la VII, la VIII rămâne `sin²+cos²=1` (revizitare) fără suport. → mut tot trig la VII sau păstrez revizit minimal la VIII? DECIZIE.
- **Modulul la V:** manualul V = numere raționale POZITIVE (fără negative → modul fără obiect). Editor „Modulul" la V; există și la VI. → REMOVE din V? [PROB]
- **Suma unghiurilor triunghi 180° la V:** geometrie V se oprește la unghiuri; e temă VI. Editor la V. → mutare V→VI (VI e acoperit). [PROB]

## CAT. 4 — GOLURI de autorat (temă în manual, LIPSĂ din editor) — latex R3 din manual

### V
- Înmulțirea fracțiilor zecimale (are +/− și ÷, nu ×). [Fracții zecimale]
- Teorema împărțirii cu rest: Î=C·c+r, 0≤r<c. [Numere]
- Procente: p% din N = pN/100. [Fracții]
### VI
- Operații cu mulțimi + cardinal reuniune: n(A∪B)=n(A)+n(B)−n(A∩B). GRUP NOU [Mulțimi].
- Inecuații în ℤ: ax+b>0. [Numere întregi]
- Probabilitate: P(A)=fav/posibile (manual VI o are: A1497 „9. Probabilități"). [Organizarea datelor]
- Unghi la centru = arc (editor doar VII). [Cerc]
- Unghi exterior triunghi = suma neadiacente. [Geometrie]
- Modulul rațional, puterea cu exp. întreg negativ a^{-n}=1/a^n, adunare/scădere pe ℚ. [Numere raționale]
### VII
- √(a²)=|a|; modulul real; x²=a ⇒ x=±√a; distanța 2 puncte; a^{-n}=1/a^n; tangente din punct exterior TA≅TB; criterii asemănare (UU); poligoane regulate înscrise l6=R, l4=R√2, l3=R√3.
### VIII
- Inecuația gr. I ax+b≥0; intervale ∪/∩; mulțime {x|P(x)}; ax²+bx+c=0 (elementar/factori, NU Δ); indicatori statistici: mediană, modul, amplitudine A=xmax−xmin (LIPSESC din tot editorul); aria/volum trunchi piramidă/con (LIPSESC); A_t piramidă/con/prismă; teorema celor 3 perpendiculare; fracții algebrice; grupare de termeni.
### XI (goluri clare, liceu)
- Semnul permutării sgn(σ)=(−1)^{inv}; dezvoltare determinant Laplace/ordin n; înmulțire matrice cu scalar; limita funcției în punct + laterale; criteriul cleștelui; rang + compatibilitate (Kronecker-Capelli); derivarea funcției inverse; puncte de inflexiune; Weierstrass; puterea matricei A^k; Stolz-Cesàro; șirul lui Rolle.
### XII (goluri clare, liceu)
- Descompunere polinom în factori ireductibili; teorema rădăcinilor raționale (p|a0,q|an); rădăcini conjugate; ecuații bipătrate; lim șiruri cu integrala (sume Riemann); FTC F'(x)=f(x); integrarea funcțiilor raționale; proprietăți integrală (liniaritate+aditivitate); axiome lege compoziție (neutru/simetric/asociativ); grup simetric Sn; subgrup + ordinul elementului.

## CAT. 5 — ÎMBUNĂTĂȚIRI notație/denumire
- VI l.55 „Proporție derivată" e de fapt proprietatea fundamentală a proporției (redenumire).
- VI l.88 „Înălțimea" are latex = aria cu înălțimea (greșit ca definiție).
- VIII funcția liniară: manualul NU impune a≠0 (include constanta) → aliniere a,b∈ℝ.
- VII „Aria cercului" → „Aria discului" (termenul din manual).
- XI grup „Sisteme liniare" doar Cramer 2×2 → generalizează x_i=Δ_i/Δ + rang.
- XII grup „Structuri algebrice" subdimensionat vs pondere (3 capitole).
- XII „Lungimea graficului" NU e în manualele M1 2007 (liceu → NU scot, doar semnalez).
