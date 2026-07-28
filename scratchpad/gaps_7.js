/**
 * Cerința 2 — Decizia 4: autorare goluri CLASA VII (prima în ordinea VII→…→XII).
 * Toate = formule STANDARD, temă dovedită de manualele VII (A1739/A1740/A1742).
 * latex validat KaTeX (lot_engine), explicatie (proză RO cu diacritice → în explicatie).
 */
require("./lot_engine").applyLot({
  CLASA: "7",
  NEW: [
    {
      grup: "Numere reale",
      nume: "Rădăcina pătrată a pătratului",
      latex: "\\sqrt{a^{2}} = |a|",
      explicatie:
        "Rădăcina pătrată a lui a² este modulul lui a, nu a: rezultatul unei rădăcini pătrate este întotdeauna nenegativ. Ex.: √((−3)²) = √9 = 3 = |−3|.",
    },
    {
      grup: "Numere reale",
      nume: "Modulul unui număr real",
      latex: "|x| = \\begin{cases} x, & x \\ge 0 \\\\ -x, & x < 0 \\end{cases}",
      explicatie:
        "Modulul (valoarea absolută) a unui număr real este distanța lui față de 0 pe axa numerelor; este mereu ≥ 0.",
    },
    {
      grup: "Numere reale",
      nume: "Puterea cu exponent întreg negativ",
      latex: "a^{-n} = \\dfrac{1}{a^{n}} \\quad (a \\ne 0)",
      explicatie:
        "O putere cu exponent negativ este egală cu inversul puterii cu exponent pozitiv. Ex.: 2⁻³ = 1/2³ = 1/8.",
    },
    {
      grup: "Ecuații și proporționalitate",
      nume: "Ecuația de forma x² = a",
      latex: "x^{2} = a \\Rightarrow x = \\pm\\sqrt{a} \\quad (a \\ge 0)",
      explicatie:
        "Pentru a ≥ 0 ecuația are două soluții opuse, ±√a; pentru a = 0 o singură soluție (0); pentru a < 0 nu are soluții reale.",
    },
    {
      grup: "Cerc",
      nume: "Tangente dintr-un punct exterior",
      latex: "TA \\cong TB",
      explicatie:
        "Cele două tangente duse dintr-un punct exterior T la un cerc sunt congruente (au lungimi egale): TA ≅ TB, unde A și B sunt punctele de tangență.",
    },
    {
      grup: "Cerc",
      nume: "Poligoane regulate înscrise (latura)",
      latex: "l_{6} = R, \\quad l_{4} = R\\sqrt{2}, \\quad l_{3} = R\\sqrt{3}",
      explicatie:
        "Latura poligonului regulat înscris într-un cerc de rază R: hexagon l₆ = R, pătrat l₄ = R√2, triunghi echilateral l₃ = R√3.",
    },
    {
      grup: "Asemănare",
      nume: "Criteriul de asemănare U.U.",
      latex:
        "\\widehat{A} \\cong \\widehat{A'},\\ \\widehat{B} \\cong \\widehat{B'} \\Rightarrow \\triangle ABC \\sim \\triangle A'B'C'",
      explicatie:
        "Criteriul unghi-unghi: dacă două triunghiuri au două perechi de unghiuri respectiv congruente, atunci triunghiurile sunt asemenea (al treilea unghi este automat congruent).",
    },
  ],
});
