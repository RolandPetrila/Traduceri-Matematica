/**
 * Cerința 2 — Decizia 4: autorare goluri CLASA VIII + rezolvarea celor 2 item-uri [PROBABIL].
 *
 * Toate golurile = teme DOVEDITE în TOC-ul manualului A1983 (Booklet VIII, prog. OMEN 3393/2017):
 *   intervale + ∪/∩ · inecuații ax+b≷0 · mulțime printr-o proprietate · ec. ax²+bx+c=0 (§5) ·
 *   indicatori statistici mediană/mod/amplitudine (§3) · grupare de termeni · trunchi piramidă/con
 *   (arii+volume) · arii+volume prismă · teorema celor 3 perpendiculare.
 * ABANDONAT (R3, gate TOC): „fracții algebrice" — NU e în TOC (scos din gimnaziu la prog. 2017).
 *
 * MUTĂRI [PROBABIL] (geom. plană misplasată la VIII = geom. spațială; R3 la corpul manualelor):
 *   - „Inegalitatea triunghiului"  VIII→VI  (A1497 VI, cap. Triunghiul, „Inegalități între
 *     elementele triunghiului" p.185). Grup nou VI „Triunghiuri" (ține și Unghi exterior — gaps_6).
 *   - „Proprietăți paralelogram" (diagonale, AO=OC/BO=OD)  VIII→VII  (A1739/40/42 VII, cap.
 *     PATRULATERUL). VII[23] „Proprietăți paralelogram" acoperă doar laturi/unghiuri opuse, NU
 *     diagonalele → intrare distinctă „Proprietăți paralelogram (diagonale)" (Roland: „VII cu redenumire").
 *
 * Ordine calls (advisor): CLASA 8 prima (16 latex noi — cea mai probabil să pice → abort înainte
 * de mutări). Pe eșec parțial: `git checkout -- frontend/src/components/editor/math-data.json` + rerun.
 */
const { applyLot } = require("./lot_engine");

// ── 1) CLASA VIII: scoate cele 2 misplasate + adaugă 16 goluri ────────────────
applyLot({
  CLASA: "8",
  REMOVE: ["Inegalitatea triunghiului", "Proprietăți paralelogram"],
  NEW: [
    {
      grup: "Ecuații și inecuații",
      nume: "Inecuația de gradul I",
      latex: "ax + b \\ge 0,\\ a > 0 \\Rightarrow x \\ge -\\dfrac{b}{a}",
      explicatie:
        "Inecuație de gradul I: se izolează x. Dacă se împarte la un număr negativ (a < 0), sensul inegalității se schimbă. Soluția este un interval de numere reale.",
    },
    {
      grup: "Ecuații și inecuații",
      nume: "Ecuația de gradul al II-lea",
      latex: "ax^{2} + bx + c = 0 \\quad (a \\ne 0)",
      explicatie:
        "Ecuația de gradul al II-lea. La clasa a VIII-a se rezolvă elementar: forme incomplete (ax²+c=0, ax²+bx=0) sau prin descompunere în factori. Formula cu discriminantul (Δ) se studiază la clasa a IX-a.",
    },
    {
      grup: "Mulțimi și intervale",
      nume: "Intervale de numere reale",
      latex: "[a, b],\\ (a, b),\\ [a, \\infty),\\ (-\\infty, b]",
      explicatie:
        "Notația intervalelor: paranteza dreaptă [ ] = capăt inclus (interval închis), paranteza rotundă ( ) = capăt exclus (deschis); ∞ nu se include niciodată. Reuniunea (∪) și intersecția (∩) a două intervale se citesc pe axa numerelor.",
    },
    {
      grup: "Mulțimi și intervale",
      nume: "Mulțime definită printr-o proprietate",
      latex: "A = \\{\\, x \\mid P(x) \\,\\}",
      explicatie:
        "O mulțime poate fi descrisă prin proprietatea comună a elementelor ei: A = {x | P(x)} se citește «mulțimea elementelor x care au proprietatea P».",
    },
    {
      grup: "Statistică",
      nume: "Mediana unei serii de date",
      latex: "M_e = x_{\\left(\\frac{n+1}{2}\\right)}",
      explicatie:
        "Mediana = valoarea din mijloc a datelor ordonate crescător. Dacă numărul de date n este impar, este valoarea de pe poziția (n+1)/2; dacă n este par, este media aritmetică a celor două valori din mijloc.",
    },
    {
      grup: "Statistică",
      nume: "Modul (valoarea modală)",
      latex: "Mo = x_k, \\quad f_k = \\max_i f_i",
      explicatie:
        "Modul (valoarea modală) = valoarea care apare cel mai des într-o serie de date (are frecvența absolută cea mai mare). O serie poate avea mai multe moduri.",
    },
    {
      grup: "Statistică",
      nume: "Amplitudinea unei serii de date",
      latex: "A = x_{\\max} - x_{\\min}",
      explicatie:
        "Amplitudinea = diferența dintre cea mai mare și cea mai mică valoare din serie. Măsoară împrăștierea datelor.",
    },
    {
      grup: "Corpuri geometrice",
      nume: "Aria laterală a piramidei regulate",
      latex: "A_l = \\dfrac{P_b \\cdot a_p}{2}",
      explicatie:
        "Aria laterală a piramidei regulate = (perimetrul bazei × apotema piramidei) ÷ 2. Apotema piramidei (a_p) = înălțimea unei fețe laterale (triunghi isoscel).",
    },
    {
      grup: "Corpuri geometrice",
      nume: "Aria totală a piramidei",
      latex: "A_t = A_l + A_b",
      explicatie:
        "Aria totală a piramidei = aria laterală (suma ariilor fețelor triunghiulare) + aria bazei.",
    },
    {
      grup: "Corpuri geometrice",
      nume: "Aria totală a conului",
      latex: "A_t = \\pi r (r + g)",
      explicatie:
        "Aria totală a conului = aria laterală (πrg) + aria bazei (πr²) = πr(r + g), unde g = generatoarea.",
    },
    {
      grup: "Corpuri geometrice",
      nume: "Aria totală a prismei drepte",
      latex: "A_t = A_l + 2 A_b",
      explicatie:
        "Aria totală a prismei drepte = aria laterală (P_b·h) + ariile celor două baze (2·A_b).",
    },
    {
      grup: "Corpuri geometrice",
      nume: "Volumul trunchiului de piramidă",
      latex:
        "V = \\dfrac{h}{3}\\left(A_B + A_b + \\sqrt{A_B \\cdot A_b}\\right)",
      explicatie:
        "Volumul trunchiului de piramidă, cu ariile bazelor A_B (baza mare) și A_b (baza mică) și înălțimea h (distanța dintre baze).",
    },
    {
      grup: "Corpuri geometrice",
      nume: "Volumul trunchiului de con",
      latex: "V = \\dfrac{\\pi h}{3}\\left(R^{2} + Rr + r^{2}\\right)",
      explicatie:
        "Volumul trunchiului de con circular drept, cu razele bazelor R (baza mare) și r (baza mică) și înălțimea h.",
    },
    {
      grup: "Corpuri geometrice",
      nume: "Aria laterală a trunchiului de con",
      latex: "A_l = \\pi G (R + r)",
      explicatie:
        "Aria laterală a trunchiului de con circular drept = π × generatoarea (G) × suma razelor bazelor (R + r).",
    },
    {
      grup: "Calcul algebric",
      nume: "Descompunere prin gruparea termenilor",
      latex: "ax + ay + bx + by = (x + y)(a + b)",
      explicatie:
        "Metoda grupării: se grupează termenii care au factor comun, se dă factor comun în fiecare grup, apoi se dă factor comun paranteza. Ex.: ax+ay+bx+by = a(x+y)+b(x+y) = (x+y)(a+b).",
    },
    {
      grup: "Corpuri geometrice",
      nume: "Teorema celor trei perpendiculare",
      latex:
        "VA \\perp \\alpha,\\ \\ AB \\perp d \\ \\Rightarrow\\ VB \\perp d",
      explicatie:
        "Teorema celor trei perpendiculare: dacă VA este perpendiculară pe planul α (A ∈ α), iar AB (proiecția, situată în α) este perpendiculară pe dreapta d ⊂ α (B ∈ d), atunci și oblica VB este perpendiculară pe d.",
    },
  ],
});

// ── 2) MUTARE VIII→VII: proprietatea diagonalelor paralelogramului ────────────
applyLot({
  CLASA: "7",
  NEW: [
    {
      grup: "Patrulatere",
      nume: "Proprietăți paralelogram (diagonale)",
      latex: "AO = OC, \\quad BO = OD",
      explicatie:
        "Diagonalele unui paralelogram se înjumătățesc reciproc: punctul lor de intersecție O este mijlocul fiecărei diagonale (AO = OC și BO = OD).",
    },
  ],
});

// ── 3) MUTARE VIII→VI: inegalitatea triunghiului (grup nou „Triunghiuri") ──────
applyLot({
  CLASA: "6",
  NEW: [
    {
      grup: "Triunghiuri",
      nume: "Inegalitatea triunghiului",
      latex: "|b - c| < a < b + c",
      explicatie:
        "Într-un triunghi, orice latură este mai mică decât suma celorlalte două și mai mare decât diferența lor. Condiție de existență a triunghiului.",
    },
  ],
});
