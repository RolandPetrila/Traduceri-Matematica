/** Autorare Clasa X (#4). node scratchpad/clasa_10.js → gate + eyeball 10. */
const { applyLot } = require("./lot_engine");

const LATEX_FIX = {
  "Forma algebrică": "z = a + bi, \\quad i^{2} = -1",
  Conjugatul: "\\bar{z} = a - bi",
  "Funcția logaritmică":
    "f(x) = \\log_{a} x \\quad (a > 0,\\, a \\ne 1,\\, x > 0)",
  "Logaritmul unui produs":
    "\\log_{a}(x \\times y) = \\log_{a} x + \\log_{a} y \\quad (x, y > 0)",
  "Logaritmul unui raport":
    "\\log_{a}\\dfrac{x}{y} = \\log_{a} x - \\log_{a} y \\quad (x, y > 0)",
  "Logaritmul unei puteri":
    "\\log_{a}(x^{n}) = n \\log_{a} x \\quad (x > 0,\\, a > 0,\\, a \\ne 1)",
  "Schimbarea bazei":
    "\\log_{a} b = \\dfrac{\\log_{c} b}{\\log_{c} a} \\quad (a, b, c > 0,\\; a, c \\ne 1)",
  "Panta unei drepte":
    "m = \\dfrac{y_{2} - y_{1}}{x_{2} - x_{1}} \\quad (x_{1} \\ne x_{2})",
  "Condiția de paralelism":
    "d_{1} \\parallel d_{2} \\Leftrightarrow m_{1} = m_{2}",
  "Condiția de perpendicularitate":
    "d_{1} \\perp d_{2} \\Leftrightarrow m_{1} \\times m_{2} = -1",
  "Formule de adunare":
    "\\sin(a \\pm b) = \\sin a \\cos b \\pm \\cos a \\sin b, \\quad \\cos(a \\pm b) = \\cos a \\cos b \\mp \\sin a \\sin b",
  "Formule de dublare":
    "\\sin 2x = 2 \\sin x \\cos x, \\quad \\cos 2x = \\cos^{2}x - \\sin^{2}x",
  "Formule de înjumătățire":
    "\\sin\\dfrac{x}{2} = \\pm\\sqrt{\\dfrac{1 - \\cos x}{2}}, \\quad \\cos\\dfrac{x}{2} = \\pm\\sqrt{\\dfrac{1 + \\cos x}{2}}",
  "Ecuație logaritmică de bază":
    "\\log_{a} x = \\log_{a} y \\Rightarrow x = y \\quad (a > 0,\\, a \\ne 1,\\, x, y > 0)",
  "Ecuația sin x = a":
    "\\sin x = a \\Rightarrow x = (-1)^{k}\\arcsin a + k\\pi, \\; k \\in \\mathbb{Z} \\quad (-1 \\le a \\le 1)",
  "Ecuația cos x = a":
    "\\cos x = a \\Rightarrow x = \\pm\\arccos a + 2k\\pi, \\; k \\in \\mathbb{Z} \\quad (-1 \\le a \\le 1)",
  "Ecuația tg x = a":
    "\\operatorname{tg} x = a \\Rightarrow x = \\operatorname{arctg} a + k\\pi, \\; k \\in \\mathbb{Z}",
  "Inecuație exponențială":
    "a^{x} > a^{y} \\Leftrightarrow \\begin{cases} x > y, & a > 1 \\\\ x < y, & 0 < a < 1 \\end{cases}",
  "Inecuație logaritmică":
    "\\log_{a} x > \\log_{a} y \\Leftrightarrow \\begin{cases} x > y, & a > 1 \\\\ x < y, & 0 < a < 1 \\end{cases} \\quad (x, y > 0)",
};

const EXPL = {
  "Forma algebrică":
    "Un număr complex se scrie z = a + bi, cu a = partea reală, b = partea imaginară și i unitatea imaginară (i² = −1).",
  "Modulul unui număr complex":
    "Modulul lui z = a + bi este distanța de la origine la punctul (a, b) în planul complex: |z| = √(a² + b²).",
  Conjugatul:
    "Conjugatul lui z = a + bi este z̄ = a − bi (se schimbă semnul părții imaginare). Proprietate: z · z̄ = |z|².",
  "Forma trigonometrică":
    "Orice număr complex se scrie z = r(cos θ + i sin θ), unde r = |z| (modulul) și θ = argumentul (unghiul față de axa reală).",
  "Formula lui Moivre":
    "Ridicarea la putere în formă trigonometrică: modulul se ridică la putere (rⁿ), iar argumentul se înmulțește cu n. Utilă la calculul puterilor mari.",
  "Funcția exponențială":
    "Funcția f(x) = aˣ (a > 0, a ≠ 1) este definită pe ℝ cu valori pozitive. Crescătoare dacă a > 1, descrescătoare dacă 0 < a < 1.",
  "Funcția logaritmică":
    "Funcția logaritmică f(x) = logₐx este inversa funcției exponențiale. Definită doar pentru x > 0.",
  "Logaritmul unui produs":
    "Logaritmul unui produs = suma logaritmilor factorilor. Transformă înmulțirea în adunare.",
  "Logaritmul unui raport":
    "Logaritmul unui raport = diferența logaritmilor. Transformă împărțirea în scădere.",
  "Logaritmul unei puteri":
    "Logaritmul unei puteri = exponentul înmulțit cu logaritmul bazei puterii. Coboară exponentul.",
  "Schimbarea bazei":
    "Permite trecerea de la baza a la o bază c (de obicei 10 sau e). Util pentru calcul cu calculatorul.",
  "Ecuația generală a dreptei":
    "Orice dreaptă din plan are o ecuație de forma ax + by + c = 0 (cu a, b nu ambii nuli). Vectorul (a, b) este normal (perpendicular) pe dreaptă.",
  "Panta unei drepte":
    "Panta (coeficientul unghiular) = raportul dintre variația lui y și variația lui x între două puncte ale dreptei.",
  "Condiția de paralelism":
    "Două drepte neverticale sunt paralele dacă și numai dacă au aceeași pantă.",
  "Condiția de perpendicularitate":
    "Două drepte neverticale sunt perpendiculare dacă și numai dacă produsul pantelor lor este −1.",
  "Relația fundamentală":
    "Pentru orice x, sin²x + cos²x = 1. Rezultă din teorema lui Pitagora pe cercul trigonometric.",
  "Formule de adunare":
    "Exprimă sinusul și cosinusul unei sume/diferențe de unghiuri prin funcțiile trigonometrice ale unghiurilor componente. Atenție la semnul din dreapta la cos (± devine ∓).",
  "Formule de dublare":
    "Cazuri particulare ale formulelor de adunare pentru a = b = x. cos 2x are și formele 2cos²x − 1 și 1 − 2sin²x.",
  "Tangenta sumei":
    "Formula tangentei unei sume/diferențe de unghiuri, exprimată prin tangentele componentelor.",
  "Formule de înjumătățire":
    "Exprimă funcțiile trigonometrice ale jumătății unui unghi prin cosinusul unghiului întreg. Semnul (±) se alege după cadranul lui x/2.",
  "Ecuație exponențială de bază":
    "Dacă bazele sunt egale (și diferite de 1), egalitatea puterilor implică egalitatea exponenților. Metodă de bază la ecuații exponențiale.",
  "Ecuație logaritmică de bază":
    "Dacă logaritmii în aceeași bază sunt egali, atunci și argumentele sunt egale (funcția log fiind injectivă). Nu uita condițiile de existență (x, y > 0).",
  "Ecuația sin x = a":
    "Ecuația sin x = a are soluții doar dacă −1 ≤ a ≤ 1. Soluția generală conține un parametru întreg k (periodicitate 2π).",
  "Ecuația cos x = a":
    "Ecuația cos x = a are soluții doar dacă −1 ≤ a ≤ 1. Soluțiile sunt simetrice (±arccos a), cu perioada 2π.",
  "Ecuația tg x = a":
    "Ecuația tg x = a are soluții pentru orice a real. Perioada tangentei este π (nu 2π).",
  "Inecuație exponențială":
    "Sensul inegalității se păstrează dacă baza a > 1 (funcție crescătoare) și se inversează dacă 0 < a < 1 (funcție descrescătoare).",
  "Inecuație logaritmică":
    "La fel ca la exponențiale: sensul se păstrează pentru a > 1 și se inversează pentru 0 < a < 1. Verifică întâi condițiile de existență (x, y > 0).",
};

const NEW = [
  {
    grup: "Combinatorică",
    nume: "Permutări",
    latex: "P_{n} = n! = 1 \\cdot 2 \\cdot 3 \\cdots n",
    explicatie:
      "Numărul de moduri de a ordona n obiecte distincte. Prin convenție 0! = 1.",
  },
  {
    grup: "Combinatorică",
    nume: "Aranjamente",
    latex: "A_{n}^{k} = \\dfrac{n!}{(n - k)!} \\quad (k \\le n)",
    explicatie:
      "Numărul de submulțimi ordonate de k elemente alese din n (contează ordinea).",
  },
  {
    grup: "Combinatorică",
    nume: "Combinări",
    latex: "C_{n}^{k} = \\dfrac{n!}{k!\\,(n - k)!} \\quad (k \\le n)",
    explicatie:
      "Numărul de submulțimi de k elemente alese din n (NU contează ordinea).",
  },
  {
    grup: "Combinatorică",
    nume: "Combinări complementare",
    latex: "C_{n}^{k} = C_{n}^{n-k}",
    explicatie:
      "A alege k elemente „incluse” este totuna cu a alege n−k elemente „excluse”. Proprietate de simetrie a combinărilor.",
  },
  {
    grup: "Combinatorică",
    nume: "Binomul lui Newton",
    latex: "(a + b)^{n} = \\sum_{k=0}^{n} C_{n}^{k}\\, a^{n-k} b^{k}",
    explicatie:
      "Dezvoltarea puterii unui binom. Coeficienții C_n^k sunt exact numerele din triunghiul lui Pascal.",
  },
  {
    grup: "Combinatorică",
    nume: "Suma combinărilor (număr de submulțimi)",
    latex: "\\sum_{k=0}^{n} C_{n}^{k} = 2^{n}",
    explicatie:
      "Suma tuturor combinărilor = numărul total de submulțimi ale unei mulțimi cu n elemente. Se obține din binom pentru a = b = 1.",
  },
  {
    grup: "Funcții",
    nume: "Compunerea funcțiilor",
    latex: "(f \\circ g)(x) = f(g(x))",
    explicatie:
      "Se aplică întâi g, apoi f. Atenție: în general f∘g ≠ g∘f (compunerea nu e comutativă).",
  },
  {
    grup: "Funcții",
    nume: "Funcția inversă",
    latex: "f(f^{-1}(x)) = x, \\quad f^{-1}(f(x)) = x",
    explicatie:
      "O funcție are inversă dacă și numai dacă este bijectivă. Inversa „anulează” efectul funcției; graficele sunt simetrice față de prima bisectoare.",
  },
  {
    grup: "Numere complexe",
    nume: "Modul și argument (forma trigonometrică)",
    latex:
      "r = \\sqrt{a^{2} + b^{2}}, \\quad \\operatorname{tg}\\theta = \\dfrac{b}{a}",
    explicatie:
      "Trecerea de la forma algebrică z = a + bi la forma trigonometrică: r este modulul, iar θ (argumentul) se află din tg θ = b/a, ținând cont de cadranul punctului (a, b).",
  },
  {
    grup: "Matematici financiare",
    nume: "Dobânda compusă",
    latex: "S = S_{0}\\left(1 + \\dfrac{p}{100}\\right)^{n}",
    explicatie:
      "Suma finală S după n perioade, pornind de la capitalul S₀ cu dobânda p% pe perioadă. Dobânda se adaugă la capital și produce, la rândul ei, dobândă.",
  },
];

applyLot({ CLASA: "10", LATEX_FIX, EXPL, NEW });
