// FAZA 4.5c — masurare P2 (timeout lant AI la Teste mari), 2026-09-10.
// Reproduce FIDEL sendChat() din frontend/src/lib/chat-providers.ts (CHAIN,
// GENERATION_OPTS, logica de timeout/buget) + promptul EXACT generat de
// buildSystemPrompt (chat-context.ts) si buildGeneratePrompt (test-generator.ts),
// pt cazul incidentului real din Supabase (2026-09-09 19:35/19:36): tema
// "Radicali", clasa VII, dificultate "greu", 10 itemi (5 grila + 3 completare +
// 2 probleme, = DEFAULT_COUNTS din TestePanel.tsx), cu barem.
// Ruleaza N runde SECVENTIAL (ca experienta reala a Cristinei, nu paralel),
// inregistreaza latenta per provider SI timpul total al lantului, opreste
// devreme daca detecteaza semnal de cota (429/RESOURCE_EXHAUSTED).
import fs from "fs";
import path from "path";

const ROOT = "C:/Proiecte/Traduceri_Matematica";
const BASE = "https://traduceri-frontend.vercel.app";
const N_ROUNDS = Number(process.argv[2] || 10);
const OUT_DIR = path.join(ROOT, "99_Roland_Work/Teste_Output");

// ---------- reconstructie system prompt (chat-context.ts) ----------
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

// ---------- reconstructie user prompt (test-generator.ts) ----------
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

// ---------- CHAIN + GENERATION_OPTS, IDENTIC cu chat-providers.ts ----------
const CHAIN = [
  { id: "gemini", label: "Gemini Flash", format: "gemini" },
  { id: "gemini2", label: "Gemini Flash (2)", format: "gemini" },
  { id: "groq", label: "Groq (gpt-oss-20b)", model: "openai/gpt-oss-20b", format: "openai" },
  { id: "mistral", label: "Mistral Small", model: "mistral-small-latest", format: "openai" },
  { id: "mistral2", label: "Mistral Small (2)", model: "mistral-small-latest", format: "openai" },
];
const GENERATION_OPTS = { maxTokens: 16384, timeoutMs: 52000, budgetMs: 58000 };

function buildGeminiPayload(system, messages, maxTokens) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
  };
}
function buildOpenAiPayload(model, system, messages, maxTokens) {
  return {
    model,
    messages: [{ role: "system", content: system }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
    max_tokens: maxTokens,
    temperature: 0.3,
  };
}
function parseReply(providerId, json) {
  const j = json || {};
  if (providerId === "gemini" || providerId === "gemini2") {
    const cand = (j.candidates || [])[0];
    return (cand?.content?.parts || []).map((p) => p.text || "").join("").trim();
  }
  const choice = (j.choices || [])[0];
  return (choice?.message?.content || "").trim();
}
function isTruncated(providerId, json) {
  const j = json || {};
  if (providerId === "gemini" || providerId === "gemini2") {
    return (j.candidates || [])[0]?.finishReason === "MAX_TOKENS";
  }
  return (j.choices || [])[0]?.finish_reason === "length";
}
function quotaSignal(status, text) {
  const t = (text || "").toLowerCase();
  return status === 429 || status === 402 || t.includes("resource_exhausted") || t.includes("quota");
}

async function runOneRound(roundIdx) {
  const messages = [{ role: "user", content: USER }];
  const maxTokens = GENERATION_OPTS.maxTokens;
  const stepTimeout = GENERATION_OPTS.timeoutMs;
  const budget = Math.max(GENERATION_OPTS.budgetMs, stepTimeout + 3000);
  const errors = [];
  const steps = [];
  const chainStart = Date.now();
  let quotaHit = false;
  let final = { ok: false, provider: null, truncated: false };

  for (const step of CHAIN) {
    const remaining = budget - (Date.now() - chainStart);
    if (remaining <= 1000) {
      errors.push("buget lanț depășit");
      steps.push({ id: "(buget)", label: "buget lanț depășit", ms: 0, outcome: "buget_epuizat" });
      break;
    }
    const body =
      step.format === "gemini"
        ? buildGeminiPayload(SYSTEM, messages, maxTokens)
        : buildOpenAiPayload(step.model || "", SYSTEM, messages, maxTokens);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), Math.min(stepTimeout, remaining));
    const t0 = Date.now();
    let outcome = "?";
    let httpStatus = null;
    try {
      const res = await fetch(`${BASE}/api/proxy?provider=${step.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: BASE },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      httpStatus = res.status;
      const text = await res.text();
      clearTimeout(timer);
      const ms = Date.now() - t0;
      if (!res.ok) {
        if (quotaSignal(res.status, text)) quotaHit = true;
        outcome = `http_${res.status}`;
        errors.push(`${step.label}: HTTP ${res.status}`);
        steps.push({ id: step.id, label: step.label, ms, outcome, httpStatus, bodySnippet: text.slice(0, 300) });
        continue;
      }
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
      const reply = json ? parseReply(step.id, json) : "";
      if (reply) {
        outcome = "success";
        steps.push({
          id: step.id,
          label: step.label,
          ms,
          outcome,
          httpStatus,
          truncated: isTruncated(step.id, json),
          replyLen: reply.length,
        });
        final = { ok: true, provider: step.label, truncated: isTruncated(step.id, json) };
        break;
      }
      outcome = "raspuns_gol";
      errors.push(`${step.label}: răspuns gol`);
      steps.push({ id: step.id, label: step.label, ms, outcome, httpStatus });
    } catch (e) {
      clearTimeout(timer);
      const ms = Date.now() - t0;
      const isAbort = e && e.name === "AbortError";
      outcome = isAbort ? "timeout" : "eroare_retea";
      errors.push(`${step.label}: ${isAbort ? "timeout" : e?.message || "eroare rețea"}`);
      steps.push({ id: step.id, label: step.label, ms, outcome });
    }
  }

  const totalMs = Date.now() - chainStart;
  return {
    round: roundIdx,
    startedAtIso: new Date(chainStart).toISOString(),
    totalMs,
    ok: final.ok,
    provider: final.provider,
    truncated: final.truncated,
    errors,
    steps,
    quotaHit,
  };
}

function percentile(arr, p) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

async function main() {
  console.log(`=== P2 masurare lant AI — Teste greu (${N_ROUNDS} runde tinta) ===`);
  console.log(`Tema=Radicali clasa=VII diff=greu itemi=10 (5 grila+3 completare+2 probleme) barem=da`);
  console.log(`GENERATION_OPTS live: maxTokens=${GENERATION_OPTS.maxTokens} timeoutMs=${GENERATION_OPTS.timeoutMs} budgetMs=${GENERATION_OPTS.budgetMs}`);
  const rounds = [];
  let stoppedEarly = false;
  for (let i = 1; i <= N_ROUNDS; i++) {
    console.log(`\n--- Runda ${i}/${N_ROUNDS} — start ${new Date().toISOString()} ---`);
    const r = await runOneRound(i);
    rounds.push(r);
    const stepsDesc = r.steps.map((s) => `${s.id}:${s.ms}ms(${s.outcome})`).join(" -> ");
    console.log(`Runda ${i}: total=${r.totalMs}ms ok=${r.ok} provider=${r.provider || "-"} | ${stepsDesc}`);
    if (r.quotaHit) {
      console.log(`⚠️ SEMNAL DE COTĂ detectat (429/402/quota) în runda ${i}. Opresc măsurătoarea aici (R-COST).`);
      stoppedEarly = true;
      break;
    }
    if (i < N_ROUNDS) await new Promise((r) => setTimeout(r, 3000));
  }

  const totalMsArr = rounds.map((r) => r.totalMs);
  const byProvider = {};
  for (const r of rounds) {
    for (const s of r.steps) {
      if (s.id === "(buget)") continue;
      byProvider[s.id] ??= { label: s.label, attempts: 0, successes: 0, ms: [] };
      byProvider[s.id].attempts++;
      if (s.outcome === "success") byProvider[s.id].successes++;
      byProvider[s.id].ms.push(s.ms);
    }
  }
  const providerStats = Object.fromEntries(
    Object.entries(byProvider).map(([id, v]) => [
      id,
      {
        label: v.label,
        attempts: v.attempts,
        successes: v.successes,
        p50: percentile(v.ms, 50),
        p90: percentile(v.ms, 90),
        max: Math.max(...v.ms),
        min: Math.min(...v.ms),
        all_ms: v.ms,
      },
    ]),
  );

  const summary = {
    scenario: { tema: "Radicali", clasa: "VII", dificultate: "greu", itemi: 10, barem: true },
    generationOpts: GENERATION_OPTS,
    roundsRequested: N_ROUNDS,
    roundsCompleted: rounds.length,
    stoppedEarlyForQuota: stoppedEarly,
    chainTotalMs: {
      p50: percentile(totalMsArr, 50),
      p90: percentile(totalMsArr, 90),
      max: Math.max(...totalMsArr),
      min: Math.min(...totalMsArr),
      all: totalMsArr,
    },
    successRate: `${rounds.filter((r) => r.ok).length}/${rounds.length}`,
    fullFailRate: `${rounds.filter((r) => !r.ok).length}/${rounds.length}`,
    providerStats,
    rounds,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(OUT_DIR, `P2_masuratori_lant_teste_${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`\n=== Scris: ${outPath} ===`);
  console.log(`Total lant: p50=${summary.chainTotalMs.p50}ms p90=${summary.chainTotalMs.p90}ms max=${summary.chainTotalMs.max}ms`);
  console.log(`Success: ${summary.successRate}`);
  for (const [id, s] of Object.entries(providerStats)) {
    console.log(`  ${id}: attempts=${s.attempts} successes=${s.successes} p50=${s.p50}ms p90=${s.p90}ms max=${s.max}ms`);
  }
}

main().catch((e) => {
  console.error("EROARE FATALA in script:", e);
  process.exit(1);
});
