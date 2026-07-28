/**
 * Cerința 2 — Decizia 4: autorare goluri CLASA XII (liceu M1) — ULTIMUL lot.
 *
 * ⚠️ Manualele XII (A197 Carminis, A264 SIGMA) sunt 2006-2007 → PREZENȚA temei în M1.
 * Goluri DOVEDITE în TOC: A197 §5/§5.4 Descompunerea polinoamelor în factori ireductibili ·
 *   §5.3 Ecuații algebrice (rădăcini raționale/conjugate) · §8.1 Ecuații bipătrate ·
 *   §2 Sume Riemann · §6 Proprietăți ale integralei definite · §9 Integrale funcții raționale ·
 *   §1.4 Parte stabilă. Lege de compoziție · §3.4 Grupul simetric Sₙ · §6 Subgrupuri ·
 *   §7.2 Ordinul unui element. A264: Subgrup. Ordinul unui element; Existența primitivelor (p.148).
 *
 * DEDUP (advisor — verificat la sursă în math-data.json):
 *   - „FTC" NU e re-listare a XII[0] „Primitivă — definiție" (F'=f) → forma distinctă G(x)=∫ₐˣ ⇒ G'=f.
 *   - „Axiome lege compoziție" NU e re-listare a XII[14] „Grup" (deja enumeră asociativ/neutru/simetric)
 *     → conceptul distinct de PARTE STABILĂ (închidere), care precede axiomele grupului.
 * R3 convenția RO: divizibilitate `a \vdots b` = „a se divide cu b" → rădăcini raționale: a₀⋮p, aₙ⋮q.
 */
const { applyLot } = require("./lot_engine");

applyLot({
  CLASA: "12",
  NEW: [
    {
      grup: "Polinoame",
      nume: "Descompunerea în factori ireductibili",
      latex: "P(X) = a_n (X - x_1)(X - x_2) \\cdots (X - x_n)",
      explicatie:
        "Peste ℂ, orice polinom de grad n se descompune complet în n factori liniari (rădăcinile x₁,…,xₙ). Peste ℝ, factorii ireductibili au gradul 1 sau 2 (perechile de rădăcini complexe conjugate dau un factor de gradul 2).",
    },
    {
      grup: "Polinoame",
      nume: "Teorema rădăcinilor raționale",
      latex: "a_0 \\vdots p, \\quad a_n \\vdots q",
      explicatie:
        "Dacă fracția ireductibilă p/q este rădăcină a unui polinom cu coeficienți întregi aₙXⁿ+…+a₀, atunci p divide termenul liber (a₀ ⋮ p) și q divide coeficientul dominant (aₙ ⋮ q).",
    },
    {
      grup: "Polinoame",
      nume: "Rădăcini conjugate",
      latex: "P(z) = 0 \\Rightarrow P(\\bar{z}) = 0",
      explicatie:
        "Un polinom cu coeficienți reali care are rădăcina complexă z=a+bi are și rădăcina conjugată z̄=a−bi (rădăcinile complexe apar în perechi). Analog, la coeficienți raționali, rădăcinile a+b√d apar cu conjugata a−b√d.",
    },
    {
      grup: "Polinoame",
      nume: "Ecuație bipătrată",
      latex:
        "ax^{4} + bx^{2} + c = 0 \\ \\xrightarrow{\\,t = x^{2}\\,}\\ at^{2} + bt + c = 0",
      explicatie:
        "Ecuația bipătrată se rezolvă cu substituția t=x² (t≥0), devenind o ecuație de gradul II în t; apoi x=±√t pentru fiecare soluție t nenegativă.",
    },
    {
      grup: "Integrala definită",
      nume: "Suma Riemann (integrala ca limită)",
      latex:
        "\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty} \\sum_{i=1}^{n} f(\\xi_i)\\,\\Delta x_i",
      explicatie:
        "Integrala definită = limita sumelor Riemann când norma diviziunii tinde la 0: aria de sub grafic se aproximează cu dreptunghiuri de arie f(ξᵢ)·Δxᵢ.",
    },
    {
      grup: "Integrala definită",
      nume: "Teorema fundamentală a calculului integral",
      latex: "G(x) = \\int_{a}^{x} f(t)\\,dt \\ \\Rightarrow\\ G'(x) = f(x)",
      explicatie:
        "Dacă f este continuă, funcția G(x)=∫ₐˣf(t)dt (integrala cu limită superioară variabilă) este o primitivă a lui f: derivata ei este chiar f(x). Aceasta garantează existența primitivelor funcțiilor continue.",
    },
    {
      grup: "Integrala definită",
      nume: "Proprietățile integralei definite",
      latex:
        "\\int_a^b (\\alpha f + \\beta g)\\,dx = \\alpha\\!\\int_a^b\\! f\\,dx + \\beta\\!\\int_a^b\\! g\\,dx",
      explicatie:
        "Liniaritate: constantele ies în față, iar integrala sumei = suma integralelor. Aditivitate în raport cu intervalul: ∫ₐᵇ f = ∫ₐᶜ f + ∫꜀ᵇ f, pentru orice c între a și b.",
    },
    {
      grup: "Primitive",
      nume: "Integrarea funcțiilor raționale simple",
      latex: "\\int \\dfrac{dx}{x - a} = \\ln|x - a| + C",
      explicatie:
        "Funcțiile raționale se integrează prin descompunere în fracții simple; fracția de bază este ∫1/(x−a)dx = ln|x−a|+C. Fracțiile de tipul 1/(x−a)ⁿ și cele cu numitor de gradul II se tratează separat.",
    },
    {
      grup: "Structuri algebrice",
      nume: "Lege de compoziție internă (parte stabilă)",
      latex: "\\forall\\, x, y \\in H:\\ x \\ast y \\in H",
      explicatie:
        "O submulțime H este parte stabilă în raport cu legea ∗ dacă rezultatul operației dintre oricare două elemente din H rămâne în H (∗ este lege de compoziție internă pe H). Este prima condiție dintr-o structură algebrică.",
    },
    {
      grup: "Structuri algebrice",
      nume: "Grupul simetric Sₙ",
      latex: "|S_n| = n!",
      explicatie:
        "Grupul simetric Sₙ = mulțimea tuturor permutărilor unei mulțimi cu n elemente, împreună cu compunerea. Are n! elemente și este necomutativ pentru n ≥ 3.",
    },
    {
      grup: "Structuri algebrice",
      nume: "Subgrup",
      latex:
        "H \\le G \\Leftrightarrow \\forall\\, x, y \\in H:\\ x \\ast y^{-1} \\in H",
      explicatie:
        "O submulțime nevidă H a grupului (G,∗) este subgrup dacă, împreună cu ∗, formează la rândul ei grup. Criteriu practic de verificare: pentru orice x, y din H, x∗y⁻¹ aparține lui H.",
    },
    {
      grup: "Structuri algebrice",
      nume: "Ordinul unui element într-un grup",
      latex:
        "\\operatorname{ord}(a) = \\min\\{\\, n \\in \\mathbb{N}^{*} \\mid a^{n} = e \\,\\}",
      explicatie:
        "Ordinul unui element a = cel mai mic număr natural nenul n pentru care aⁿ = e (elementul neutru). Dacă un asemenea n nu există, elementul are ordin infinit.",
    },
  ],
});
