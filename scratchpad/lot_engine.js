/**
 * Engine reutilizabil pt autorarea unui lot per clasă (#4 V→XII).
 * Fiecare scratchpad/clasa_<N>.js: require('./lot_engine').applyLot({CLASA, LATEX_FIX, EXPL, NEW}).
 *   - LATEX_FIX{nume}: curăță proza/formulele sudate (latex = pur simbolic; proza RO cu
 *     diacritice NU merge în \text{} → în explicatie).
 *   - EXPL{nume}: explicație (text profesor) pt fiecare intrare existentă fără ea.
 *   - NEW[{grup,nume,latex,explicatie}]: formule noi din golurile ➕ (plan §2).
 * Regenerează html din latex (output:"html"), scrie doar dacă TOTUL randează (throwOnError).
 * Guard anti-typo pe nume + anti-dublură. Apoi rulează gate_check.js + eyeball.js <N>.
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

function applyLot({ CLASA, LATEX_FIX = {}, EXPL = {}, NEW = [] }) {
  const d = JSON.parse(fs.readFileSync(MATH, "utf-8"));
  const arr = d.formule[CLASA];
  if (!arr) throw new Error(`Clasa ${CLASA} inexistentă`);

  const html = (l) =>
    katex.renderToString(l, {
      throwOnError: false,
      strict: false,
      output: "html",
    });
  const rendersOk = (l, nume) => {
    try {
      katex.renderToString(l, { throwOnError: true, strict: false });
      return true;
    } catch (e) {
      console.log(
        `  ✗ KATEX-FAIL [${nume}]: ${String(e.message).split("\n")[0]}`,
      );
      return false;
    }
  };

  // Guard anti-typo: fiecare cheie LATEX_FIX/EXPL trebuie să existe ca nume în clasă.
  const numeSet = new Set(arr.map((x) => x.nume));
  let guardFail = 0;
  for (const k of [...Object.keys(LATEX_FIX), ...Object.keys(EXPL)]) {
    if (!numeSet.has(k)) {
      console.log(`  ✗ NUME NEGĂSIT în clasa ${CLASA}: ${JSON.stringify(k)}`);
      guardFail++;
    }
  }
  if (guardFail) {
    console.log(`GUARD FAIL: ${guardFail} nume nepotrivite — abort.`);
    process.exit(1);
  }

  let fixedLatex = 0,
    addedExpl = 0,
    renderFail = 0;
  for (const x of arr) {
    if (LATEX_FIX[x.nume]) {
      x.latex = LATEX_FIX[x.nume];
      fixedLatex++;
    }
    if (EXPL[x.nume]) {
      x.explicatie = EXPL[x.nume];
      addedExpl++;
    }
    if (!rendersOk(x.latex, x.nume)) renderFail++;
    // rebuild în ordinea de chei canonică: grup, nume, html, latex, explicatie
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

  for (const n of NEW) {
    if (numeSet.has(n.nume)) {
      console.log(`  ✗ DUBLURĂ nume nou deja existent: ${n.nume}`);
      renderFail++;
      continue;
    }
    if (!rendersOk(n.latex, n.nume)) renderFail++;
    arr.push({
      grup: n.grup,
      nume: n.nume,
      html: html(n.latex),
      latex: n.latex,
      explicatie: n.explicatie,
    });
  }

  const totalLib = Object.values(d.formule).reduce((s, a) => s + a.length, 0);
  console.log(
    `Clasa ${CLASA}: latex_fix=${fixedLatex} expl_add=${addedExpl} noi=${NEW.length} render_fail=${renderFail}`,
  );
  console.log(
    `Total clasa ${CLASA} = ${arr.length}   |   Total bibliotecă = ${totalLib}`,
  );
  if (renderFail) {
    console.log("RENDER FAIL — NU scriu fișierul.");
    process.exit(1);
  }
  fs.writeFileSync(MATH, JSON.stringify(d), "utf-8");
  console.log("Scris:", path.relative(process.cwd(), MATH));
}

module.exports = { applyLot };
