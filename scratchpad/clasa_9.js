/** Autorare Clasa IX (#4). node scratchpad/clasa_9.js → gate + eyeball 9. */
const { applyLot } = require("./lot_engine");

const LATEX_FIX = {
  "Monotonia funcției de gradul I":
    "a > 0 \\Rightarrow f \\nearrow, \\quad a < 0 \\Rightarrow f \\searrow",
  "Formula rădăcinilor": "x_{1,2} = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}",
  "Relațiile lui Viète":
    "x_{1} + x_{2} = -\\dfrac{b}{a}, \\quad x_{1} \\times x_{2} = \\dfrac{c}{a}",
  "Vârful parabolei":
    "V\\left(-\\dfrac{b}{2a},\\, -\\dfrac{\\Delta}{4a}\\right)",
  "Distanța dintre două puncte":
    "d = \\sqrt{(x_{2} - x_{1})^{2} + (y_{2} - y_{1})^{2}}",
  "Mijlocul unui segment":
    "M\\left(\\dfrac{x_{1} + x_{2}}{2},\\, \\dfrac{y_{1} + y_{2}}{2}\\right)",
  "Modulul unui vector": "|\\vec{v}| = \\sqrt{x^{2} + y^{2}}",
  "Suma a doi vectori":
    "\\vec{u}(x_{1}, y_{1}) + \\vec{v}(x_{2}, y_{2}) = (x_{1} + x_{2},\\, y_{1} + y_{2})",
  "Produsul unui vector cu un scalar": "k \\times \\vec{u}(x, y) = (kx,\\, ky)",
  "Coliniaritatea a doi vectori":
    "\\vec{u} \\parallel \\vec{v} \\Leftrightarrow x_{1} y_{2} - x_{2} y_{1} = 0",
  "Sinus, cosinus, tangentă (triunghi dreptunghic)":
    "\\sin A = \\dfrac{a}{c}, \\; \\cos A = \\dfrac{b}{c}, \\; \\operatorname{tg} A = \\dfrac{a}{b}",
  "Valori notabile — 30°, 45°, 60°":
    "\\sin 30^{\\circ} = \\dfrac{1}{2}, \\quad \\sin 45^{\\circ} = \\dfrac{\\sqrt{2}}{2}, \\quad \\sin 60^{\\circ} = \\dfrac{\\sqrt{3}}{2}",
  "Teorema sinusurilor (triunghi oarecare)":
    "\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C} = 2R",
  "Teorema cosinusului (triunghi oarecare)":
    "a^{2} = b^{2} + c^{2} - 2bc \\cos A",
  "Aria triunghiului prin sinus":
    "A = \\dfrac{1}{2} \\times b \\times c \\times \\sin A",
  "Funcție injectivă / surjectivă / bijectivă":
    "\\begin{aligned} &\\text{inj.:}\\ x_1 \\ne x_2 \\Rightarrow f(x_1) \\ne f(x_2) \\\\ &\\text{surj.:}\\ \\forall y\\ \\exists x:\\ f(x) = y \\\\ &\\text{bij.:}\\ \\text{inj. + surj.} \\end{aligned}",
};

const EXPL = {
  "Progresie aritmetică — termen general":
    "Într-o progresie aritmetică fiecare termen se obține adunând rația r la cel precedent. Termenul de rang n = primul termen + (n−1) rații.",
  "Progresie aritmetică — sumă":
    "Suma primilor n termeni ai unei progresii aritmetice = numărul de termeni × media dintre primul și ultimul termen.",
  "Progresie geometrică — termen general":
    "Într-o progresie geometrică fiecare termen se obține înmulțind cu rația q (aici r) pe cel precedent. Termenul de rang n = a₁ · rⁿ⁻¹.",
  "Progresie geometrică — sumă":
    "Suma primilor n termeni ai unei progresii geometrice cu rația r ≠ 1. Dacă |r| < 1, suma infinită tinde la a₁/(1−r).",
  "Funcția de gradul I":
    "Funcția f(x) = ax + b (a ≠ 0) are ca grafic o dreaptă. a = panta, b = ordonata la origine.",
  "Monotonia funcției de gradul I":
    "Funcția de gradul I este crescătoare dacă panta a > 0 și descrescătoare dacă a < 0. Simbolurile ↗ / ↘ marchează creșterea / descreșterea.",
  "Funcția de gradul II":
    "Funcția f(x) = ax² + bx + c (a ≠ 0) are ca grafic o parabolă. Deschisă în sus dacă a > 0, în jos dacă a < 0.",
  Discriminant:
    "Discriminantul Δ = b² − 4ac decide numărul de rădăcini reale: Δ > 0 → două rădăcini distincte, Δ = 0 → o rădăcină dublă, Δ < 0 → fără rădăcini reale.",
  "Formula rădăcinilor":
    "Rădăcinile ecuației de gradul II ax² + bx + c = 0 se află cu formula x = (−b ± √Δ)/(2a), unde Δ = b² − 4ac.",
  "Relațiile lui Viète":
    "Suma rădăcinilor = −b/a, iar produsul lor = c/a. Permit aflarea rădăcinilor fără rezolvarea ecuației și verificarea soluțiilor.",
  "Vârful parabolei":
    "Vârful parabolei y = ax² + bx + c are coordonatele (−b/2a, −Δ/4a). Este punctul de minim (a > 0) sau de maxim (a < 0).",
  "Descompunerea trinomului":
    "Dacă x₁ și x₂ sunt rădăcinile trinomului, atunci ax² + bx + c = a(x − x₁)(x − x₂). Utilă la simplificări și rezolvarea inecuațiilor.",
  "Distanța dintre două puncte":
    "Distanța dintre punctele A(x₁, y₁) și B(x₂, y₂) în plan = radicalul din suma pătratelor diferențelor coordonatelor (Pitagora).",
  "Mijlocul unui segment":
    "Coordonatele mijlocului unui segment = media aritmetică a coordonatelor capetelor.",
  "Modulul unui vector":
    "Lungimea (modulul) vectorului de componente (x, y) = radicalul din suma pătratelor componentelor.",
  "Suma a doi vectori":
    "Doi vectori se adună pe componente: se adună abscisele între ele și ordonatele între ele (regula paralelogramului).",
  "Produsul unui vector cu un scalar":
    "Înmulțirea unui vector cu un scalar k înmulțește fiecare componentă cu k. Vectorul își păstrează direcția (se mărește/micșorează, se poate inversa dacă k < 0).",
  "Coliniaritatea a doi vectori":
    "Doi vectori sunt coliniari (paraleli) dacă și numai dacă determinantul componentelor lor este 0: x₁y₂ − x₂y₁ = 0.",
  "Sinus, cosinus, tangentă (triunghi dreptunghic)":
    "Într-un triunghi dreptunghic cu unghiul drept în C: a = cateta opusă lui A, b = cateta alăturată, c = ipotenuza. sin = opusă/ipotenuză, cos = alăturată/ipotenuză, tg = opusă/alăturată.",
  "Valori notabile — 30°, 45°, 60°":
    "Valorile sinusului pentru unghiurile uzuale. Cosinusul se obține simetric (cos30° = sin60° etc.), iar tg = sin/cos.",
  "Teorema sinusurilor (triunghi oarecare)":
    "Într-un triunghi oarecare, raportul dintre o latură și sinusul unghiului opus este constant și egal cu 2R (R = raza cercului circumscris).",
  "Teorema cosinusului (triunghi oarecare)":
    "Generalizează teorema lui Pitagora la orice triunghi: pătratul unei laturi = suma pătratelor celorlalte două minus dublul produsului lor cu cosinusul unghiului dintre ele.",
  "Aria triunghiului prin sinus":
    "Aria unui triunghi = jumătate din produsul a două laturi cu sinusul unghiului dintre ele. Utilă când se cunosc două laturi și unghiul cuprins.",
  "Funcție injectivă / surjectivă / bijectivă":
    "Injectivă: valori diferite ale lui x dau imagini diferite. Surjectivă: orice element din codomeniu este imaginea cel puțin a unui x. Bijectivă: injectivă și surjectivă simultan (are inversă).",
};

const NEW = [
  {
    grup: "Logică",
    nume: "Negarea cuantificatorului universal",
    latex:
      "\\overline{(\\forall x)\\, p(x)} = (\\exists x)\\, \\overline{p(x)}",
    explicatie:
      "Negarea propoziției „pentru orice x, p(x)” este „există un x pentru care p(x) este falsă”.",
  },
  {
    grup: "Logică",
    nume: "Negarea cuantificatorului existențial",
    latex:
      "\\overline{(\\exists x)\\, p(x)} = (\\forall x)\\, \\overline{p(x)}",
    explicatie:
      "Negarea propoziției „există x cu p(x)” este „pentru orice x, p(x) este falsă”.",
  },
  {
    grup: "Logică",
    nume: "Legile lui De Morgan",
    latex:
      "\\overline{p \\land q} = \\overline{p} \\lor \\overline{q}, \\quad \\overline{p \\lor q} = \\overline{p} \\land \\overline{q}",
    explicatie:
      "Negarea unei conjuncții (ȘI) este disjuncția (SAU) negațiilor, și invers. ∧ = și, ∨ = sau, bara = negație.",
  },
  {
    grup: "Geometrie analitică",
    nume: "Ecuația dreptei (pantă și punct)",
    latex: "y - y_{0} = m(x - x_{0})",
    explicatie:
      "Ecuația dreptei care trece prin punctul (x₀, y₀) și are panta m. Forma explicită: y = mx + n.",
  },
  {
    grup: "Geometrie analitică",
    nume: "Paralelism / perpendicularitate (drepte)",
    latex:
      "d_{1} \\parallel d_{2} \\Leftrightarrow m_{1} = m_{2}, \\quad d_{1} \\perp d_{2} \\Leftrightarrow m_{1} m_{2} = -1",
    explicatie:
      "Două drepte sunt paralele dacă au aceeași pantă și perpendiculare dacă produsul pantelor este −1.",
  },
  {
    grup: "Geometrie analitică",
    nume: "Distanța de la un punct la o dreaptă",
    latex: "d = \\dfrac{|a x_{0} + b y_{0} + c|}{\\sqrt{a^{2} + b^{2}}}",
    explicatie:
      "Distanța de la punctul (x₀, y₀) la dreapta de ecuație ax + by + c = 0. La numărător modulul, la numitor norma vectorului normal.",
  },
  {
    grup: "Vectori",
    nume: "Produsul scalar a doi vectori",
    latex: "\\vec{u} \\cdot \\vec{v} = x_{1} x_{2} + y_{1} y_{2}",
    explicatie:
      "Produsul scalar (în coordonate) = suma produselor componentelor. Este 0 dacă și numai dacă vectorii sunt perpendiculari.",
  },
  {
    grup: "Trigonometrie",
    nume: "Aria triunghiului (formula lui Heron)",
    latex: "A = \\sqrt{p(p - a)(p - b)(p - c)}",
    explicatie:
      "Aria unui triunghi cu laturile a, b, c, unde p = (a + b + c)/2 este semiperimetrul. Utilă când se cunosc doar cele trei laturi.",
  },
];

applyLot({ CLASA: "9", LATEX_FIX, EXPL, NEW });
