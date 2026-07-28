/**
 * Cerința 2 — Decizia 4: 2 rafinamente de fidelitate/claritate la VIII (post-advisor), înainte de deploy.
 *   - „Modul (valoarea modală)": `Mo=x_k, f_k=max f_i` lăsa k nelegat (2 aserțiuni) →
 *      reformulat ca implicație `f_k=max_i f_i ⇒ Mo=x_k` (leagă k înainte de a-l folosi).
 *   - „Inecuația de gradul I": `a>0 ⇒ x≥−b/a` îngusta manualul (A1983: „ax+b ≤ 0 (≥,<,>)",
 *      fără restricție pe semnul lui a) + inconsistent cu forma VI → `ax+b≥0, x∈ℝ`
 *      (paralel cu VI `x∈ℤ`; sensul-flip pt a<0 rămâne în explicatie).
 */
const { applyLot } = require("./lot_engine");

applyLot({
  CLASA: "8",
  LATEX_FIX: {
    "Modul (valoarea modală)": "f_k = \\max_i f_i \\ \\Rightarrow\\ Mo = x_k",
    "Inecuația de gradul I": "ax + b \\ge 0, \\quad x \\in \\mathbb{R}",
  },
});
