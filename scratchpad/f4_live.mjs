// Validare LIVE F4 (Grădiniță) — generare REALĂ prin /api/proxy de pe PROD (Gemini,
// infrastructură deja deployată/generică), pe un eșantion de 6/12 noduri (cele mai
// riscante: fără exemple Carla, sau cu gărzi critice anti scope-creep). Regulamentele
// F4 NU sunt încă deployate (sesiune locală) — le citim din filesystem, nu din prod;
// doar apelul AI (/api/proxy) e pe prod, ca dovadă că pipeline-ul de generare reală
// funcționează cu conținutul nou. Rulează cu: node scratchpad/f4_live.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REG_DIR = path.resolve(
  __dirname,
  "../frontend/public/scolare/regulamente",
);

const BASE = "https://traduceri-frontend.vercel.app";
const ORIGIN = BASE;
const MAX_REGULAMENT_CHARS = 8000;

const NODES = [
  {
    label: "Grupa Mică · Comunicare (DLC)",
    ref: "gradinita/grupa-mica/comunicare",
    nume: "Comunicare",
    tipNod: "domeniul de dezvoltare",
    grupa: "Grădiniță — Grupa Mică",
    capitole: [
      "Recunoaștere vizuală litere mari de tipar (A, M, S, O)",
      "Cuvinte simple, familiare (MAMA, CASA, MAR)",
      "Identificarea sunetului inițial (cu sprijin vizual)",
      "Elemente grafice de pre-scriere (trasare contur mare)",
    ],
    forbidden: [/\bge\b|\bgi\b|\bche\b|\bchi\b|\bghe\b|\bghi\b/i],
  },
  {
    label: "Grupa Mică · Matematică (DS)",
    ref: "gradinita/grupa-mica/matematica",
    nume: "Matematică",
    tipNod: "domeniul de dezvoltare",
    grupa: "Grădiniță — Grupa Mică",
    capitole: [
      "Numerele 1-5 (recunoaștere, numărare, asociere cifră-cantitate)",
      "Comparare cantități (mult/puțin, mai multe/mai puține)",
      "Forme geometrice de bază (cerc, pătrat, opțional triunghi)",
    ],
    // <>= ca simbol de RELAȚIE matematică (nu artefact ASCII gen "<-------->" de
    // desenat o linie de unire) — interzis la Grupa Mică (apare abia la Grupa Mare).
    // "+"/"-" BAR (fără "=" obligatoriu) — regulamentul zice "NU se scriu operații
    // matematice (+, -) sub nicio formă", nu doar ecuații complete (advisor: regexul
    // vechi /..+..=..(\d)/ nu testa exact afirmația scrisă în regulament).
    forbidden: [/\d\s*[+\-]\s*\d/, /\d\s*[<>](?!-)(?<!-)\s*\d/],
  },
  {
    label: "Grupa Mijlocie · Practică (DOS)",
    ref: "gradinita/grupa-mijlocie/practica",
    nume: "Practică",
    tipNod: "domeniul de dezvoltare",
    grupa: "Grădiniță — Grupa Mijlocie",
    capitole: [
      "Igienă personală și sănătate de bază",
      "Orientare spațială simplă (sus/jos/stânga/dreapta)",
      "Comportament civilizat, reguli sociale simple",
      "Siguranță personală de bază",
    ],
    forbidden: [],
  },
  {
    label: "Grupa Mijlocie · Educație Plastică (DEC)",
    ref: "gradinita/grupa-mijlocie/educatie-plastica",
    nume: "Educație Plastică",
    tipNod: "domeniul de dezvoltare",
    grupa: "Grădiniță — Grupa Mijlocie",
    capitole: [
      "Amestecul culorilor (culori secundare simple)",
      "Desen tematic",
      "Simetrie simplă (a doua jumătate a desenului)",
      "Colorare pe coduri",
    ],
    forbidden: [/\d\s*[+\-]\s*\d\s*=\s*\d/],
  },
  {
    label: "Grupa Mare · Matematică (DS) [gardă critică: fără ecuații scrise]",
    ref: "gradinita/grupa-mare/matematica",
    nume: "Matematică",
    tipNod: "domeniul de dezvoltare",
    grupa: "Grădiniță — Grupa Mare",
    capitole: [
      "Numerele 1-10, vecinii numerelor",
      "Comparare cu semnele <, >, = (relație, nu calcul)",
      "Descompunerea numerelor (vizual, prin obiecte desenate)",
      "Probleme ilustrate simple, rezolvate prin numărare",
    ],
    // Regulamentul: „«+» nu apare NICIODATĂ" — testăm afirmația EXACTĂ (bare "+"
    // între cifre), nu doar ecuația completă "a+b=c" (advisor: regex vechi prea slab).
    forbidden: [/\d\s*\+\s*\d/],
  },
  {
    label:
      "Grupa Mare · Cunoașterea Mediului [gardă critică: fără sisteme anatomice]",
    ref: "gradinita/grupa-mare/cunoasterea-mediului",
    nume: "Cunoașterea Mediului",
    tipNod: "domeniul de dezvoltare",
    grupa: "Grădiniță — Grupa Mare",
    capitole: [
      "Animale și habitatele lor",
      "Anotimpurile (caracteristici vizibile)",
      "Corpul omenesc — DOAR părți vizibile + organe de simț",
      "Protejarea naturii (comportamente concrete)",
    ],
    forbidden: [
      /schelet/i,
      /mu[sș]chi/i,
      /aparat\s+(respirator|circulator|digestiv)/i,
      /sistem\s+(osos|muscular|nervos)/i,
      /organe?\s+intern/i,
    ],
  },
];

// Replică sanitizeFisa (frontend/src/lib/scolare/sanitize.ts) — scriptul apelează
// /api/proxy brut, fără trecerea prin ScolarePanel, deci aplicăm manual aceeași
// curățare determinist ca să vedem exact ce ar afișa aplicația (nu raw AI output).
function sanitizeFisa(text) {
  if (!text) return text;
  return text
    .replace(/(?:\\?_[ \t]?){8,}/g, "______")
    .replace(/([.\-·‾–—])\1{9,}/g, (_m, c) => c.repeat(6));
}

// Replică verifyArithmetic (frontend/src/lib/scolare/verify-fisa.ts) — 3/3 sesiuni
// anterioare (F0/F1/F3) au prins fals-pozitive reale DOAR rulând-o pe output AI real,
// nu presupunând că prompt-ul e respectat. F4 introduce <,>,= ca simboluri de RELAȚIE
// (vocabular nou pt acest verificator) — trebuie verificat pe capturi reale.
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

function refToFile(ref) {
  return ref.replace(/\//g, "_").replace(/clasa-/g, "clasa") + ".md";
}

function buildPrompt({ grupa, nume, tipNod, capitole, regulament }) {
  const nrExercitii = 5;
  const lines = [];
  lines.push(
    `Creează o fișă de lucru A4 pentru ${grupa}, ${tipNod} „${nume}", nivel de dificultate Standard.`,
  );
  lines.push(
    `Fișa are exact ${nrExercitii} exerciții, numerotate de la 1 la ${nrExercitii}.`,
  );
  if (capitole && capitole.length) {
    lines.push(
      "Acoperă teme din programa oficială (variază între ele, nu toate din același capitol): " +
        capitole.join("; ") +
        ".",
    );
  }
  if (regulament && regulament.trim()) {
    lines.push(
      "Respectă STRICT următorul regulament de conținut al grupei (concepte permise, tipuri de exerciții, interdicții):",
      "---",
      regulament.trim().slice(0, MAX_REGULAMENT_CHARS),
      "---",
    );
  }
  lines.push(
    "Structură: un titlu scurt al fișei, apoi exercițiile numerotate (fiecare pe rândul lui, cu enunț clar).",
    "La final adaugă o secțiune „Barem / Soluții” cu răspunsul complet al fiecărui exercițiu.",
    "Formulele în LaTeX ($...$). Fără introduceri sau comentarii — doar fișa.",
    "Pentru spațiile de răspuns folosește un marcaj SCURT (de exemplu «______» de cel mult ~10 caractere, «□» sau «(...)»). NU genera linii sau zone goale de scriere pentru elev (elevul scrie pe caiet) și NU repeta niciun caracter de mai mult de 10 ori la rând.",
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
    return { ok: true, status: "local-fs", text };
  } catch (e) {
    return { ok: false, status: `local-fs error: ${e.message}`, text: "" };
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
    headers: {
      "Content-Type": "application/json",
      Origin: ORIGIN,
      Referer: ORIGIN + "/",
    },
    body: JSON.stringify(body),
  });
  const status = res.status;
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  const cand = json?.candidates?.[0];
  const reply = (cand?.content?.parts || [])
    .map((p) => p.text || "")
    .join("")
    .trim();
  const finishReason = cand?.finishReason;
  return { status, reply, finishReason, raw: json };
}

async function main() {
  console.log(`=== F4 LIVE validation — ${NODES.length} noduri eșantion ===\n`);
  let failures = 0;
  for (const node of NODES) {
    console.log(`--- ${node.label} ---`);
    const reg = await fetchRegulament(node.ref);
    console.log(
      `  regulament: HTTP ${reg.status}, ${reg.text.length} chars ${reg.ok && reg.text.length > 200 ? "OK" : "PROBLEMA"}`,
    );
    if (!reg.ok || reg.text.length < 200) {
      failures++;
      continue;
    }
    const gen = await generate({ ...node, regulament: reg.text });
    console.log(`  generare: HTTP ${gen.status}, finishReason=${gen.finishReason}`);
    if (gen.status !== 200 || !gen.reply) {
      console.log(`  EȘEC generare:`, JSON.stringify(gen.raw).slice(0, 500));
      failures++;
      console.log("");
      continue;
    }
    const rawLen = gen.reply.length;
    const sanitized = sanitizeFisa(gen.reply);
    console.log(
      `  reply length: ${rawLen} chars (brut) → ${sanitized.length} chars (după sanitizeFisa, ca-n aplicație)`,
    );
    let leakFound = false;
    for (const rx of node.forbidden || []) {
      const m = sanitized.match(rx);
      if (m) {
        leakFound = true;
        console.log(`  ⚠ SCURGERE detectată (${rx}): "...${sanitized.slice(Math.max(0, m.index - 40), m.index + 40)}..."`);
      }
    }
    if (!leakFound) console.log(`  ✓ 0 scurgeri curriculare (${(node.forbidden || []).length} verificări, pe textul sanitizat)`);
    else failures++;
    // runaway check DUPĂ sanitizeFisa (ce vede efectiv utilizatorul în aplicație)
    const runaway = sanitized.match(/(.)\1{15,}/);
    if (runaway) {
      console.log(`  ⚠ RUNAWAY REZIDUAL (după sanitize): caracter „${runaway[1]}" repetat ${runaway[0].length}x`);
      failures++;
    } else if (rawLen !== sanitized.length) {
      console.log(`  ✓ 0 runaway rezidual (sanitizeFisa a curățat ${rawLen - sanitized.length} caractere de umplere)`);
    } else {
      console.log(`  ✓ 0 runaway`);
    }
    // verifyArithmetic pe TEXTUL COMPLET (barem inclus) — 3/3 sesiuni anterioare au
    // prins fals-pozitive reale DOAR verificând output AI real, niciodată presupunând.
    const verify = verifyArithmetic(sanitized);
    if (verify.issues.length > 0) {
      console.log(`  ⚠ verifyArithmetic: ${verify.checked} verificate, ${verify.issues.length} PROBLEME:`);
      verify.issues.forEach((i) => console.log(`      „${i.expr}" — așteptat ${i.expected}, găsit ${i.found}`));
      failures++;
    } else {
      console.log(`  ✓ verifyArithmetic: ${verify.checked} egalități verificate, 0 probleme`);
    }
    const showFull = node.ref.includes("matematica");
    console.log(`  --- ${showFull ? "text COMPLET (sanitizat)" : "primele 500 caractere (sanitizat)"} ---`);
    console.log(
      "  " + (showFull ? sanitized : sanitized.slice(0, 500)).replace(/\n/g, "\n  "),
    );
    console.log("");
  }
  console.log(`=== TOTAL: ${NODES.length - failures}/${NODES.length} noduri OK, ${failures} probleme ===`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("EROARE SCRIPT:", e);
  process.exit(2);
});
