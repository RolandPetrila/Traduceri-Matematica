/* numere.js — generator „Numere" (careu crossmath size×size, size ∈ {3,4,5}).
 * Contract §5 (ca uneste.js / cautare.js / dictare.js):
 *   buildOne(params, seed) -> item   // params = {marime, dificultate}
 *   render(item) -> { pages:[puzzle, answer], css, interactive, interactiveCss }
 *   renderPages(item, nr, total) -> { puzzle, answer }
 *   (fără parametru mm — spre deosebire de labirint.js/cautare.js; grila se
 *   scalează automat intern via trackSizesMm/trackSizesPx)
 *   selftest() -> { ok, detalii }
 *   signature(item) -> string
 *
 * Careu size×size de numere (size=3 original + 4/5 mai mari, cerință B din
 * docs/PLAN_MASTER.md §6b). Fiecare RÂND și fiecare COLOANĂ e o ecuație de
 * `size` termeni cu `size-1` operatori (`+`/`−`), evaluată STÂNGA→DREAPTA (pt
 * +/− = ordinea standard → ZERO capcană de precedență). Operatorii + toate
 * cele `2*size` rezultate (size rânduri, size coloane) sunt TIPĂRITE; unele
 * celule sunt ascunse; copilul le completează.
 *
 * CORECTITUDINE = SOLUȚIE UNICĂ (altfel exercițiul e ambiguu = bug):
 *  - Domeniul e TIPĂRIT pe planșă („numere de la 1 la N") → unicitatea se verifică pe
 *    domeniul DECLARAT (altfel „unic" e fals pt un copil care nu știe plafonul).
 *  - Grila e un SISTEM LINIAR (±1). O a 2-a soluție există exact când celulele ascunse
 *    conțin un CICLU în graful bipartit rânduri↔coloane (ex. un dreptunghi 2×2) →
 *    vector în nucleu. Dacă celulele ascunse formează o PĂDURE (aciclic), eliminarea
 *    prin „singletoni" (rând/coloană cu o singură necunoscută → forțată) golește tot →
 *    soluție UNICĂ, INDEPENDENT de domeniu. Max într-un size×size = 2*size-1 celule
 *    (arbore de acoperire al celor size+size vârfuri din K_size,size). Deci ascundem
 *    un FOREST → unic prin construcție — GENERIC pe size (verificat empiric 2026-08-08:
 *    tehnica nu presupune size=3, doar bipartit complet size+size vârfuri).
 *  - VERIFICATOR INDEPENDENT: un solver cu backtracking numără soluțiile pe domeniu
 *    (NU împarte logica de rezolvare cu generatorul care doar CONSTRUIEȘTE). Fiecare
 *    planșă e acceptată doar dacă solverul confirmă `count == 1` ȘI soluția == cea
 *    intenționată (`sol == intended` = check pe calcularea FORWARD a rezultatelor).
 *  - selftest face și ROUND-TRIP pe HTML-ul TIPĂRIT (extrage glifele operatorilor +
 *    numerele + rezultatele, hartă glif→op scrisă INDEPENDENT, re-rulează solverul) →
 *    prinde un bug de randare (ex. „−" tipărit ca „+") pe care logica internă nu-l vede.
 *
 * Dificultatea = nr celule ascunse + amestec operatori (Ușor doar +), pe FIECARE
 * mărime (DIFF[marime][dificultate] — pattern identic cu DIFF[forma][dificultate]
 * din integrama.js). RNG seedabil (PlansePRNG.PyRandom) → același seed → același careu.
 */
(function (root) {
  "use strict";

  var PyRandom = root.PlansePRNG.PyRandom;
  var Sig = root.PlanseSig;

  var MINUS = "−"; // semnul minus tipografic (U+2212), nu cratimă
  var OP_GLYPH = { "+": "+", "-": MINUS };

  // Benzi de dificultate PER mărime. hide ≤ 2*marime-1 (arbore de acoperire
  // K_marime,marime) — verificat explicit în selftest (invariant, nu doar
  // respectat tacit). resCap ~ marime*N*1.11 (păstrează raportul din 3×3
  // Greu original: N=12,resCap=40), rotunjit la valori „rotunde".
  var DIFF = {
    3: {
      Usor: { N: 6, hide: 3, allowMinus: false, resCap: 18 },
      Standard: { N: 9, hide: 4, allowMinus: true, resCap: 27 },
      Greu: { N: 12, hide: 5, allowMinus: true, resCap: 40 },
    },
    4: {
      Usor: { N: 6, hide: 4, allowMinus: false, resCap: 27 },
      Standard: { N: 9, hide: 5, allowMinus: true, resCap: 40 },
      Greu: { N: 12, hide: 7, allowMinus: true, resCap: 53 },
    },
    5: {
      Usor: { N: 6, hide: 5, allowMinus: false, resCap: 33 },
      Standard: { N: 9, hide: 6, allowMinus: true, resCap: 50 },
      Greu: { N: 12, hide: 9, allowMinus: true, resCap: 67 },
    },
  };
  var MARIMI = Object.keys(DIFF).map(Number); // [3,4,5]

  // ---------- aritmetică (regula puzzle-ului; testată cu oracol în selftest) ----------
  function ap(x, op, y) {
    return op === "+" ? x + y : x - y;
  }
  // vals = [v0..v_{size-1}], ops = [op0..op_{size-2}] -> evaluare stânga→dreapta.
  function evalLine(vals, ops) {
    var acc = vals[0];
    for (var i = 0; i < ops.length; i++) acc = ap(acc, ops[i], vals[i + 1]);
    return acc;
  }
  // Evaluare cu constrângeri de generare: fiecare rezultat parțial ≥ 0, final ≤ cap.
  function evalChecked(vals, ops, cap) {
    var acc = vals[0];
    for (var i = 0; i < ops.length; i++) {
      acc = ap(acc, ops[i], vals[i + 1]);
      if (acc < 0) return { ok: false };
    }
    if (acc > cap) return { ok: false };
    return { ok: true, val: acc };
  }

  // ---------- set ascuns ACICLIC (pădure în graful bipartit rânduri↔coloane) --------
  // Vârfuri: rânduri 0..size-1 → uf 0..size-1 ; coloane 0..size-1 → uf size..2*size-1.
  // Celula (r,c) = muchia (r, size+c). Adăugăm muchii care NU creează ciclu
  // (union-find) până la k. k ≤ 2*size-1 (K_size,size conex → arbore de
  // acoperire = 2*size-1 muchii) — GENERIC pe size, nu doar size=3.
  function acyclicHidden(rng, k, size) {
    var parent = [];
    for (var v = 0; v < 2 * size; v++) parent.push(v);
    function find(x) {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    }
    var cells = [];
    for (var r = 0; r < size; r++)
      for (var c = 0; c < size; c++) cells.push([r, c]);
    rng.shuffle(cells);
    var hidden = [];
    for (var i = 0; i < cells.length && hidden.length < k; i++) {
      var a = find(cells[i][0]),
        b = find(size + cells[i][1]);
      if (a !== b) {
        parent[a] = b;
        hidden.push(cells[i]);
      }
    }
    return hidden; // lungime == k pt k ≤ 2*size-1
  }

  // ---------- VERIFICATOR INDEPENDENT (numără soluțiile pe domeniul 1..N) -----------
  // spec: { rowOp:[[o..]xsize], colOp:[[o..]xsize], R:[size], C:[size],
  //         shown:{"r,c":val}, hidden:[[r,c]] }
  // Backtracking peste celulele ascunse, prună imediat ce un rând/coloană devine complet.
  function countSolutions(spec, N, size, cap) {
    var g = [];
    for (var r0 = 0; r0 < size; r0++) g.push(new Array(size).fill(null));
    for (var key in spec.shown) {
      var p = key.split(",");
      g[+p[0]][+p[1]] = spec.shown[key];
    }
    var H = spec.hidden;
    var count = 0,
      firstSol = null;
    function rowComplete(r) {
      for (var c = 0; c < size; c++) if (g[r][c] == null) return false;
      return true;
    }
    function colComplete(c) {
      for (var r = 0; r < size; r++) if (g[r][c] == null) return false;
      return true;
    }
    function rowVals(r) {
      var vals = [];
      for (var c = 0; c < size; c++) vals.push(g[r][c]);
      return vals;
    }
    function colVals(c) {
      var vals = [];
      for (var r = 0; r < size; r++) vals.push(g[r][c]);
      return vals;
    }
    function rowOk(r) {
      return evalLine(rowVals(r), spec.rowOp[r]) === spec.R[r];
    }
    function colOk(c) {
      return evalLine(colVals(c), spec.colOp[c]) === spec.C[c];
    }
    function bt(idx) {
      if (count >= cap) return;
      if (idx === H.length) {
        for (var r = 0; r < size; r++) if (!rowOk(r)) return;
        for (var c = 0; c < size; c++) if (!colOk(c)) return;
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

  function sameGrid(a, b, size) {
    if (!a || !b) return false;
    for (var r = 0; r < size; r++)
      for (var c = 0; c < size; c++) if (a[r][c] !== b[r][c]) return false;
    return true;
  }

  function specFromSol(rowOp, colOp, R, C, sol, hidden, size) {
    var hset = {};
    for (var i = 0; i < hidden.length; i++)
      hset[hidden[i][0] + "," + hidden[i][1]] = true;
    var shown = {};
    for (var r = 0; r < size; r++)
      for (var c = 0; c < size; c++)
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
    var marime = params.marime;
    if (MARIMI.indexOf(marime) === -1)
      throw new Error("mărime necunoscută: " + marime);
    var dif = params.dificultate;
    if (!(dif in DIFF[marime]))
      throw new Error("dificultate necunoscută pt " + marime + ": " + dif);
    var band = DIFF[marime][dif];
    var size = marime;
    var N = band.N;
    var rng = new PyRandom(seed);

    function pickOp() {
      return band.allowMinus ? rng.choice(["+", "-"]) : "+";
    }

    // Praguri mai mari la mărimi mai mari (mai multe linii de satisfăcut
    // simultan -> probabilitate multiplicativ mai mică per încercare).
    var maxAttempts = 800 * Math.pow(3, size - 3);
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      var rowOp = [],
        colOp = [];
      for (var r = 0; r < size; r++) {
        var ro = [];
        for (var k1 = 0; k1 < size - 1; k1++) ro.push(pickOp());
        rowOp.push(ro);
      }
      for (var c = 0; c < size; c++) {
        var co = [];
        for (var k2 = 0; k2 < size - 1; k2++) co.push(pickOp());
        colOp.push(co);
      }

      var sol = [];
      for (var r2 = 0; r2 < size; r2++) {
        var row = [];
        for (var c2 = 0; c2 < size; c2++) row.push(rng.randint(1, N));
        sol.push(row);
      }

      var R = [],
        C = [],
        okv = true;
      for (var r3 = 0; r3 < size && okv; r3++) {
        var e = evalChecked(sol[r3], rowOp[r3], band.resCap);
        if (!e.ok) okv = false;
        else R.push(e.val);
      }
      for (var c3 = 0; c3 < size && okv; c3++) {
        var colVals3 = [];
        for (var rr3 = 0; rr3 < size; rr3++) colVals3.push(sol[rr3][c3]);
        var e2 = evalChecked(colVals3, colOp[c3], band.resCap);
        if (!e2.ok) okv = false;
        else C.push(e2.val);
      }
      if (!okv) continue;

      var hidden = acyclicHidden(rng, band.hide, size);
      var spec = specFromSol(rowOp, colOp, R, C, sol, hidden, size);
      // VERIFICARE INDEPENDENTĂ: unic pe domeniu + == intenționata (aciclic garantează,
      // dar verificăm oricum — plasa de siguranță dacă raționamentul are o gaură).
      var res = countSolutions(spec, N, size, 2);
      if (res.count === 1 && sameGrid(res.sol, sol, size)) {
        var hset = {};
        for (var h = 0; h < hidden.length; h++)
          hset[hidden[h][0] + "," + hidden[h][1]] = true;
        var canon =
          "numere|" +
          marime +
          "|" +
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
          marime: marime,
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
      "VERIFICARE ESUATĂ: nu am generat un careu UNIC pentru " +
        marime +
        "×" +
        marime +
        "/" +
        dif,
    );
  }

  function signature(item) {
    return item.semnatura;
  }

  // ---------- RANDARE (grilă (2*size+1)×(2*size+1) parseabilă) ----------
  // Poziții (gr,gc), gr/gc 0..2*size: numere la par×par (gc<EQC); operatori
  // între ele; „=" + rezultat rând pe col EQC/RESC; „=" + rezultat coloană pe
  // rândul EQC/RESC. EQC=2*size-1 (coloana/rândul „="), RESC=2*size (rezultat).
  function cellHtml(item, gr, gc, mode) {
    var size = item.marime;
    var EQC = 2 * size - 1,
      RESC = 2 * size;
    var isNum = gr < 2 * size && gr % 2 === 0 && gc < EQC && gc % 2 === 0;
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
    if (gr < 2 * size && gr % 2 === 0 && gc < EQC && gc % 2 === 1)
      return (
        '<div class="nm-cell nm-op">' +
        OP_GLYPH[item.rowOp[gr / 2][(gc - 1) / 2]] +
        "</div>"
      );
    if (gr < 2 * size && gr % 2 === 0 && gc === EQC)
      return '<div class="nm-cell nm-eq">=</div>';
    if (gr < 2 * size && gr % 2 === 0 && gc === RESC)
      return '<div class="nm-cell nm-res">' + item.R[gr / 2] + "</div>";
    if (gr % 2 === 1 && gr < EQC && gc < 2 * size && gc % 2 === 0)
      return (
        '<div class="nm-cell nm-op">' +
        OP_GLYPH[item.colOp[gc / 2][(gr - 1) / 2]] +
        "</div>"
      );
    if (gr === EQC && gc < 2 * size && gc % 2 === 0)
      return '<div class="nm-cell nm-eq">=</div>';
    if (gr === RESC && gc < 2 * size && gc % 2 === 0)
      return '<div class="nm-cell nm-res">' + item.C[gc / 2] + "</div>";
    return '<div class="nm-cell nm-x"></div>';
  }

  // 16mm(num) 9mm(op) alternând `size` numere, apoi 8mm(=) 16mm(rezultat) —
  // reproduce EXACT șirul fix folosit înainte la size=3 (16 9 16 9 16 8 16).
  function trackSizesMm(size) {
    var parts = [];
    for (var i = 0; i < size; i++) {
      parts.push("16mm");
      if (i < size - 1) parts.push("9mm");
    }
    parts.push("8mm", "16mm");
    return parts.join(" ");
  }
  function trackSizesPx(size) {
    var parts = [];
    for (var i = 0; i < size; i++) {
      parts.push("44px");
      if (i < size - 1) parts.push("26px");
    }
    parts.push("24px", "44px");
    return parts.join(" ");
  }

  function gridHtml(item, mode) {
    var size = item.marime;
    var W = 2 * size + 1;
    var out = [];
    for (var gr = 0; gr < W; gr++)
      for (var gc = 0; gc < W; gc++) out.push(cellHtml(item, gr, gc, mode));
    var cls = "nm-grid" + (mode === "answer" ? " show-solution" : "");
    var style =
      "grid-template-columns:" +
      trackSizesMm(size) +
      ";grid-template-rows:" +
      trackSizesMm(size) +
      ";";
    return (
      '<div class="' +
      cls +
      '" data-marime="' +
      size +
      '" style="' +
      style +
      '">' +
      out.join("") +
      "</div>"
    );
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
        " Fiecare rând și fiecare coloană trebuie să dea rezultatul scris în dreapta / dedesubt (se calculează de la stânga la dreapta). &bull; careu " +
        item.marime +
        "×" +
        item.marime +
        " &bull; " +
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
    "  .nm-grid { display:grid; margin:0 auto; }\n" +
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
    ".numere-sheet .nm-grid { display:grid; margin:0 auto; }\n" +
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
      '<div class="numere-head"><span>Numere &bull; careu ' +
      item.marime +
      "×" +
      item.marime +
      " &bull; " +
      item.dificultate +
      " &bull; " +
      item.nrAscunse +
      " căsuțe de completat</span></div>" +
      '<div class="numere-sub">' +
      domainSentence(item) +
      " Rândurile și coloanele dau rezultatele scrise (calcul stânga→dreapta).</div>" +
      '<div class="nm-grid" data-marime="' +
      item.marime +
      '" style="grid-template-columns:' +
      trackSizesPx(item.marime) +
      ";grid-template-rows:" +
      trackSizesPx(item.marime) +
      ';">' +
      cellsOnly(item, "interactive") +
      "</div></div>";
    return {
      pages: [pg.puzzle, pg.answer],
      css: PRINT_CSS,
      interactive: interactive,
      interactiveCss: INTERACTIVE_CSS,
    };
  }
  // extrage doar celulele (fără wrapper-ul .nm-grid, deja construit în `render`
  // cu style px în loc de mm) — evită duplicarea listei de celule.
  function cellsOnly(item, mode) {
    var size = item.marime,
      W = 2 * size + 1,
      out = [];
    for (var gr = 0; gr < W; gr++)
      for (var gc = 0; gc < W; gc++) out.push(cellHtml(item, gr, gc, mode));
    return out.join("");
  }

  // ---------- SELFTEST (invarianți) ----------
  // Hartă glif→op scrisă INDEPENDENT (analogul REV_LABEL din dictare) — prinde un
  // bug de randare a operatorului (ex. „−" tipărit ca „+").
  var REV_OP = { "+": "+" };
  REV_OP[MINUS] = "-";

  // Reimplementare INDEPENDENTĂ a clasificării poziției (nu apelează cellHtml) —
  // citește `size` din data-marime TIPĂRIT, nu presupune 3×3.
  function parsePuzzleHtml(html) {
    var gridMatch = html.match(/<div class="nm-grid[^"]*" data-marime="(\d+)"/);
    if (!gridMatch) throw new Error("nu am găsit data-marime în HTML");
    var size = parseInt(gridMatch[1], 10);
    var W = 2 * size + 1;
    var EQC = 2 * size - 1,
      RESC = 2 * size;

    var re = /<div class="nm-cell([^"]*)">([^<]*)<\/div>/g;
    var cells = [],
      m;
    while ((m = re.exec(html))) cells.push({ cls: m[1], txt: m[2].trim() });
    if (cells.length !== W * W)
      throw new Error(
        "nr celule parsate = " + cells.length + " (aștept " + W * W + ")",
      );
    var rowOp = [],
      colOp = [];
    for (var i0 = 0; i0 < size; i0++) {
      rowOp.push(new Array(size - 1).fill(null));
      colOp.push(new Array(size - 1).fill(null));
    }
    var R = new Array(size).fill(null),
      C = new Array(size).fill(null);
    var shown = {},
      hidden = [];
    for (var i = 0; i < W * W; i++) {
      var gr = Math.floor(i / W),
        gc = i % W,
        cell = cells[i];
      var isNum = gr < 2 * size && gr % 2 === 0 && gc < EQC && gc % 2 === 0;
      if (isNum) {
        if (cell.cls.indexOf("nm-num") === -1)
          throw new Error("clasă greșită la poziția număr " + gr + "," + gc);
        var r = gr / 2,
          c = gc / 2;
        if (cell.txt === "") hidden.push([r, c]);
        else shown[r + "," + c] = parseInt(cell.txt, 10);
      } else if (gr < 2 * size && gr % 2 === 0 && gc < EQC && gc % 2 === 1) {
        var op = REV_OP[cell.txt];
        if (!op)
          throw new Error(
            "glif operator necunoscut la rând: '" + cell.txt + "'",
          );
        rowOp[gr / 2][(gc - 1) / 2] = op;
      } else if (gr < 2 * size && gr % 2 === 0 && gc === RESC) {
        R[gr / 2] = parseInt(cell.txt, 10);
      } else if (gr % 2 === 1 && gr < EQC && gc < 2 * size && gc % 2 === 0) {
        var op2 = REV_OP[cell.txt];
        if (!op2)
          throw new Error(
            "glif operator necunoscut la coloană: '" + cell.txt + "'",
          );
        colOp[gc / 2][(gr - 1) / 2] = op2;
      } else if (gr === RESC && gc < 2 * size && gc % 2 === 0) {
        C[gc / 2] = parseInt(cell.txt, 10);
      }
    }
    var mn = html.match(/de la 1 la (\d+)/);
    var N = mn ? parseInt(mn[1], 10) : null;
    return {
      size: size,
      rowOp: rowOp,
      colOp: colOp,
      R: R,
      C: C,
      shown: shown,
      hidden: hidden,
      N: N,
    };
  }

  function deepEqOps(a, b, size) {
    for (var i = 0; i < size; i++)
      for (var j = 0; j < size - 1; j++) if (a[i][j] !== b[i][j]) return false;
    return true;
  }
  function deepEqArr(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function checkItem(item) {
    var size = item.marime;
    // 1) valori în domeniu + rezultate ≥ 0
    for (var r = 0; r < size; r++)
      for (var c = 0; c < size; c++)
        if (!(item.sol[r][c] >= 1 && item.sol[r][c] <= item.N))
          throw new Error("valoare în afara domeniului: " + item.sol[r][c]);
    for (var i = 0; i < size; i++) {
      if (item.R[i] < 0) throw new Error("rezultat rând negativ");
      if (item.C[i] < 0) throw new Error("rezultat coloană negativ");
      // forward: rezultatele TIPĂRITE == recalcul din soluție (calc corect)
      if (evalLine(item.sol[i], item.rowOp[i]) !== item.R[i])
        throw new Error(
          "R[" + i + "] nu se potrivește cu soluția (calc forward greșit)",
        );
      var colVals = [];
      for (var rr = 0; rr < size; rr++) colVals.push(item.sol[rr][i]);
      if (evalLine(colVals, item.colOp[i]) !== item.C[i])
        throw new Error(
          "C[" + i + "] nu se potrivește cu soluția (calc forward greșit)",
        );
    }
    // 2) nr ascunse == ținta dificultății (fără colaps tăcut Greu→Standard)
    var band = DIFF[item.marime][item.dificultate];
    if (item.nrAscunse !== band.hide)
      throw new Error(
        "nr ascunse " + item.nrAscunse + " != țintă " + band.hide,
      );
    // 3) SOLUȚIE UNICĂ pe obiectul în memorie (verificator independent)
    var spec = specFromSol(
      item.rowOp,
      item.colOp,
      item.R,
      item.C,
      item.sol,
      item.hidden,
      size,
    );
    var res = countSolutions(spec, item.N, size, 2);
    if (res.count !== 1)
      throw new Error("nr soluții = " + res.count + " (nu 1)");
    if (!sameGrid(res.sol, item.sol, size))
      throw new Error("soluția găsită != cea intenționată (forward check)");
    // 4) ROUND-TRIP pe HTML-ul TIPĂRIT (glife/numere/rezultate parsate independent)
    var puz = paginaPrint(item, 1, 1, false);
    var p = parsePuzzleHtml(puz);
    if (p.size !== size)
      throw new Error("mărime tipărită " + p.size + " != " + size);
    if (p.N !== item.N)
      throw new Error("domeniu tipărit " + p.N + " != solver " + item.N);
    if (!deepEqOps(p.rowOp, item.rowOp, size))
      throw new Error("operatori rând tipăriți greșit");
    if (!deepEqOps(p.colOp, item.colOp, size))
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
      size,
      2,
    );
    if (res2.count !== 1)
      throw new Error("puzzle-ul TIPĂRIT are " + res2.count + " soluții");
    if (!sameGrid(res2.sol, item.sol, size))
      throw new Error("soluția puzzle-ului TIPĂRIT != intenționata");
    // 5) render nu aruncă + structură
    var rr2 = render(item);
    if (!rr2 || rr2.pages.length !== 2 || typeof rr2.interactive !== "string")
      throw new Error("render invalid");
  }

  function selftest() {
    var detalii = [];
    var ok = true;
    function fail(msg) {
      ok = false;
      detalii.push("[FAIL] " + msg);
    }

    // -1) invariant hide ≤ 2*marime-1 (arbore de acoperire K_marime,marime) —
    // asertat explicit ca o bandă viitoare să nu ceară mai multe ascunse decât
    // există muchii posibile într-un forest (ar bloca buildOne la infinit).
    try {
      MARIMI.forEach(function (marime) {
        var maxHide = 2 * marime - 1;
        for (var dif in DIFF[marime]) {
          if (DIFF[marime][dif].hide > maxHide)
            throw new Error(
              marime +
                "×" +
                marime +
                "/" +
                dif +
                " are hide=" +
                DIFF[marime][dif].hide +
                " > max arbore " +
                maxHide,
            );
        }
      });
      detalii.push(
        "[OK] invariant hide ≤ 2*marime-1 — nicio bandă nu cere mai multe celule ascunse decât permite arborele de acoperire",
      );
    } catch (e) {
      fail(e.message);
    }

    // 0) oracol evalLine (independent de generator)
    try {
      var cases = [
        [[5, 3, 2], ["+", "+"], 10],
        [[9, 4, 2], ["-", "+"], 7],
        [[8, 3, 2], ["-", "-"], 3],
        [[2, 6, 1], ["+", "-"], 7],
        [[6, 6, 6], ["+", "+"], 18],
        [[10, 2, 3, 1], ["+", "-", "+"], 10],
        [[5, 1, 2, 3, 4], ["+", "+", "-", "+"], 9],
      ];
      for (var i = 0; i < cases.length; i++) {
        var got = evalLine(cases[i][0], cases[i][1]);
        if (got !== cases[i][2])
          throw new Error(
            "evalLine(" +
              cases[i][0].join(",") +
              " / " +
              cases[i][1].join(",") +
              ") = " +
              got +
              " != " +
              cases[i][2],
          );
      }
      detalii.push(
        "[OK] evalLine — 7 cazuri-oracol corecte (inclusiv lungime 4/5, nu doar 3)",
      );
    } catch (e) {
      fail("oracol evalLine: " + e.message);
    }

    // 1) fiecare mărime × dificultate × mai multe seed-uri: unic + round-trip + nr ascunse
    MARIMI.forEach(function (marime) {
      for (var dif in DIFF[marime]) {
        var seeds = 24;
        var okCount = 0,
          hitTarget = 0;
        var firstErr = null;
        for (var seed = 0; seed < seeds; seed++) {
          try {
            var it = buildOne({ marime: marime, dificultate: dif }, seed);
            checkItem(it);
            var it2 = buildOne({ marime: marime, dificultate: dif }, seed);
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
            if (it.nrAscunse === DIFF[marime][dif].hide) hitTarget++;
            okCount++;
          } catch (e) {
            if (!firstErr) firstErr = "seed=" + seed + ": " + e.message;
          }
        }
        var tag = marime + "×" + marime + "/" + dif;
        if (okCount !== seeds)
          fail(
            tag + " — " + okCount + "/" + seeds + " OK; primul: " + firstErr,
          );
        else if (hitTarget !== seeds)
          fail(
            tag +
              " — nr ascunse a atins ținta doar " +
              hitTarget +
              "/" +
              seeds +
              " (colaps difficultate)",
          );
        else
          detalii.push(
            "[OK] " +
              tag +
              " x" +
              seeds +
              " seed-uri -> soluție UNICĂ, round-trip HTML, " +
              DIFF[marime][dif].hide +
              " ascunse, determinist",
          );
      }
    });

    // 2) negative sanity — un puzzle cu ciclu (dreptunghi 2×2) NU e unic (dovada că
    //    solverul chiar numără): construim manual un careu 3×3 all-+ și ascundem un 2×2.
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
      // ascunde dreptunghiul (0,0),(0,1),(1,0),(1,1) → ciclu → ≥2 soluții pe 1..9
      var hidden = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      var spec = specFromSol(rowOp, colOp, R, C, sol, hidden, 3);
      var res = countSolutions(spec, 9, 3, 3);
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
    MARIMI: MARIMI,
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
