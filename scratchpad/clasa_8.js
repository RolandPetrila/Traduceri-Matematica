/** Autorare Clasa VIII (#4). node scratchpad/clasa_8.js → gate + eyeball 8. */
const { applyLot } = require("./lot_engine");

const LATEX_FIX = {
  "Sistem de ecuații liniare 2×2":
    "\\begin{cases} ax + by = c \\\\ a'x + b'y = c' \\end{cases}",
  "Funcția liniară (introducere)":
    "f(x) = ax + b, \\quad f : \\mathbb{R} \\to \\mathbb{R} \\;\\; (a \\ne 0)",
  "Linia mijlocie în triunghi": "MN \\parallel BC, \\; MN = \\dfrac{BC}{2}",
  "Teorema lui Thales":
    "DE \\parallel BC \\Rightarrow \\dfrac{AD}{AB} = \\dfrac{AE}{AC}",
  "Raport de arii pt. triunghiuri asemenea": "\\dfrac{A_{1}}{A_{2}} = k^{2}",
  "Volumul prismei": "V = A_{b} \\times h",
  "Aria laterală a prismei drepte": "A_{l} = P_{b} \\times h",
  "Volumul piramidei": "V = \\dfrac{1}{3} \\times A_{b} \\times h",
  "Volumul conului": "V = \\dfrac{1}{3} \\times \\pi \\times r^{2} \\times h",
  "Aria laterală a conului": "A_{l} = \\pi \\times r \\times g",
  "Volumul sferei": "V = \\dfrac{4}{3} \\times \\pi \\times r^{3}",
  "Sinus, cosinus, tangentă, cotangentă":
    "\\sin A = \\dfrac{a}{c}, \\; \\cos A = \\dfrac{b}{c}, \\; \\operatorname{tg} A = \\dfrac{a}{b}, \\; \\operatorname{ctg} A = \\dfrac{b}{a}",
  "Valori notabile — 30°, 45°, 60°":
    "\\begin{array}{c|ccc} & 30^\\circ & 45^\\circ & 60^\\circ \\\\ \\hline \\sin & \\frac{1}{2} & \\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{3}}{2} \\\\ \\cos & \\frac{\\sqrt{3}}{2} & \\frac{\\sqrt{2}}{2} & \\frac{1}{2} \\\\ \\operatorname{tg} & \\frac{\\sqrt{3}}{3} & 1 & \\sqrt{3} \\end{array}",
  "Probabilitatea unui eveniment (cazuri egal probabile)":
    "P(A) = \\dfrac{\\text{cazuri favorabile}}{\\text{cazuri posibile}}",
  "Frecvența relativă": "f_{r} = \\dfrac{n_{i}}{N}",
};

const EXPL = {
  "Sistem de ecuații liniare 2×2":
    "Sistem de două ecuații de gradul I cu două necunoscute (x, y). Se rezolvă prin metoda substituției sau a reducerii. Soluția este perechea (x, y) care verifică ambele ecuații.",
  "Funcția liniară (introducere)":
    "Funcția de gradul I f(x) = ax + b (a ≠ 0) are ca grafic o dreaptă. a = panta (înclinarea), b = ordonata la origine (unde taie axa Oy).",
  "Modulul unui număr real (inecuație)":
    "Inecuația |x − a| < r înseamnă că x este la distanță mai mică decât r față de a, deci x se află în intervalul deschis (a − r, a + r).",
  "Linia mijlocie în triunghi":
    "Segmentul care unește mijloacele a două laturi (M pe AB, N pe AC) este paralel cu a treia latură și are jumătate din lungimea ei.",
  "Inegalitatea triunghiului":
    "Într-un triunghi, orice latură este mai mică decât suma celorlalte două și mai mare decât diferența lor. Condiție de existență a triunghiului.",
  "Teorema lui Thales":
    "O paralelă la o latură (DE ∥ BC) taie celelalte două laturi în segmente proporționale, măsurate de la vârf. Stă la baza asemănării.",
  "Raport de arii pt. triunghiuri asemenea":
    "La două triunghiuri asemenea cu raportul de asemănare k, raportul ariilor este k² (pătratul raportului laturilor).",
  "Volumul cubului":
    "Volumul cubului = latura la puterea a treia (l³), deoarece toate muchiile sunt egale.",
  "Aria totală a cubului":
    "Cubul are 6 fețe pătrate egale, deci aria totală = 6 × l².",
  "Volumul paralelipipedului dreptunghic":
    "Volumul = produsul celor trei dimensiuni: lungime × lățime × înălțime.",
  "Aria totală a paralelipipedului":
    "Paralelipipedul are 3 perechi de fețe dreptunghiulare egale; aria totală = 2 × (Ll + Lh + lh).",
  "Volumul prismei":
    "Volumul unei prisme = aria bazei (A_b) înmulțită cu înălțimea (distanța dintre baze).",
  "Aria laterală a prismei drepte":
    "Aria laterală a prismei drepte = perimetrul bazei (P_b) înmulțit cu înălțimea. Aria totală = A_lat + 2·A_bază.",
  "Volumul piramidei":
    "Volumul piramidei = o treime din produsul dintre aria bazei (A_b) și înălțime (perpendiculara din vârf pe bază).",
  "Volumul cilindrului":
    "Cilindrul este o „prismă cu baza cerc”: volumul = aria bazei (π·r²) × înălțimea h.",
  "Aria laterală a cilindrului":
    "Desfășurata suprafeței laterale este un dreptunghi cu lățimea = circumferința bazei (2πr) și înălțimea h, deci A_lat = 2πrh.",
  "Aria totală a cilindrului":
    "Aria totală = aria laterală (2πrh) + ariile celor două baze (2·πr²) = 2πr(r + h).",
  "Volumul conului":
    "Conul este o „piramidă cu baza cerc”: volumul = o treime din aria bazei (π·r²) × înălțimea h.",
  "Aria laterală a conului":
    "Aria laterală a conului = π × raza bazei (r) × generatoarea (g = latura oblică, de la vârf la marginea bazei).",
  "Volumul sferei": "Volumul sferei de rază r = (4/3)·π·r³.",
  "Aria sferei":
    "Aria suprafeței sferei de rază r = 4·π·r² (de 4 ori aria unui cerc mare).",
  "Sinus, cosinus, tangentă, cotangentă":
    "Într-un triunghi dreptunghic cu unghiul drept în C: a = cateta opusă unghiului A, b = cateta alăturată, c = ipotenuza. sin = opusă/ipotenuză, cos = alăturată/ipotenuză, tg = opusă/alăturată, ctg = alăturată/opusă.",
  "Valori notabile — 30°, 45°, 60°":
    "Valorile funcțiilor trigonometrice pentru unghiurile uzuale. De reținut: sinusul crește (1/2 → √2/2 → √3/2), cosinusul scade simetric, iar tg30°·tg60° = 1.",
  "Probabilitatea unui eveniment (cazuri egal probabile)":
    "Probabilitatea unui eveniment A = numărul cazurilor favorabile împărțit la numărul cazurilor posibile (când toate cazurile sunt egal probabile). Valoare între 0 și 1.",
  "Frecvența relativă":
    "Frecvența relativă a unei valori = frecvența absolută (nᵢ = de câte ori apare) împărțită la numărul total de date N. Procentual: fᵣ × 100%.",
};

const NEW = [
  {
    grup: "Numere reale",
    nume: "Raționalizarea numitorului",
    latex: "\\dfrac{1}{\\sqrt{a}} = \\dfrac{\\sqrt{a}}{a} \\quad (a > 0)",
    explicatie:
      "Pentru a scăpa de radical la numitor, amplifici fracția cu radicalul respectiv. Ex.: 1/√2 = √2/2.",
  },
  {
    grup: "Numere reale",
    nume: "Introducerea sub radical",
    latex: "a\\sqrt{b} = \\sqrt{a^{2} b} \\quad (a, b \\ge 0)",
    explicatie:
      "Un factor pozitiv din fața radicalului intră sub radical ridicat la pătrat. Operația inversă scoaterii factorilor de sub radical.",
  },
  {
    grup: "Funcții",
    nume: "Panta unei drepte (prin două puncte)",
    latex:
      "m = \\dfrac{y_{2} - y_{1}}{x_{2} - x_{1}} \\quad (x_{1} \\ne x_{2})",
    explicatie:
      "Panta (coeficientul unghiular) unei drepte care trece prin punctele (x₁, y₁) și (x₂, y₂). Pozitivă = dreapta urcă, negativă = coboară.",
  },
  {
    grup: "Funcții",
    nume: "Intersecția graficului cu axele (gr. I)",
    latex:
      "Ox:\\; \\left(-\\dfrac{b}{a},\\, 0\\right), \\quad Oy:\\; (0,\\, b)",
    explicatie:
      "Graficul funcției f(x) = ax + b taie axa Ox unde y = 0 (x = −b/a) și axa Oy unde x = 0 (y = b).",
  },
  {
    grup: "Corpuri geometrice",
    nume: "Diagonala cubului",
    latex: "d = l\\sqrt{3}",
    explicatie:
      "Diagonala cubului (care unește două vârfuri opuse, prin interior) = latura înmulțită cu √3. Se deduce aplicând de două ori teorema lui Pitagora.",
  },
  {
    grup: "Corpuri geometrice",
    nume: "Diagonala paralelipipedului dreptunghic",
    latex: "d = \\sqrt{L^{2} + l^{2} + h^{2}}",
    explicatie:
      "Diagonala paralelipipedului dreptunghic = radicalul din suma pătratelor celor trei dimensiuni (lungime, lățime, înălțime).",
  },
  {
    grup: "Trigonometrie",
    nume: "Relația fundamentală a trigonometriei",
    latex: "\\sin^{2}\\alpha + \\cos^{2}\\alpha = 1",
    explicatie:
      "Pentru orice unghi α, suma pătratelor sinusului și cosinusului este 1. Rezultă direct din teorema lui Pitagora în triunghiul dreptunghic.",
  },
  {
    grup: "Trigonometrie",
    nume: "Tangenta ca raport",
    latex:
      "\\operatorname{tg}\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha} \\quad (\\cos\\alpha \\ne 0)",
    explicatie:
      "Tangenta unui unghi = raportul dintre sinus și cosinus. Cotangenta este inversul: ctg α = cos α / sin α.",
  },
];

applyLot({ CLASA: "8", LATEX_FIX, EXPL, NEW });
