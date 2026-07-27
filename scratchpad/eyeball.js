// Eyeball: pentru o clasă, arată latex + glifele randate CURAT (fără MathML annotation).
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
const CLASA = process.argv[2] || "6";
const d = JSON.parse(fs.readFileSync(MATH, "utf-8"));
function glyphs(l) {
  const h = katex.renderToString(l, { throwOnError: false, strict: false });
  return h
    .replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/​/g, "")
    .trim();
}
const arr = d.formule[CLASA];
console.log(`CLASA ${CLASA} — ${arr.length} intrări\n${"=".repeat(70)}`);
arr.forEach((x, i) => {
  console.log(`[${String(i).padStart(2)}] ${x.grup} :: ${x.nume}`);
  console.log(`     latex : ${x.latex}`);
  console.log(`     RANDAT: ${glyphs(x.latex)}`);
  console.log(
    `     expl  : ${x.explicatie ? x.explicatie.slice(0, 80) + (x.explicatie.length > 80 ? "…" : "") : "(LIPSĂ)"}`,
  );
  console.log();
});
