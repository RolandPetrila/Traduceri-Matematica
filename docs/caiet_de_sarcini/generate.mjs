// Genereaza docs/caiet_de_sarcini.md + docs/caiet_de_sarcini.html din data.json (sursa unica).
// Rulare: node docs/caiet_de_sarcini/generate.mjs
// Motiv sursa-unica: evita drift-ul intre .md si .html (aceeasi capcana ca error_codes.json <-> error-catalog.ts).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const DATA_PATH = path.join(HERE, "data.json");
const MD_PATH = path.join(ROOT, "docs", "caiet_de_sarcini.md");
const HTML_PATH = path.join(ROOT, "docs", "caiet_de_sarcini.html");

const STATUS_LABEL = {
  unverified: "⬜ neverificat",
  live_ok: "🟢 verificat live",
  live_partial: "🟡 parțial",
  broken: "🔴 defect",
};

function esc(s) {
  return String(s ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function loadData() {
  return JSON.parse(readFileSync(DATA_PATH, "utf8"));
}

function countButtons(mod) {
  return mod.submodules.reduce((n, s) => n + (s.buttons?.length || 0), 0);
}

function buildMarkdown(data) {
  const lines = [];
  lines.push("# Caiet de sarcini — modul → submodul → funcție → buton");
  lines.push("");
  lines.push(
    "> **Generat automat** din `docs/caiet_de_sarcini/data.json` cu `generate.mjs` — NU edita" +
      " acest fișier direct, editează `data.json` și rulează din nou generatorul (`.md` și" +
      " `.html` rămân mereu identice, fără drift între ele — NU detectează automat butoane noi" +
      " apărute în cod; asta rămâne de făcut manual până la un mecanism dedicat, vezi Faza 6)."
  );
  lines.push(`> Generat: ${data.generatedAt ?? "—"}`);
  lines.push("");
  const totalButtons = data.modules.reduce((n, m) => n + countButtons(m), 0);
  lines.push(`Total module: **${data.modules.length}** · total butoane inventariate: **${totalButtons}**`);
  lines.push("");
  lines.push("## Cuprins");
  for (const mod of data.modules) {
    lines.push(`- [${mod.name}](#${slug(mod.id)}) — ${countButtons(mod)} butoane`);
  }
  lines.push("");
  for (const mod of data.modules) {
    lines.push(`## ${mod.name} {#${slug(mod.id)}}`);
    lines.push("");
    lines.push(`Rută: \`${mod.route}\``);
    lines.push("");
    if (!mod.submodules.length) {
      lines.push("_Neinventariat încă._");
      lines.push("");
      continue;
    }
    for (const sub of mod.submodules) {
      lines.push(`### ${sub.name}`);
      lines.push("");
      if (!sub.buttons || !sub.buttons.length) {
        lines.push("_Fără butoane de execuție inventariate._");
        lines.push("");
        continue;
      }
      lines.push(
        "| Buton | Ce execută | Cum se testează | Coduri eroare | Mesaj acționabil la eroare | Sursă | Status |"
      );
      lines.push("| --- | --- | --- | --- | --- | --- | --- |");
      for (const b of sub.buttons) {
        lines.push(
          `| ${md(b.label)} | ${md(b.executes)} | ${md(b.howToTest)} | ${md(
            (b.errorCodes || []).join(", ") || "—"
          )} | ${md(b.actionableMessage || "—")} | \`${b.source || "—"}\` | ${
            STATUS_LABEL[b.status] || b.status || "⬜"
          } |`
        );
      }
      lines.push("");
    }
  }
  return lines.join("\n") + "\n";
}

function md(s) {
  return String(s ?? "—").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function slug(id) {
  return String(id).toLowerCase();
}

function buildHtml(data) {
  const totalButtons = data.modules.reduce((n, m) => n + countButtons(m), 0);
  const labels = {};
  const sections = data.modules
    .map((mod) => {
      const subsHtml = mod.submodules.length
        ? mod.submodules
            .map((sub) => {
              const rows = (sub.buttons || [])
                .map((b) => {
                  const searchBlob = esc(
                    [
                      mod.name,
                      sub.name,
                      b.label,
                      b.executes,
                      b.howToTest,
                      (b.errorCodes || []).join(" "),
                      b.actionableMessage,
                      b.source,
                    ]
                      .join(" ")
                      .toLowerCase()
                  );
                  const statusClass = `status-${esc(b.status || "unverified")}`;
                  labels[b.id] = `${mod.name} › ${sub.name} › ${b.label}`;
                  return `<tr data-search="${searchBlob}">
        <td class="col-label">${esc(b.label)}</td>
        <td>${esc(b.executes)}</td>
        <td>${esc(b.howToTest)}</td>
        <td>${esc((b.errorCodes || []).join(", ") || "—")}</td>
        <td>${esc(b.actionableMessage || "—")}</td>
        <td><code>${esc(b.source || "—")}</code></td>
        <td class="${statusClass}">${esc(STATUS_LABEL[b.status] || b.status || "⬜")}</td>
        <td><textarea class="mention" data-k="${esc(b.id)}" placeholder="Mențiune…" rows="2"></textarea></td>
      </tr>`;
                })
                .join("\n");
              const body = rows
                ? `<table>
      <thead><tr><th>Buton</th><th>Ce execută</th><th>Cum se testează</th><th>Coduri eroare</th><th>Mesaj acționabil</th><th>Sursă</th><th>Status</th><th>Mențiune</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
                : `<p class="empty">Fără butoane de execuție inventariate.</p>`;
              return `<details class="submodule" open>
    <summary>${esc(sub.name)} <span class="count">${(sub.buttons || []).length}</span></summary>
    ${body}
  </details>`;
            })
            .join("\n")
        : `<p class="empty">Neinventariat încă.</p>`;
      return `<section class="module" id="${esc(slug(mod.id))}" data-search-module="${esc(
        mod.name.toLowerCase()
      )}">
  <h2>${esc(mod.name)} <span class="route">${esc(mod.route)}</span> <span class="count">${countButtons(
        mod
      )} butoane</span></h2>
  ${subsHtml}
</section>`;
    })
    .join("\n");

  const nav = data.modules
    .map((m) => `<a href="#${esc(slug(m.id))}">${esc(m.name)} (${countButtons(m)})</a>`)
    .join("");

  return `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Caiet de sarcini — Traduceri Matematica</title>
<style>
:root {
  --bg: #1e3a12; --panel: #2d5016; --panel2: #24400f; --line: #4a7c2a;
  --chalk: #f4f4ef; --chalk-dim: #cfe0c0; --yellow: #ffd75e; --red: #ff8a7a; --green: #8fe07a;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--chalk); font-family: "Segoe UI", system-ui, -apple-system, sans-serif; line-height: 1.5; font-size: 15px; }
header { position: sticky; top: 0; z-index: 50; background: var(--panel2); border-bottom: 2px solid var(--line); padding: 10px 16px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
header h1 { font-size: 16px; margin: 0; flex: 1 1 260px; }
header input[type="search"] { flex: 2 1 320px; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel); color: var(--chalk); font-size: 14px; }
header .meta { color: var(--chalk-dim); font-size: 12px; }
nav.modnav { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 16px; background: var(--panel2); border-bottom: 1px solid var(--line); }
nav.modnav a { color: var(--chalk-dim); text-decoration: none; font-size: 12px; padding: 4px 8px; border: 1px solid var(--line); border-radius: 999px; }
nav.modnav a:hover { color: var(--yellow); border-color: var(--yellow); }
.wrap { max-width: 1200px; margin: 0 auto; padding: 16px 16px 80px; }
section.module { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
section.module h2 { margin: 0 0 10px; font-size: 18px; }
section.module .route { color: var(--chalk-dim); font-weight: normal; font-size: 12px; }
section.module .count { color: var(--yellow); font-weight: normal; font-size: 12px; }
details.submodule { background: var(--panel2); border: 1px solid var(--line); border-radius: 8px; margin: 8px 0; padding: 8px 10px; }
details.submodule summary { cursor: pointer; font-weight: 600; }
details.submodule summary .count { color: var(--chalk-dim); font-weight: normal; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--yellow); font-size: 12px; }
td code { color: var(--chalk-dim); font-size: 11px; }
.col-label { font-weight: 600; }
.status-unverified { color: var(--chalk-dim); }
.status-live_ok { color: var(--green); }
.status-live_partial { color: var(--yellow); }
.status-broken { color: var(--red); }
p.empty { color: var(--chalk-dim); font-style: italic; }
tr[hidden] { display: none; }
section[hidden] { display: none; }
textarea.mention { width: 100%; min-width: 160px; background: var(--panel); color: var(--chalk); border: 1px solid var(--line); border-radius: 6px; padding: 4px 6px; font-family: inherit; font-size: 12px; resize: vertical; }
textarea.mention:focus { outline: 2px solid var(--yellow); }
header button.act { background: var(--panel); color: var(--chalk); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; }
header button.act:hover { border-color: var(--yellow); color: var(--yellow); }
header .status { color: var(--chalk-dim); font-size: 12px; min-width: 90px; }
</style>
</head>
<body>
<header>
  <h1>Caiet de sarcini — Traduceri Matematica</h1>
  <input type="search" id="q" placeholder="Caută modul, buton, cod eroare..." />
  <button class="act" id="btnSave">💾 Descarcă mențiunile</button>
  <button class="act" id="btnClear">🗑 Șterge mențiunile</button>
  <span class="status" id="status"></span>
  <span class="meta">${totalButtons} butoane · ${data.modules.length} module · generat ${esc(
    data.generatedAt ?? "—"
  )}</span>
</header>
<nav class="modnav">${nav}</nav>
<div class="wrap">
${sections}
</div>
<script>
const q = document.getElementById('q');
q.addEventListener('input', () => {
  const term = q.value.trim().toLowerCase();
  document.querySelectorAll('section.module').forEach((section) => {
    let anyVisible = false;
    section.querySelectorAll('tr[data-search]').forEach((row) => {
      const match = !term || row.dataset.search.includes(term);
      row.hidden = !match;
      if (match) anyVisible = true;
    });
    const moduleMatch = !term || (section.dataset.searchModule || '').includes(term);
    section.hidden = !(anyVisible || moduleMatch);
  });
});

(function () {
  "use strict";
  var KEY = "caiet_de_sarcini_mentiuni_v1";
  var statusEl = document.getElementById("status");
  var LABEL = ${JSON.stringify(labels)};

  function allFields() {
    return Array.prototype.slice.call(document.querySelectorAll("textarea.mention[data-k]"));
  }

  function collect() {
    var out = {};
    allFields().forEach(function (t) {
      if (t.value.trim()) out[t.dataset.k] = t.value;
    });
    return out;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(collect()));
      statusEl.textContent = "salvat " + new Date().toLocaleTimeString("ro-RO");
    } catch (e) {
      statusEl.textContent = "nu pot salva local (mod privat?)";
    }
  }

  function restore() {
    var raw;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {
      return;
    }
    if (!raw) return;
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return;
    }
    allFields().forEach(function (t) {
      if (data[t.dataset.k]) t.value = data[t.dataset.k];
    });
    statusEl.textContent = "mențiuni restaurate";
  }

  function buildReport() {
    var d = collect();
    var keys = Object.keys(d);
    var out = [];
    out.push("# Mențiuni — caiet de sarcini");
    out.push("");
    out.push("Generat: " + new Date().toLocaleString("ro-RO"));
    out.push("");
    if (!keys.length) {
      out.push("_(nicio mențiune scrisă)_");
      return out.join("\\n");
    }
    keys.forEach(function (k) {
      out.push("### " + (LABEL[k] || k));
      out.push("");
      out.push(d[k]);
      out.push("");
    });
    return out.join("\\n");
  }

  document.getElementById("btnSave").addEventListener("click", function () {
    var txt = buildReport();
    var blob = new Blob([txt], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "caiet_de_sarcini_mentiuni.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    statusEl.textContent = "descărcat";
  });

  document.getElementById("btnClear").addEventListener("click", function () {
    if (!confirm("Sigur ștergi TOATE mențiunile scrise?")) return;
    allFields().forEach(function (t) {
      t.value = "";
    });
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
    statusEl.textContent = "șters";
  });

  var saveTimer = null;
  document.addEventListener("input", function (e) {
    if (!e.target.classList || !e.target.classList.contains("mention")) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 500);
  });
  window.addEventListener("beforeunload", save);

  restore();
})();
</script>
</body>
</html>
`;
}

function main() {
  const data = loadData();
  data.generatedAt = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
  writeFileSync(MD_PATH, buildMarkdown(data), "utf8");
  writeFileSync(HTML_PATH, buildHtml(data), "utf8");
  console.log(`OK: ${MD_PATH}`);
  console.log(`OK: ${HTML_PATH}`);
}

main();
