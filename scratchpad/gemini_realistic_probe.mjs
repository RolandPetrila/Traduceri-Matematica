const KEY = process.env.GOOGLE_API_KEY;
const PROMPT = "Creeaza o fisa de lucru A4 pentru Clasa a V-a, Matematica, nivel Standard. Fisa are exact 3 exercitii, numerotate. Formulele in LaTeX ($...$). La final o sectiune Barem/Solutii.";

async function probe(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: PROMPT }] }],
    generationConfig: { maxOutputTokens: 8192, temperature: 0.3 },
  };
  const t0 = Date.now();
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  const ms = Date.now() - t0;
  if (!res.ok) return console.log(`✗ ${model} HTTP ${res.status} ${JSON.stringify(json).slice(0,200)}`);
  const text = (json.candidates?.[0]?.content?.parts || []).map(p=>p.text||"").join("");
  const finishReason = json.candidates?.[0]?.finishReason;
  const usage = json.usageMetadata;
  console.log(`✓ ${model} — ${ms}ms — finishReason=${finishReason} — chars=${text.length} — usage=${JSON.stringify(usage)}`);
  console.log(`   primele 150 car: ${text.slice(0,150).replace(/\n/g,' ')}`);
}

for (const m of ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"]) {
  await probe(m);
}
