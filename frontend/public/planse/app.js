/* app.js — controller shell modul „Planșe".
 *
 * F0: bară sub-taburi + placeholder „în construcție".
 * F1: sub-tabul Labirint e FUNCȚIONAL (formular → generează → preview →
 *     toggle soluție → Print/PDF curat). Restul rămân placeholder.
 *
 * Generatoarele rulează 100% în browser (offline, instant). Corectitudinea e
 * garantată de selftest.html (invarianți + oracol byte-exact vs Python).
 */
(function () {
  "use strict";

  var SUBTABS = [
    {
      id: "numere",
      label: "Numere",
      desc: "Careuri numerice încrucișate (3×3 multi-crossing).",
    },
    {
      id: "integrama",
      label: "Integramă",
      desc: "Integramă aritmetică cu soluție unică.",
    },
    {
      id: "labirint",
      label: "Labirint",
      desc: "Labirint perfect cu drum unic Start→Ieșire.",
      ready: true,
    },
    {
      id: "uneste",
      label: "Unește",
      desc: "Unește punctele (connect-the-dots) din catalog de forme.",
    },
    { id: "dictare", label: "Dictare", desc: "Dictare grafică pe grilă." },
    {
      id: "cautare",
      label: "Căutare",
      desc: "Careu de căutare cuvinte pe teme.",
      ready: true,
    },
    {
      id: "scolare",
      label: "Școlare",
      icon: "🌐",
      online: true,
      desc: "Fișe școlare generate de AI (online, Faza 4).",
    },
  ];

  var nav = document.getElementById("subtabs");
  var panel = document.getElementById("panel");
  var active = "labirint"; // F1: pornim pe generatorul funcțional

  // injectează o dată CSS-ul de preview interactiv al generatoarelor
  (function injectCss() {
    var css = "";
    if (window.PlanseGen && window.PlanseGen.labirint)
      css += window.PlanseGen.labirint.interactiveCss || "";
    if (window.PlanseGen && window.PlanseGen.cautare)
      css += "\n" + (window.PlanseGen.cautare.interactiveCss || "");
    if (css) {
      var s = document.createElement("style");
      s.textContent = css;
      document.head.appendChild(s);
    }
  })();

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function wipPanel(tab) {
    var badge = tab.online
      ? '<p class="note-online">🌐 Online / AI — va apărea în Faza 4 (materiale școlare). Restul planșelor sunt offline, instant.</p>'
      : "";
    panel.innerHTML =
      '<div class="wip">' +
      '<span class="emoji">' +
      (tab.icon || "🧩") +
      "</span>" +
      "<h2>" +
      tab.label +
      " — în construcție</h2>" +
      "<p>" +
      tab.desc +
      "</p>" +
      "<p>Scheletul modulului e gata. Generatorul va fi adăugat într-o fază următoare.</p>" +
      badge +
      "</div>";
  }

  // ---------------- LABIRINT (F1) ----------------
  function mountLabirint() {
    var lab = window.PlanseGen && window.PlanseGen.labirint;
    if (!lab) {
      panel.innerHTML =
        '<div class="wip"><h2>Eroare</h2><p>Generatorul labirint nu s-a încărcat.</p></div>';
      return;
    }
    var LEVELS = [
      { key: "Usor", label: "Ușor 8×8" },
      { key: "Standard", label: "Standard 12×12" },
      { key: "Avansat", label: "Avansat 16×16" },
    ];

    panel.innerHTML =
      '<div class="gen">' +
      '  <form class="gen-form" id="lab-form">' +
      '    <fieldset class="fld">' +
      "      <legend>Nivel</legend>" +
      '      <div class="radios" id="lab-nivel">' +
      LEVELS.map(function (l, i) {
        return (
          '<label class="radio"><input type="radio" name="nivel" value="' +
          l.key +
          '"' +
          (i === 1 ? " checked" : "") +
          "> " +
          l.label +
          "</label>"
        );
      }).join("") +
      "      </div>" +
      "    </fieldset>" +
      '    <fieldset class="fld">' +
      "      <legend>Număr labirinturi</legend>" +
      '      <div class="stepper">' +
      '        <button type="button" class="chalk-mini" id="lab-minus">−</button>' +
      '        <input type="number" id="lab-nr" min="1" max="8" value="2" inputmode="numeric">' +
      '        <button type="button" class="chalk-mini" id="lab-plus">+</button>' +
      "      </div>" +
      "    </fieldset>" +
      '    <details class="adv">' +
      "      <summary>Avansat</summary>" +
      '      <div class="adv-row">' +
      '        <label>Seed (opțional) <input type="number" id="lab-seed" placeholder="aleator" inputmode="numeric"></label>' +
      '        <label>Mărime celulă <input type="number" id="lab-mm" step="0.1" placeholder="auto"> mm</label>' +
      "      </div>" +
      '      <p class="adv-note">Seed-ul reproduce un labirint anume (același seed → același labirint). Mărimea celulei e „auto" (potrivită la A4) dacă o lași goală.</p>' +
      "    </details>" +
      '    <button type="submit" class="chalk-cta" id="lab-gen">⚡ Generează</button>' +
      "  </form>" +
      '  <div class="gen-actions" id="lab-actions" style="display:none">' +
      '    <button type="button" class="chalk-btn2" id="lab-sol">👁 Arată soluția</button>' +
      '    <button type="button" class="chalk-btn2" id="lab-print">🖨 Print / PDF</button>' +
      '    <span class="gen-meta" id="lab-meta"></span>' +
      "  </div>" +
      '  <div class="gen-preview" id="lab-preview"><p class="hint">Alege nivelul și numărul, apoi „Generează". Preview-ul apare aici.</p></div>' +
      "</div>";

    var form = document.getElementById("lab-form");
    var nrInput = document.getElementById("lab-nr");
    var seedInput = document.getElementById("lab-seed");
    var mmInput = document.getElementById("lab-mm");
    var preview = document.getElementById("lab-preview");
    var actions = document.getElementById("lab-actions");
    var solBtn = document.getElementById("lab-sol");
    var printBtn = document.getElementById("lab-print");
    var meta = document.getElementById("lab-meta");

    var state = { items: [], showSolution: false, mm: null };

    function selectedNivel() {
      var r = document.querySelector('input[name="nivel"]:checked');
      return r ? r.value : "Standard";
    }
    function updateMmPlaceholder() {
      var n = lab.NIVELURI[selectedNivel()];
      mmInput.placeholder = "auto (" + lab.cellMm(n) + ")";
    }
    updateMmPlaceholder();
    document
      .getElementById("lab-nivel")
      .addEventListener("change", updateMmPlaceholder);

    function clampNr() {
      var v = parseInt(nrInput.value, 10);
      if (isNaN(v)) v = 1;
      v = Math.max(1, Math.min(8, v));
      nrInput.value = v;
      return v;
    }
    document.getElementById("lab-minus").addEventListener("click", function () {
      nrInput.value = Math.max(1, clampNr() - 1);
    });
    document.getElementById("lab-plus").addEventListener("click", function () {
      nrInput.value = Math.min(8, clampNr() + 1);
    });

    function randomSeed() {
      if (window.crypto && window.crypto.getRandomValues) {
        var a = new Uint32Array(1);
        window.crypto.getRandomValues(a);
        return a[0];
      }
      return Math.floor(Math.random() * 0xffffffff);
    }

    function generate() {
      var nivel = selectedNivel();
      var nr = clampNr();
      var seedRaw = seedInput.value.trim();
      var seedAdv = seedRaw === "" ? null : parseInt(seedRaw, 10);
      var mmRaw = mmInput.value.trim();
      var mm = mmRaw === "" ? null : parseFloat(mmRaw);
      if (mm !== null && (isNaN(mm) || mm <= 0)) mm = null;

      var base = seedAdv !== null && !isNaN(seedAdv) ? seedAdv : randomSeed();
      var items = [];
      var seen = {};
      var seed = base;
      var guard = 0;
      // dedup în cadrul lotului: niciodată două labirinturi identice deodată (§8)
      while (items.length < nr && guard < nr + 200) {
        guard++;
        try {
          var it = lab.buildOne({ nivel: nivel }, seed);
          if (!seen[it.semnatura]) {
            seen[it.semnatura] = true;
            items.push(it);
          }
        } catch (e) {
          // nu ar trebui să apară (gate-ul de verificare aruncă doar la bug)
          if (window.console) console.error("[planse:labirint]", e);
        }
        seed++;
      }
      state.items = items;
      state.mm = mm;
      state.showSolution = false;
      renderPreview();
      meta.textContent =
        items.length +
        " labirint" +
        (items.length === 1 ? "" : "uri") +
        " · seed bază " +
        base;
      actions.style.display = items.length ? "flex" : "none";
      solBtn.textContent = "👁 Arată soluția";
    }

    function renderPreview() {
      if (!state.items.length) {
        preview.innerHTML = '<p class="hint">Niciun labirint generat.</p>';
        return;
      }
      var html = "";
      for (var i = 0; i < state.items.length; i++) {
        var r = lab.render(state.items[i], state.mm);
        html +=
          '<div class="preview-item"><div class="preview-cap">Labirint ' +
          (i + 1) +
          "/" +
          state.items.length +
          "</div>" +
          r.interactive +
          "</div>";
      }
      preview.innerHTML = html;
      applySolution();
    }

    function applySolution() {
      var grids = preview.querySelectorAll(".labirint");
      for (var i = 0; i < grids.length; i++) {
        grids[i].classList.toggle("show-solution", state.showSolution);
      }
    }

    solBtn.addEventListener("click", function () {
      state.showSolution = !state.showSolution;
      solBtn.textContent = state.showSolution
        ? "🙈 Ascunde soluția"
        : "👁 Arată soluția";
      applySolution();
    });

    printBtn.addEventListener("click", function () {
      if (!state.items.length) return;
      var total = state.items.length;
      var puzzle = [];
      var answer = [];
      for (var i = 0; i < total; i++) {
        var pg = lab.renderPages(state.items[i], i + 1, total, state.mm);
        puzzle.push(pg.puzzle);
        answer.push(pg.answer);
      }
      var doc = window.PlanseRender.printDocument({
        title: "Labirint",
        css: lab.printCss,
        puzzlePages: puzzle,
        answerPages: answer,
      });
      var w = window.PlanseRender.openPrintWindow(doc);
      if (!w) {
        // popup blocat → fallback link (gest utilizator)
        var blob = new Blob([doc], { type: "text/html" });
        var url = URL.createObjectURL(blob);
        var old = document.getElementById("lab-fallback");
        if (old) old.remove();
        var note = el(
          '<div id="lab-fallback" class="fallback">Fereastra de print a fost blocată. ' +
            '<a href="' +
            url +
            '" target="_blank" rel="noopener">Deschide foaia de print →</a></div>',
        );
        actions.parentNode.insertBefore(note, preview);
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      generate();
    });
  }

  // ---------------- CĂUTARE (word-search) ----------------
  function mountCautare() {
    var cauta = window.PlanseGen && window.PlanseGen.cautare;
    if (!cauta) {
      panel.innerHTML =
        '<div class="wip"><h2>Eroare</h2><p>Generatorul căutare nu s-a încărcat.</p></div>';
      return;
    }
    var LEVELS = [
      { key: "Usor", label: "Ușor 10×10" },
      { key: "Standard", label: "Standard 12×12" },
      { key: "Greu", label: "Greu 15×15" },
    ];
    var themeOpts = Object.keys(cauta.THEMES)
      .map(function (id) {
        return (
          '<option value="' + id + '">' + cauta.THEMES[id].label + "</option>"
        );
      })
      .join("");

    panel.innerHTML =
      '<div class="gen">' +
      '  <form class="gen-form" id="ca-form">' +
      '    <fieldset class="fld"><legend>Temă</legend>' +
      '      <select id="ca-tema" class="chalk-select">' +
      themeOpts +
      "</select></fieldset>" +
      '    <fieldset class="fld"><legend>Dificultate</legend>' +
      '      <div class="radios" id="ca-dif">' +
      LEVELS.map(function (l, i) {
        return (
          '<label class="radio"><input type="radio" name="cadif" value="' +
          l.key +
          '"' +
          (i === 1 ? " checked" : "") +
          "> " +
          l.label +
          "</label>"
        );
      }).join("") +
      "      </div></fieldset>" +
      '    <fieldset class="fld"><legend>Număr cuvinte</legend>' +
      '      <div class="stepper">' +
      '        <button type="button" class="chalk-mini" id="ca-wminus">−</button>' +
      '        <input type="number" id="ca-nw" min="3" max="12" value="8" inputmode="numeric">' +
      '        <button type="button" class="chalk-mini" id="ca-wplus">+</button>' +
      "      </div></fieldset>" +
      '    <fieldset class="fld"><legend>Număr careuri</legend>' +
      '      <div class="stepper">' +
      '        <button type="button" class="chalk-mini" id="ca-pminus">−</button>' +
      '        <input type="number" id="ca-np" min="1" max="8" value="2" inputmode="numeric">' +
      '        <button type="button" class="chalk-mini" id="ca-pplus">+</button>' +
      "      </div></fieldset>" +
      '    <details class="adv"><summary>Avansat</summary>' +
      '      <div class="adv-row"><label>Seed (opțional) <input type="number" id="ca-seed" placeholder="aleator" inputmode="numeric"></label>' +
      '        <label>Mărime celulă <input type="number" id="ca-mm" step="0.1" placeholder="auto"> mm</label></div>' +
      '      <p class="adv-note">Același seed → același careu. Mărimea celulei e „auto" (A4) dacă o lași goală.</p>' +
      "    </details>" +
      '    <button type="submit" class="chalk-cta">⚡ Generează</button>' +
      "  </form>" +
      '  <div class="gen-actions" id="ca-actions" style="display:none">' +
      '    <button type="button" class="chalk-btn2" id="ca-sol">👁 Arată soluția</button>' +
      '    <button type="button" class="chalk-btn2" id="ca-print">🖨 Print / PDF</button>' +
      '    <span class="gen-meta" id="ca-meta"></span>' +
      "  </div>" +
      '  <div class="gen-preview" id="ca-preview"><p class="hint">Alege tema și dificultatea, apoi „Generează".</p></div>' +
      "</div>";

    var form = document.getElementById("ca-form");
    var temaSel = document.getElementById("ca-tema");
    var nwInput = document.getElementById("ca-nw");
    var npInput = document.getElementById("ca-np");
    var seedInput = document.getElementById("ca-seed");
    var mmInput = document.getElementById("ca-mm");
    var preview = document.getElementById("ca-preview");
    var actions = document.getElementById("ca-actions");
    var solBtn = document.getElementById("ca-sol");
    var printBtn = document.getElementById("ca-print");
    var meta = document.getElementById("ca-meta");

    var state = { items: [], showSolution: false, mm: null };

    function selectedDif() {
      var r = document.querySelector('input[name="cadif"]:checked');
      return r ? r.value : "Standard";
    }
    function clampInt(input, lo, hi) {
      var v = parseInt(input.value, 10);
      if (isNaN(v)) v = lo;
      v = Math.max(lo, Math.min(hi, v));
      input.value = v;
      return v;
    }
    document.getElementById("ca-wminus").addEventListener("click", function () {
      nwInput.value = Math.max(3, clampInt(nwInput, 3, 12) - 1);
    });
    document.getElementById("ca-wplus").addEventListener("click", function () {
      nwInput.value = Math.min(12, clampInt(nwInput, 3, 12) + 1);
    });
    document.getElementById("ca-pminus").addEventListener("click", function () {
      npInput.value = Math.max(1, clampInt(npInput, 1, 8) - 1);
    });
    document.getElementById("ca-pplus").addEventListener("click", function () {
      npInput.value = Math.min(8, clampInt(npInput, 1, 8) + 1);
    });

    function randomSeed() {
      if (window.crypto && window.crypto.getRandomValues) {
        var a = new Uint32Array(1);
        window.crypto.getRandomValues(a);
        return a[0];
      }
      return Math.floor(Math.random() * 0xffffffff);
    }

    function generate() {
      var tema = temaSel.value;
      var dif = selectedDif();
      var nw = clampInt(nwInput, 3, 12);
      var np = clampInt(npInput, 1, 8);
      var seedRaw = seedInput.value.trim();
      var seedAdv = seedRaw === "" ? null : parseInt(seedRaw, 10);
      var mmRaw = mmInput.value.trim();
      var mm = mmRaw === "" ? null : parseFloat(mmRaw);
      if (mm !== null && (isNaN(mm) || mm <= 0)) mm = null;

      var base = seedAdv !== null && !isNaN(seedAdv) ? seedAdv : randomSeed();
      var items = [];
      var seen = {};
      var seed = base;
      var guard = 0;
      while (items.length < np && guard < np + 200) {
        guard++;
        try {
          var it = cauta.buildOne(
            { tema: tema, dificultate: dif, nrCuvinte: nw },
            seed,
          );
          if (!seen[it.semnatura]) {
            seen[it.semnatura] = true;
            items.push(it);
          }
        } catch (e) {
          if (window.console) console.error("[planse:cautare]", e);
        }
        seed++;
      }
      state.items = items;
      state.mm = mm;
      state.showSolution = false;
      renderPreview();
      meta.textContent =
        items.length +
        " careu" +
        (items.length === 1 ? "" : "ri") +
        " · seed bază " +
        base;
      actions.style.display = items.length ? "flex" : "none";
      solBtn.textContent = "👁 Arată soluția";
    }

    function renderPreview() {
      if (!state.items.length) {
        preview.innerHTML = '<p class="hint">Niciun careu generat.</p>';
        return;
      }
      var html = "";
      for (var i = 0; i < state.items.length; i++) {
        var r = cauta.render(state.items[i], state.mm);
        html +=
          '<div class="preview-item"><div class="preview-cap">Careu ' +
          (i + 1) +
          "/" +
          state.items.length +
          "</div>" +
          r.interactive +
          "</div>";
      }
      preview.innerHTML = html;
      applySolution();
    }

    function applySolution() {
      var grids = preview.querySelectorAll(".cauta-grid");
      for (var i = 0; i < grids.length; i++) {
        grids[i].classList.toggle("show-solution", state.showSolution);
      }
    }

    solBtn.addEventListener("click", function () {
      state.showSolution = !state.showSolution;
      solBtn.textContent = state.showSolution
        ? "🙈 Ascunde soluția"
        : "👁 Arată soluția";
      applySolution();
    });

    printBtn.addEventListener("click", function () {
      if (!state.items.length) return;
      var total = state.items.length;
      var puzzle = [];
      var answer = [];
      for (var i = 0; i < total; i++) {
        var pg = cauta.renderPages(state.items[i], i + 1, total, state.mm);
        puzzle.push(pg.puzzle);
        answer.push(pg.answer);
      }
      var doc = window.PlanseRender.printDocument({
        title: "Căutare cuvinte",
        css: cauta.printCss,
        puzzlePages: puzzle,
        answerPages: answer,
      });
      var w = window.PlanseRender.openPrintWindow(doc);
      if (!w) {
        var blob = new Blob([doc], { type: "text/html" });
        var url = URL.createObjectURL(blob);
        var old = document.getElementById("ca-fallback");
        if (old) old.remove();
        var note = el(
          '<div id="ca-fallback" class="fallback">Fereastra de print a fost blocată. ' +
            '<a href="' +
            url +
            '" target="_blank" rel="noopener">Deschide foaia de print →</a></div>',
        );
        actions.parentNode.insertBefore(note, preview);
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      generate();
    });
  }

  // ---------------- SHELL ----------------
  function renderPanel(tab) {
    if (tab.id === "labirint" && tab.ready) {
      mountLabirint();
    } else if (tab.id === "cautare" && tab.ready) {
      mountCautare();
    } else {
      wipPanel(tab);
    }
  }

  function setActive(id) {
    active = id;
    var buttons = nav.querySelectorAll(".subtab");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle("active", buttons[i].dataset.id === id);
    }
    var tab = SUBTABS.filter(function (t) {
      return t.id === id;
    })[0];
    if (tab) renderPanel(tab);
  }

  SUBTABS.forEach(function (tab) {
    var btn = document.createElement("button");
    btn.className = "subtab";
    btn.type = "button";
    btn.dataset.id = tab.id;
    btn.innerHTML =
      (tab.icon ? tab.icon + " " : "") +
      tab.label +
      (tab.online ? '<span class="badge">🌐</span>' : "") +
      (tab.ready ? '<span class="badge ready">●</span>' : "");
    btn.addEventListener("click", function () {
      setActive(tab.id);
    });
    nav.appendChild(btn);
  });

  setActive(active);
})();
