/**
 * Cerința 2 — Decizia 4: autorare goluri CLASA VI + fix CAT.5 + rename CAT.5 la VII.
 *
 * Goluri DOVEDITE în TOC A1497 (Booklet VI, prog. 2017):
 *   §3-4 Mulțimi + cardinalul mulțimii finite + operații (reuniune/intersecție) ·
 *   §9 Inecuații în ℤ · §5 (raționale) Puterea cu exponent număr ÎNTREG a unui rațional nenul
 *   (⇒ a^{-n}=1/aⁿ e temă VI, revizit cu VII) · §2 Adunarea/scăderea pe ℚ ·
 *   Cerc: Unghi la centru (p.169), Pozițiile dreptei față de cerc + a două cercuri (§5.2 p.174) ·
 *   Triunghi: Unghi exterior (p.180).
 * SKIP (R3, near-dup): „Modulul rațional" — VI[5] „Modulul unui număr întreg" = aceeași formulă |x|.
 * (Inegalitatea triunghiului deja mutată la VI în gaps_8; Probabilitatea deja la VI din realign.)
 *
 * CAT.5 (Roland „îmbunătățiri → aplică-le"):
 *   - VI „Înălțimea": latex era A=a·h_a/2 (ARIA!) → def. corectă a înălțimii (AD⊥BC).
 *   - VII „Aria cercului" → „Aria discului" (termenul din manual; explicația o folosea deja).
 */
const { applyLot } = require("./lot_engine");

// ── CLASA VI: fix Înălțimea + 9 goluri ────────────────────────────────────────
applyLot({
  CLASA: "6",
  LATEX_FIX: {
    Înălțimea: "AD \\perp BC, \\quad D \\in BC",
  },
  EXPL: {
    Înălțimea:
      "Înălțimea unui triunghi = segmentul perpendicular dintr-un vârf pe latura opusă (sau pe prelungirea ei); AD ⊥ BC, cu piciorul D pe BC. Se notează h_a. (Aria triunghiului = a·h_a/2.)",
  },
  NEW: [
    {
      grup: "Mulțimi",
      nume: "Operații cu mulțimi",
      latex: "A \\cup B, \\quad A \\cap B, \\quad A \\setminus B",
      explicatie:
        "Reuniunea (A∪B) = toate elementele din A sau din B; intersecția (A∩B) = elementele comune; diferența (A∖B) = elementele din A care nu sunt în B.",
    },
    {
      grup: "Mulțimi",
      nume: "Cardinalul reuniunii a două mulțimi",
      latex: "n(A \\cup B) = n(A) + n(B) - n(A \\cap B)",
      explicatie:
        "Numărul elementelor reuniunii = suma cardinalelor minus cardinalul intersecției (elementele comune, altfel numărate de două ori). Principiul includerii și excluderii.",
    },
    {
      grup: "Numere întregi",
      nume: "Inecuație în numere întregi",
      latex: "ax + b > 0, \\quad x \\in \\mathbb{Z}",
      explicatie:
        "Inecuație de gradul I rezolvată în mulțimea numerelor întregi: se izolează x, iar soluțiile sunt numerele întregi care o verifică. La împărțirea cu un număr negativ, sensul se schimbă.",
    },
    {
      grup: "Numere raționale",
      nume: "Puterea cu exponent întreg negativ",
      latex: "a^{-n} = \\dfrac{1}{a^{n}} \\quad (a \\ne 0)",
      explicatie:
        "O putere cu exponent întreg negativ este egală cu inversul puterii cu exponent pozitiv. Ex.: 2⁻³ = 1/2³ = 1/8. (La clasa a VI-a — pentru numere raționale nenule.)",
    },
    {
      grup: "Numere raționale",
      nume: "Adunarea numerelor raționale",
      latex: "\\dfrac{a}{b} + \\dfrac{c}{d} = \\dfrac{ad + bc}{bd}",
      explicatie:
        "Se aduc fracțiile la același numitor (bd), apoi se adună numărătorii. Scăderea se face analog, cu semnul minus. Atenție la regula semnelor pe ℚ.",
    },
    {
      grup: "Cerc",
      nume: "Unghiul la centru",
      latex: "m(\\angle AOB) = m(\\overset{\\frown}{AB})",
      explicatie:
        "Unghiul cu vârful în centrul cercului (O) are măsura egală cu măsura arcului cuprins între laturile sale (arcul AB).",
    },
    {
      grup: "Cerc",
      nume: "Pozițiile unei drepte față de un cerc",
      latex: "d < R; \\quad d = R; \\quad d > R",
      explicatie:
        "După distanța d de la centru la dreaptă: d < R → dreapta este secantă (2 puncte comune); d = R → tangentă (1 punct); d > R → exterioară (0 puncte comune).",
    },
    {
      grup: "Cerc",
      nume: "Pozițiile relative a două cercuri",
      latex:
        "d > R + r; \\ \\ d = R + r; \\ \\ |R - r| < d < R + r; \\ \\ d = |R - r|; \\ \\ d < |R - r|",
      explicatie:
        "După distanța d dintre centre (raze R și r): exterioare (d>R+r); tangente exterior (d=R+r); secante (|R−r|<d<R+r); tangente interior (d=|R−r|); interioare/concentrice (d<|R−r|).",
    },
    {
      grup: "Triunghiuri",
      nume: "Unghiul exterior al triunghiului",
      latex:
        "m(\\widehat{A}_{\\text{ext}}) = m(\\widehat{B}) + m(\\widehat{C})",
      explicatie:
        "Măsura unui unghi exterior al triunghiului = suma măsurilor celor două unghiuri interioare nealăturate lui.",
    },
  ],
});

// ── CAT.5 la VII: „Aria cercului" → „Aria discului" (termenul din manual) ──────
applyLot({
  CLASA: "7",
  RENAME: { "Aria cercului": "Aria discului" },
});
