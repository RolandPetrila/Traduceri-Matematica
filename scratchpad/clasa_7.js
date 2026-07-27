/** Autorare Clasa VII (#4). Rulează: node scratchpad/clasa_7.js → gate + eyeball 7. */
const { applyLot } = require("./lot_engine");

const LATEX_FIX = {
  "Mărimi direct proporționale": "y = k \\times x \\quad (k \\ne 0)",
  "Teorema înălțimii": "h^{2} = m \\times n",
  "Teorema catetei": "b^{2} = c \\times n",
  "Unghiul la centru": "m(\\angle AOB) = m(\\overset{\\frown}{AB})",
  "Unghiul înscris în cerc":
    "m(\\widehat{ABC}) = \\dfrac{1}{2}\\, m(\\overset{\\frown}{AC})",
};

const EXPL = {
  "Radicalul unui produs":
    "Radicalul unui produs de numere pozitive = produsul radicalilor. Se folosește și invers, pentru a grupa radicali la înmulțire.",
  "Radicalul unui raport":
    "Radicalul unui raport (cu numitor strict pozitiv) = raportul radicalilor. Util la raționalizarea numitorului.",
  "Scoaterea factorilor de sub radical":
    "Dacă sub radical apare un pătrat perfect ca factor (a²), el „iese” în fața radicalului ca a. Ex.: √(4·3) = √4 · √3 = 2√3.",
  "Pătratul unei sume":
    "Formulă de calcul prescurtat: pătratul primului, plus dublul produsului, plus pătratul celui de-al doilea. (a+b)² NU este a²+b².",
  "Pătratul unei diferențe":
    "La fel ca pătratul sumei, dar termenul din mijloc este negativ: (a−b)² = a² − 2ab + b².",
  "Diferența de pătrate":
    "a² − b² se descompune în produsul (a−b)(a+b). Foarte des folosită la descompuneri în factori și simplificări.",
  "Cubul unei sume":
    "Dezvoltarea lui (a+b)³: coeficienții 1, 3, 3, 1 (triunghiul lui Pascal), toți termenii cu semnul plus.",
  "Cubul unei diferențe":
    "Dezvoltarea lui (a−b)³: coeficienții 1, 3, 3, 1, cu semne alternante (+ − + −).",
  "Suma de cuburi":
    "a³ + b³ se descompune în (a+b)(a² − ab + b²). Atenție la semnul minus din paranteza a doua.",
  "Diferența de cuburi":
    "a³ − b³ se descompune în (a−b)(a² + ab + b²). Atenție la semnul plus din paranteza a doua.",
  "Ecuația de gradul I":
    "Ecuația de gradul I: treci termenul liber b în dreapta și împarți la a. Soluția: x = −b/a (a ≠ 0).",
  "Mărimi direct proporționale":
    "Două mărimi sunt direct proporționale dacă y = k·x, cu k constant (factorul de proporționalitate). Graficul este o dreaptă prin origine.",
  "Mărimi invers proporționale":
    "Două mărimi sunt invers proporționale dacă produsul lor este constant: y = k/x. Când x crește, y scade.",
  "Teorema lui Pitagora":
    "Într-un triunghi dreptunghic, pătratul ipotenuzei (c) este egal cu suma pătratelor catetelor (a și b). Se folosește pentru a afla o latură când se cunosc celelalte două.",
  "Teorema înălțimii":
    "Într-un triunghi dreptunghic, pătratul înălțimii din vârful unghiului drept este egal cu produsul proiecțiilor catetelor pe ipotenuză (m și n). Deci h este media geometrică a lui m și n.",
  "Teorema catetei":
    "Într-un triunghi dreptunghic, pătratul unei catete (b) este egal cu produsul dintre ipotenuză (c) și proiecția acelei catete pe ipotenuză (n).",
  "Aria triunghiului dreptunghic":
    "La triunghiul dreptunghic, catetele sunt bază și înălțime una pentru cealaltă, deci aria = (cateta₁ × cateta₂) : 2.",
  "Aria trapezului":
    "Aria trapezului = (baza mare B + baza mică b) × înălțimea h, împărțit la 2. Echivalent: linia mijlocie × înălțimea.",
  "Aria paralelogramului":
    "Aria paralelogramului = baza × înălțimea corespunzătoare (distanța dintre laturile paralele), nu latura oblică.",
  "Aria rombului":
    "Aria rombului = semiprodusul diagonalelor (D = diagonala mare, d = diagonala mică), deoarece diagonalele sunt perpendiculare.",
  "Aria cercului":
    "Aria discului mărginit de cerc = π·r², unde r este raza. π ≈ 3,14.",
  "Unghiul la centru":
    "Măsura unui unghi la centru (cu vârful în centrul cercului) este egală cu măsura arcului cuprins între laturile sale.",
  "Unghiul înscris în cerc":
    "Măsura unui unghi înscris (cu vârful pe cerc) este jumătate din măsura arcului cuprins între laturile sale. Consecință: unghiul înscris într-un semicerc este drept (90°).",
};

const NEW = [
  {
    grup: "Calcul algebric",
    nume: "Pătratul unui trinom",
    latex: "(a + b + c)^{2} = a^{2} + b^{2} + c^{2} + 2ab + 2bc + 2ca",
    explicatie:
      "Pătratul unei sume de trei termeni = suma pătratelor fiecărui termen, plus dublul fiecărui produs de câte doi termeni.",
  },
  {
    grup: "Calcul algebric",
    nume: "Descompunere prin factor comun",
    latex: "ab + ac = a(b + c)",
    explicatie:
      "Dacă toți termenii au un factor comun (a), acesta se dă în afara parantezei. Este primul pas la descompunerea în factori.",
  },
  {
    grup: "Asemănare",
    nume: "Teorema lui Thales",
    latex: "MN \\parallel BC \\Rightarrow \\dfrac{AM}{MB} = \\dfrac{AN}{NC}",
    explicatie:
      "O paralelă la o latură a triunghiului (MN ∥ BC) taie celelalte două laturi în segmente proporționale. Stă la baza asemănării triunghiurilor.",
  },
  {
    grup: "Asemănare",
    nume: "Triunghiuri asemenea (raport de asemănare)",
    latex: "\\dfrac{AB}{A'B'} = \\dfrac{BC}{B'C'} = \\dfrac{CA}{C'A'} = k",
    explicatie:
      "Două triunghiuri sunt asemenea dacă au unghiurile respectiv congruente și laturile proporționale. Raportul comun k se numește raport de asemănare.",
  },
  {
    grup: "Asemănare",
    nume: "Raportul ariilor triunghiurilor asemenea",
    latex: "\\dfrac{A_{1}}{A_{2}} = k^{2}",
    explicatie:
      "La două triunghiuri asemenea cu raportul de asemănare k, raportul ariilor este k² (pătratul raportului laturilor). La fel pentru orice figuri asemenea.",
  },
  {
    grup: "Radicali",
    nume: "Media geometrică",
    latex: "m_{g} = \\sqrt{a \\times b} \\quad (a, b \\ge 0)",
    explicatie:
      "Media geometrică (proporțională) a două numere pozitive este radicalul din produsul lor. Apare la teorema înălțimii: h = √(m·n).",
  },
  {
    grup: "Triunghi echilateral",
    nume: "Aria triunghiului echilateral",
    latex: "A = \\dfrac{l^{2}\\sqrt{3}}{4}",
    explicatie:
      "Aria unui triunghi echilateral de latură l. Se obține din formula generală folosind înălțimea h = l√3/2.",
  },
  {
    grup: "Triunghi echilateral",
    nume: "Înălțimea triunghiului echilateral",
    latex: "h = \\dfrac{l\\sqrt{3}}{2}",
    explicatie:
      "Înălțimea unui triunghi echilateral de latură l. Se deduce din teorema lui Pitagora într-o jumătate de triunghi.",
  },
];

applyLot({ CLASA: "7", LATEX_FIX, EXPL, NEW });
