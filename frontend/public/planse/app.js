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
      desc: "Careuri numerice încrucișate (3×3/4×4/5×5 multi-crossing).",
      ready: true,
    },
    {
      id: "integrama",
      label: "Integramă",
      desc: "Integramă aritmetică cu soluție unică (mai multe forme).",
      ready: true,
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
      ready: true,
    },
    {
      id: "dictare",
      label: "Dictare",
      desc: "Dictare grafică pe grilă (urmezi pașii → apare o formă).",
      ready: true,
    },
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
    {
      id: "istoric",
      label: "🧺 Coș",
      desc: "Coșul curent + istoricul planșelor deja folosite.",
      ready: true,
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
    if (window.PlanseGen && window.PlanseGen.uneste)
      css += "\n" + (window.PlanseGen.uneste.interactiveCss || "");
    if (window.PlanseGen && window.PlanseGen.dictare)
      css += "\n" + (window.PlanseGen.dictare.interactiveCss || "");
    if (window.PlanseGen && window.PlanseGen.numere)
      css += "\n" + (window.PlanseGen.numere.interactiveCss || "");
    if (window.PlanseGen && window.PlanseGen.integrama)
      css += "\n" + (window.PlanseGen.integrama.interactiveCss || "");
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

  // P4: helper-e comune pt „coș & istoric" (lib/history.js), folosite de toate
  // generatoarele. Fail-open dacă lib-ul lipsește (ex. precache offline vechi).
  function historyFresh(sig) {
    return !(window.PlanseHistory && window.PlanseHistory.isKnown(sig));
  }
  function addBatchToCart(tip, items, btn) {
    if (!window.PlanseHistory || !items.length) return;
    var entries = items.map(function (it) {
      return { tip: tip, semnatura: it.semnatura, item: it };
    });
    var added = window.PlanseHistory.addToCart(entries);
    if (btn) {
      var orig = btn.getAttribute("data-orig") || btn.textContent;
      btn.setAttribute("data-orig", orig);
      btn.textContent = added ? "✓ Adăugat (" + added + ")" : "🧺 Deja în coș";
      setTimeout(function () {
        btn.textContent = orig;
      }, 1600);
    }
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
    var formaOpts = Object.keys(lab.FORME)
      .map(function (k) {
        return (
          '<option value="' +
          k +
          '"' +
          (k === "patrat" ? " selected" : "") +
          ">" +
          lab.FORME[k] +
          "</option>"
        );
      })
      .join("");
    var iesireOpts = Object.keys(lab.IESIRI)
      .map(function (k) {
        return (
          '<option value="' +
          k +
          '"' +
          (k === "coltOpus" ? " selected" : "") +
          ">" +
          lab.IESIRI[k] +
          "</option>"
        );
      })
      .join("");

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
      '        <label>Formă <select id="lab-forma" class="chalk-select">' +
      formaOpts +
      "</select></label>" +
      '        <label>Ieșire <select id="lab-iesire" class="chalk-select">' +
      iesireOpts +
      "</select></label>" +
      "      </div>" +
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
      '    <button type="button" class="chalk-btn2" id="lab-cart">🧺 Adaugă în coș</button>' +
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
    var cartBtn = document.getElementById("lab-cart");
    var meta = document.getElementById("lab-meta");
    cartBtn.addEventListener("click", function () {
      addBatchToCart("labirint", state.items, cartBtn);
    });

    var state = { items: [], showSolution: false, mm: null };

    function selectedNivel() {
      var r = document.querySelector('input[name="nivel"]:checked');
      return r ? r.value : "Standard";
    }
    function selectedForma() {
      var s = document.getElementById("lab-forma");
      return s ? s.value : "patrat";
    }
    function selectedIesire() {
      var s = document.getElementById("lab-iesire");
      return s ? s.value : "coltOpus";
    }
    function updateMmPlaceholder() {
      var n = lab.NIVELURI[selectedNivel()];
      var dims = lab.dimsFor(n, selectedForma());
      mmInput.placeholder = "auto (" + lab.cellMm(dims.rows, dims.cols) + ")";
    }
    updateMmPlaceholder();
    document
      .getElementById("lab-nivel")
      .addEventListener("change", updateMmPlaceholder);
    document
      .getElementById("lab-forma")
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
      var forma = selectedForma();
      var iesire = selectedIesire();
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
          var it = lab.buildOne(
            { nivel: nivel, forma: forma, iesire: iesire },
            seed,
          );
          if (!seen[it.semnatura] && historyFresh(it.semnatura)) {
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
      '    <button type="button" class="chalk-btn2" id="ca-cart">🧺 Adaugă în coș</button>' +
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
    var cartBtn = document.getElementById("ca-cart");
    var meta = document.getElementById("ca-meta");
    cartBtn.addEventListener("click", function () {
      addBatchToCart("cautare", state.items, cartBtn);
    });

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
          if (!seen[it.semnatura] && historyFresh(it.semnatura)) {
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

  // ---------------- UNEȘTE (connect-the-dots) ----------------
  function mountUneste() {
    var uneste = window.PlanseGen && window.PlanseGen.uneste;
    if (!uneste) {
      panel.innerHTML =
        '<div class="wip"><h2>Eroare</h2><p>Generatorul unește nu s-a încărcat.</p></div>';
      return;
    }
    var LEVELS = [
      { key: "Usor", label: "Ușor (puține puncte)" },
      { key: "Standard", label: "Standard" },
      { key: "Greu", label: "Greu (multe puncte)" },
    ];
    var formaOpts =
      '<option value="aleator">Amestecat (surpriză)</option>' +
      uneste.SHAPE_IDS.map(function (id) {
        return (
          '<option value="' + id + '">' + uneste.SHAPES[id].label + "</option>"
        );
      }).join("");

    panel.innerHTML =
      '<div class="gen">' +
      '  <form class="gen-form" id="un-form">' +
      '    <fieldset class="fld"><legend>Formă</legend>' +
      '      <select id="un-forma" class="chalk-select">' +
      formaOpts +
      "</select></fieldset>" +
      '    <fieldset class="fld"><legend>Dificultate</legend>' +
      '      <div class="radios" id="un-dif">' +
      LEVELS.map(function (l, i) {
        return (
          '<label class="radio"><input type="radio" name="undif" value="' +
          l.key +
          '"' +
          (i === 1 ? " checked" : "") +
          "> " +
          l.label +
          "</label>"
        );
      }).join("") +
      "      </div></fieldset>" +
      '    <fieldset class="fld"><legend>Număr planșe</legend>' +
      '      <div class="stepper">' +
      '        <button type="button" class="chalk-mini" id="un-pminus">−</button>' +
      '        <input type="number" id="un-np" min="1" max="8" value="2" inputmode="numeric">' +
      '        <button type="button" class="chalk-mini" id="un-pplus">+</button>' +
      "      </div>" +
      '      <p class="adv-note">„Amestecat" alege forme diferite; o formă anume dă o singură planșă.</p>' +
      "    </fieldset>" +
      '    <details class="adv"><summary>Avansat</summary>' +
      '      <div class="adv-row"><label>Seed (opțional) <input type="number" id="un-seed" placeholder="aleator" inputmode="numeric"></label></div>' +
      "    </details>" +
      '    <button type="submit" class="chalk-cta">⚡ Generează</button>' +
      "  </form>" +
      '  <div class="gen-actions" id="un-actions" style="display:none">' +
      '    <button type="button" class="chalk-btn2" id="un-sol">👁 Arată soluția</button>' +
      '    <button type="button" class="chalk-btn2" id="un-print">🖨 Print / PDF</button>' +
      '    <button type="button" class="chalk-btn2" id="un-cart">🧺 Adaugă în coș</button>' +
      '    <span class="gen-meta" id="un-meta"></span>' +
      "  </div>" +
      '  <div class="gen-preview" id="un-preview"><p class="hint">Alege forma și dificultatea, apoi „Generează".</p></div>' +
      "</div>";

    var form = document.getElementById("un-form");
    var formaSel = document.getElementById("un-forma");
    var npInput = document.getElementById("un-np");
    var seedInput = document.getElementById("un-seed");
    var preview = document.getElementById("un-preview");
    var actions = document.getElementById("un-actions");
    var solBtn = document.getElementById("un-sol");
    var printBtn = document.getElementById("un-print");
    var cartBtn = document.getElementById("un-cart");
    var meta = document.getElementById("un-meta");
    cartBtn.addEventListener("click", function () {
      addBatchToCart("uneste", state.items, cartBtn);
    });

    var state = { items: [], showSolution: false };

    function selectedDif() {
      var r = document.querySelector('input[name="undif"]:checked');
      return r ? r.value : "Standard";
    }
    function clampNp() {
      var v = parseInt(npInput.value, 10);
      if (isNaN(v)) v = 1;
      v = Math.max(1, Math.min(8, v));
      npInput.value = v;
      return v;
    }
    document.getElementById("un-pminus").addEventListener("click", function () {
      npInput.value = Math.max(1, clampNp() - 1);
    });
    document.getElementById("un-pplus").addEventListener("click", function () {
      npInput.value = Math.min(8, clampNp() + 1);
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
      var forma = formaSel.value;
      var dif = selectedDif();
      var np = clampNp();
      var seedRaw = seedInput.value.trim();
      var seedAdv = seedRaw === "" ? null : parseInt(seedRaw, 10);
      var base = seedAdv !== null && !isNaN(seedAdv) ? seedAdv : randomSeed();
      var items = [];
      var seen = {};
      var seed = base;
      var guard = 0;
      while (items.length < np && guard < np + 400) {
        guard++;
        try {
          var it = uneste.buildOne({ forma: forma, dificultate: dif }, seed);
          if (!seen[it.semnatura] && historyFresh(it.semnatura)) {
            seen[it.semnatura] = true;
            items.push(it);
          }
        } catch (e) {
          if (window.console) console.error("[planse:uneste]", e);
        }
        seed++;
        // o formă fixă dă o singură planșă (semnătură constantă) → nu bucla inutil
        if (forma !== "aleator") break;
      }
      state.items = items;
      state.showSolution = false;
      renderPreview();
      meta.textContent =
        items.length +
        " planșă" +
        (items.length === 1 ? "" : "e") +
        " · seed bază " +
        base;
      actions.style.display = items.length ? "flex" : "none";
      solBtn.textContent = "👁 Arată soluția";
    }

    function renderPreview() {
      if (!state.items.length) {
        preview.innerHTML = '<p class="hint">Nicio planșă generată.</p>';
        return;
      }
      var html = "";
      for (var i = 0; i < state.items.length; i++) {
        var r = uneste.render(state.items[i]);
        html +=
          '<div class="preview-item"><div class="preview-cap">Planșă ' +
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
      var draws = preview.querySelectorAll(".unaste-draw");
      for (var i = 0; i < draws.length; i++) {
        draws[i].classList.toggle("show-solution", state.showSolution);
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
        var pg = uneste.renderPages(state.items[i], i + 1, total);
        puzzle.push(pg.puzzle);
        answer.push(pg.answer);
      }
      var doc = window.PlanseRender.printDocument({
        title: "Unește punctele",
        css: uneste.printCss,
        puzzlePages: puzzle,
        answerPages: answer,
      });
      var w = window.PlanseRender.openPrintWindow(doc);
      if (!w) {
        var blob = new Blob([doc], { type: "text/html" });
        var url = URL.createObjectURL(blob);
        var old = document.getElementById("un-fallback");
        if (old) old.remove();
        var note = el(
          '<div id="un-fallback" class="fallback">Fereastra de print a fost blocată. ' +
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

  // ---------------- DICTARE (dictare grafică) ----------------
  function mountDictare() {
    var dictare = window.PlanseGen && window.PlanseGen.dictare;
    if (!dictare) {
      panel.innerHTML =
        '<div class="wip"><h2>Eroare</h2><p>Generatorul dictare nu s-a încărcat.</p></div>';
      return;
    }
    var LEVELS = [
      { key: "Usor", label: "Ușor (grilă mică, puțini pași)" },
      { key: "Standard", label: "Standard" },
      { key: "Greu", label: "Greu (grilă mare, mulți pași)" },
    ];
    var formaOpts =
      '<option value="aleator">Amestecat (surpriză)</option>' +
      dictare.SHAPE_IDS.map(function (id) {
        return (
          '<option value="' + id + '">' + dictare.SHAPES[id].label + "</option>"
        );
      }).join("");

    panel.innerHTML =
      '<div class="gen">' +
      '  <form class="gen-form" id="di-form">' +
      '    <fieldset class="fld"><legend>Formă</legend>' +
      '      <select id="di-forma" class="chalk-select">' +
      formaOpts +
      "</select></fieldset>" +
      '    <fieldset class="fld"><legend>Dificultate</legend>' +
      '      <div class="radios" id="di-dif">' +
      LEVELS.map(function (l, i) {
        return (
          '<label class="radio"><input type="radio" name="didif" value="' +
          l.key +
          '"' +
          (i === 1 ? " checked" : "") +
          "> " +
          l.label +
          "</label>"
        );
      }).join("") +
      "      </div></fieldset>" +
      '    <fieldset class="fld"><legend>Număr planșe</legend>' +
      '      <div class="stepper">' +
      '        <button type="button" class="chalk-mini" id="di-pminus">−</button>' +
      '        <input type="number" id="di-np" min="1" max="8" value="2" inputmode="numeric">' +
      '        <button type="button" class="chalk-mini" id="di-pplus">+</button>' +
      "      </div>" +
      '      <p class="adv-note">„Amestecat" alege forme din banda dificultății; o formă anume dă o singură planșă. La dificultate mai mare grila se mărește ca să încapă forma.</p>' +
      "    </fieldset>" +
      '    <details class="adv"><summary>Avansat</summary>' +
      '      <div class="adv-row"><label>Seed (opțional) <input type="number" id="di-seed" placeholder="aleator" inputmode="numeric"></label></div>' +
      "    </details>" +
      '    <button type="submit" class="chalk-cta">⚡ Generează</button>' +
      "  </form>" +
      '  <div class="gen-actions" id="di-actions" style="display:none">' +
      '    <button type="button" class="chalk-btn2" id="di-sol">👁 Arată soluția</button>' +
      '    <button type="button" class="chalk-btn2" id="di-print">🖨 Print / PDF</button>' +
      '    <button type="button" class="chalk-btn2" id="di-cart">🧺 Adaugă în coș</button>' +
      '    <span class="gen-meta" id="di-meta"></span>' +
      "  </div>" +
      '  <div class="gen-preview" id="di-preview"><p class="hint">Alege forma și dificultatea, apoi „Generează".</p></div>' +
      "</div>";

    var form = document.getElementById("di-form");
    var formaSel = document.getElementById("di-forma");
    var npInput = document.getElementById("di-np");
    var seedInput = document.getElementById("di-seed");
    var preview = document.getElementById("di-preview");
    var actions = document.getElementById("di-actions");
    var solBtn = document.getElementById("di-sol");
    var printBtn = document.getElementById("di-print");
    var cartBtn = document.getElementById("di-cart");
    var meta = document.getElementById("di-meta");
    cartBtn.addEventListener("click", function () {
      addBatchToCart("dictare", state.items, cartBtn);
    });

    var state = { items: [], showSolution: false };

    function selectedDif() {
      var r = document.querySelector('input[name="didif"]:checked');
      return r ? r.value : "Standard";
    }
    function clampNp() {
      var v = parseInt(npInput.value, 10);
      if (isNaN(v)) v = 1;
      v = Math.max(1, Math.min(8, v));
      npInput.value = v;
      return v;
    }
    document.getElementById("di-pminus").addEventListener("click", function () {
      npInput.value = Math.max(1, clampNp() - 1);
    });
    document.getElementById("di-pplus").addEventListener("click", function () {
      npInput.value = Math.min(8, clampNp() + 1);
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
      var forma = formaSel.value;
      var dif = selectedDif();
      var np = clampNp();
      var seedRaw = seedInput.value.trim();
      var seedAdv = seedRaw === "" ? null : parseInt(seedRaw, 10);
      var base = seedAdv !== null && !isNaN(seedAdv) ? seedAdv : randomSeed();
      var items = [];
      var seen = {};
      var seed = base;
      var guard = 0;
      while (items.length < np && guard < np + 400) {
        guard++;
        try {
          var it = dictare.buildOne({ forma: forma, dificultate: dif }, seed);
          if (!seen[it.semnatura] && historyFresh(it.semnatura)) {
            seen[it.semnatura] = true;
            items.push(it);
          }
        } catch (e) {
          if (window.console) console.error("[planse:dictare]", e);
        }
        seed++;
        // o formă fixă dă o singură planșă (semnătură constantă) → nu bucla inutil
        if (forma !== "aleator") break;
      }
      state.items = items;
      state.showSolution = false;
      renderPreview();
      meta.textContent =
        items.length +
        " planșă" +
        (items.length === 1 ? "" : "e") +
        (items.length < np
          ? " (doar atâtea forme distincte la această dificultate)"
          : "") +
        " · seed bază " +
        base;
      actions.style.display = items.length ? "flex" : "none";
      solBtn.textContent = "👁 Arată soluția";
    }

    function renderPreview() {
      if (!state.items.length) {
        preview.innerHTML = '<p class="hint">Nicio planșă generată.</p>';
        return;
      }
      var html = "";
      for (var i = 0; i < state.items.length; i++) {
        var r = dictare.render(state.items[i]);
        html +=
          '<div class="preview-item"><div class="preview-cap">Planșă ' +
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
      var draws = preview.querySelectorAll(".dict-draw");
      for (var i = 0; i < draws.length; i++) {
        draws[i].classList.toggle("show-solution", state.showSolution);
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
        var pg = dictare.renderPages(state.items[i], i + 1, total);
        puzzle.push(pg.puzzle);
        answer.push(pg.answer);
      }
      var doc = window.PlanseRender.printDocument({
        title: "Dictare grafică",
        css: dictare.printCss,
        puzzlePages: puzzle,
        answerPages: answer,
      });
      var w = window.PlanseRender.openPrintWindow(doc);
      if (!w) {
        var blob = new Blob([doc], { type: "text/html" });
        var url = URL.createObjectURL(blob);
        var old = document.getElementById("di-fallback");
        if (old) old.remove();
        var note = el(
          '<div id="di-fallback" class="fallback">Fereastra de print a fost blocată. ' +
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

  // ---------------- NUMERE (crossmath 3×3/4×4/5×5) ----------------
  function mountNumere() {
    var numere = window.PlanseGen && window.PlanseGen.numere;
    if (!numere) {
      panel.innerHTML =
        '<div class="wip"><h2>Eroare</h2><p>Generatorul numere nu s-a încărcat.</p></div>';
      return;
    }
    // Etichetele NU includ N/goluri exacte (variază cu Mărimea — vezi
    // numere.DIFF[marime][dif] — un text fix ar deveni fals la 4×4/5×5).
    var LEVELS = [
      { key: "Usor", label: "Ușor (doar +)" },
      { key: "Standard", label: "Standard (+/−)" },
      { key: "Greu", label: "Greu (+/−, mai multe goluri)" },
    ];

    var MARIMI = numere.MARIMI || [3];
    var marimeOpts = MARIMI.map(function (m) {
      return '<option value="' + m + '">' + m + "×" + m + "</option>";
    }).join("");

    panel.innerHTML =
      '<div class="gen">' +
      '  <form class="gen-form" id="nm-form">' +
      '    <fieldset class="fld"><legend>Mărime grilă</legend>' +
      '      <select id="nm-marime" class="chalk-select">' +
      marimeOpts +
      "</select></fieldset>" +
      '    <fieldset class="fld"><legend>Dificultate</legend>' +
      '      <div class="radios" id="nm-dif">' +
      LEVELS.map(function (l, i) {
        return (
          '<label class="radio"><input type="radio" name="nmdif" value="' +
          l.key +
          '"' +
          (i === 1 ? " checked" : "") +
          "> " +
          l.label +
          "</label>"
        );
      }).join("") +
      "      </div></fieldset>" +
      '    <fieldset class="fld"><legend>Număr careuri</legend>' +
      '      <div class="stepper">' +
      '        <button type="button" class="chalk-mini" id="nm-pminus">−</button>' +
      '        <input type="number" id="nm-np" min="1" max="8" value="2" inputmode="numeric">' +
      '        <button type="button" class="chalk-mini" id="nm-pplus">+</button>' +
      "      </div>" +
      '      <p class="adv-note">Fiecare careu are soluție UNICĂ (verificată). Rândurile și coloanele dau rezultatele scrise; se calculează de la stânga la dreapta.</p>' +
      "    </fieldset>" +
      '    <details class="adv"><summary>Avansat</summary>' +
      '      <div class="adv-row"><label>Seed (opțional) <input type="number" id="nm-seed" placeholder="aleator" inputmode="numeric"></label></div>' +
      "    </details>" +
      '    <button type="submit" class="chalk-cta">⚡ Generează</button>' +
      "  </form>" +
      '  <div class="gen-actions" id="nm-actions" style="display:none">' +
      '    <button type="button" class="chalk-btn2" id="nm-sol">👁 Arată soluția</button>' +
      '    <button type="button" class="chalk-btn2" id="nm-print">🖨 Print / PDF</button>' +
      '    <button type="button" class="chalk-btn2" id="nm-cart">🧺 Adaugă în coș</button>' +
      '    <span class="gen-meta" id="nm-meta"></span>' +
      "  </div>" +
      '  <div class="gen-preview" id="nm-preview"><p class="hint">Alege dificultatea, apoi „Generează".</p></div>' +
      "</div>";

    var form = document.getElementById("nm-form");
    var npInput = document.getElementById("nm-np");
    var seedInput = document.getElementById("nm-seed");
    var preview = document.getElementById("nm-preview");
    var actions = document.getElementById("nm-actions");
    var solBtn = document.getElementById("nm-sol");
    var printBtn = document.getElementById("nm-print");
    var cartBtn = document.getElementById("nm-cart");
    var meta = document.getElementById("nm-meta");
    cartBtn.addEventListener("click", function () {
      addBatchToCart("numere", state.items, cartBtn);
    });

    var state = { items: [], showSolution: false };

    function selectedDif() {
      var r = document.querySelector('input[name="nmdif"]:checked');
      return r ? r.value : "Standard";
    }
    function selectedMarime() {
      var sel = document.getElementById("nm-marime");
      return sel ? parseInt(sel.value, 10) : MARIMI[0];
    }
    function clampNp() {
      var v = parseInt(npInput.value, 10);
      if (isNaN(v)) v = 1;
      v = Math.max(1, Math.min(8, v));
      npInput.value = v;
      return v;
    }
    document.getElementById("nm-pminus").addEventListener("click", function () {
      npInput.value = Math.max(1, clampNp() - 1);
    });
    document.getElementById("nm-pplus").addEventListener("click", function () {
      npInput.value = Math.min(8, clampNp() + 1);
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
      var dif = selectedDif();
      var marime = selectedMarime();
      var np = clampNp();
      var seedRaw = seedInput.value.trim();
      var seedAdv = seedRaw === "" ? null : parseInt(seedRaw, 10);
      var base = seedAdv !== null && !isNaN(seedAdv) ? seedAdv : randomSeed();
      var items = [];
      var seen = {};
      var seed = base;
      var guard = 0;
      while (items.length < np && guard < np + 400) {
        guard++;
        try {
          var it = numere.buildOne({ marime: marime, dificultate: dif }, seed);
          if (!seen[it.semnatura] && historyFresh(it.semnatura)) {
            seen[it.semnatura] = true;
            items.push(it);
          }
        } catch (e) {
          if (window.console) console.error("[planse:numere]", e);
        }
        seed++;
      }
      state.items = items;
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
        var r = numere.render(state.items[i]);
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
      var grids = preview.querySelectorAll(".nm-grid");
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
        var pg = numere.renderPages(state.items[i], i + 1, total);
        puzzle.push(pg.puzzle);
        answer.push(pg.answer);
      }
      var doc = window.PlanseRender.printDocument({
        title: "Numere — careuri",
        css: numere.printCss,
        puzzlePages: puzzle,
        answerPages: answer,
      });
      var w = window.PlanseRender.openPrintWindow(doc);
      if (!w) {
        var blob = new Blob([doc], { type: "text/html" });
        var url = URL.createObjectURL(blob);
        var old = document.getElementById("nm-fallback");
        if (old) old.remove();
        var note = el(
          '<div id="nm-fallback" class="fallback">Fereastra de print a fost blocată. ' +
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

  // ---------------- INTEGRAMĂ (moară de vânt) ----------------
  function mountIntegrama() {
    var integrama = window.PlanseGen && window.PlanseGen.integrama;
    if (!integrama) {
      panel.innerHTML =
        '<div class="wip"><h2>Eroare</h2><p>Generatorul integrama nu s-a încărcat.</p></div>';
      return;
    }
    var LEVELS = [
      { key: "Usor", label: "Ușor (domeniu mic, puține goluri)" },
      { key: "Standard", label: "Standard" },
      { key: "Greu", label: "Greu (domeniu mare, mai multe goluri)" },
    ];
    var formaOpts =
      '<option value="aleator">Amestecat (surpriză)</option>' +
      integrama.FORME.map(function (id) {
        return (
          '<option value="' +
          id +
          '">' +
          (integrama.FORM_LABELS[id] || id) +
          "</option>"
        );
      }).join("");

    panel.innerHTML =
      '<div class="gen">' +
      '  <form class="gen-form" id="ig-form">' +
      '    <fieldset class="fld"><legend>Formă</legend>' +
      '      <select id="ig-forma" class="chalk-select">' +
      formaOpts +
      "</select></fieldset>" +
      '    <fieldset class="fld"><legend>Dificultate</legend>' +
      '      <div class="radios" id="ig-dif">' +
      LEVELS.map(function (l, i) {
        return (
          '<label class="radio"><input type="radio" name="igdif" value="' +
          l.key +
          '"' +
          (i === 1 ? " checked" : "") +
          "> " +
          l.label +
          "</label>"
        );
      }).join("") +
      "      </div></fieldset>" +
      '    <fieldset class="fld"><legend>Număr integrame</legend>' +
      '      <div class="stepper">' +
      '        <button type="button" class="chalk-mini" id="ig-pminus">−</button>' +
      '        <input type="number" id="ig-np" min="1" max="8" value="2" inputmode="numeric">' +
      '        <button type="button" class="chalk-mini" id="ig-pplus">+</button>' +
      "      </div>" +
      '      <p class="adv-note">Fiecare integramă are soluție UNICĂ (verificată). Fiecare cruce = 4 ecuații scurte (+, −, ×, ÷) care se ating într-un număr comun.</p>' +
      "    </fieldset>" +
      '    <details class="adv"><summary>Avansat</summary>' +
      '      <div class="adv-row"><label>Seed (opțional) <input type="number" id="ig-seed" placeholder="aleator" inputmode="numeric"></label></div>' +
      "    </details>" +
      '    <button type="submit" class="chalk-cta">⚡ Generează</button>' +
      "  </form>" +
      '  <div class="gen-actions" id="ig-actions" style="display:none">' +
      '    <button type="button" class="chalk-btn2" id="ig-sol">👁 Arată soluția</button>' +
      '    <button type="button" class="chalk-btn2" id="ig-print">🖨 Print / PDF</button>' +
      '    <button type="button" class="chalk-btn2" id="ig-cart">🧺 Adaugă în coș</button>' +
      '    <span class="gen-meta" id="ig-meta"></span>' +
      "  </div>" +
      '  <div class="gen-preview" id="ig-preview"><p class="hint">Alege dificultatea, apoi „Generează".</p></div>' +
      "</div>";

    var form = document.getElementById("ig-form");
    var formaSel = document.getElementById("ig-forma");
    var npInput = document.getElementById("ig-np");
    var seedInput = document.getElementById("ig-seed");
    var preview = document.getElementById("ig-preview");
    var actions = document.getElementById("ig-actions");
    var solBtn = document.getElementById("ig-sol");
    var printBtn = document.getElementById("ig-print");
    var cartBtn = document.getElementById("ig-cart");
    var meta = document.getElementById("ig-meta");
    cartBtn.addEventListener("click", function () {
      addBatchToCart("integrama", state.items, cartBtn);
    });

    var state = { items: [], showSolution: false };

    function selectedDif() {
      var r = document.querySelector('input[name="igdif"]:checked');
      return r ? r.value : "Standard";
    }
    function clampNp() {
      var v = parseInt(npInput.value, 10);
      if (isNaN(v)) v = 1;
      v = Math.max(1, Math.min(8, v));
      npInput.value = v;
      return v;
    }
    document.getElementById("ig-pminus").addEventListener("click", function () {
      npInput.value = Math.max(1, clampNp() - 1);
    });
    document.getElementById("ig-pplus").addEventListener("click", function () {
      npInput.value = Math.min(8, clampNp() + 1);
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
      var forma = formaSel.value;
      var dif = selectedDif();
      var np = clampNp();
      var seedRaw = seedInput.value.trim();
      var seedAdv = seedRaw === "" ? null : parseInt(seedRaw, 10);
      var base = seedAdv !== null && !isNaN(seedAdv) ? seedAdv : randomSeed();
      var items = [];
      var seen = {};
      var seed = base;
      var guard = 0;
      while (items.length < np && guard < np + 400) {
        guard++;
        try {
          var it = integrama.buildOne({ forma: forma, dificultate: dif }, seed);
          if (!seen[it.semnatura] && historyFresh(it.semnatura)) {
            seen[it.semnatura] = true;
            items.push(it);
          }
        } catch (e) {
          if (window.console) console.error("[planse:integrama]", e);
        }
        seed++;
      }
      state.items = items;
      state.showSolution = false;
      renderPreview();
      meta.textContent =
        items.length +
        " integram" +
        (items.length === 1 ? "ă" : "e") +
        " · seed bază " +
        base;
      actions.style.display = items.length ? "flex" : "none";
      solBtn.textContent = "👁 Arată soluția";
    }

    function renderPreview() {
      if (!state.items.length) {
        preview.innerHTML = '<p class="hint">Nicio integramă generată.</p>';
        return;
      }
      var html = "";
      for (var i = 0; i < state.items.length; i++) {
        var r = integrama.render(state.items[i]);
        html +=
          '<div class="preview-item"><div class="preview-cap">Integramă ' +
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
      var grids = preview.querySelectorAll(".ig-grid");
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
        var pg = integrama.renderPages(state.items[i], i + 1, total);
        puzzle.push(pg.puzzle);
        answer.push(pg.answer);
      }
      var doc = window.PlanseRender.printDocument({
        title: "Integramă — careuri",
        css: integrama.printCss,
        puzzlePages: puzzle,
        answerPages: answer,
      });
      var w = window.PlanseRender.openPrintWindow(doc);
      if (!w) {
        var blob = new Blob([doc], { type: "text/html" });
        var url = URL.createObjectURL(blob);
        var old = document.getElementById("ig-fallback");
        if (old) old.remove();
        var note = el(
          '<div id="ig-fallback" class="fallback">Fereastra de print a fost blocată. ' +
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

  // ---------------- ISTORIC & COȘ (P4) ----------------
  function mountIstoric() {
    var H = window.PlanseHistory;
    if (!H) {
      panel.innerHTML =
        '<div class="wip"><h2>Eroare</h2><p>lib/history.js nu s-a încărcat.</p></div>';
      return;
    }

    function doPrint() {
      var cart = H.getCart();
      if (!cart.length) return;
      var total = cart.length;
      var puzzle = [],
        answer = [];
      var cssParts = {},
        cssOrder = [];
      cart.forEach(function (entry, idx) {
        var gen = window.PlanseGen[entry.tip];
        if (!gen) return;
        var pg = gen.renderPages(entry.item, idx + 1, total);
        puzzle.push(pg.puzzle);
        answer.push(pg.answer);
        if (!cssParts[entry.tip]) {
          cssParts[entry.tip] = gen.printCss || "";
          cssOrder.push(entry.tip);
        }
      });
      var css = cssOrder
        .map(function (t) {
          return cssParts[t];
        })
        .join("\n");
      var doc = window.PlanseRender.printDocument({
        title: "Coș planșe",
        css: css,
        puzzlePages: puzzle,
        answerPages: answer,
      });
      var w = window.PlanseRender.openPrintWindow(doc);
      if (!w) {
        var blob = new Blob([doc], { type: "text/html" });
        var url = URL.createObjectURL(blob);
        var note = el(
          '<div class="fallback">Fereastra de print a fost blocată. ' +
            '<a href="' +
            url +
            '" target="_blank" rel="noopener">Deschide foaia de print →</a></div>',
        );
        panel.insertBefore(note, panel.firstChild);
        return; // nu goli coșul dacă print-ul n-a pornit — userul poate reîncerca
      }
      H.clearCart();
      renderList();
    }

    function renderList() {
      var cart = H.getCart();
      var html = '<div class="gen">';
      html +=
        '<p class="adv-note">Planșe adăugate din ORICE generator (Numere, Integramă, Labirint, Unește, Dictare, Căutare) → un SINGUR document de print. Fiecare planșă adăugată aici e reținută ca „deja folosită" — generatoarele nu o vor mai oferi din nou automat.</p>';
      html += '<div class="gen-actions" style="margin-bottom:16px;">';
      html +=
        '<button type="button" class="chalk-cta" id="ist-print"' +
        (cart.length ? "" : " disabled") +
        ">🖨 Printează coșul (" +
        cart.length +
        ")</button>";
      html +=
        '<button type="button" class="chalk-btn2" id="ist-clear"' +
        (cart.length ? "" : " disabled") +
        ">🗑 Golește coșul</button>";
      html += "</div>";
      if (!cart.length) {
        html +=
          '<p class="hint">Coșul e gol. Generează o planșă la orice tip și apasă „🧺 Adaugă în coș".</p>';
      } else {
        html += '<div class="gen-preview">';
        cart.forEach(function (entry, idx) {
          var gen = window.PlanseGen[entry.tip];
          var rr = null;
          try {
            rr = gen ? gen.render(entry.item) : null;
          } catch (e) {
            rr = null;
          }
          html +=
            '<div class="preview-item"><div class="preview-cap">' +
            (idx + 1) +
            "/" +
            cart.length +
            " — " +
            entry.tip +
            ' <button type="button" class="chalk-mini" data-remove="' +
            entry.semnatura +
            '">🗑</button></div>';
          html += rr
            ? rr.interactive
            : '<p class="hint">(nu s-a putut re-randa — generatorul lipsește)</p>';
          html += "</div>";
        });
        html += "</div>";
      }
      html += "</div>";
      panel.innerHTML = html;

      var printBtn = document.getElementById("ist-print");
      var clearBtn = document.getElementById("ist-clear");
      if (printBtn) printBtn.addEventListener("click", doPrint);
      if (clearBtn)
        clearBtn.addEventListener("click", function () {
          H.clearCart();
          renderList();
        });
      Array.prototype.forEach.call(
        panel.querySelectorAll("[data-remove]"),
        function (btn) {
          btn.addEventListener("click", function () {
            H.removeFromCart(btn.getAttribute("data-remove"));
            renderList();
          });
        },
      );
    }

    renderList();
  }

  // ---------------- SHELL ----------------
  function renderPanel(tab) {
    if (tab.id === "labirint" && tab.ready) {
      mountLabirint();
    } else if (tab.id === "cautare" && tab.ready) {
      mountCautare();
    } else if (tab.id === "uneste" && tab.ready) {
      mountUneste();
    } else if (tab.id === "dictare" && tab.ready) {
      mountDictare();
    } else if (tab.id === "numere" && tab.ready) {
      mountNumere();
    } else if (tab.id === "integrama" && tab.ready) {
      mountIntegrama();
    } else if (tab.id === "istoric" && tab.ready) {
      mountIstoric();
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
