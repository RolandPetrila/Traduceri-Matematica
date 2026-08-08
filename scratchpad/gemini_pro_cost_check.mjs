const KEY = process.env.GOOGLE_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${KEY}`;
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Spune doar: OK" }] }], generationConfig: { maxOutputTokens: 20 } }),
});
const json = await res.json();
console.log("HTTP", res.status);
console.log(JSON.stringify(json, null, 2).slice(0, 1500));
