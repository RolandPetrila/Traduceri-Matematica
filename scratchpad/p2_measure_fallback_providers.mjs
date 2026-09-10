// FAZA 4.5c — completare P2: latenta REALA a modelelor active azi pe fallback
// (groq gpt-oss-20b, mistral-small-latest x2) — datele istorice din Supabase pt
// acesti provideri sunt de la modele RETRASE (schimbate 2026-09-07), deci nu
// reprezinta comportamentul curent. Acelasi prompt greu (Radicali/VII/greu/10
// itemi/barem) ca la chain. NU trece prin Gemini — cota separata.
import fs from "fs";
import path from "path";

const ROOT = "C:/Proiecte/Traduceri_Matematica";
const BASE = "https://traduceri-frontend.vercel.app";
const OUT_DIR = path.join(ROOT, "99_Roland_Work/Teste_Output");
const ROUNDS_PER_PROVIDER = 3;
const SAFETY_TIMEOUT_MS = 55000;

const mathData = JSON.parse(
  fs.readFileSync(path.join(ROOT, "frontend/src/components/editor/math-data.json"), "utf8"),
);
const tabsData = JSON.parse(fs.readFileSync(path.join(ROOT, "config/tabs.json"), "utf8"));
function buildLibraryIndex() {
  const formule = mathData.formule || {};
  const order = ["5", "6", "7", "8", "9", "10", "11", "12"];
  const roman = { 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII" };
  const parts = [];
  for (const c of order) {
    const items = formule[c];
    if (!items || items.length === 0) continue;
    const groups = Array.from(new Set(items.map((i) => i.grup)));
    parts.push(`clasa ${roman[c] || c}: ${groups.join(", ")}`);
  }
  return parts.join(" · ");
}
function buildModulesList() {
  return (tabsData.tabs || []).map((t) => t.label).join(", ");
}
function buildSystemPrompt() {
  const lib = buildLibraryIndex();
  const modules = buildModulesList();
  const lines = [
    "Ești un asistent de MATEMATICĂ pentru o profesoară (Cristina) și elevii ei, la nivel gimnaziu–liceu (România/Slovacia).",
    "Răspunde în ROMÂNĂ (sau slovacă dacă întrebarea e în slovacă), clar și la obiect.",
    "Scrie formulele matematice între semne de dolar: $...$ pentru inline, $$...$$ pentru bloc (se randează cu KaTeX). Folosește notație LaTeX corectă.",
    "La rezolvări, arată TOȚI pașii clar. Când întrebarea are mai multe puncte (a, b, c, …), răspunde COMPLET la FIECARE, în ordine, până la ultimul — NU te opri la jumătate și nu sări peste niciun punct. La corectarea unei teme, indică exact unde e greșeala și cum se corectează.",
    "Ești onest: dacă nu ești sigur de un calcul, spune-o și sugerează verificarea cu modulul Calculator din aplicație.",
    "",
    `Aplicația în care ești integrat are modulele: ${modules}.`,
    "Editorul are un meniu „Matematică” (buton Σ) cu formule pe clase, un constructor de structuri (fracție/radical/limită/sumă/integrală, imbricabile), figuri geometrice editabile și import OCR.",
    "Modulul Calculator: științific + grafic de funcții + matrice/sisteme. Modulul Planșe: generatoare de fișe printabile.",
    lib ? `Biblioteca de formule din editor acoperă: ${lib}.` : "",
    "Dacă te întreabă unde găsește ceva în aplicație, îndrumă-l concret (ex. „Editor → Matematică → clasa VII → grupul Teoreme”).",
  ];
  return lines.filter((l) => l !== "").join("\n");
}
const ITEM_INSTR = {
  grila: "de tip alegere multiplă (grilă): enunț urmat de 4 variante etichetate a), b), c), d), din care exact UNA corectă",
  completare: "de tip completare: enunț cu unul sau două spații lipsă marcate „___” (termen, rezultat sau formulă de completat)",
  probleme: "de tip rezolvare de probleme: problemă cu enunț care cere rezolvare pas cu pas",
};
function buildGeneratePrompt(clasa, tema, difficulty, withAnswers, typeCounts) {
  const items = typeCounts.map((t) => ({ instr: ITEM_INSTR[t.key], n: t.n }));
  const total = items.reduce((s, x) => s + x.n, 0);
  const lines = [
    `Generează un test de matematică pentru clasa a ${clasa}-a, tema „${tema}", nivel ${difficulty}.`,
    `Testul are exact ${total} itemi, împărțiți pe tipuri astfel:`,
    ...items.map((x) => `- ${x.n} itemi ${x.instr}`),
    `Grupează itemii pe secțiuni, câte o secțiune per tip, fiecare cu un titlu scurt (ex. „I. Alegere multiplă”). Numerotează itemii continuu de la 1 la ${total} în tot testul.`,
    "Scrie formulele în LaTeX între semne de dolar ($...$). Conținutul să respecte programa românească pentru această clasă.",
    withAnswers
      ? "La final adaugă o secțiune „Barem / Soluții” cu răspunsul fiecărui item (litera corectă la alegere multiplă; termenul la completare; A sau F; perechile la corespondență; rezolvarea la probleme)."
      : "NU include răspunsurile (doar enunțurile).",
    "Nu adăuga introduceri sau comentarii — doar testul.",
  ];
  return lines.join("\n");
}
const SYSTEM = buildSystemPrompt();
const USER = buildGeneratePrompt("VII", "Radicali", "greu", true, [
  { key: "grila", n: 5 },
  { key: "completare", n: 3 },
  { key: "probleme", n: 2 },
]);
const MAX_TOKENS = 16384;

const PROVIDERS = [
  { id: "groq", label: "Groq (gpt-oss-20b)", model: "openai/gpt-oss-20b" },
  { id: "mistral", label: "Mistral Small", model: "mistral-small-latest" },
  { id: "mistral2", label: "Mistral Small (2)", model: "mistral-small-latest" },
];

function buildOpenAiPayload(model, system, userMsg, maxTokens) {
  return {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMsg },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
  };
}
function parseReply(json) {
  const choice = (json?.choices || [])[0];
  return (choice?.message?.content || "").trim();
}
function isTruncated(json) {
  return (json?.choices || [])[0]?.finish_reason === "length";
}

async function callOnce(step) {
  const body = buildOpenAiPayload(step.model, SYSTEM, USER, MAX_TOKENS);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SAFETY_TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE}/api/proxy?provider=${step.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    clearTimeout(timer);
    const ms = Date.now() - t0;
    if (!res.ok) {
      return { id: step.id, label: step.label, ms, httpStatus: res.status, outcome: `http_${res.status}`, bodySnippet: text.slice(0, 300) };
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    const reply = json ? parseReply(json) : "";
    if (reply) {
      return { id: step.id, label: step.label, ms, httpStatus: res.status, outcome: "success", truncated: isTruncated(json), replyLen: reply.length };
    }
    return { id: step.id, label: step.label, ms, httpStatus: res.status, outcome: "raspuns_gol" };
  } catch (e) {
    clearTimeout(timer);
    const ms = Date.now() - t0;
    const isAbort = e && e.name === "AbortError";
    return { id: step.id, label: step.label, ms, outcome: isAbort ? "timeout_siguranta_55s" : "eroare_retea", errMsg: e?.message };
  }
}

function percentile(arr, p) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

async function main() {
  console.log(`=== P2 — latenta fallback-uri ACTIVE (groq gpt-oss-20b, mistral-small-latest x2), ${ROUNDS_PER_PROVIDER} runde/provider ===`);
  const allResults = [];
  for (const step of PROVIDERS) {
    for (let i = 1; i <= ROUNDS_PER_PROVIDER; i++) {
      console.log(`\n${step.label} — runda ${i}/${ROUNDS_PER_PROVIDER} — start ${new Date().toISOString()}`);
      const r = await callOnce(step);
      allResults.push({ ...r, round: i, startedAtIso: new Date().toISOString() });
      console.log(`  -> ${r.ms}ms outcome=${r.outcome}${r.replyLen ? ` replyLen=${r.replyLen} truncated=${r.truncated}` : ""}`);
      await new Promise((res) => setTimeout(res, 1500));
    }
  }
  const byProvider = {};
  for (const r of allResults) {
    byProvider[r.id] ??= { label: r.label, ms: [], results: [] };
    byProvider[r.id].ms.push(r.ms);
    byProvider[r.id].results.push(r);
  }
  const stats = Object.fromEntries(
    Object.entries(byProvider).map(([id, v]) => [
      id,
      {
        label: v.label,
        n: v.ms.length,
        successes: v.results.filter((x) => x.outcome === "success").length,
        p50: percentile(v.ms, 50),
        p90: percentile(v.ms, 90),
        max: Math.max(...v.ms),
        min: Math.min(...v.ms),
        all_ms: v.ms,
      },
    ]),
  );
  const summary = { scenario: "acelasi prompt greu ca la chain, apel DIRECT (fara AbortController de productie, safety=55s)", stats, raw: allResults };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(OUT_DIR, `P2_masuratori_fallback_${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`\n=== Scris: ${outPath} ===`);
  for (const [id, s] of Object.entries(stats)) {
    console.log(`  ${id}: n=${s.n} successes=${s.successes} p50=${s.p50}ms p90=${s.p90}ms max=${s.max}ms min=${s.min}ms`);
  }
}
main().catch((e) => {
  console.error("EROARE FATALA:", e);
  process.exit(1);
});
