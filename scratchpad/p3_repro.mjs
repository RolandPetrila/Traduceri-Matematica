// Faza 4.5b — diagnostic P3: reproducere live pe api-ul de productie.
// Ipoteza (din cod): editor-translate.ts (segmentInline) rupe textul in sectiuni
// SEPARATE la fiecare granita de marcaj (bold/italic). translate_text.py le uneste
// cu "\n|||SEP|||\n", trimite intregul batch la DeepL ca UN singur text, desparte
// dupa "|||SEP|||" (fara \n!) si aplica .strip() pe fiecare bucata rezultata.
// Vreau sa vad, pe raspunsul REAL DeepL: (A) se pierde spatiul intre doua sectiuni
// adiacente (granita bold)? (B) apare vreun \n literal in mijlocul unei sectiuni
// scurte langa o formula?
const API = "https://traduceri-api.vercel.app";

function mark(s) {
  return JSON.stringify(s); // arata explicit spatiile/newline-urile
}

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
  try { data = JSON.parse(txt); } catch { console.log(`${label} | HTTP ${r.status} | NEPARSABIL: ${txt.slice(0,200)}`); return; }
  console.log(`\n=== ${label} | HTTP ${r.status} | provider=${data.provider} ===`);
  sections.forEach((s, i) => {
    const out = data.translated_sections?.[i]?.content;
    console.log(`  IN [${i}]  ${mark(s)}`);
    console.log(`  OUT[${i}]  ${mark(out)}`);
  });
  // reconstructie simpla: concatenare bruta, ca in expandSegment/rebuildTranslated
  const joined = (data.translated_sections || []).map((s) => s.content).join("");
  console.log(`  RECONSTRUIT (concatenare bruta, ca in client): ${mark(joined)}`);
}

// Caz A — granita de marcaj (bold), ca in editor-translate.test.ts:
// p(t("normal "), t("bold", [bold]), t(" iar normal"))
await call("A) bold boundary — 3 sectiuni separate (simuleaza segmentInline)", [
  "Triunghiul este ",
  "dreptunghic",
  " și isoscel.",
]);

// Control A — ACELASI text, dar ca O SINGURA sectiune (fara granita de marcaj)
await call("A-control) acelasi text, 1 sectiune (fara granita)", [
  "Triunghiul este dreptunghic și isoscel.",
]);

// Caz B — cuvant/conjunctie scurta langa formula, izolata ca sectiune proprie
// (simuleaza cazul din jurnal #6: virgula/conjunctie scurta langa formula LaTeX inline)
await call("B) sectiune scurta adiacenta unei formule — 3 sectiuni", [
  "Aria triunghiului este $A = \\frac{b \\cdot h}{2}$",
  ", deci",
  " calculăm perimetrul.",
]);

// Control B — formula IN ACEEASI sectiune cu tot textul (cum ar iesi daca nu exista granita de marcaj)
await call("B-control) formula + tot textul, 1 sectiune", [
  "Aria triunghiului este $A = \\frac{b \\cdot h}{2}$, deci calculăm perimetrul.",
]);

// Caz C — multe sectiuni scurte la rand (stres-test pe join/split \n|||SEP|||\n)
await call("C) 5 sectiuni scurte consecutive", [
  "Fie ",
  "ABC",
  " un triunghi cu ",
  "AB = BC",
  ", isoscel.",
]);
