/** Autorare Clasa XII (#4, ULTIMA). node scratchpad/clasa_12.js → gate + eyeball 12. */
const { applyLot } = require("./lot_engine");

const LATEX_FIX = {
  "Primitivă — definiție": "\\int f(x)\\,dx = F(x) + C, \\quad F' = f",
  "Integrale uzuale — puteri":
    "\\int x^{n}\\,dx = \\dfrac{x^{n+1}}{n+1} + C \\;(n \\ne -1), \\quad \\int \\dfrac{dx}{x} = \\ln|x| + C",
  "Integrale uzuale — exponențiale":
    "\\int e^{x}\\,dx = e^{x} + C, \\quad \\int a^{x}\\,dx = \\dfrac{a^{x}}{\\ln a} + C",
  "Integrale uzuale — trigonometrice":
    "\\int \\sin x\\,dx = -\\cos x + C, \\quad \\int \\cos x\\,dx = \\sin x + C, \\quad \\int \\dfrac{dx}{\\cos^{2}x} = \\operatorname{tg} x + C",
  "Integrale uzuale — funcții inverse":
    "\\int \\dfrac{dx}{1+x^{2}} = \\operatorname{arctg} x + C, \\quad \\int \\dfrac{dx}{\\sqrt{1-x^{2}}} = \\arcsin x + C",
  "Integrarea prin părți": "\\int u\\, v'\\,dx = uv - \\int u'\\, v\\,dx",
  "Formula Leibniz-Newton": "\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)",
  "Aria subgraficului": "A = \\int_{a}^{b} f(x)\\,dx \\quad (f \\ge 0)",
  "Aria dintre două grafice": "A = \\int_{a}^{b} |f(x) - g(x)|\\,dx",
  "Volumul corpului de rotație": "V = \\pi \\int_{a}^{b} f^{2}(x)\\,dx",
  "Probabilitatea unui eveniment (Laplace)":
    "P(A) = \\dfrac{|A|}{|\\Omega|} = \\dfrac{\\text{cazuri favorabile}}{\\text{cazuri posibile}}",
  "Probabilitatea condiționată":
    "P(A|B) = \\dfrac{P(A \\cap B)}{P(B)} \\quad (P(B) > 0)",
  "Inel și corp (definiție)": "(A, +, \\times)",
  "Schimbarea de variabilă (substituție)":
    "\\int f(g(x))\\, g'(x)\\,dx = \\int f(u)\\,du, \\quad u = g(x)",
  "Teorema împărțirii cu rest":
    "A = B \\cdot Q + R, \\quad \\operatorname{grad} R < \\operatorname{grad} B",
  "Teorema lui Bézout":
    "P(x) = (x - a)Q(x) + P(a), \\quad P(a) = 0 \\Leftrightarrow P(x) \\;\\vdots\\; (x - a)",
  "Schema lui Bernoulli": "P(k) = C_{n}^{k}\\, p^{k}\\,(1 - p)^{n-k}",
  "Ecuație binomă":
    "x^{n} = a \\Rightarrow x_{k} = \\sqrt[n]{r}\\left(\\cos\\dfrac{\\theta + 2k\\pi}{n} + i\\sin\\dfrac{\\theta + 2k\\pi}{n}\\right)",
  "Ecuație reciprocă (grad 4)":
    "ax^{4} + bx^{3} + cx^{2} + bx + a = 0, \\quad y = x + \\dfrac{1}{x}",
};

const EXPL = {
  "Primitivă — definiție":
    "O primitivă F a lui f este o funcție a cărei derivată este f (F' = f). Integrala nedefinită = mulțimea tuturor primitivelor, care diferă printr-o constantă C.",
  "Integrale uzuale — puteri":
    "Integrarea puterilor: se crește exponentul cu 1 și se împarte la noul exponent. Excepția n = −1 dă logaritmul natural (ln|x|).",
  "Integrale uzuale — exponențiale":
    "Exponențiala eˣ este propria primitivă. Pentru bază oarecare a, se împarte la ln a.",
  "Integrale uzuale — trigonometrice":
    "Primitivele funcțiilor trigonometrice de bază. Atenție la semnul minus la ∫sin x dx = −cos x + C.",
  "Integrale uzuale — funcții inverse":
    "Integrale care conduc la funcțiile trigonometrice inverse (arctg și arcsin). Utile la fracții cu 1 + x² sau √(1 − x²) la numitor.",
  "Integrarea prin părți":
    "Metodă de integrare a unui produs: ∫u·v' = u·v − ∫u'·v. Se alege u astfel încât u' să fie mai simplu.",
  "Formula Leibniz-Newton":
    "Integrala definită = diferența valorilor unei primitive la capetele intervalului: F(b) − F(a). Leagă integrala de primitive.",
  "Aria subgraficului":
    "Pentru f ≥ 0 pe [a, b], integrala definită dă aria cuprinsă între grafic, axa Ox și verticalele x = a, x = b.",
  "Aria dintre două grafice":
    "Aria dintre două curbe = integrala din valoarea absolută a diferenței funcțiilor (funcția de sus minus cea de jos).",
  "Volumul corpului de rotație":
    "Volumul corpului obținut prin rotirea subgraficului lui f în jurul axei Ox = π · ∫f²(x) dx.",
  "Probabilitatea unui eveniment (Laplace)":
    "Probabilitatea = numărul cazurilor favorabile (|A|) împărțit la numărul cazurilor posibile (|Ω|), când toate cazurile sunt egal probabile. Valoare între 0 și 1.",
  "Probabilitatea reuniunii":
    "Probabilitatea ca A sau B să se producă = suma probabilităților minus probabilitatea intersecției (care altfel s-ar număra de două ori).",
  "Probabilitatea condiționată":
    "Probabilitatea lui A știind că B s-a produs = probabilitatea intersecției împărțită la probabilitatea lui B.",
  "Evenimente independente":
    "Două evenimente sunt independente dacă producerea unuia nu influențează probabilitatea celuilalt; atunci P(A∩B) = P(A)·P(B).",
  "Inel și corp (definiție)":
    "Inel = (A, +, ×) cu (A, +) grup abelian, × asociativă și distributivă față de +. Corp (comutativ) = inel comutativ cu 1 ≠ 0 în care orice element nenul este inversabil.",
  "Schimbarea de variabilă (substituție)":
    "Metodă de integrare: se notează u = g(x), du = g'(x)dx, transformând integrala într-una mai simplă în variabila u.",
  "Teorema împărțirii cu rest":
    "Orice polinom A se împarte la B (≠ 0) obținând un cât Q și un rest R, unde gradul restului este strict mai mic decât gradul lui B.",
  "Teorema lui Bézout":
    "Restul împărțirii lui P(x) la (x − a) este P(a). Consecință: a este rădăcină a lui P dacă și numai dacă (x − a) divide P(x).",
  "Media unei variabile aleatoare discrete":
    "Media (valoarea așteptată) = suma valorilor înmulțite cu probabilitățile lor. Arată la ce valoare „se așteaptă” media pe termen lung.",
  "Dispersia unei variabile aleatoare":
    "Dispersia (varianța) măsoară împrăștierea valorilor față de medie: D(X) = M(X²) − [M(X)]². Este mereu ≥ 0.",
  "Schema lui Bernoulli":
    "Probabilitatea de a obține exact k succese din n încercări independente, fiecare cu probabilitatea de succes p (și 1 − p de eșec).",
  "Ecuație binomă":
    "Ecuația xⁿ = a are exact n rădăcini complexe distincte, obținute din forma trigonometrică a lui a (r = |a|, θ = argumentul), pentru k = 0, 1, …, n−1.",
  "Ecuație reciprocă (grad 4)":
    "Ecuație cu coeficienți simetrici (a, b, c, b, a). Se împarte la x² și se face substituția y = x + 1/x, reducând-o la o ecuație de gradul II în y.",
};

const NEW = [
  {
    grup: "Integrala definită",
    nume: "Lungimea graficului",
    latex: "L = \\int_{a}^{b} \\sqrt{1 + [f'(x)]^{2}}\\,dx",
    explicatie:
      "Lungimea arcului de curbă y = f(x) între x = a și x = b, când f este derivabilă cu derivata continuă.",
  },
  {
    grup: "Integrala definită",
    nume: "Media unei funcții pe interval",
    latex: "f_{\\text{med}} = \\dfrac{1}{b - a}\\int_{a}^{b} f(x)\\,dx",
    explicatie:
      "Valoarea medie a funcției f pe intervalul [a, b] = integrala definită împărțită la lungimea intervalului.",
  },
  {
    grup: "Structuri algebrice",
    nume: "Morfism de grupuri",
    latex: "f(x \\ast y) = f(x) \\circ f(y)",
    explicatie:
      "O funcție f între două grupuri (G, ∗) și (H, ∘) este morfism dacă „păstrează operația”: imaginea produsului = produsul imaginilor. Izomorfism = morfism bijectiv.",
  },
  {
    grup: "Polinoame",
    nume: "Relațiile lui Viète (grad 3)",
    latex:
      "x_1 + x_2 + x_3 = -\\dfrac{b}{a}, \\; x_1 x_2 + x_2 x_3 + x_3 x_1 = \\dfrac{c}{a}, \\; x_1 x_2 x_3 = -\\dfrac{d}{a}",
    explicatie:
      "Pentru ax³ + bx² + cx + d = 0 cu rădăcinile x₁, x₂, x₃: suma = −b/a, suma produselor două câte două = c/a, produsul = −d/a.",
  },
  {
    grup: "Structuri algebrice",
    nume: "Congruențe (aritmetică modulară)",
    latex: "a \\equiv b \\pmod{n} \\Leftrightarrow (a - b)\\;\\vdots\\; n",
    explicatie:
      "a este congruent cu b modulo n dacă diferența a − b se divide cu n (dau același rest la împărțirea cu n).",
  },
  {
    grup: "Probabilități",
    nume: "Abaterea standard",
    latex: "\\sigma = \\sqrt{D(X)}",
    explicatie:
      "Abaterea standard (medie pătratică) = radicalul dispersiei. Măsoară împrăștierea în aceleași unități ca valorile variabilei.",
  },
];

applyLot({ CLASA: "12", LATEX_FIX, EXPL, NEW });
