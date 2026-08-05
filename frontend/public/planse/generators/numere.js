/* numere.js — generator „Numere" (careu crossmath 3×3 multi-crossing).
 * Contract §5 (ca uneste.js / cautare.js / dictare.js):
 *   buildOne(params, seed) -> item
 *   render(item, mm?) -> { pages:[puzzle, answer], css, interactive, interactiveCss }
 *   renderPages(item, nr, total, mm?) -> { puzzle, answer }
 *   selftest() -> { ok, detalii }
 *   signature(item) -> string
 *
 * Careu 3×3 de numere. Fiecare RÂND și fiecare COLOANĂ e o ecuație de 3 termeni cu
 * 2 operatori (`+`/`−`), evaluată STÂNGA→DREAPTA (pt +/− = ordinea standard → ZERO
 * capcană de precedență). Operatorii + cele 6 rezultate (3 rânduri, 3 coloane) sunt
 * TIPĂRITE; unele celule sunt ascunse; copilul le completează.
 *
 * CORECTITUDINE = SOLUȚIE UNICĂ (altfel exercițiul e ambiguu = bug):
 *  - Domeniul e TIPĂRIT pe planșă („numere de la 1 la N") → unicitatea se verifică pe
 *    domeniul DECLARAT (altfel „unic" e fals pt un copil care nu știe plafonul).
 *  - Grila e un SISTEM LINIAR (±1). O a 2-a soluție există exact când celulele ascunse
 *    conțin un CICLU în graful bipartit rânduri↔coloane (ex. un dreptunghi 2×2) →
 *    vector în nucleu. Dacă celulele ascunse formează o PĂDURE (aciclic), eliminarea
 *    prin „singletoni" (rând/coloană cu o singură necunoscută → forțată) golește tot →
 *    soluție UNICĂ, INDEPENDENT de domeniu. Max într-un 3×3 = 5 celule (arbore de
 *    acoperire al celor 3+3 vârfuri). Deci ascundem un FOREST → unic prin construcție.
 *  - VERIFICATOR INDEPENDENT: un solver cu backtracking numără soluțiile pe domeniu
 *    (NU împarte logica de rezolvare cu generatorul care doar CONSTRUIEȘTE). Fiecare
 *    planșă e acceptată doar dacă solverul confirmă `count == 1` ȘI soluția == cea
 *    intenționată (`sol == intended` = check pe calcularea FORWARD a rezultatelor).
 *  - selftest face și ROUND-TRIP pe HTML-ul TIPĂRIT (extrage glifele operatorilor +
 *    numerele + rezultatele, hartă glif→op scrisă INDEPENDENT, re-rulează solverul) →
 *    prinde un bug de randare (ex. „−" tipărit ca „+") pe care logica internă nu-l vede.
 *
 * Dificultatea = nr celule ascunse (3→4→5) + amestec operatori (Ușor doar +). RNG
 * seedabil (PlansePRNG.PyRandom) → același seed → același careu.
 */
(function (root) {
  "use strict";

  var PyRandom = root.PlansePRNG.PyRandom;
  var Sig = root.PlanseSig;

  var MINUS = "−"; // semnul minus tipografic (U+2212), nu cratimă
  var OP_GLYPH = { "+": "+", "-": MINUS };

  // Benzi de dificultate. Levierul principal = nr celule ascunse (aciclic → unic).
  var DIFF = {
    Usor: { N: 6, hide: 3, allowMinus: false, resCap: 18 },
    Standard: { N: 9, hide: 4, allowMinus: true, resCap: 27 },
    Greu: { N: 12, hide: 5, allowMinus: true, resCap: 40 },
  };

  // ---------- aritmetică (regula puzzle-ului; testată cu oracol în selftest) ----------
  function ap(x, op, y) {
    return op === "+" ? x + y : x - y;
  }
  function evalLine(a, op1, b, op2, c) {
    return ap(ap(a, op1, b), op2, c); // stânga→dreapta
  }
  // Evaluare cu constrângeri de generare: parțiale + final ≥ 0 și final ≤ cap.
  function evalChecked(a, op1, b, op2, c, cap) {
    var p1 = ap(a, op1, b);
    if (p1 < 0) return { ok: false };
    var v = ap(p1, op2, c);
    if (v < 0 || v > cap) return { ok: false };
    return { ok: true, val: v };
  }

  // ---------- set ascuns ACICLIC (pădure în graful bipartit rânduri↔coloane) --------
  // Vârfuri: rânduri 0,1,2 → uf 0,1,2 ; coloane 0,1,2 → uf 3,4,5. Celula (r,c) = muchia
  // (r, 3+c). Adăugăm muchii care NU creează ciclu (union-find) până la k. k ≤ 5.
  function acyclicHidden(rng, k) {
    var parent = [0, 1, 2, 3, 4, 5];
    function find(x) {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    }
    var cells = [];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) cells.push([r, c]);
    rng.shuffle(cells);
    var hidden = [];
    for (var i = 0; i < cells.length && hidden.length < k; i++) {
      var a = find(cells[i][0]),
        b = find(3 + cells[i][1]);
      if (a !== b) {
        parent[a] = b;
        hidden.push(cells[i]);
      }
    }
    return hidden; // lungime == k pt k ≤ 5 (K3,3 conex → arbore de acoperire = 5 muchii)
  }

  // ---------- VERIFICATOR INDEPENDENT (numără soluțiile pe domeniul 1..N) -----------
  // spec: { rowOp:[[o,o]x3], colOp:[[o,o]x3], R:[3], C:[3], shown:{"r,c":val}, hidden:[[r,c]] }
  // Backtracking peste celulele ascunse, prună imediat ce un rând/coloană devine complet.
  function countSolutions(spec, N, cap) {
    var g = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
    for (var key in spec.shown) {
      var p = key.split(",");
      g[+p[0]][+p[1]] = spec.shown[key];
    }
    var H = spec.hidden;
    var count = 0,
      firstSol = null;
    function rowComplete(r) {
      return g[r][0] != null && g[r][1] != null && g[r][2] != null;
    }
    function colComplete(c) {
      return g[0][c] != null && g[1][c] != null && g[2][c] != null;
    }
    function rowOk(r) {
      return (
        evalLine(
          g[r][0],
          spec.rowOp[r][0],
          g[r][1],
          spec.rowOp[r][1],
          g[r][2],
        ) === spec.R[r]
      );
    }
    function colOk(c) {
      return (
        evalLine(
          g[0][c],
          spec.colOp[c][0],
          g[1][c],
          spec.colOp[c][1],
          g[2][c],
        ) === spec.C[c]
      );
    }
    function bt(idx) {
      if (count >= cap) return;
      if (idx === H.length) {
        for (var r = 0; r < 3; r++) if (!rowOk(r)) return;
        for (var c = 0; c < 3; c++) if (!colOk(c)) return;
        count++;
        if (!firstSol)
          firstSol = g.map(function (row) {
            return row.slice();
          });
        return;
      }
      var pos = H[idx],
        rr = pos[0],
        cc = pos[1];
      for (var v = 1; v <= N; v++) {
        g[rr][cc] = v;
        var pruned = false;
        if (rowComplete(rr) && !rowOk(rr)) pruned = true;
        if (!pruned && colComplete(cc) && !colOk(cc)) pruned = true;
        if (!pruned) bt(idx + 1);
        if (count >= cap) {
          g[rr][cc] = null;
          return;
        }
      }
      g[rr][cc] = null;
    }
    bt(0);
    return { count: count, sol: firstSol };
  }

  function sameGrid(a, b) {
    if (!a || !b) return false;
    for (var r = 0; r < 3; r++)
      for (var c = 0; c < 3; c++) if (a[r][c] !== b[r][c]) return false;
    return true;
  }

  function specFromSol(rowOp, colOp, R, C, sol, hidden) {
    var hset = {};
    for (var i = 0; i < hidden.length; i++)
      hset[hidden[i][0] + "," + hidden[i][1]] = true;
    var shown = {};
    for (var r = 0; r < 3; r++)
      for (var c = 0; c < 3; c++)
        if (!hset[r + "," + c]) shown[r + "," + c] = sol[r][c];
    return {
      rowOp: rowOp,
      colOp: colOp,
      R: R,
      C: C,
      shown: shown,
      hidden: hidden,
    };
  }

  function buildOne(params, seed) {
    var dif = params.dificultate;
    if (!(dif in DIFF)) throw new Error("dificultate necunoscută: " + dif);
    var band = DIFF[dif];
    var N = band.N;
    var rng = new PyRandom(seed);

    function pickOp() {
      return band.allowMinus ? rng.choice(["+", "-"]) : "+";
    }

    for (var attempt = 0; attempt < 800; attempt++) {
      var rowOp = [],
        colOp = [];
      for (var r = 0; r < 3; r++) rowOp.push([pickOp(), pickOp()]);
      for (var c = 0; c < 3; c++) colOp.push([pickOp(), pickOp()]);

      var sol = [];
      for (var r2 = 0; r2 < 3; r2++) {
        var row = [];
        for (var c2 = 0; c2 < 3; c2++) row.push(rng.randint(1, N));
        sol.push(row);
      }

      var R = [],
        C = [],
        okv = true;
      for (var r3 = 0; r3 < 3 && okv; r3++) {
        var e = evalChecked(
          sol[r3][0],
          rowOp[r3][0],
          sol[r3][1],
          rowOp[r3][1],
          sol[r3][2],
          band.resCap,
        );
        if (!e.ok) okv = false;
        else R.push(e.val);
      }
      for (var c3 = 0; c3 < 3 && okv; c3++) {
        var e2 = evalChecked(
          sol[0][c3],
          colOp[c3][0],
          sol[1][c3],
          colOp[c3][1],
          sol[2][c3],
          band.resCap,
        );
        if (!e2.ok) okv = false;
        else C.push(e2.val);
      }
      if (!okv) continue;

      var hidden = acyclicHidden(rng, band.hide);
      var spec = specFromSol(rowOp, colOp, R, C, sol, hidden);
      // VERIFICARE INDEPENDENTĂ: unic pe domeniu + == intenționata (aciclic garantează,
      // dar verificăm oricum — plasa de siguranță dacă raționamentul are o gaură).
      var res = countSolutions(spec, N, 2);
      if (res.count === 1 && sameGrid(res.sol, sol)) {
        var hset = {};
        for (var h = 0; h < hidden.length; h++)
          hset[hidden[h][0] + "," + hidden[h][1]] = true;
        var canon =
          "numere|" +
          dif +
          "|N" +
          N +
          "|" +
          sol
            .map(function (rw) {
              return rw.join(",");
            })
            .join(";") +
          "|" +
          rowOp
            .map(function (o) {
              return o.join("");
            })
            .join(";") +
          "|" +
          colOp
            .map(function (o) {
              return o.join("");
            })
            .join(";") +
          "|" +
          hidden
            .slice()
            .sort(function (a, b) {
              return a[0] - b[0] || a[1] - b[1];
            })
            .map(function (p) {
              return p[0] + "" + p[1];
            })
            .join("");
        return {
          tip: "numere",
          dificultate: dif,
          N: N,
          rowOp: rowOp,
          colOp: colOp,
          sol: sol,
          R: R,
          C: C,
          hidden: hidden,
          hiddenSet: hset,
          nrAscunse: hidden.length,
          seed: seed,
          semnatura: Sig.md5(canon).slice(0, 12),
        };
      }
      // altfel (extrem de rar cu aciclic) → reîncearcă cu alt draw
    }
    throw new Error(
      "VERIFICARE ESUATĂ: nu am generat un careu UNIC pentru " + dif,
    );
  }

  function signature(item) {
    return item.semnatura;
  }

  // ---------- RANDARE (grilă 7×7 parseabilă) ----------
  // Poziții (gr,gc), gr/gc 0..6: numere la par×par (col<5); operatori între ele;
  // „=" + rezultat rând pe col 5/6; „=" + rezultat coloană pe rândul 5/6.
  function cellHtml(item, gr, gc, mode) {
    var isNum = gr < 5 && gr % 2 === 0 && gc < 5 && gc % 2 === 0;
    if (isNum) {
      var r = gr / 2,
        c = gc / 2;
      var hidden = !!item.hiddenSet[r + "," + c];
      if (!hidden)
        return '<div class="nm-cell nm-num">' + item.sol[r][c] + "</div>";
      if (mode === "answer")
        return (
          '<div class="nm-cell nm-num nm-blank nm-fill">' +
          item.sol[r][c] +
          "</div>"
        );
      if (mode === "interactive")
        return (
          '<div class="nm-cell nm-num nm-blank"><span class="nm-ans">' +
          item.sol[r][c] +
          "</span></div>"
        );
      return '<div class="nm-cell nm-num nm-blank"></div>'; // puzzle: gol
    }
    if (gr < 5 && gr % 2 === 0 && (gc === 1 || gc === 3))
      return (
        '<div class="nm-cell nm-op">' +
        OP_GLYPH[item.rowOp[gr / 2][(gc - 1) / 2]] +
        "</div>"
      );
    if (gr < 5 && gr % 2 === 0 && gc === 5)
      return '<div class="nm-cell nm-eq">=</div>';
    if (gr < 5 && gr % 2 === 0 && gc === 6)
      return '<div class="nm-cell nm-res">' + item.R[gr / 2] + "</div>";
    if ((gr === 1 || gr === 3) && gc < 5 && gc % 2 === 0)
      return (
        '<div class="nm-cell nm-op">' +
        OP_GLYPH[item.colOp[gc / 2][(gr - 1) / 2]] +
        "</div>"
      );
    if (gr === 5 && gc < 5 && gc % 2 === 0)
      return '<div class="nm-cell nm-eq">=</div>';
    if (gr === 6 && gc < 5 && gc % 2 === 0)
      return '<div class="nm-cell nm-res">' + item.C[gc / 2] + "</div>";
    return '<div class="nm-cell nm-x"></div>';
  }

  function gridHtml(item, mode) {
    var out = [];
    for (var gr = 0; gr < 7; gr++)
      for (var gc = 0; gc < 7; gc++) out.push(cellHtml(item, gr, gc, mode));
    var cls = "nm-grid" + (mode === "answer" ? " show-solution" : "");
    return '<div class="' + cls + '">' + out.join("") + "</div>";
  }

  function domainSentence(item) {
    return (
      "Completează căsuțele goale cu numere de la 1 la " +
      item.N +
      " (se pot repeta)."
    );
  }

  function paginaPrint(item, nr, total, raspuns) {
    var clasa = raspuns ? "page-a4 pagina-raspuns" : "page-a4";
    var antet, sub, corp;
    if (raspuns) {
      antet =
        '<div class="header-title">Răspuns &mdash; Numere ' + nr + "</div>";
      sub =
        '<div class="nota-parinte">Pentru părinte &mdash; nu se printează. Căsuțele completate sunt evidențiate.</div>';
      corp =
        '<div class="exercise-block">' + gridHtml(item, "answer") + "</div>";
    } else {
      antet =
        '<div class="header-title">Numere &mdash; careu</div>' +
        '<div class="header-fields"><div>Nume: ____________</div><div>Data: __________</div></div>';
      sub =
        '<div class="subtitlu">' +
        domainSentence(item) +
        " Fiecare rând și fiecare coloană trebuie să dea rezultatul scris în dreapta / dedesubt (se calculează de la stânga la dreapta). &bull; " +
        item.dificultate +
        " &bull; Careu " +
        nr +
        "/" +
        total +
        "</div>";
      corp =
        '<div class="exercise-block">' + gridHtml(item, "puzzle") + "</div>";
    }
    return (
      '<div class="' +
      clasa +
      '">\n  <div class="header-row">' +
      antet +
      "</div>\n  " +
      sub +
      "\n  " +
      corp +
      "\n</div>"
    );
  }

  var GRID_CSS =
    "  .nm-grid { display:grid; grid-template-columns:16mm 9mm 16mm 9mm 16mm 8mm 16mm; grid-template-rows:16mm 9mm 16mm 9mm 16mm 8mm 16mm; margin:0 auto; }\n" +
    "  .nm-cell { display:flex; align-items:center; justify-content:center; }\n" +
    "  .nm-num { border:2px solid #111; font-size:1.7rem; font-weight:bold; }\n" +
    "  .nm-blank { background:#f4f4f4; }\n" +
    "  .nm-op { font-size:1.5rem; font-weight:bold; }\n" +
    "  .nm-eq { font-size:1.5rem; font-weight:bold; }\n" +
    "  .nm-res { font-size:1.6rem; font-weight:bold; color:#1a4a8a; border-bottom:3px solid #1a4a8a; }\n" +
    "  .nm-fill { color:#1a7a3a; background:#e8ffe8; }\n";

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
    "  .subtitlu { font-size:1.02rem; color:#333; margin-bottom:10mm; }\n" +
    "  .nota-parinte { font-size:0.95rem; color:#333; margin-bottom:8mm; font-style:italic; }\n" +
    "  .exercise-block { flex-grow:1; display:flex; align-items:center; justify-content:center; }\n" +
    GRID_CSS;

  var INTERACTIVE_CSS =
    ".numere-sheet { background:#fff; color:#111; border-radius:10px; padding:16px; margin:0 auto; max-width:100%; overflow:auto; font-family:'Patrick Hand', ui-rounded, 'Segoe UI', system-ui, sans-serif; }\n" +
    ".numere-sheet .numere-head { display:flex; justify-content:space-between; align-items:baseline; font-weight:bold; margin-bottom:6px; }\n" +
    ".numere-sheet .numere-sub { font-size:0.9rem; color:#333; margin-bottom:14px; }\n" +
    ".numere-sheet .nm-grid { display:grid; grid-template-columns:44px 26px 44px 26px 44px 24px 44px; grid-template-rows:44px 26px 44px 26px 44px 24px 44px; margin:0 auto; }\n" +
    ".numere-sheet .nm-cell { display:flex; align-items:center; justify-content:center; }\n" +
    ".numere-sheet .nm-num { border:2px solid #111; font-size:1.3rem; font-weight:bold; }\n" +
    ".numere-sheet .nm-blank { background:#f4f4f4; }\n" +
    ".numere-sheet .nm-op, .numere-sheet .nm-eq { font-size:1.2rem; font-weight:bold; }\n" +
    ".numere-sheet .nm-res { font-size:1.25rem; font-weight:bold; color:#1a4a8a; border-bottom:3px solid #1a4a8a; }\n" +
    ".numere-sheet .nm-ans { display:none; color:#1a7a3a; }\n" +
    ".numere-sheet .nm-grid.show-solution .nm-blank { background:#e8ffe8; }\n" +
    ".numere-sheet .nm-grid.show-solution .nm-ans { display:inline; }\n";

  function renderPages(item, nr, total) {
    return {
      puzzle: paginaPrint(item, nr, total, false),
      answer: paginaPrint(item, nr, total, true),
    };
  }

  function render(item) {
    var pg = renderPages(item, 1, 1);
    var interactive =
      '<div class="numere-sheet">' +
      '<div class="numere-head"><span>Numere &bull; careu &bull; ' +
      item.dificultate +
      " &bull; " +
      item.nrAscunse +
      " căsuțe de completat</span></div>" +
      '<div class="numere-sub">' +
      domainSentence(item) +
      " Rândurile și coloanele dau rezultatele scrise (calcul stânga→dreapta).</div>" +
      gridHtml(item, "interactive") +
      "</div>";
    return {
      pages: [pg.puzzle, pg.answer],
      css: PRINT_CSS,
      interactive: interactive,
      interactiveCss: INTERACTIVE_CSS,
    };
  }

  // ---------- SELFTEST (invarianți) ----------
  // Hartă glif→op scrisă INDEPENDENT (analogul REV_LABEL din dictare) — prinde un
  // bug de randare a operatorului (ex. „−" tipărit ca „+").
  var REV_OP = { "+": "+" };
  REV_OP[MINUS] = "-";

  function parsePuzzleHtml(html) {
    var re = /<div class="nm-cell([^"]*)">([^<]*)<\/div>/g;
    var cells = [],
      m;
    while ((m = re.exec(html))) cells.push({ cls: m[1], txt: m[2].trim() });
    if (cells.length !== 49)
      throw new Error("nr celule parsate = " + cells.length + " (aștept 49)");
    var rowOp = [
      [null, null],
      [null, null],
      [null, null],
    ];
    var colOp = [
      [null, null],
      [null, null],
      [null, null],
    ];
    var R = [null, null, null],
      C = [null, null, null];
    var shown = {},
      hidden = [];
    for (var i = 0; i < 49; i++) {
      var gr = Math.floor(i / 7),
        gc = i % 7,
        cell = cells[i];
      var isNum = gr < 5 && gr % 2 === 0 && gc < 5 && gc % 2 === 0;
      if (isNum) {
        if (cell.cls.indexOf("nm-num") === -1)
          throw new Error("clasă greșită la poziția număr " + gr + "," + gc);
        var r = gr / 2,
          c = gc / 2;
        if (cell.txt === "") hidden.push([r, c]);
        else shown[r + "," + c] = parseInt(cell.txt, 10);
      } else if (gr < 5 && gr % 2 === 0 && (gc === 1 || gc === 3)) {
        var op = REV_OP[cell.txt];
        if (!op)
          throw new Error(
            "glif operator necunoscut la rând: '" + cell.txt + "'",
          );
        rowOp[gr / 2][(gc - 1) / 2] = op;
      } else if (gr < 5 && gr % 2 === 0 && gc === 6) {
        R[gr / 2] = parseInt(cell.txt, 10);
      } else if ((gr === 1 || gr === 3) && gc < 5 && gc % 2 === 0) {
        var op2 = REV_OP[cell.txt];
        if (!op2)
          throw new Error(
            "glif operator necunoscut la coloană: '" + cell.txt + "'",
          );
        colOp[gc / 2][(gr - 1) / 2] = op2;
      } else if (gr === 6 && gc < 5 && gc % 2 === 0) {
        C[gc / 2] = parseInt(cell.txt, 10);
      }
    }
    var mn = html.match(/de la 1 la (\d+)/);
    var N = mn ? parseInt(mn[1], 10) : null;
    return {
      rowOp: rowOp,
      colOp: colOp,
      R: R,
      C: C,
      shown: shown,
      hidden: hidden,
      N: N,
    };
  }

  function deepEqOps(a, b) {
    for (var i = 0; i < 3; i++)
      for (var j = 0; j < 2; j++) if (a[i][j] !== b[i][j]) return false;
    return true;
  }
  function deepEqArr(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function checkItem(item) {
    // 1) valori în domeniu + rezultate ≥ 0
    for (var r = 0; r < 3; r++)
      for (var c = 0; c < 3; c++)
        if (!(item.sol[r][c] >= 1 && item.sol[r][c] <= item.N))
          throw new Error("valoare în afara domeniului: " + item.sol[r][c]);
    for (var i = 0; i < 3; i++) {
      if (item.R[i] < 0) throw new Error("rezultat rând negativ");
      if (item.C[i] < 0) throw new Error("rezultat coloană negativ");
      // forward: rezultatele TIPĂRITE == recalcul din soluție (calc corect)
      if (
        evalLine(
          item.sol[i][0],
          item.rowOp[i][0],
          item.sol[i][1],
          item.rowOp[i][1],
          item.sol[i][2],
        ) !== item.R[i]
      )
        throw new Error(
          "R[" + i + "] nu se potrivește cu soluția (calc forward greșit)",
        );
      if (
        evalLine(
          item.sol[0][i],
          item.colOp[i][0],
          item.sol[1][i],
          item.colOp[i][1],
          item.sol[2][i],
        ) !== item.C[i]
      )
        throw new Error(
          "C[" + i + "] nu se potrivește cu soluția (calc forward greșit)",
        );
    }
    // 2) nr ascunse == ținta dificultății (fără colaps tăcut Greu→Standard)
    if (item.nrAscunse !== DIFF[item.dificultate].hide)
      throw new Error(
        "nr ascunse " +
          item.nrAscunse +
          " != țintă " +
          DIFF[item.dificultate].hide,
      );
    // 3) SOLUȚIE UNICĂ pe obiectul în memorie (verificator independent)
    var spec = specFromSol(
      item.rowOp,
      item.colOp,
      item.R,
      item.C,
      item.sol,
      item.hidden,
    );
    var res = countSolutions(spec, item.N, 2);
    if (res.count !== 1)
      throw new Error("nr soluții = " + res.count + " (nu 1)");
    if (!sameGrid(res.sol, item.sol))
      throw new Error("soluția găsită != cea intenționată (forward check)");
    // 4) ROUND-TRIP pe HTML-ul TIPĂRIT (glife/numere/rezultate parsate independent)
    var puz = paginaPrint(item, 1, 1, false);
    var p = parsePuzzleHtml(puz);
    if (p.N !== item.N)
      throw new Error("domeniu tipărit " + p.N + " != solver " + item.N);
    if (!deepEqOps(p.rowOp, item.rowOp))
      throw new Error("operatori rând tipăriți greșit");
    if (!deepEqOps(p.colOp, item.colOp))
      throw new Error("operatori coloană tipăriți greșit");
    if (!deepEqArr(p.R, item.R))
      throw new Error("rezultate rând tipărite greșit");
    if (!deepEqArr(p.C, item.C))
      throw new Error("rezultate coloană tipărite greșit");
    // celulele ascunse parsate == cele reale
    var hkey = function (h) {
      return h
        .slice()
        .sort(function (a, b) {
          return a[0] - b[0] || a[1] - b[1];
        })
        .map(function (x) {
          return x[0] + "" + x[1];
        })
        .join(",");
    };
    if (hkey(p.hidden) !== hkey(item.hidden))
      throw new Error("celule ascunse tipărite greșit");
    // re-rezolvă puzzle-ul RECONSTRUIT din HTML → tot unic + == intenționata
    var res2 = countSolutions(
      {
        rowOp: p.rowOp,
        colOp: p.colOp,
        R: p.R,
        C: p.C,
        shown: p.shown,
        hidden: p.hidden,
      },
      p.N,
      2,
    );
    if (res2.count !== 1)
      throw new Error("puzzle-ul TIPĂRIT are " + res2.count + " soluții");
    if (!sameGrid(res2.sol, item.sol))
      throw new Error("soluția puzzle-ului TIPĂRIT != intenționata");
    // 5) render nu aruncă + structură
    var rr = render(item);
    if (!rr || rr.pages.length !== 2 || typeof rr.interactive !== "string")
      throw new Error("render invalid");
  }

  function selftest() {
    var detalii = [];
    var ok = true;
    function fail(msg) {
      ok = false;
      detalii.push("[FAIL] " + msg);
    }

    // 0) oracol evalLine (independent de generator)
    try {
      var cases = [
        [[5, "+", 3, "+", 2], 10],
        [[9, "-", 4, "+", 2], 7],
        [[8, "-", 3, "-", 2], 3],
        [[2, "+", 6, "-", 1], 7],
        [[6, "+", 6, "+", 6], 18],
      ];
      for (var i = 0; i < cases.length; i++) {
        var a = cases[i][0];
        if (evalLine(a[0], a[1], a[2], a[3], a[4]) !== cases[i][1])
          throw new Error("evalLine(" + a.join(" ") + ") != " + cases[i][1]);
      }
      detalii.push("[OK] evalLine — 5 cazuri-oracol corecte");
    } catch (e) {
      fail("oracol evalLine: " + e.message);
    }

    // 1) fiecare dificultate × mai multe seed-uri: unic + round-trip + nr ascunse
    for (var dif in DIFF) {
      var seeds = 24;
      var okCount = 0,
        hitTarget = 0;
      var firstErr = null;
      for (var seed = 0; seed < seeds; seed++) {
        try {
          var it = buildOne({ dificultate: dif }, seed);
          checkItem(it);
          // determinism pe puzzle serializat (semnătura ar fi vacuă doar dacă e seed-dependentă;
          // aici e derivată din geometrie → comparăm structura completă)
          var it2 = buildOne({ dificultate: dif }, seed);
          if (
            JSON.stringify([
              it.sol,
              it.rowOp,
              it.colOp,
              it.R,
              it.C,
              it.hidden,
            ]) !==
            JSON.stringify([
              it2.sol,
              it2.rowOp,
              it2.colOp,
              it2.R,
              it2.C,
              it2.hidden,
            ])
          )
            throw new Error("nedeterminist");
          if (it.nrAscunse === DIFF[dif].hide) hitTarget++;
          okCount++;
        } catch (e) {
          if (!firstErr) firstErr = "seed=" + seed + ": " + e.message;
        }
      }
      if (okCount !== seeds)
        fail(dif + " — " + okCount + "/" + seeds + " OK; primul: " + firstErr);
      else if (hitTarget !== seeds)
        fail(
          dif +
            " — nr ascunse a atins ținta doar " +
            hitTarget +
            "/" +
            seeds +
            " (colaps difficultate)",
        );
      else
        detalii.push(
          "[OK] " +
            dif +
            " x" +
            seeds +
            " seed-uri -> soluție UNICĂ, round-trip HTML, " +
            DIFF[dif].hide +
            " ascunse, determinist",
        );
    }

    // 2) negative sanity — un puzzle cu ciclu (dreptunghi 2×2) NU e unic (dovada că
    //    solverul chiar numără): construim manual un careu all-+ și ascundem un 2×2.
    try {
      var sol = [
        [2, 3, 5],
        [4, 1, 6],
        [1, 2, 7],
      ];
      var rowOp = [
        ["+", "+"],
        ["+", "+"],
        ["+", "+"],
      ];
      var colOp = [
        ["+", "+"],
        ["+", "+"],
        ["+", "+"],
      ];
      var R = [10, 11, 10],
        C = [7, 6, 18];
      // verifică datele
      // ascunde dreptunghiul (0,0),(0,1),(1,0),(1,1) → ciclu → ≥2 soluții pe 1..9
      var hidden = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      var spec = specFromSol(rowOp, colOp, R, C, sol, hidden);
      var res = countSolutions(spec, 9, 3);
      if (res.count < 2)
        throw new Error(
          "dreptunghiul 2×2 ar trebui să dea ≥2 soluții, dă " + res.count,
        );
      detalii.push(
        "[OK] control negativ — ciclul 2×2 dă " +
          res.count +
          " soluții (solverul chiar numără)",
      );
    } catch (e) {
      fail("control negativ ciclu: " + e.message);
    }

    return { ok: ok, detalii: detalii };
  }

  root.PlanseGen = root.PlanseGen || {};
  root.PlanseGen.numere = {
    DIFF: DIFF,
    buildOne: buildOne,
    render: render,
    renderPages: renderPages,
    countSolutions: countSolutions,
    evalLine: evalLine,
    printCss: PRINT_CSS,
    interactiveCss: INTERACTIVE_CSS,
    selftest: selftest,
    signature: signature,
  };
})(typeof window !== "undefined" ? window : globalThis);
