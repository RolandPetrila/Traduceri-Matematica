// Test empiric: modelele Gemini candidate pt upgrade chiar exista si raspund
// cu schema pe care o asteapta parseReply/buildGeminiPayload din chat-providers.ts
// (candidates[0].content.parts[].text + finishReason). Cheie REALA, local.
const KEY = process.env.GOOGLE_API_KEY;
if (!KEY) { console.error("GOOGLE_API_KEY lipsa"); process.exit(1); }

const CANDIDATES = [
  "gemini-2.5-flash", // curent, control
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash-lite",
];

async function probe(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: "Spune doar cuvantul: OK" }] }],
    generationConfig: { maxOutputTokens: 30, temperature: 0 },
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      return { model, status: res.status, ok: false, error: json?.error?.message || JSON.stringify(json).slice(0, 200) };
    }
    const text = (json.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    const finishReason = json.candidates?.[0]?.finishReason;
    return { model, status: res.status, ok: true, text: text.trim(), finishReason, modelVersion: json.modelVersion };
  } catch (e) {
    return { model, ok: false, error: e.message };
  }
}

const results = await Promise.all(CANDIDATES.map(probe));
for (const r of results) {
  if (r.ok) {
    console.log(`✓ ${r.model} — HTTP ${r.status} — reply: "${r.text}" — finishReason=${r.finishReason} — modelVersion=${r.modelVersion || "n/a"}`);
  } else {
    console.log(`✗ ${r.model} — HTTP ${r.status || "?"} — ${r.error}`);
  }
}
