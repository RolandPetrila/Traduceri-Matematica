/**
 * Gate de validare pentru biblioteca de formule (math-data.json) — #4 autorare V→XII.
 * Rulează după fiecare lot de autorare: `node scratchpad/gate_check.js`
 *
 * Verifică (exit 1 dacă pică):
 *   - fiecare `latex` randează în KaTeX (throwOnError) — 0 eșecuri;
 *   - INVARIANT: fiecare intrare are `latex` (NO_LATEX=0) — altfel fallback-ul
 *     `insert(f.html)` din EditorMathMenu ar putea pune proză pe foaie;
 *   - `html`-ul intrărilor cu `explicatie` nu conține proză (regenerat din latex);
 *   - scriptul de auto-fit din editor-export.ts parsează (clasa de bug backtick-in-comment).
 *
 * ⚠️ NU verifică CORECTITUDINEA MATEMATICĂ sau SEMANTICA simbolurilor (ex. ⋮ vs ∣,
 *    formulă corectă). PASS ≠ „matematica e corectă". Fiecare formulă = R3 la autorare
 *    + verificare de domeniu de Cristina.
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
const EXPORT = path.join(FRONTEND, "src", "lib", "editor-export.ts");

const d = JSON.parse(fs.readFileSync(MATH, "utf-8"));
let ok = 0,
  bad = 0,
  noLatex = 0,
  withExpl = 0,
  proseInHtml = 0,
  tot = 0;
const PROSE =
  /(dacă|unește|perpendiculara|semidreapta|numere naturale|se scrie|divizori)/i;
for (const arr of Object.values(d.formule)) {
  for (const x of arr) {
    tot++;
    if (x.explicatie) withExpl++;
    if (!x.latex) {
      noLatex++;
      console.log("NO-LATEX:", x.nume);
      continue;
    }
    try {
      katex.renderToString(x.latex, { throwOnError: true, strict: false });
      ok++;
    } catch (e) {
      bad++;
      console.log("KATEX-FAIL:", x.nume, String(e.message).split("\n")[0]);
    }
    if (x.explicatie && PROSE.test(x.html || "")) {
      proseInHtml++;
      console.log("PROSE-IN-HTML:", x.nume);
    }
  }
}
console.log(
  `TOTAL=${tot} KATEX_OK=${ok} KATEX_BAD=${bad} NO_LATEX=${noLatex} cu_explicatie=${withExpl} proza_in_html=${proseInHtml}`,
);

const exp = fs.readFileSync(EXPORT, "utf-8");
const m = exp.match(/MATH_FIT_SCRIPT = `<script>([\s\S]*?)<\/script>`/);
let scriptOk = false;
if (m) {
  try {
    new Function(m[1]);
    scriptOk = true;
  } catch (e) {
    console.log("EXPORT-SCRIPT-PARSE-FAIL:", e.message);
  }
} else console.log("EXPORT-SCRIPT-NOT-FOUND");
console.log("export_fit_script_parseaza:", scriptOk);

const pass = bad === 0 && noLatex === 0 && proseInHtml === 0 && scriptOk;
console.log(pass ? "GATE: PASS" : "GATE: FAIL");
process.exit(pass ? 0 : 1);
