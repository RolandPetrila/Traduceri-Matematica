/**
 * Cerința 2 — REALINIEREA gimnazială (Deciziile 1+2+3 confirmate de Roland, 2026-07-28).
 * Corectează offset-ul pre-2017: mută formule EXISTENTE între clase (latex deja validat),
 * păstrând intact obiectul (grup nou + html/latex/explicatie). Un singur NEW (Frecvența la V).
 * Rebuild html + validare KaTeX; scrie doar dacă totul randează.
 */
const path = require("path");
const fs = require("fs");
const FRONTEND = path.join(__dirname, "..", "frontend");
const katex = require(path.join(FRONTEND, "node_modules", "katex"));
const MATH = path.join(
  FRONTEND,
  "src",
  "components",
  "editor",
  "math-data.json",
);
const d = JSON.parse(fs.readFileSync(MATH, "utf-8"));

const html = (l) =>
  katex.renderToString(l, {
    throwOnError: false,
    strict: false,
    output: "html",
  });
const rok = (l, n) => {
  try {
    katex.renderToString(l, { throwOnError: true, strict: false });
    return true;
  } catch (e) {
    console.log(`✗ KATEX [${n}]: ${String(e.message).split("\n")[0]}`);
    return false;
  }
};

function take(cls, nume) {
  const arr = d.formule[cls];
  const i = arr.findIndex((x) => x.nume === nume);
  if (i < 0) {
    console.log(`  ✗ NEGĂSIT în ${cls}: ${JSON.stringify(nume)}`);
    process.exit(1);
  }
  return arr.splice(i, 1)[0];
}
function move(from, to, nume, grup) {
  const o = take(from, nume);
  o.grup = grup;
  d.formule[to].push(o);
  console.log(`  MOVE ${from}→${to} [${grup}] ${nume}`);
}
function del(cls, nume) {
  take(cls, nume);
  console.log(`  DEL ${cls} ${nume}`);
}

// ── Decizia 1: VI → VII (patrulatere proprietăți + suma unghiuri + lungimea cercului) ──
move("6", "7", "Proprietăți paralelogram", "Patrulatere");
move("6", "7", "Proprietăți romb", "Patrulatere");
move("6", "7", "Proprietăți trapez", "Patrulatere");
move("6", "7", "Suma unghiurilor unui patrulater convex", "Patrulatere");
move("6", "7", "Lungimea cercului", "Cerc");
// VI: șterge ariile patrulaterelor + aria cercului (VII le are deja identic)
del("6", "Aria paralelogramului");
del("6", "Aria rombului");
del("6", "Aria trapezului");
del("6", "Aria cercului");

// ── Decizia 1: VIII → VII (radicali + sistem + linia mijlocie) ──
move("8", "7", "Raționalizarea numitorului", "Radicali");
move("8", "7", "Introducerea sub radical", "Radicali");
move("8", "7", "Sistem de ecuații liniare 2×2", "Ecuații și proporționalitate");
move("8", "7", "Linia mijlocie în triunghi", "Asemănare");

// ── Decizia 3: trigonometrie — mut DEFINIȚIILE la VII, păstrez sin²+cos²=1 + tg=sin/cos la VIII ──
move("8", "7", "Sinus, cosinus, tangentă, cotangentă", "Trigonometrie");
move("8", "7", "Valori notabile — 30°, 45°, 60°", "Trigonometrie");

// ── Decizia 1: VII → VIII (grupul [Calcul algebric], 9 formule) ──
for (const nume of d.formule["7"]
  .filter((x) => x.grup === "Calcul algebric")
  .map((x) => x.nume)) {
  move("7", "8", nume, "Calcul algebric");
}

// ── Decizia 2: probabilitate V → VI (manualele VI o predau); Frecvența relativă rămâne/vine la V ──
move("5", "6", "Probabilitatea unui eveniment", "Organizarea datelor");
d.formule["5"].push({
  grup: "Organizarea datelor",
  nume: "Frecvența relativă",
  html: html("f_{r} = \\dfrac{n_{i}}{N}"),
  latex: "f_{r} = \\dfrac{n_{i}}{N}",
  explicatie:
    "Frecvența relativă a unei valori dintr-un set de date = numărul de apariții al valorii (n_i) împărțit la numărul total de date (N). Se poate exprima și procentual.",
});
console.log("  NEW 5 [Organizarea datelor] Frecvența relativă");

// ── rebuild html + validate ──
let fail = 0;
for (const cls of Object.keys(d.formule))
  for (const x of d.formule[cls]) {
    if (!rok(x.latex, x.nume)) fail++;
    const o = {
      grup: x.grup,
      nume: x.nume,
      html: html(x.latex),
      latex: x.latex,
    };
    if (x.explicatie) o.explicatie = x.explicatie;
    Object.keys(x).forEach((k) => delete x[k]);
    Object.assign(x, o);
  }
const counts = Object.fromEntries(
  Object.keys(d.formule)
    .sort((a, b) => a - b)
    .map((c) => [c, d.formule[c].length]),
);
const total = Object.values(d.formule).reduce((s, a) => s + a.length, 0);
console.log("counts:", counts, "total:", total, "render_fail:", fail);
if (fail) {
  console.log("RENDER FAIL — NU scriu.");
  process.exit(1);
}
fs.writeFileSync(MATH, JSON.stringify(d), "utf-8");
console.log("Scris:", path.relative(process.cwd(), MATH));
