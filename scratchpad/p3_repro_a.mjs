const API = "https://traduceri-api.vercel.app";
function mark(s) { return JSON.stringify(s); }

async function call(label, sections) {
  const body = {
    text_sections: sections.map((content) => ({ type: "paragraph", content })),
    source_lang: "ro",
    target_lang: "sk",
    translate_engine: "deepl",
  };
  const r = await fetch(`${API}/api/translate-text`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(body),
  });
  const txt = await r.text();
  let data;
  try { data = JSON.parse(txt); } catch { console.log(label, "NEPARSABIL (cold start framing):", txt.slice(0, 150)); return; }
  console.log(`\n=== ${label} | provider=${data.provider} ===`);
  sections.forEach((s, i) => {
    console.log(`  IN [${i}] ${mark(s)}  ->  OUT[${i}] ${mark(data.translated_sections?.[i]?.content)}`);
  });
  console.log(`  RECONSTRUIT: ${mark((data.translated_sections || []).map((s) => s.content).join(""))}`);
}

for (let i = 0; i < 3; i++) {
  await call(`A retry #${i + 1}`, ["Triunghiul este ", "dreptunghic", " și isoscel."]);
}
