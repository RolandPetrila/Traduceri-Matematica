/**
 * Cerința 2 — Decizia 4: autorare goluri CLASA XI (liceu M1, mate-info).
 *
 * ⚠️ Manualele XI (A178 SIGMA, A196 Carminis) sunt 2006-2007 → probează PREZENȚA temei la
 * clasa XI în M1, NU apartenența la programa curentă. Toate golurile de mai jos sunt
 * DOVEDITE prezente în TOC-uri:
 *   A196 §1/§3 Permutări. Inversiuni. Semnul · §1.4 Dezvoltarea determinantului după linie/coloană ·
 *   §2.1 înmulțirea matricei cu scalari · §2.4 Puterea unei matrice · §3.3 Rangul + §3.4 compatibilitate ·
 *   §8.4 Criteriul cleștelui · §9 Weierstrass · §11.5 Stolz-Cesàro · §13 Limite laterale ·
 *   §4.4 Derivarea funcției inverse · §7.4 Șirul lui Rolle · inflexiune (p.296). A178: idem.
 * CAT.5: grupul „Sisteme liniare" avea doar Cramer 2×2 → generalizez xᵢ=Δᵢ/Δ + Kronecker-Capelli.
 */
const { applyLot } = require("./lot_engine");

applyLot({
  CLASA: "11",
  NEW: [
    {
      grup: "Permutări",
      nume: "Semnul unei permutări",
      latex: "\\varepsilon(\\sigma) = (-1)^{\\operatorname{inv}(\\sigma)}",
      explicatie:
        "Semnul (signatura) unei permutări σ = (−1) la puterea numărului de inversiuni. Permutare pară → semn +1; permutare impară → semn −1.",
    },
    {
      grup: "Algebră liniară",
      nume: "Dezvoltarea determinantului (Laplace)",
      latex: "\\det A = \\sum_{j=1}^{n} (-1)^{i+j}\\, a_{ij}\\, M_{ij}",
      explicatie:
        "Dezvoltarea determinantului după linia i: se adună produsele elementelor a_ij cu complemenții lor algebrici (−1)^(i+j)·M_ij, unde M_ij (minorul) = determinantul obținut ștergând linia i și coloana j.",
    },
    {
      grup: "Algebră liniară",
      nume: "Înmulțirea unei matrice cu scalar",
      latex: "\\lambda \\cdot A = (\\lambda\\, a_{ij})_{i,j}",
      explicatie:
        "La înmulțirea unei matrice cu un scalar λ, fiecare element al matricei se înmulțește cu λ.",
    },
    {
      grup: "Algebră liniară",
      nume: "Puterea unei matrice",
      latex: "A^{k} = \\underbrace{A \\cdot A \\cdots A}_{k \\text{ ori}}",
      explicatie:
        "Puterea a k-a a unei matrice pătratice A = produsul lui A cu ea însăși de k ori (k ≥ 1); prin convenție A⁰ = Iₙ (matricea unitate).",
    },
    {
      grup: "Sisteme liniare",
      nume: "Teorema Kronecker-Capelli",
      latex: "\\operatorname{rang}(A) = \\operatorname{rang}(\\bar{A})",
      explicatie:
        "Un sistem liniar este compatibil (are cel puțin o soluție) dacă și numai dacă rangul matricei sistemului (A) este egal cu rangul matricei extinse (Ā, cu coloana termenilor liberi).",
    },
    {
      grup: "Sisteme liniare",
      nume: "Regula lui Cramer (sistem n×n)",
      latex: "x_i = \\dfrac{\\Delta_i}{\\Delta} \\quad (\\Delta \\ne 0)",
      explicatie:
        "Pentru un sistem Cramer (determinantul Δ al matricei ≠ 0), necunoscuta xᵢ = Δᵢ/Δ, unde Δᵢ este determinantul obținut înlocuind coloana i cu coloana termenilor liberi.",
    },
    {
      grup: "Limite",
      nume: "Limita unei funcții într-un punct (laterale)",
      latex:
        "\\lim_{x \\to a} f(x) = \\ell \\Leftrightarrow \\lim_{x \\to a^{-}} f(x) = \\lim_{x \\to a^{+}} f(x) = \\ell",
      explicatie:
        "Limita unei funcții într-un punct a există și este ℓ dacă și numai dacă limitele laterale (la stânga, x→a⁻, și la dreapta, x→a⁺) există și sunt egale cu ℓ.",
    },
    {
      grup: "Limite",
      nume: "Criteriul cleștelui",
      latex:
        "f \\le g \\le h,\\ \\ \\lim_{x\\to a} f = \\lim_{x\\to a} h = \\ell \\ \\Rightarrow\\ \\lim_{x\\to a} g = \\ell",
      explicatie:
        "Dacă o funcție g este «prinsă» între f și h (f ≤ g ≤ h) în jurul lui a, iar f și h au aceeași limită ℓ în a, atunci și g are limita ℓ.",
    },
    {
      grup: "Limite",
      nume: "Teorema lui Weierstrass (șiruri)",
      latex:
        "(a_n) \\nearrow,\\ \\ a_n \\le M \\ \\Rightarrow\\ \\exists\\, \\lim_{n \\to \\infty} a_n",
      explicatie:
        "Orice șir monoton și mărginit este convergent: un șir crescător și mărginit superior (sau descrescător și mărginit inferior) are limită finită.",
    },
    {
      grup: "Limite",
      nume: "Lema Stolz-Cesàro",
      latex:
        "\\lim_{n\\to\\infty} \\dfrac{a_n}{b_n} = \\lim_{n\\to\\infty} \\dfrac{a_{n+1} - a_n}{b_{n+1} - b_n}",
      explicatie:
        "Pentru cazul ∞/∞ (cu (b_n) strict crescător și nemărginit), limita raportului a_n/b_n este egală cu limita raportului diferențelor consecutive, dacă aceasta din urmă există.",
    },
    {
      grup: "Derivate",
      nume: "Derivata funcției inverse",
      latex: "(f^{-1})'(y_0) = \\dfrac{1}{f'(x_0)}, \\quad y_0 = f(x_0)",
      explicatie:
        "Derivata funcției inverse în punctul y₀ = inversul derivatei lui f în x₀ (unde y₀ = f(x₀) și f'(x₀) ≠ 0).",
    },
    {
      grup: "Derivate — aplicații",
      nume: "Puncte de inflexiune",
      latex: "f''(x_0) = 0",
      explicatie:
        "Într-un punct de inflexiune x₀, derivata a doua se anulează (f''(x₀)=0) și își schimbă semnul; graficul își schimbă concavitatea (din convex în concav sau invers).",
    },
    {
      grup: "Derivate — aplicații",
      nume: "Șirul lui Rolle",
      latex:
        "f(x_i) \\cdot f(x_{i+1}) < 0 \\ \\Rightarrow\\ \\exists!\\, c \\in (x_i, x_{i+1}),\\ f(c) = 0",
      explicatie:
        "Metodă de separare a rădăcinilor ecuației f(x)=0: între două rădăcini consecutive x_i, x_{i+1} ale derivatei f', dacă f(x_i)·f(x_{i+1}) < 0, există exact o rădăcină a lui f în interval.",
    },
  ],
});
