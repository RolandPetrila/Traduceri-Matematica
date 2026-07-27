/** Autorare Clasa XI (#4). node scratchpad/clasa_11.js → gate + eyeball 11.
 *  REMOVE: combinatorica (5) — mutata la clasa X unde e corect in programa RO (plan §2). */
const { applyLot } = require("./lot_engine");

const REMOVE = [
  "Permutări",
  "Aranjamente",
  "Combinări",
  "Proprietatea combinărilor",
  "Binomul lui Newton",
];

const LATEX_FIX = {
  "Determinant de ordin 2":
    "\\det A = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc",
  "Regula lui Sarrus (ordin 3)": "\\det A = aei + bfg + cdh - ceg - bdi - afh",
  "Derivata — definiție":
    "f'(x) = \\lim\\limits_{h \\to 0} \\dfrac{f(x + h) - f(x)}{h}",
  "Reguli de derivare":
    "\\begin{aligned} (f \\pm g)' &= f' \\pm g' \\\\ (f g)' &= f'g + f g' \\\\ \\left(\\dfrac{f}{g}\\right)' &= \\dfrac{f'g - f g'}{g^{2}} \\;\\; (g \\ne 0) \\end{aligned}",
  "Derivata funcției compuse": "(f \\circ g)'(x) = f'(g(x)) \\cdot g'(x)",
  "Derivate uzuale — puteri și exponențiale":
    "(x^{n})' = n x^{n-1}, \\quad (e^{x})' = e^{x}, \\quad (\\ln x)' = \\dfrac{1}{x}",
  "Derivate uzuale — trigonometrice":
    "(\\sin x)' = \\cos x, \\quad (\\cos x)' = -\\sin x, \\quad (\\operatorname{tg} x)' = \\dfrac{1}{\\cos^{2}x}",
  "Ecuația tangentei la grafic": "y - f(a) = f'(a)(x - a)",
  "Adunarea matricelor": "(A + B)_{ij} = A_{ij} + B_{ij}",
  "Matrice inversabilă": "A A^{-1} = A^{-1} A = I_{n} \\quad (\\det A \\ne 0)",
  "Monotonia cu derivata întâi":
    "f'(x) > 0 \\Rightarrow f \\nearrow, \\quad f'(x) < 0 \\Rightarrow f \\searrow",
  "Teorema lui Fermat (condiție necesară)":
    "x_{0} \\text{ extrem} \\Rightarrow f'(x_{0}) = 0",
  "Condiție suficientă de extrem":
    "f'(x_{0}) = 0,\\ f'(x_{0}^{-})\\, f'(x_{0}^{+}) < 0 \\Rightarrow x_{0} \\text{ extrem}",
  "Concavitate/convexitate":
    "f''(x) > 0 \\Rightarrow f \\text{ convex}, \\quad f''(x) < 0 \\Rightarrow f \\text{ concav}",
  "Regula lui Cramer (sistem 2×2)":
    "x = \\dfrac{\\Delta_{x}}{\\Delta}, \\quad y = \\dfrac{\\Delta_{y}}{\\Delta} \\quad (\\Delta \\ne 0)",
  "Înmulțirea matricelor": "(A B)_{ij} = \\sum_{k} A_{ik} B_{kj}",
  "Limite fundamentale (numărul e)":
    "\\lim\\limits_{x \\to \\infty}\\left(1 + \\dfrac{1}{x}\\right)^{x} = e, \\quad \\lim\\limits_{x \\to 0}\\dfrac{\\ln(1 + x)}{x} = 1, \\quad \\lim\\limits_{x \\to 0}\\dfrac{e^{x} - 1}{x} = 1",
  "Cazuri de nedeterminare":
    "\\dfrac{0}{0}, \\; \\dfrac{\\infty}{\\infty}, \\; \\infty - \\infty, \\; 0 \\cdot \\infty, \\; 1^{\\infty}, \\; 0^{0}, \\; \\infty^{0}",
  "Funcție continuă într-un punct":
    "\\lim\\limits_{x \\to x_{0}} f(x) = f(x_{0})",
  "Asimptotă orizontală":
    "\\lim\\limits_{x \\to \\pm\\infty} f(x) = L \\Rightarrow y = L",
  "Asimptotă verticală":
    "\\lim\\limits_{x \\to a} f(x) = \\pm\\infty \\Rightarrow x = a",
  "Asimptotă oblică":
    "y = mx + n, \\quad m = \\lim\\limits_{x \\to \\infty}\\dfrac{f(x)}{x}, \\quad n = \\lim\\limits_{x \\to \\infty}[f(x) - mx]",
};

const EXPL = {
  "Determinant de ordin 2":
    "Determinantul unei matrice 2×2 = produsul diagonalei principale minus produsul diagonalei secundare (ad − bc).",
  "Regula lui Sarrus (ordin 3)":
    "Metodă de calcul a determinantului de ordin 3: se adună cele 3 produse „descendente” și se scad cele 3 „ascendente” (a, b, c … i sunt elementele matricei pe linii).",
  "Limita unui șir (notație)":
    "Un șir are limita L dacă termenii se apropie oricât de mult de L pe măsură ce n crește. Se notează lim aₙ = L.",
  "Limita fundamentală trigonometrică":
    "Limita fundamentală: sin x / x tinde la 1 când x → 0 (x în radiani). Stă la baza calculului derivatelor funcțiilor trigonometrice.",
  "Derivata — definiție":
    "Derivata în x = limita raportului de variație (creșterea funcției / creșterea argumentului) când pasul h tinde la 0. Reprezintă panta tangentei la grafic.",
  "Reguli de derivare":
    "Regulile de bază: derivata sumei/diferenței, a produsului și a câtului. Atenție la produs (nu este f'·g') și la cât (semnul minus la numărător).",
  "Derivata funcției compuse":
    "Regula lanțului: derivata funcției compuse = derivata funcției exterioare (în punctul g(x)) înmulțită cu derivata funcției interioare.",
  "Derivate uzuale — puteri și exponențiale":
    "Derivatele de bază: puterea coboară exponentul; exponențiala eˣ este propria derivată; logaritmul natural are derivata 1/x.",
  "Derivate uzuale — trigonometrice":
    "Derivatele funcțiilor trigonometrice. Atenție la semnul minus la derivata cosinusului.",
  "Ecuația tangentei la grafic":
    "Ecuația dreptei tangente la graficul lui f în punctul de abscisă a: panta este f'(a), iar dreapta trece prin (a, f(a)).",
  "Adunarea matricelor":
    "Două matrice de aceeași dimensiune se adună element cu element (pe poziții corespunzătoare).",
  "Matrice inversabilă":
    "O matrice pătratică A este inversabilă dacă există A⁻¹ cu A·A⁻¹ = A⁻¹·A = I. Condiția: determinantul ei să fie nenul.",
  "Monotonia cu derivata întâi":
    "Pe un interval I: dacă derivata este pozitivă, funcția este crescătoare (↗); dacă este negativă, funcția este descrescătoare (↘).",
  "Teorema lui Fermat (condiție necesară)":
    "Dacă f are un extrem local într-un punct interior x₀ și e derivabilă acolo, atunci f'(x₀) = 0. (Reciproca nu e adevărată — vezi f(x)=x³ în 0.)",
  "Condiție suficientă de extrem":
    "Dacă f'(x₀) = 0 și derivata își schimbă semnul în x₀ (produsul semnelor de o parte și de alta e negativ), atunci x₀ este punct de extrem.",
  "Concavitate/convexitate":
    "Semnul derivatei a doua dă forma graficului pe un interval: f'' > 0 → funcție convexă (⌣), f'' < 0 → funcție concavă (⌢). Unde f'' se anulează schimbând semnul = punct de inflexiune.",
  "Regula lui Cramer (sistem 2×2)":
    "Soluția sistemului liniar cu Δ ≠ 0: fiecare necunoscută = determinantul obținut înlocuind coloana ei cu termenii liberi, împărțit la determinantul principal Δ.",
  "Înmulțirea matricelor":
    "Elementul (i, j) al produsului = suma produselor dintre linia i a lui A și coloana j a lui B. Condiție: numărul de coloane al lui A = numărul de linii al lui B.",
  "Limite fundamentale (numărul e)":
    "Limite fundamentale legate de e și de logaritm/exponențială, folosite la ridicarea nedeterminărilor 1^∞ și 0/0.",
  "Cazuri de nedeterminare":
    "Formele la care limita nu se poate calcula direct și necesită transformări (factor comun, l'Hôpital, limite fundamentale).",
  "Funcție continuă într-un punct":
    "f este continuă în x₀ dacă limita în x₀ există și este egală cu valoarea funcției f(x₀) (limitele laterale sunt egale între ele și cu f(x₀)).",
  "Asimptotă orizontală":
    "Dreapta y = L este asimptotă orizontală dacă limita funcției la ±∞ este finită (L). Se calculează separat spre +∞ și spre −∞.",
  "Asimptotă verticală":
    "Dreapta x = a este asimptotă verticală dacă cel puțin una dintre limitele laterale în a este ±∞ (de obicei la punctele care anulează numitorul).",
  "Asimptotă oblică":
    "Dreapta y = mx + n (m ≠ 0) este asimptotă oblică dacă m = lim f(x)/x și n = lim [f(x) − mx] sunt finite. Se calculează separat spre ±∞.",
};

const NEW = [
  {
    grup: "Derivate — aplicații",
    nume: "Teorema lui Rolle",
    latex: "f(a) = f(b) \\Rightarrow \\exists c \\in (a, b): f'(c) = 0",
    explicatie:
      "Dacă f e continuă pe [a, b], derivabilă pe (a, b) și ia valori egale la capete, atunci există măcar un punct interior în care tangenta e orizontală (f'(c) = 0).",
  },
  {
    grup: "Derivate — aplicații",
    nume: "Teorema lui Lagrange (creșterilor finite)",
    latex: "f'(c) = \\dfrac{f(b) - f(a)}{b - a}, \\; c \\in (a, b)",
    explicatie:
      "Dacă f e continuă pe [a, b] și derivabilă pe (a, b), există un punct c în care panta tangentei egalează panta coardei (viteza medie = viteza instantanee).",
  },
  {
    grup: "Limite",
    nume: "Regula lui l'Hôpital",
    latex: "\\lim \\dfrac{f(x)}{g(x)} = \\lim \\dfrac{f'(x)}{g'(x)}",
    explicatie:
      "La nedeterminările 0/0 sau ∞/∞, limita raportului = limita raportului derivatelor (dacă aceasta din urmă există). Se poate aplica repetat.",
  },
  {
    grup: "Limite",
    nume: "Limita fundamentală (tangentă)",
    latex: "\\lim\\limits_{x \\to 0} \\dfrac{\\operatorname{tg} x}{x} = 1",
    explicatie:
      "Rezultă din limita sin x / x = 1 și cos x → 1. Utilă la nedeterminări cu tangentă.",
  },
  {
    grup: "Algebră liniară",
    nume: "Transpusa unei matrice",
    latex: "(A^{T})_{ij} = A_{ji}",
    explicatie:
      "Transpusa se obține schimbând liniile cu coloanele. Proprietăți: (Aᵀ)ᵀ = A și (AB)ᵀ = BᵀAᵀ.",
  },
  {
    grup: "Algebră liniară",
    nume: "Determinantul unui produs",
    latex: "\\det(A B) = \\det A \\cdot \\det B",
    explicatie:
      "Determinantul unui produs de matrice pătratice = produsul determinanților. Consecință: det(A⁻¹) = 1/det A.",
  },
  {
    grup: "Algebră liniară",
    nume: "Inversa unei matrice 2×2",
    latex:
      "A^{-1} = \\dfrac{1}{\\det A}\\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}",
    explicatie:
      "Pentru A = (a b / c d) cu det A = ad − bc ≠ 0: se schimbă a cu d, se schimbă semnul lui b și c, apoi se împarte la determinant.",
  },
  {
    grup: "Derivate",
    nume: "Derivata funcției exponențiale generale",
    latex: "(a^{x})' = a^{x} \\ln a \\quad (a > 0)",
    explicatie:
      "Derivata lui aˣ = aˣ înmulțit cu logaritmul natural al bazei. Pentru a = e se obține (eˣ)' = eˣ.",
  },
];

applyLot({ CLASA: "11", LATEX_FIX, EXPL, NEW, REMOVE });
