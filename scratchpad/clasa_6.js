/**
 * Autorare Clasa VI (#4) — model repetabil V→XII (vezi scratchpad/README_autorare_math.md).
 *   LATEX_FIX{nume} — curăță proza/formulele sudate (latex = PUR simbolic; proza RO cu
 *                     diacritice NU merge în \text{} → merge în explicatie).
 *   EXPL{nume}      — explicație (text profesor) pt fiecare intrare existentă fără ea.
 *   NEW[]           — formule noi din golurile ➕ ale clasei VI (plan §2).
 * html regenerat din latex final cu katex (output:"html", ca restul bibliotecii).
 * Rulează: node scratchpad/clasa_6.js  → apoi node scratchpad/gate_check.js (GATE: PASS).
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
const CLASA = "6";

const d = JSON.parse(fs.readFileSync(MATH, "utf-8"));
const arr = d.formule[CLASA];

// --- 1. LATEX_FIX: curăță proza sudată în latex (după nume) ---
const LATEX_FIX = {
  "Proporție derivată":
    "\\dfrac{a}{b} = \\dfrac{c}{d} \\Rightarrow a \\times d = b \\times c \\quad (b, d \\ne 0)",
  "Procente — aflarea a p% din N":
    "p\\% \\text{ din } N = \\dfrac{p \\times N}{100}",
  "Regula de trei simplă (direct proporțional)":
    "a \\to b, \\; c \\to x \\Rightarrow x = \\dfrac{b \\times c}{a} \\quad (a \\ne 0)",
  "Media aritmetică a două numere": "m = \\dfrac{a + b}{2}",
  "Media ponderată":
    "m = \\dfrac{a \\times p + b \\times q}{p + q} \\quad (p + q \\ne 0)",
  "Modulul unui număr întreg":
    "|a| = \\begin{cases} a, & a \\ge 0 \\\\ -a, & a < 0 \\end{cases}",
  "Aria triunghiului": "A = \\dfrac{b \\times h}{2}",
  "Unghiuri complementare / suplementare":
    "\\alpha + \\beta = 90^{\\circ}\\ (\\text{compl.}), \\quad \\gamma + \\delta = 180^{\\circ}\\ (\\text{supl.})",
  "Unghiuri formate de 2 paralele + secantă":
    "a \\parallel b \\Rightarrow \\widehat{1} \\cong \\widehat{5}, \\;\\; \\widehat{4} \\cong \\widehat{6}",
  "Regula semnelor la înmulțire/împărțire":
    "(+) \\cdot (+) = +, \\quad (+) \\cdot (-) = -, \\quad (-) \\cdot (-) = +",
  "Rotunjirea unui număr": "3{,}47 \\approx 3{,}5",
  "Regula de trei simplă (invers proporțional)":
    "a \\to b, \\; c \\to x \\Rightarrow x = \\dfrac{a \\times b}{c} \\quad (c \\ne 0)",
  "Proprietăți paralelogram":
    "AB \\parallel CD,\\ AB \\cong CD \\;;\\; \\widehat{A} \\cong \\widehat{C}",
  "Proprietăți romb":
    "AB \\cong BC \\cong CD \\cong DA \\;;\\; d_{1} \\perp d_{2}",
};

// --- 2. EXPL: explicație la fiecare intrare existentă fără explicatie ---
const EXPL = {
  "Proporție derivată":
    "Proprietatea fundamentală a proporțiilor: produsul extremilor (a·d) este egal cu produsul mezilor (b·c). Se folosește pentru a afla un termen necunoscut („înmulțire în cruce”).",
  "Procente — aflarea a p% din N":
    "Pentru a afla p procente dintr-un număr N, înmulțești N cu p și împarți la 100. Ex.: 20% din 150 = (20·150)/100 = 30.",
  "Regula de trei simplă (direct proporțional)":
    "Mărimi direct proporționale: dacă la a corespunde b, atunci la c corespunde x = (b·c)/a. Când o mărime crește, cealaltă crește în aceeași proporție.",
  "Media aritmetică a două numere":
    "Media aritmetică a două numere este suma lor împărțită la 2. Se află „la mijloc” între cele două valori.",
  "Media ponderată":
    "Media ponderată ține cont de „greutățile” (ponderile) p și q ale valorilor a și b: fiecare valoare se înmulțește cu ponderea sa, se adună, apoi se împarte la suma ponderilor.",
  "Modulul unui număr întreg":
    "Modulul (valoarea absolută) al unui număr întreg este distanța sa față de 0 pe axă; este întotdeauna pozitiv sau 0. Numerele opuse au același modul.",
  "Aria dreptunghiului":
    "Aria dreptunghiului = lungimea (L) înmulțită cu lățimea (l), exprimate în aceeași unitate de măsură.",
  "Aria pătratului":
    "Aria pătratului = latura la pătrat (l²), deoarece toate laturile sunt egale.",
  "Aria triunghiului":
    "Aria triunghiului = (baza × înălțimea) : 2, unde înălțimea este perpendiculara din vârf pe baza b.",
  "Lungimea cercului":
    "Lungimea (circumferința) cercului = 2·π·r, unde r este raza. π ≈ 3,14.",
  "Aria cercului":
    "Aria discului mărginit de cerc = π·r². Se folosește aceeași rază ca la lungimea cercului.",
  "Unghiuri complementare / suplementare":
    "Două unghiuri sunt complementare dacă suma măsurilor lor este 90°, și suplementare dacă suma lor este 180°.",
  "Unghiuri formate de 2 paralele + secantă":
    "Când două drepte paralele sunt tăiate de o secantă se formează perechi de unghiuri: corespondente (congruente), alterne interne (congruente), alterne externe (congruente) și interne de aceeași parte (suplementare).",
  "Suma unghiurilor unui patrulater convex":
    "Suma măsurilor unghiurilor oricărui patrulater convex este 360°. (Patrulaterul se împarte în 2 triunghiuri: 2 × 180°.)",
  "Diametru și rază":
    "Diametrul cercului este dublul razei. Este cea mai lungă coardă și trece prin centru.",
  "Regula semnelor la înmulțire/împărțire":
    "La înmulțire și împărțire: semne la fel → rezultat pozitiv (+); semne diferite → rezultat negativ (−).",
  "Rotunjirea unui număr":
    "Regula rotunjirii: dacă prima cifră neglijată este ≥ 5, rotunjești în sus; dacă este < 5, rotunjești în jos. Ex.: 3,47 rotunjit la zecimi → 3,5 (cifra a doua zecimală este 7 ≥ 5).",
  "Regula de trei simplă (invers proporțional)":
    "Mărimi invers proporționale: produsul lor rămâne constant, deci x = (a·b)/c. (Ex.: mai mulți muncitori → timp de lucru mai scurt.)",
  "Proprietăți paralelogram":
    "Paralelogramul are: laturile opuse paralele și congruente; unghiurile opuse congruente; unghiurile alăturate suplementare; diagonalele se înjumătățesc.",
  "Proprietăți romb":
    "Rombul este un paralelogram cu toate laturile congruente. Diagonalele sunt perpendiculare, se înjumătățesc și sunt bisectoarele unghiurilor.",
};

// --- 3. NEW: formule noi din golurile ➕ ale clasei VI (plan §2) ---
const NEW = [
  {
    grup: "Rapoarte și proporții",
    nume: "Șir de rapoarte egale",
    latex:
      "\\dfrac{a}{b} = \\dfrac{c}{d} = \\dfrac{a + c}{b + d} \\quad (b + d \\ne 0)",
    explicatie:
      "Într-un șir de rapoarte egale, raportul dintre suma numărătorilor și suma numitorilor este egal cu fiecare raport. Foarte util la problemele cu proporții (mărimi proporționale).",
  },
  {
    grup: "Rapoarte și proporții",
    nume: "Mărimi direct proporționale",
    latex: "\\dfrac{a_{1}}{b_{1}} = \\dfrac{a_{2}}{b_{2}} = \\ldots = k",
    explicatie:
      "Două mărimi sunt direct proporționale dacă raportul valorilor corespunzătoare este constant (k = factorul de proporționalitate). Când una crește, cealaltă crește proporțional.",
  },
  {
    grup: "Rapoarte și proporții",
    nume: "Mărimi invers proporționale",
    latex: "a_{1} \\cdot b_{1} = a_{2} \\cdot b_{2} = \\ldots = k",
    explicatie:
      "Două mărimi sunt invers proporționale dacă produsul valorilor corespunzătoare este constant. Când una crește, cealaltă scade în aceeași proporție.",
  },
  {
    grup: "Rapoarte și proporții",
    nume: "Mărire / micșorare cu p%",
    latex: "N_{1} = N \\left(1 \\pm \\dfrac{p}{100}\\right)",
    explicatie:
      "Mărirea unui număr cu p%: înmulțești cu (1 + p/100). Micșorarea cu p%: înmulțești cu (1 − p/100). Ex.: 200 mărit cu 15% = 200 · 1,15 = 230.",
  },
  {
    grup: "Ecuații",
    nume: "Ecuația de gradul I",
    latex: "ax + b = 0 \\Rightarrow x = -\\dfrac{b}{a} \\quad (a \\ne 0)",
    explicatie:
      "Ecuația de gradul I: izolezi necunoscuta. Treci termenul liber b în dreapta (devine −b), apoi împarți la coeficientul a. Soluția: x = −b/a.",
  },
  {
    grup: "Patrulatere",
    nume: "Aria paralelogramului",
    latex: "A = b \\times h",
    explicatie:
      "Aria paralelogramului = baza (b) înmulțită cu înălțimea corespunzătoare (h = distanța dintre laturile paralele). Atenție: se folosește înălțimea, nu latura oblică.",
  },
  {
    grup: "Patrulatere",
    nume: "Aria rombului",
    latex: "A = \\dfrac{d_{1} \\times d_{2}}{2}",
    explicatie:
      "Aria rombului = semiprodusul diagonalelor (d₁ și d₂). Diagonalele fiind perpendiculare, rombul se împarte în 4 triunghiuri dreptunghice. Alternativ: A = latura × înălțime.",
  },
  {
    grup: "Patrulatere",
    nume: "Aria trapezului",
    latex: "A = \\dfrac{(B + b) \\times h}{2}",
    explicatie:
      "Aria trapezului = (baza mare B + baza mică b) înmulțită cu înălțimea h, împărțit la 2. Echivalent: linia mijlocie × înălțimea.",
  },
  {
    grup: "Organizarea datelor",
    nume: "Frecvența relativă",
    latex: "f_{r} = \\dfrac{n_{i}}{N}",
    explicatie:
      "Frecvența relativă a unei valori = de câte ori apare (frecvența absolută nᵢ) împărțit la numărul total de date N. Se poate exprima procentual (× 100%).",
  },
];

// --- Aplicare ---
function html(latex) {
  return katex.renderToString(latex, {
    throwOnError: false,
    strict: false,
    output: "html",
  });
}
function assertRender(latex, nume) {
  try {
    katex.renderToString(latex, { throwOnError: true, strict: false });
  } catch (e) {
    console.log(
      `  ✗ KATEX-FAIL [${nume}]: ${String(e.message).split("\n")[0]}`,
    );
    return false;
  }
  return true;
}

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
  console.log(`GUARD FAIL: ${guardFail} nume nepotrivite — abort, nu scriu.`);
  process.exit(1);
}

let fixedLatex = 0,
  addedExpl = 0,
  regen = 0,
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
  if (!assertRender(x.latex, x.nume)) renderFail++;
  x.html = html(x.latex);
  regen++;
  // rebuild în ordinea de chei canonică: grup, nume, html, latex, explicatie
  const o = { grup: x.grup, nume: x.nume, html: x.html, latex: x.latex };
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
  if (!assertRender(n.latex, n.nume)) renderFail++;
  arr.push({
    grup: n.grup,
    nume: n.nume,
    html: html(n.latex),
    latex: n.latex,
    explicatie: n.explicatie,
  });
}

const totalCls = arr.length;
const totalLib = Object.values(d.formule).reduce((s, a) => s + a.length, 0);
console.log(
  `Clasa ${CLASA}: latex_fix=${fixedLatex} expl_add=${addedExpl} regen_html=${regen} noi=${NEW.length} render_fail=${renderFail}`,
);
console.log(
  `Total clasa ${CLASA} = ${totalCls}   |   Total bibliotecă = ${totalLib}`,
);

if (renderFail) {
  console.log("RENDER FAIL — NU scriu fișierul.");
  process.exit(1);
}
fs.writeFileSync(MATH, JSON.stringify(d), "utf-8");
console.log("Scris:", path.relative(process.cwd(), MATH));
