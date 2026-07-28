/**
 * Cerința 2 — Decizia 4: autorare goluri CLASA V.
 *
 * Goluri DOVEDITE în TOC A1254 (Booklet V, prog. 2017) + A1259 (Litera V):
 *   §5.2 Împărțirea cu rest a numerelor naturale (teorema împărțirii cu rest) ·
 *   §4 (p.112) Înmulțirea fracțiilor zecimale · §9 (p.97) Fracții/procente dintr-un număr ·
 *   §7 (p.121) Transformarea fracției zecimale periodice în fracție ordinară ·
 *   §5 (p.153) Calcule cu măsuri de unghiuri în grade și minute.
 * Nota: „procente" e temă V confirmată la sursă (A1254 §9), NU doar VI.
 * SKIP: „scrierea în baza 2" (temă V, dar fără formulă închegată — algoritm, nu formulă).
 */
const { applyLot } = require("./lot_engine");

applyLot({
  CLASA: "5",
  NEW: [
    {
      grup: "Fracții zecimale",
      nume: "Înmulțirea numerelor zecimale",
      latex: "2{,}5 \\times 1{,}3 = 3{,}25",
      explicatie:
        "Se înmulțesc ca numere naturale (ignorând virgula), apoi produsul are atâtea zecimale câte au împreună cei doi factori. Ex.: 2,5 × 1,3 → 25×13 = 325 → 3,25 (o zecimală + o zecimală = două zecimale).",
    },
    {
      grup: "Divizibilitate",
      nume: "Teorema împărțirii cu rest",
      latex: "D = \\hat{I} \\cdot C + R, \\quad 0 \\le R < \\hat{I}",
      explicatie:
        "Deîmpărțitul (D) = împărțitorul (Î) × câtul (C) + restul (R), unde restul este întotdeauna mai mic decât împărțitorul (0 ≤ R < Î).",
    },
    {
      grup: "Fracții",
      nume: "Procente dintr-un număr",
      latex: "p\\% \\text{ din } N = \\dfrac{p \\cdot N}{100}",
      explicatie:
        "p% dintr-un număr N se calculează înmulțind numărul cu p și împărțind la 100. Ex.: 20% din 150 = 20·150/100 = 30.",
    },
    {
      grup: "Fracții zecimale",
      nume: "Fracție zecimală periodică în fracție ordinară",
      latex: "0{,}(a) = \\dfrac{a}{9}, \\quad 0{,}(ab) = \\dfrac{ab}{99}",
      explicatie:
        "O fracție zecimală periodică simplă se transformă în fracție ordinară: la numărător perioada, la numitor atâtea cifre de 9 câte cifre are perioada. Ex.: 0,(3) = 3/9 = 1/3.",
    },
    {
      grup: "Geometrie",
      nume: "Măsuri de unghiuri: grade și minute",
      latex: "1^\\circ = 60', \\quad 1' = 60''",
      explicatie:
        "Un grad sexagesimal are 60 de minute, iar un minut are 60 de secunde. La adunarea/scăderea măsurilor, 60′ se transformă într-un grad (și invers).",
    },
  ],
});
