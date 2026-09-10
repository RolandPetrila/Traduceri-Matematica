// Confirmare suplimentara (cerut de auditor-dovezi, portiunea de tabel neverificata
// independent): simuleaza EXACT ce trimite clientul pentru un tabel — celulele devin
// text_sections {type:"paragraph"} separate, cu granita de marcaj bold in mijlocul unei
// celule (ca "Lungime **exacta**" din testul live din browser).
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
  const data = await r.json();
  console.log(`\n=== ${label} | provider=${data.provider} ===`);
  sections.forEach((s, i) => {
    console.log(`  IN [${i}] ${mark(s)}  ->  OUT[${i}] ${mark(data.translated_sections?.[i]?.content)}`);
  });
}

// header row: 3 celule, fiecare text_section separata (ca tabelul real din browser)
await call("Tabel - antet (3 celule)", ["Latura", "Lungime ", "exact\u0103", "Observa\u021bii"]);
// data row: celula din mijloc are granita bold "6 cm, deci **aproximativ** 6.0"
await call("Tabel - rand date, granita bold in celula", ["AB", "6 cm, deci ", "aproximativ", " 6.0", "bine"]);
