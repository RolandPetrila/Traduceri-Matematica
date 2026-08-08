const KEY = process.env.GOOGLE_API_KEY;
function buildGeminiPayload(system, messages) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: { maxOutputTokens: 8192, temperature: 0.3 },
  };
}
function parseReply(json) {
  const cand = json?.candidates?.[0];
  return (cand?.content?.parts || []).map((p) => p.text || "").join("").trim();
}
function isTruncated(json) {
  return json?.candidates?.[0]?.finishReason === "MAX_TOKENS";
}

const system = "Esti un asistent care raspunde scurt si corect in limba romana.";
const messages = [{ role: "user", content: "Cat face 12 * 7? Raspunde doar cu numarul." }];
const body = buildGeminiPayload(system, messages);

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${KEY}`;
const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const json = await res.json();
console.log("HTTP", res.status);
console.log("reply:", JSON.stringify(parseReply(json)));
console.log("truncated:", isTruncated(json));
console.log("usage:", JSON.stringify(json.usageMetadata));
