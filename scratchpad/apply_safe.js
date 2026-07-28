/**
 * Cerința 2 — remedieri NEAMBIGUE (aprobate advisor; independente de deciziile de clasă):
 *  1. VIII: șterge „Raport de arii pt. triunghiuri asemenea" — duplicat byte-identic cu VII
 *     „Raportul ariilor triunghiurilor asemenea" (A1/A2=k²); asemănarea e temă VII (ambele manuale),
 *     VII păstrează copia → ștergere fără pierdere.
 *  2. VI: redenumește „Proporție derivată" → „Proprietatea fundamentală a proporției" (in-place):
 *     latexul (a/b=c/d ⇒ ad=bc) ESTE proprietatea fundamentală; numele era greșit
 *     (manualele VI le tratează ca lecții distincte: proprietatea fundamentală vs proporții derivate).
 * Rebuild html din latex; scrie doar dacă TOTUL randează KaTeX.
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

// 1. VIII REMOVE (class-scoped)
const before8 = d.formule["8"].length;
d.formule["8"] = d.formule["8"].filter(
  (x) => x.nume !== "Raport de arii pt. triunghiuri asemenea",
);
console.log(
  `VIII: removed ${before8 - d.formule["8"].length} (Raport de arii — duplicat VII)`,
);

// 2. VI rename in-place
let renamed = 0;
for (const x of d.formule["6"]) {
  if (x.nume === "Proporție derivată") {
    x.nume = "Proprietatea fundamentală a proporției";
    renamed++;
  }
}
console.log(
  `VI: renamed ${renamed} (Proporție derivată → Proprietatea fundamentală a proporției)`,
);

// rebuild html + validate ALL entries render
let fail = 0;
for (const cls of Object.keys(d.formule)) {
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
}
const total = Object.values(d.formule).reduce((s, a) => s + a.length, 0);
console.log(
  `render_fail=${fail}  |  Total bibliotecă = ${total}  (VIII ${d.formule["8"].length}, VI ${d.formule["6"].length})`,
);
if (fail) {
  console.log("RENDER FAIL — NU scriu.");
  process.exit(1);
}
fs.writeFileSync(MATH, JSON.stringify(d), "utf-8");
console.log("Scris:", path.relative(process.cwd(), MATH));
