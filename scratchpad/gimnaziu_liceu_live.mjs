// Validare LIVE Gimnaziu (toate materiile) + Liceu (toate materiile) — generare REALĂ
// prin /api/proxy de pe PROD (infrastructură deja deployată), pe un eșantion diversificat
// din cele 75 fișiere noi. Regulamentele NU sunt încă deployate — citite din filesystem
// local; doar apelul AI e pe prod. Rulează cu: node scratchpad/gimnaziu_liceu_live.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REG_DIR = path.resolve(__dirname, "../frontend/public/scolare/regulamente");
const BASE = "https://traduceri-frontend.vercel.app";
const MAX_REGULAMENT_CHARS = 8000;

const NODES = [
  {
    label: "Gimnaziu Cl.5 · Limba Română",
    ref: "gimnaziu/clasa-5/limba-romana",
    nume: "Limba și Literatura Română",
    grupa: "Gimnaziu — Clasa a V-a",
    capitole: ["Lectură și înțelegerea textului", "Sintaxă — propoziția", "Morfologie — părțile de vorbire", "Ortografie și ortoepie"],
  },
  {
    label: "Gimnaziu Cl.8 · Biologie [gardă: ereditate/evoluție, nu anatomie nouă]",
    ref: "gimnaziu/clasa-8/biologie",
    nume: "Biologie",
    grupa: "Gimnaziu — Clasa a VIII-a",
    capitole: ["Ereditatea și variabilitatea", "Transmiterea materialului genetic", "Evoluționism", "Sănătatea omului și a mediului"],
  },
  {
    label: "Gimnaziu Cl.7 · Chimie",
    ref: "gimnaziu/clasa-7/chimie",
    nume: "Chimie",
    grupa: "Gimnaziu — Clasa a VII-a",
    capitole: ["Chimia și viața. Substanțele în natură", "Atom. Element chimic", "Tabelul Periodic. Ioni. Molecule"],
  },
  {
    label: "Liceu Cl.9 · Matematică [risc maxim: reformă iminentă]",
    ref: "liceu/clasa-9/matematica",
    nume: "Matematică",
    grupa: "Liceu — Clasa a IX-a",
    capitole: ["Mulțimi și logică matematică", "Șiruri", "Funcții și lecturi grafice", "Vectori în plan"],
    in_reforma: true,
  },
  {
    label: "Liceu Cl.12 · Filosofie",
    ref: "liceu/clasa-12/filosofie",
    nume: "Filosofie",
    grupa: "Liceu — Clasa a XII-a",
    capitole: ["Omul", "Morala", "Cunoașterea"],
    in_reforma: true,
  },
  {
    label: "Liceu Cl.11 · Informatică [risc: conținut SQL/cod]",
    ref: "liceu/clasa-11/informatica",
    nume: "Informatică",
    grupa: "Liceu — Clasa a XI-a",
    capitole: ["Subprograme — declarare, apel, parametri", "Recursivitate", "Liste, stive, cozi"],
    in_reforma: true,
  },
];

function refToFile(ref) {
  return ref.replace(/\//g, "_").replace(/clasa-/g, "clasa") + ".md";
}

function sanitizeFisa(text) {
  if (!text) return text;
  return text
    .replace(/(?:\\?_[ \t]?){8,}/g, "______")
    .replace(/([.\-·‾–—])\1{9,}/g, (_m, c) => c.repeat(6));
}

// verifyArithmetic replicat (vezi frontend/src/lib/scolare/verify-fisa.ts)
const SUPERSCRIPT = { "⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5","⁶":"6","⁷":"7","⁸":"8","⁹":"9" };
function num(s) { return parseFloat(s.replace(",", ".")); }
const EPS = 1e-6;
function apply(a, op, b) {
  switch (op) {
    case "+": return a + b;
    case "-": case "−": return a - b;
    case "×": case "x": case "*": case "·": return a * b;
    case ":": case "÷": case "/": return b === 0 ? null : a / b;
    default: return null;
  }
}
const CHAIN = "0123456789+-−×x*·⋅:÷/^=\\";
function cleanBoundary(text, start, end) {
  let i = start - 1;
  while (i >= 0 && (text[i] === " " || text[i] === "\t")) i--;
  if (i >= 0 && text[i] !== "\n") {
    if (CHAIN.indexOf(text[i]) >= 0) return false;
    if (text[i] >= "a" && text[i] <= "z") {
      let k = i;
      while (k >= 0 && text[k] >= "a" && text[k] <= "z") k--;
      if (k >= 0 && text[k] === "\\") return false;
    }
  }
  let j = end;
  while (j < text.length && (text[j] === " " || text[j] === "\t")) j++;
  if (j < text.length && text[j] !== "\n" && CHAIN.indexOf(text[j]) >= 0) return false;
  return true;
}
function verifyArithmetic(rawText) {
  const issues = [];
  let checked = 0;
  const text = rawText.replace(/(\d)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_m, base, sup) =>
    `${base}^${sup.replace(/./g, (c) => SUPERSCRIPT[c] ?? "")}`);
  const powRe = /(\d+(?:[.,]\d+)?)\s*\^\s*(\d+)\s*=\s*(-?\d+(?:[.,]\d+)?)/g;
  let pm;
  while ((pm = powRe.exec(text)) !== null) {
    if (!cleanBoundary(text, pm.index, pm.index + pm[0].length)) continue;
    const exp = parseInt(pm[2], 10);
    if (exp > 30) continue;
    const expected = Math.pow(num(pm[1]), exp);
    const found = num(pm[3]);
    checked++;
    if (Math.abs(expected - found) > EPS) issues.push({ expr: pm[0].trim(), expected, found });
  }
  const binRe = /(-?\d+(?:[.,]\d+)?)\s*([+\-−×x*·:÷/])\s*(\d+(?:[.,]\d+)?)\s*=\s*(-?\d+(?:[.,]\d+)?)/g;
  let bm;
  while ((bm = binRe.exec(text)) !== null) {
    if (!cleanBoundary(text, bm.index, bm.index + bm[0].length)) continue;
    const expected = apply(num(bm[1]), bm[2], num(bm[3]));
    if (expected === null) continue;
    const found = num(bm[4]);
    checked++;
    if (Math.abs(expected - found) > EPS) issues.push({ expr: bm[0].trim(), expected, found });
  }
  return { checked, issues };
}

function buildPrompt({ grupa, nume, capitole, regulament, in_reforma }) {
  const nrExercitii = 5;
  const lines = [];
  lines.push(`Creează o fișă de lucru A4 pentru ${grupa}, disciplina „${nume}", nivel de dificultate Standard.`);
  lines.push(`Fișa are exact ${nrExercitii} exerciții, numerotate de la 1 la ${nrExercitii}.`);
  if (capitole?.length) {
    lines.push("Acoperă teme din programa oficială (variază între ele): " + capitole.join("; ") + ".");
  }
  if (regulament?.trim()) {
    lines.push(
      "Respectă STRICT următorul regulament de conținut al clasei:",
      "---", regulament.trim().slice(0, MAX_REGULAMENT_CHARS), "---",
    );
  }
  if (in_reforma) {
    lines.push("ATENȚIE: programa acestei clase e în reformă curriculară (2026-2027). Rămâi la concepte fundamentale, larg acceptate.");
  }
  lines.push(
    "Structură: un titlu scurt, apoi exercițiile numerotate.",
    "La final adaugă „Barem / Soluții” cu răspunsul complet al fiecărui exercițiu.",
    "Formulele în LaTeX ($...$). Fără introduceri sau comentarii — doar fișa.",
    "Pentru spațiile de răspuns folosește un marcaj SCURT («______», «□», «(...)»). NU repeta niciun caracter de mai mult de 10 ori la rând.",
  );
  return lines.join("\n");
}

const SYSTEM_PROMPT = [
  "Ești un cadru didactic din România care creează fișe de lucru pentru elevi, aliniate la programa școlară oficială aprobată.",
  "Generezi conținut ORIGINAL, corect și adecvat vârstei/clasei. Nu copiezi din manuale.",
  "Scrii formulele matematice în LaTeX între semne de dolar ($...$).",
  "Răspunzi DOAR cu fișa (fără introduceri, fără comentarii meta).",
].join(" ");

async function fetchRegulament(ref) {
  const file = path.join(REG_DIR, refToFile(ref));
  try {
    const text = await readFile(file, "utf8");
    return { ok: true, text };
  } catch (e) {
    return { ok: false, text: "", err: e.message };
  }
}

async function generate(node) {
  const prompt = buildPrompt(node);
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 8192, temperature: 0.3 },
  };
  const res = await fetch(`${BASE}/api/proxy?provider=gemini`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE, Referer: BASE + "/" },
    body: JSON.stringify(body),
  });
  const status = res.status;
  let json = null;
  try { json = await res.json(); } catch {}
  const cand = json?.candidates?.[0];
  const reply = (cand?.content?.parts || []).map((p) => p.text || "").join("").trim();
  return { status, reply, finishReason: cand?.finishReason, raw: json };
}

async function main() {
  console.log(`=== Gimnaziu+Liceu LIVE validation — ${NODES.length} noduri eșantion ===\n`);
  let failures = 0;
  for (const node of NODES) {
    console.log(`--- ${node.label} ---`);
    const reg = await fetchRegulament(node.ref);
    console.log(`  regulament: ${reg.ok ? "OK" : "EROARE " + reg.err}, ${reg.text.length} chars`);
    if (!reg.ok || reg.text.length < 200) { failures++; continue; }
    const gen = await generate({ ...node, regulament: reg.text });
    console.log(`  generare: HTTP ${gen.status}, finishReason=${gen.finishReason}`);
    if (gen.status !== 200 || !gen.reply) {
      console.log(`  EȘEC:`, JSON.stringify(gen.raw).slice(0, 400));
      failures++; console.log(""); continue;
    }
    const sanitized = sanitizeFisa(gen.reply);
    console.log(`  reply: ${gen.reply.length} chars brut -> ${sanitized.length} după sanitize`);
    const runaway = sanitized.match(/(.)\1{15,}/);
    if (runaway) { console.log(`  ⚠ RUNAWAY rezidual: „${runaway[1]}" x${runaway[0].length}`); failures++; }
    else console.log(`  ✓ 0 runaway`);
    const verify = verifyArithmetic(sanitized);
    if (verify.issues.length > 0) {
      console.log(`  ⚠ verifyArithmetic: ${verify.issues.length} probleme din ${verify.checked} verificate`);
      verify.issues.forEach((i) => console.log(`      „${i.expr}" — așteptat ${i.expected}, găsit ${i.found}`));
      failures++;
    } else {
      console.log(`  ✓ verifyArithmetic: ${verify.checked} verificate, 0 probleme`);
    }
    console.log(`  --- primele 400 caractere ---`);
    console.log("  " + sanitized.slice(0, 400).replace(/\n/g, "\n  "));
    console.log("");
  }
  console.log(`=== TOTAL: ${NODES.length - failures}/${NODES.length} OK, ${failures} probleme ===`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => { console.error("EROARE SCRIPT:", e); process.exit(2); });
