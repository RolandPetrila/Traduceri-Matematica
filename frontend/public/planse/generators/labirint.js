/* labirint.js — port JS al generator_labirint.py (Carla). Contract §5:
 *   buildOne(params, seed) -> item
 *   render(item) -> { pages:[fragment], css }   (+ `interactive` pt preview live)
 *   selftest() -> { ok, detalii }
 *   signature(item) -> string
 *
 * Algoritm identic: recursive backtracker iterativ (DFS) → labirint PERFECT
 * (arbore) ⇒ drum unic. RNG = oracol PyRandom (byte-exact cu random.Random Python).
 * Cheile de nivel sunt ASCII ("Usor"/"Standard"/"Avansat") ca semnătura MD5 să fie
 * IDENTICĂ cu Python; eticheta afișată (cu diacritice) e separată, în UI.
 *
 * Variație (2026-08-08, B/labirint): forma grilei (pătrat/lat/înalt, derivată din
 * n-ul nivelului — NU schimbă NIVELURI) + poziția ieșirii (colț opus implicit /
 * mijloc dreapta / mijloc jos / aleator). Ambele sunt OPȚIONALE și implicite la
 * comportamentul vechi (patrat + coltOpus), ca cele 24 de cazuri PY_REF din
 * selftest.html (oracol MT19937 byte-exact, semnătură "nivel|NxN|hash" pe 3
 * segmente) să rămână identice bit-cu-bit. "aleator" extrage din rng DUPĂ
 * genereaza() — nu atinge fluxul de randomness al labirintului însuși.
 */
(function (root) {
  "use strict";

  var PyRandom = root.PlansePRNG.PyRandom;
  var Sig = root.PlanseSig;

  var NIVELURI = { Usor: 8, Standard: 12, Avansat: 16 };
  var FORME = { patrat: "Pătrat", lat: "Lat", inalt: "Înalt" };
  var IESIRI = {
    coltOpus: "Colț opus",
    mijlocDreapta: "Mijloc dreapta",
    mijlocJos: "Mijloc jos",
    aleator: "Aleator",
  };
  var DIRS = [
    [-1, 0],
    [1, 0],
    [0, 1],
    [0, -1],
  ]; // N, S, E, V

  // Dimensiuni rows×cols pornind de la n-ul nivelului. "patrat" (implicit) =
  // rows=cols=n, identic cu comportamentul dinaintea acestei extinderi.
  function dimsFor(n, forma) {
    if (forma === "lat") {
      var d1 = Math.round(n / 4);
      return { rows: n - d1, cols: n + d1 };
    }
    if (forma === "inalt") {
      var d2 = Math.round(n / 4);
      return { rows: n + d2, cols: n - d2 };
    }
    return { rows: n, cols: n };
  }

  // Poziția ieșirii. "coltOpus" (implicit) = [rows-1, cols-1], identic cu
  // vechiul comportament hardcodat. "aleator" e singura variantă care extrage
  // din rng — și doar ea, doar când e cerută explicit.
  function exitFor(rows, cols, iesire, rng) {
    if (iesire === "mijlocDreapta") return [Math.floor(rows / 2), cols - 1];
    if (iesire === "mijlocJos") return [rows - 1, Math.floor(cols / 2)];
    if (iesire === "aleator") {
      var candidati = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var peMargine =
            r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
          if (peMargine && !(r === 0 && c === 0)) candidati.push([r, c]);
        }
      }
      return candidati[rng.randrange(candidati.length)];
    }
    return [rows - 1, cols - 1]; // coltOpus
  }

  function edgeKey(a, b) {
    // cheie canonică (celula mai mică prima), pentru membership rapid
    var lo, hi;
    if (a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1])) {
      lo = a;
      hi = b;
    } else {
      lo = b;
      hi = a;
    }
    return lo[0] + "," + lo[1] + "|" + hi[0] + "," + hi[1];
  }

  function genereaza(rows, cols, rng) {
    var vizitat = [];
    for (var r = 0; r < rows; r++) vizitat.push(new Array(cols).fill(false));
    var pasaje = new Set(); // chei canonice
    var edges = []; // [[a,b]] pentru semnătură
    var stiva = [[0, 0]];
    vizitat[0][0] = true;
    var nrViz = 1;
    while (stiva.length) {
      var cur = stiva[stiva.length - 1];
      var cr = cur[0],
        cc = cur[1];
      var vecini = [];
      for (var d = 0; d < DIRS.length; d++) {
        var nr = cr + DIRS[d][0],
          nc = cc + DIRS[d][1];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !vizitat[nr][nc]) {
          vecini.push([nr, nc]);
        }
      }
      if (vecini.length) {
        var pick = vecini[rng.randrange(vecini.length)];
        pasaje.add(edgeKey([cr, cc], pick));
        edges.push([[cr, cc], pick]);
        vizitat[pick[0]][pick[1]] = true;
        nrViz++;
        stiva.push(pick);
      } else {
        stiva.pop();
      }
    }
    return { pasaje: pasaje, edges: edges, nrViz: nrViz };
  }

  function arePasaj(pasaje, a, b) {
    return pasaje.has(edgeKey(a, b));
  }

  function verifica(rows, cols, pasaje, edges, exit) {
    var total = rows * cols;
    if (edges.length !== total - 1) {
      throw new Error(
        "VERIFICARE ESUATA: muchii=" +
          edges.length +
          " != celule-1=" +
          (total - 1) +
          " (nu e arbore perfect)",
      );
    }
    // adiacență
    var adj = {};
    function key(cell) {
      return cell[0] + "," + cell[1];
    }
    for (var r = 0; r < rows; r++)
      for (var c = 0; c < cols; c++) adj[r + "," + c] = [];
    for (var e = 0; e < edges.length; e++) {
      var a = edges[e][0],
        b = edges[e][1];
      adj[key(a)].push(b);
      adj[key(b)].push(a);
    }
    // BFS (0,0) -> exit + reconstrucție drum + accesibilitate totală
    var start = [0, 0];
    var prev = {};
    prev[key(start)] = null;
    var q = [start];
    var head = 0;
    while (head < q.length) {
      var curr = q[head++];
      var neigh = adj[key(curr)];
      for (var i = 0; i < neigh.length; i++) {
        var nb = neigh[i];
        if (!(key(nb) in prev)) {
          prev[key(nb)] = curr;
          q.push(nb);
        }
      }
    }
    if (!(key(exit) in prev))
      throw new Error("VERIFICARE ESUATA: nu exista drum START->IESIRE");
    if (Object.keys(prev).length !== total)
      throw new Error(
        "VERIFICARE ESUATA: doar " +
          Object.keys(prev).length +
          "/" +
          total +
          " celule accesibile",
      );
    var drum = [];
    var cur2 = exit;
    while (cur2 !== null) {
      drum.push(cur2);
      cur2 = prev[key(cur2)];
    }
    drum.reverse();
    return drum;
  }

  function buildOne(params, seed) {
    var nivel = params.nivel;
    if (!(nivel in NIVELURI)) throw new Error("nivel necunoscut: " + nivel);
    var n = NIVELURI[nivel];
    var forma = params.forma && FORME[params.forma] ? params.forma : "patrat";
    var iesire =
      params.iesire && IESIRI[params.iesire] ? params.iesire : "coltOpus";
    var dims = dimsFor(n, forma);
    var rows = dims.rows,
      cols = dims.cols;
    var rng = new PyRandom(seed);
    var g = genereaza(rows, cols, rng);
    var exit = exitFor(rows, cols, iesire, rng); // doar "aleator" consumă rng aici
    var drum = verifica(rows, cols, g.pasaje, g.edges, exit); // aruncă dacă invalid
    var extraParts = [];
    if (forma !== "patrat") extraParts.push("f=" + forma);
    if (iesire !== "coltOpus") extraParts.push("e=" + iesire);
    var extra = extraParts.join(",");
    return {
      tip: "labirint",
      nivel: nivel,
      n: n,
      forma: forma,
      iesire: iesire,
      rows: rows,
      cols: cols,
      exit: exit,
      pasaje: g.pasaje,
      edges: g.edges,
      drum: drum,
      nrViz: g.nrViz,
      seed: seed,
      semnatura: Sig.labirint(nivel, rows, cols, g.edges, extra || null),
    };
  }

  function signature(item) {
    return item.semnatura;
  }

  // ---------- RANDARE ----------
  function drumSetOf(item) {
    var s = new Set();
    for (var i = 0; i < item.drum.length; i++)
      s.add(item.drum[i][0] + "," + item.drum[i][1]);
    return s;
  }

  // celule ale grilei. mode: 'puzzle' | 'answer' (inline #c8c8c8) | 'interactive' (class sol)
  function celuleHtml(rows, cols, pasaje, drumSet, mode, exit) {
    var out = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var st = [];
        if (r === 0 || !arePasaj(pasaje, [r, c], [r - 1, c]))
          st.push("border-top:2.5px solid #000");
        if (r === rows - 1 || !arePasaj(pasaje, [r, c], [r + 1, c]))
          st.push("border-bottom:2.5px solid #000");
        if (c === 0 || !arePasaj(pasaje, [r, c], [r, c - 1]))
          st.push("border-left:2.5px solid #000");
        if (c === cols - 1 || !arePasaj(pasaje, [r, c], [r, c + 1]))
          st.push("border-right:2.5px solid #000");
        var cls = "cel";
        var onPath = drumSet && drumSet.has(r + "," + c);
        if (onPath) {
          if (mode === "interactive") cls += " sol";
          else if (mode === "answer") st.push("background:#c8c8c8");
        }
        var continut = "";
        if (r === 0 && c === 0)
          continut = '<span class="marcaj">&#9679;</span>';
        else if (r === exit[0] && c === exit[1])
          continut = '<span class="marcaj">&#9733;</span>';
        out.push(
          '<div class="' +
            cls +
            '" style="' +
            st.join(";") +
            '">' +
            continut +
            "</div>",
        );
      }
    }
    return out.join("\n");
  }

  function cellMm(rows, cols) {
    return Math.round(Math.min(165.0 / cols, 190.0 / rows, 20.0) * 10) / 10;
  }

  function gridStyle(rows, cols, mmOverride) {
    var mm = mmOverride || cellMm(rows, cols);
    return (
      "grid-template-columns:repeat(" +
      cols +
      ", " +
      mm +
      "mm);grid-template-rows:repeat(" +
      rows +
      ", " +
      mm +
      "mm);"
    );
  }

  // Pagină A4 print — port fidel al _pagina() din Python. mm = mărime celulă opțională.
  function paginaPrint(item, celuleHtmlStr, nr, total, raspuns, mm) {
    var clasa = raspuns ? "page-a4 pagina-raspuns" : "page-a4";
    var antet, sub;
    if (raspuns) {
      antet =
        '<div class="header-title">Raspuns &mdash; Labirint ' + nr + "</div>";
      sub =
        '<div class="nota-parinte">Pentru parinte &mdash; nu se printeaza (ascuns automat la print). Drumul-solutie e evidentiat.</div>';
    } else {
      antet =
        '<div class="header-title">Labirint</div>' +
        '<div class="header-fields"><div>Nume: ____________</div><div>Data: __________</div></div>';
      sub =
        '<div class="subtitlu">De la &#9679; (Start) la &#9733; (Iesire), fara sa treci prin pereti &bull; Nivel ' +
        item.nivel +
        " &bull; Labirint " +
        nr +
        "/" +
        total +
        "</div>";
    }
    return (
      '<div class="' +
      clasa +
      '">\n  <div class="header-row">' +
      antet +
      "</div>\n  " +
      sub +
      '\n  <div class="exercise-block">\n    <div class="labirint" style="' +
      gridStyle(item.rows, item.cols, mm) +
      '">\n' +
      celuleHtmlStr +
      "\n    </div>\n  </div>\n</div>"
    );
  }

  // CSS print — port al css-ului din randeaza() (Python), dar fontul unificat pe
  // Patrick Hand (același ca restul aplicației — consistență cerută de Roland).
  var PRINT_CSS =
    '  @import url("https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap");\n' +
    "  * { box-sizing:border-box; margin:0; padding:0; }\n" +
    "  body { font-family:'Patrick Hand', ui-rounded, 'Segoe UI', system-ui, sans-serif; color:#111; background:#fff; }\n" +
    "  @page { size:A4; margin:0mm; }\n" +
    "  @media print {\n" +
    "    body { margin:0 !important; padding:0 !important; }\n" +
    "    .page-a4 { width:210mm !important; height:297mm !important; margin:0 !important; overflow:hidden !important; }\n" +
    "    .pagina-raspuns { display:none !important; }\n" +
    "    * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }\n" +
    "  }\n" +
    "  .page-a4 { display:flex; flex-direction:column; page-break-after:always; width:210mm; min-height:297mm; padding:14mm; }\n" +
    "  .header-row { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6mm; }\n" +
    "  .header-title { font-size:1.6rem; font-weight:bold; }\n" +
    "  .header-fields { display:flex; gap:20px; font-size:1.05rem; }\n" +
    "  .subtitlu { font-size:1.05rem; color:#333; margin-bottom:8mm; }\n" +
    "  .nota-parinte { font-size:0.95rem; color:#333; margin-bottom:6mm; font-style:italic; }\n" +
    "  .exercise-block { flex-grow:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; }\n" +
    "  .labirint { display:grid; margin:0 auto; }\n" +
    "  .cel { display:flex; align-items:center; justify-content:center; }\n" +
    "  .marcaj { font-size:0.9rem; line-height:1; }";

  // CSS pentru preview-ul interactiv (pe alb, în modul; soluția pe toggle).
  var INTERACTIVE_CSS =
    ".lab-sheet { background:#fff; color:#111; border-radius:10px; padding:16px; margin:0 auto; max-width:100%; overflow:auto; font-family:'Patrick Hand', ui-rounded, 'Segoe UI', system-ui, sans-serif; }\n" +
    ".lab-sheet .lab-head { display:flex; justify-content:space-between; align-items:baseline; font-weight:bold; margin-bottom:6px; }\n" +
    ".lab-sheet .lab-sub { font-size:0.9rem; color:#333; margin-bottom:10px; }\n" +
    ".lab-sheet .labirint { display:grid; margin:0 auto; }\n" +
    ".lab-sheet .cel { display:flex; align-items:center; justify-content:center; }\n" +
    ".lab-sheet .marcaj { font-size:0.9rem; line-height:1; }\n" +
    ".lab-sheet .labirint.show-solution .cel.sol { background:#c8c8c8; }";

  // Pagini print pentru un item, cu numerotare corectă (nr/total) — folosit de
  // render.js la compunerea documentului de print multi-labirint / coșului.
  function renderPages(item, nr, total, mm) {
    var dSet = drumSetOf(item);
    return {
      puzzle: paginaPrint(
        item,
        celuleHtml(
          item.rows,
          item.cols,
          item.pasaje,
          null,
          "puzzle",
          item.exit,
        ),
        nr,
        total,
        false,
        mm,
      ),
      answer: paginaPrint(
        item,
        celuleHtml(
          item.rows,
          item.cols,
          item.pasaje,
          dSet,
          "answer",
          item.exit,
        ),
        nr,
        total,
        true,
        mm,
      ),
    };
  }

  function render(item, mm) {
    var dSet = drumSetOf(item);
    var pg = renderPages(item, 1, 1, mm);
    var puzzle = pg.puzzle;
    var answer = pg.answer;
    // fragment interactiv pentru preview live (grilă cu celule .sol togglabile)
    var interactive =
      '<div class="lab-sheet">' +
      '<div class="lab-head"><span>Labirint &bull; Nivel ' +
      item.nivel +
      "</span></div>" +
      '<div class="lab-sub">De la &#9679; (Start) la &#9733; (Iesire), fara sa treci prin pereti</div>' +
      '<div class="labirint" style="' +
      gridStyle(item.rows, item.cols, mm) +
      '">' +
      celuleHtml(
        item.rows,
        item.cols,
        item.pasaje,
        dSet,
        "interactive",
        item.exit,
      ) +
      "</div></div>";
    return {
      pages: [puzzle, answer],
      css: PRINT_CSS,
      interactive: interactive,
      interactiveCss: INTERACTIVE_CSS,
    };
  }

  // Extrage indexul celulei cu marcajul ★ dintr-un HTML generat de celuleHtml,
  // fără DOM (regex pe divurile "cel", în ordine) — verificare independentă că
  // ce se TIPĂREȘTE chiar arată ieșirea la item.exit (nu doar starea internă).
  function starCellFromHtml(html, cols) {
    var re = /<div class="cel[^>]*>(.*?)<\/div>/g;
    var idx = 0,
      m;
    while ((m = re.exec(html)) !== null) {
      if (m[1].indexOf("&#9733;") !== -1) {
        return [Math.floor(idx / cols), idx % cols];
      }
      idx++;
    }
    return null;
  }

  // ---------- SELFTEST (Stratul 1 — invarianți) ----------
  function verificaDrum(lab) {
    var drum = lab.drum;
    for (var i = 0; i + 1 < drum.length; i++) {
      var a = drum[i],
        b = drum[i + 1];
      if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1)
        throw new Error("drum cu saritura " + a + "->" + b);
      if (!arePasaj(lab.pasaje, a, b))
        throw new Error("drum trece prin perete " + a + "->" + b);
    }
    if (!(drum[0][0] === 0 && drum[0][1] === 0))
      throw new Error("drum nu incepe la (0,0)");
    var last = drum[drum.length - 1];
    if (!(last[0] === lab.exit[0] && last[1] === lab.exit[1]))
      throw new Error(
        "drum nu se termina la iesire " + lab.exit + " (termina " + last + ")",
      );
  }

  function selftest() {
    var detalii = [];
    var ok = true;

    // Stratul 1a — comportament implicit (patrat + coltOpus), NEATINS: aceasta
    // e bucla exercitată de PY_REF (selftest.html) pt. oracolul MT19937.
    for (var nivel in NIVELURI) {
      var nivOk = true;
      for (var seed = 0; seed < 5; seed++) {
        try {
          var lab = buildOne({ nivel: nivel }, seed);
          verificaDrum(lab);
        } catch (err) {
          ok = false;
          nivOk = false;
          detalii.push(
            "[FAIL] " + nivel + " seed=" + seed + ": " + err.message,
          );
        }
      }
      if (nivOk)
        detalii.push(
          "[OK] " +
            nivel +
            " (" +
            NIVELURI[nivel] +
            "x" +
            NIVELURI[nivel] +
            ") x5 seeds -> arbore perfect, drum unic verificat",
        );
    }

    // Stratul 1b — forme/ieșiri noi: invarianți + round-trip HTML (ștampila
    // ★ tipărită trebuie să cadă exact pe item.exit, nu pe colțul vechi).
    var combos = [];
    Object.keys(FORME).forEach(function (forma) {
      Object.keys(IESIRI).forEach(function (iesire) {
        if (forma === "patrat" && iesire === "coltOpus") return; // deja acoperit mai sus
        combos.push([forma, iesire]);
      });
    });
    var comboFail = 0;
    combos.forEach(function (fi) {
      var forma = fi[0],
        iesire = fi[1];
      for (var nivel2 in NIVELURI) {
        for (var seed2 = 0; seed2 < 3; seed2++) {
          try {
            var it = buildOne(
              { nivel: nivel2, forma: forma, iesire: iesire },
              seed2,
            );
            verificaDrum(it);
            var html = celuleHtml(
              it.rows,
              it.cols,
              it.pasaje,
              null,
              "puzzle",
              it.exit,
            );
            var star = starCellFromHtml(html, it.cols);
            if (!star || star[0] !== it.exit[0] || star[1] !== it.exit[1])
              throw new Error(
                "★ tiparit la " + star + " != item.exit " + it.exit,
              );
          } catch (err2) {
            ok = false;
            comboFail++;
            detalii.push(
              "[FAIL] " +
                nivel2 +
                "/" +
                forma +
                "/" +
                iesire +
                " seed=" +
                seed2 +
                ": " +
                err2.message,
            );
          }
        }
      }
    });
    if (!comboFail)
      detalii.push(
        "[OK] " +
          combos.length +
          " combinatii forma×iesire (non-implicite) x3 nivele x3 seeds -> arbore perfect, drum + ★ tiparit corect",
      );

    return { ok: ok, detalii: detalii };
  }

  root.PlanseGen = root.PlanseGen || {};
  root.PlanseGen.labirint = {
    NIVELURI: NIVELURI,
    FORME: FORME,
    IESIRI: IESIRI,
    dimsFor: dimsFor,
    buildOne: buildOne,
    render: render,
    renderPages: renderPages,
    printCss: PRINT_CSS,
    interactiveCss: INTERACTIVE_CSS,
    cellMm: cellMm,
    selftest: selftest,
    signature: signature,
  };
})(typeof window !== "undefined" ? window : globalThis);
