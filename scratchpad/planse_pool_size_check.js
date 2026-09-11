// Verificare directa (nu presupunere) a marimii spatiului de semnaturi pt dictare.js si uneste.js.
// Read-only, nu atinge codul aplicatiei. Ruleaza generatoarele reale, exact cum le incarca app.js.
const fs = require("fs");
const path = require("path");

const BASE = "C:/Proiecte/Traduceri_Matematica/frontend/public/planse";

function loadGlobal(relPath) {
  const code = fs.readFileSync(path.join(BASE, relPath), "utf8");
  eval(code);
}

loadGlobal("lib/prng.js");
loadGlobal("lib/signature.js");
loadGlobal("generators/dictare.js");
loadGlobal("generators/uneste.js");

const dictare = globalThis.PlanseGen.dictare;
const uneste = globalThis.PlanseGen.uneste;

console.log("=== dictare.js ===");
let totalDictare = 0;
for (const dif of Object.keys(dictare.DIFF)) {
  const elig = dictare.eligibleFor(dif);
  totalDictare += elig.length;
  console.log(dif, "->", elig.length, "forme eligibile:", elig.join(", "));
}
console.log("TOTAL semnaturi distincte posibile (dictare):", totalDictare);

console.log("\n=== uneste.js ===");
// uneste nu filtreaza pe dificultate (orice forma la orice dif) -> total = nrForme * nrDificultati
const nrForme = Object.keys(uneste.SHAPES).length;
const nrDif = Object.keys(uneste.DIFF).length;
console.log(
  "nr forme:",
  nrForme,
  "x nr dificultati:",
  nrDif,
  "=",
  nrForme * nrDif,
);

console.log(
  "\n=== MAX_SEEN global (din history.js, citit direct din sursa) ===",
);
const histSrc = fs.readFileSync(path.join(BASE, "lib/history.js"), "utf8");
const m = histSrc.match(/MAX_SEEN\s*=\s*(\d+)/);
console.log("MAX_SEEN =", m ? m[1] : "NEGASIT");
