/* integrama.js — generator „Integramă" (lanț de „mori de vânt": ecuații scurte
 * `a op b = c` care se ÎNCRUCIȘEAZĂ într-o celulă centrală comună, toate 4
 * operațiile +,−,×,÷ prezente per moară). Contract §5 (ca numere.js/dictare.js):
 *   buildOne(params, seed) -> item
 *   render(item, mm?) -> { pages:[puzzle, answer], css, interactive, interactiveCss }
 *   renderPages(item, nr, total, mm?) -> { puzzle, answer }
 *   selftest() -> { ok, detalii }
 *   signature(item) -> string
 *
 * FORMA (confirmată de Roland via mock, 2026-08-07): un lanț de N „mori de
 * vânt". Fiecare moară are un centru X_i atins de 4 ecuații scurte (fiecare cu
 * O SINGURĂ operație): SUS (p op q = X_i), JOS (X_i op r = s), STÂNGA (link cu
 * moara anterioară / frunze proprii dacă e prima), DREAPTA (link cu moara
 * următoare / frunze proprii dacă e ultima). Morile Ușor/Standard/Greu = 1/2/3
 * (4/7/10 ecuații). Coloana STÂNGA-DREAPTA formează o „coloană vertebrală"
 * orizontală unică: a0 op0 b0 = X1 op1 b1 = X2 op2 b2 = ... = X_n opN bFinal = rFinal.
 *
 * CORECTITUDINE = SOLUȚIE UNICĂ:
 *  - Domeniul e TIPĂRIT („toate numerele din desen sunt de la 1 la N", inclusiv
 *    centrele — nu doar frunzele) → unicitatea se verifică pe domeniul DECLARAT.
 *  - Construcție: se aleg centrele + operatorii (o permutare a {+,−,×,÷} per
 *    paritate de moară, ca cele 4 brațe ale FIECĂREI mori să fie toate distincte
 *    și legătura STÂNGA/DREAPTA între mori consecutive să coincidă), apoi
 *    frunzele prin rezolvare directă/inversă (nu ghicire-și-verificare).
 *  - Set ascuns ales printr-o EURISTICĂ DE PROPAGARE FORȚATĂ (`canForcePropagate`):
 *    o celulă e păstrată ascunsă doar dacă, pornind de la celulele ÎNCĂ arătate,
 *    propagarea (o ecuație cu exact 1 necunoscută se rezolvă, repetă până la
 *    fixpoint) reușește să deducă TOT setul ascuns curent. Asta e doar euristică
 *    de CONSTRUCȚIE — NU e acceptată ca dovadă de unicitate.
 *  - VERIFICATOR INDEPENDENT (`countSolutions`): backtracking separat, care NU
 *    împarte cod cu euristica de propagare, enumeră fiecare celulă ascunsă pe
 *    domeniul TIPĂRIT 1..N (inclusiv centrele — vezi nota domeniului mai sus),
 *    numără soluțiile. Acceptat doar dacă `count==1` ȘI `sol==intended`.
 *  - selftest face ROUND-TRIP pe HTML-ul TIPĂRIT (extrage glifele operatorilor +
 *    numerele, hartă glif→op scrisă INDEPENDENT (REV_OP), re-rulează solverul)
 *    → prinde un bug de randare (ex. „×" tipărit ca „+").
 */
(function (root) {
  "use strict";

  var PyRandom = root.PlansePRNG.PyRandom;
  var Sig = root.PlanseSig;

  var MINUS = "−"; // U+2212
  var TIMES = "×"; // U+00D7
  var DIV = "÷"; // U+00F7
  var OP_GLYPH = { "+": "+", "-": MINUS, "*": TIMES, "/": DIV };
  var REV_OP = {};
  REV_OP["+"] = "+";
  REV_OP[MINUS] = "-";
  REV_OP[TIMES] = "*";
  REV_OP[DIV] = "/";
  var ALL_OPS = ["+", "-", "*", "/"];

  // Dificultate: n mori înlănțuite, domeniu 1..N, nr celule ascunse, lățime col (mm).
  var DIFF = {
    Usor: { n: 1, N: 12, hide: 3, cellMM: 16, opMM: 9 },
    Standard: { n: 2, N: 16, hide: 5, cellMM: 13, opMM: 8 },
    Greu: { n: 3, N: 20, hide: 7, cellMM: 10, opMM: 7 },
  };

  // ---------- aritmetică (regula puzzle-ului; testată cu oracol în selftest) ----------
  function evalOp(op, a, b) {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b !== 0 && a % b === 0 ? a / b : null;
    }
    return null;
  }
  // rezolvă b din `a op b = c` (a, c cunoscute)
  function solveSecond(op, a, c) {
    switch (op) {
      case "+":
        return c - a;
      case "-":
        return a - c;
      case "*":
        return a !== 0 && c % a === 0 ? c / a : null;
      case "/":
        return c !== 0 && a % c === 0 ? a / c : null;
    }
    return null;
  }
  // rezolvă a din `a op b = c` (b, c cunoscute)
  function solveFirst(op, b, c) {
    switch (op) {
      case "+":
        return c - b;
      case "-":
        return c + b;
      case "*":
        return b !== 0 && c % b === 0 ? c / b : null;
      case "/":
        return c * b;
    }
    return null;
  }

  // ---------- construcție: perechi pt rezultat țintă / frunză liberă ----------
  // p op q = target ; ambele în [1,N] ; evită triviale (operand 1 la */).
  function pickPairForResult(rng, op, target, N) {
    if (op === "+") {
      if (target < 2) return null;
      var lo = Math.max(1, target - N),
        hi = Math.min(N, target - 1);
      if (lo > hi) return null;
      var p = rng.randint(lo, hi);
      return [p, target - p];
    }
    if (op === "-") {
      var maxQ = N - target;
      if (maxQ < 1) return null;
      var q = rng.randint(1, maxQ);
      return [target + q, q];
    }
    if (op === "*") {
      var divs = [];
      for (var d = 2; d * d <= target; d++) {
        if (target % d === 0) {
          var e = target / d;
          if (d <= N && e <= N && e >= 2) divs.push(d);
          if (e !== d && e <= N && d <= N && d >= 2) divs.push(e);
        }
      }
      if (!divs.length) return null;
      var pick = divs[rng.randrange(divs.length)];
      return [pick, target / pick];
    }
    if (op === "/") {
      // p / q = target -> p = target*q
      var maxQ2 = Math.floor(N / target);
      if (maxQ2 < 2) return null;
      var q2 = rng.randint(2, maxQ2);
      return [target * q2, q2];
    }
    return null;
  }
  // a op b = ? ; a cunoscut (centru), b ales liber, rezultat calculat (în [1,N]).
  function pickSecondFree(rng, op, a, N) {
    if (op === "+") {
      var maxB = N - a;
      if (maxB < 1) return null;
      var b = rng.randint(1, maxB);
      return [b, a + b];
    }
    if (op === "-") {
      if (a < 2) return null;
      var b2 = rng.randint(1, a - 1);
      return [b2, a - b2];
    }
    if (op === "*") {
      var maxB2 = Math.floor(N / a);
      if (maxB2 < 2) return null;
      var b3 = rng.randint(2, maxB2);
      return [b3, a * b3];
    }
    if (op === "/") {
      var divs2 = [];
      for (var d2 = 2; d2 <= a; d2++) if (a % d2 === 0) divs2.push(d2);
      if (!divs2.length) return null;
      var b4 = divs2[rng.randrange(divs2.length)];
      return [b4, a / b4];
    }
    return null;
  }
  // link interior: X_j op b = X_{j+1} ; X_j, X_{j+1} FIXE -> b forțat.
  function linkLeaf(op, Xj, Xj1, N) {
    var b = solveSecond(op, Xj, Xj1);
    if (b === null || !(b >= 1 && b <= N)) return null;
    if ((op === "*" || op === "/") && b === 1) return null; // evită trivial
    return b;
  }

  // ---------- rolurile celor 4 brațe per moară (paritate -> permutare ops) ----------
  function armOps(perm, i) {
    // perm = [opA,opB,opC,opD], i = indice moară (1-based)
    var odd = i % 2 === 1;
    return odd
      ? { L: perm[0], R: perm[1], U: perm[2], D: perm[3] }
      : { L: perm[1], R: perm[0], U: perm[3], D: perm[2] };
  }

  function key(r, c) {
    return r + "," + c;
  }

  // ---------- CONSTRUCȚIE ----------
  function buildRaw(rng, n, N) {
    var perm = ALL_OPS.slice();
    rng.shuffle(perm);

    // link_j operator (j=0..n): link_0 = moara1.L ; link_j (1<=j<=n-1) = moara_j.R ;
    // link_n = moara_n.R.
    function linkOp(j) {
      if (j === 0) return armOps(perm, 1).L;
      return armOps(perm, j).R;
    }

    var X = new Array(n + 1); // X[1..n]
    var innerB = new Array(n); // innerB[1..n-1] = leaf pe link interior j
    var a0, b0, bFinal, rFinal;
    var upLeaf1 = [],
      upLeaf2 = [],
      downLeaf1 = [],
      downLeaf2 = []; // index 1..n

    // X1 liber, apoi link0 + up1 + down1
    var Xmin = Math.max(2, Math.floor(N * 0.3)),
      Xmax = Math.min(N - 1, Math.ceil(N * 0.8));
    if (Xmin > Xmax)
      Xmin = Xmax = Math.max(2, Math.min(N - 1, Math.floor(N / 2)));
    X[1] = rng.randint(Xmin, Xmax);

    var l0 = pickPairForResult(rng, linkOp(0), X[1], N);
    if (!l0) return null;
    a0 = l0[0];
    b0 = l0[1];

    var ops1 = armOps(perm, 1);
    var u1 = pickPairForResult(rng, ops1.U, X[1], N);
    if (!u1) return null;
    upLeaf1[1] = u1[0];
    upLeaf2[1] = u1[1];
    var d1 = pickSecondFree(rng, ops1.D, X[1], N);
    if (!d1) return null;
    downLeaf1[1] = d1[0];
    downLeaf2[1] = d1[1];

    for (var i = 2; i <= n; i++) {
      var found = false;
      for (var t = 0; t < 60 && !found; t++) {
        var cand = rng.randint(1, N);
        var b = linkLeaf(linkOp(i - 1), X[i - 1], cand, N);
        if (b === null) continue;
        var opsI = armOps(perm, i);
        var u = pickPairForResult(rng, opsI.U, cand, N);
        if (!u) continue;
        var dwn = pickSecondFree(rng, opsI.D, cand, N);
        if (!dwn) continue;
        X[i] = cand;
        innerB[i - 1] = b;
        upLeaf1[i] = u[0];
        upLeaf2[i] = u[1];
        downLeaf1[i] = dwn[0];
        downLeaf2[i] = dwn[1];
        found = true;
      }
      if (!found) return null;
    }

    var lf = pickSecondFree(rng, linkOp(n), X[n], N);
    if (!lf) return null;
    bFinal = lf[0];
    rFinal = lf[1];

    return {
      n: n,
      N: N,
      perm: perm,
      X: X,
      a0: a0,
      b0: b0,
      innerB: innerB,
      bFinal: bFinal,
      rFinal: rFinal,
      upLeaf1: upLeaf1,
      upLeaf2: upLeaf2,
      downLeaf1: downLeaf1,
      downLeaf2: downLeaf2,
      linkOp: linkOp,
    };
  }

  // Construiește harta de celule + lista de ecuații din structura brută.
  // Coordonate: coloana centrului morii i = 4*i. Rând spine = 4. Braț SUS =
  // rândurile 0-3 (p,op,q,=) pe coloana centrului. Braț JOS = rândurile 5-8
  // (op,r,=,s). Coloana 0-3 = blocul inițial (a0,op0,b0,=).
  function cellsFromRaw(raw) {
    var n = raw.n;
    var cells = {}; // key -> {kind:'num'|'op', value, op}
    var equations = [];

    function setNum(r, c, v) {
      cells[key(r, c)] = { kind: "num", value: v };
    }
    function setOp(r, c, op) {
      cells[key(r, c)] = { kind: "op", op: op };
    }
    function eq(cellA, cellB, cellC, op) {
      equations.push({ cells: [cellA, cellB, cellC], op: op });
    }

    // bloc inițial: a0(col0) op0(col1) b0(col2) =(col3) X1(col4)
    setNum(4, 0, raw.a0);
    setOp(4, 1, raw.linkOp(0));
    setNum(4, 2, raw.b0);
    // col3 = "=" (fără celulă numerică, doar randare)
    setNum(4, 4, raw.X[1]);
    eq(key(4, 0), key(4, 2), key(4, 4), raw.linkOp(0));

    for (var i = 1; i <= n; i++) {
      var c = 4 * i;
      // SUS: rând0=p, rând1=op, rând2=q, rând3="=" , rând4=X_i (deja setat)
      setNum(0, c, raw.upLeaf1[i]);
      setOp(1, c, armOps(raw.perm, i).U);
      setNum(2, c, raw.upLeaf2[i]);
      eq(key(0, c), key(2, c), key(4, c), armOps(raw.perm, i).U);
      // JOS: rând4=X_i, rând5=op, rând6=r, rând7="=", rând8=s
      setOp(5, c, armOps(raw.perm, i).D);
      setNum(6, c, raw.downLeaf1[i]);
      setNum(8, c, raw.downLeaf2[i]);
      eq(key(4, c), key(6, c), key(8, c), armOps(raw.perm, i).D);

      if (i < n) {
        var cNext = 4 * (i + 1);
        setOp(4, c + 1, raw.linkOp(i));
        setNum(4, c + 2, raw.innerB[i]);
        setNum(4, cNext, raw.X[i + 1]);
        eq(key(4, c), key(4, c + 2), key(4, cNext), raw.linkOp(i));
      } else {
        setOp(4, c + 1, raw.linkOp(n));
        setNum(4, c + 2, raw.bFinal);
        setNum(4, c + 4, raw.rFinal);
        eq(key(4, c), key(4, c + 2), key(4, c + 4), raw.linkOp(n));
      }
    }

    var cols = 4 * n + 5;
    return { cells: cells, equations: equations, rows: 9, cols: cols };
  }

  // ---------- euristică de PROPAGARE (construcție hidden-set, NU acceptare) ----------
  function solveUnknown(op, vals, idx) {
    if (idx === 2) return evalOp(op, vals[0], vals[1]);
    if (idx === 0) return solveFirst(op, vals[1], vals[2]);
    if (idx === 1) return solveSecond(op, vals[0], vals[2]);
    return null;
  }
  function canForcePropagate(full, equations, hiddenKeys) {
    var known = {};
    for (var k in full) if (hiddenKeys.indexOf(k) === -1) known[k] = full[k];
    var remaining = hiddenKeys.slice();
    var changed = true;
    while (changed && remaining.length) {
      changed = false;
      for (var i = 0; i < equations.length; i++) {
        var eqk = equations[i].cells;
        var vals = [known[eqk[0]], known[eqk[1]], known[eqk[2]]];
        var unk = [];
        for (var j = 0; j < 3; j++) if (vals[j] === undefined) unk.push(j);
        if (unk.length === 1) {
          var idx = unk[0];
          var ck = eqk[idx];
          if (remaining.indexOf(ck) === -1) continue;
          var v = solveUnknown(equations[i].op, vals, idx);
          if (v === null || v !== full[ck]) continue; // inconsistent -> nu forța (nu ar trebui să apară)
          known[ck] = v;
          remaining.splice(remaining.indexOf(ck), 1);
          changed = true;
        }
      }
    }
    return remaining.length === 0;
  }

  function pickHidden(rng, structure, target) {
    var allKeys = Object.keys(structure.cells).filter(function (k) {
      return structure.cells[k].kind === "num";
    });
    var full = {};
    allKeys.forEach(function (k) {
      full[k] = structure.cells[k].value;
    });
    var order = allKeys.slice();
    rng.shuffle(order);
    var hidden = [];
    for (var i = 0; i < order.length && hidden.length < target; i++) {
      var cand = hidden.concat([order[i]]);
      if (canForcePropagate(full, structure.equations, cand)) hidden = cand;
    }
    return hidden;
  }

  // ---------- VERIFICATOR INDEPENDENT (numără soluțiile pe domeniul 1..N) -----------
  // NU reutilizează canForcePropagate — DFS pur cu pruning pe ecuații complete.
  function countSolutions(structure, N, hiddenKeys, shown, cap) {
    var assign = {};
    for (var s in shown) assign[s] = shown[s];
    var count = 0,
      firstSol = null;

    function eqStatus(eqSpec) {
      var vals = eqSpec.cells.map(function (k) {
        return assign[k];
      });
      var unk = [];
      for (var i = 0; i < 3; i++) if (vals[i] === undefined) unk.push(i);
      return { vals: vals, unk: unk };
    }
    function checkComplete(touchedKey) {
      for (var i = 0; i < structure.equations.length; i++) {
        var e = structure.equations[i];
        if (e.cells.indexOf(touchedKey) === -1) continue;
        var st = eqStatus(e);
        if (st.unk.length === 0) {
          if (e.op === "/") {
            if (st.vals[1] === 0 || st.vals[0] % st.vals[1] !== 0) return false;
          }
          if (evalOp(e.op, st.vals[0], st.vals[1]) !== st.vals[2]) return false;
        }
      }
      return true;
    }

    function bt(idx) {
      if (count >= cap) return;
      if (idx === hiddenKeys.length) {
        for (var i = 0; i < structure.equations.length; i++) {
          var e = structure.equations[i];
          var vals = e.cells.map(function (k) {
            return assign[k];
          });
          if (e.op === "/" && (vals[1] === 0 || vals[0] % vals[1] !== 0))
            return;
          if (evalOp(e.op, vals[0], vals[1]) !== vals[2]) return;
        }
        count++;
        if (!firstSol) {
          firstSol = {};
          for (var k in assign) firstSol[k] = assign[k];
        }
        return;
      }
      var ck = hiddenKeys[idx];
      for (var v = 1; v <= N; v++) {
        assign[ck] = v;
        if (checkComplete(ck)) bt(idx + 1);
        if (count >= cap) {
          delete assign[ck];
          return;
        }
      }
      delete assign[ck];
    }
    bt(0);
    return { count: count, sol: firstSol };
  }

  function sameSol(a, b, hiddenKeys) {
    if (!a || !b) return false;
    for (var i = 0; i < hiddenKeys.length; i++)
      if (a[hiddenKeys[i]] !== b[hiddenKeys[i]]) return false;
    return true;
  }

  function buildOne(params, seed) {
    var dif = params.dificultate;
    if (!(dif in DIFF)) throw new Error("dificultate necunoscută: " + dif);
    var band = DIFF[dif];
    var rng = new PyRandom(seed);

    for (var attempt = 0; attempt < 1500; attempt++) {
      var raw = buildRaw(rng, band.n, band.N);
      if (!raw) continue;
      var structure = cellsFromRaw(raw);
      var hidden = pickHidden(rng, structure, band.hide);
      if (hidden.length !== band.hide) continue;

      var shown = {};
      var allNumKeys = Object.keys(structure.cells).filter(function (k) {
        return structure.cells[k].kind === "num";
      });
      allNumKeys.forEach(function (k) {
        if (hidden.indexOf(k) === -1) shown[k] = structure.cells[k].value;
      });
      var intended = {};
      allNumKeys.forEach(function (k) {
        intended[k] = structure.cells[k].value;
      });

      var res = countSolutions(structure, band.N, hidden, shown, 2);
      if (res.count === 1 && sameSol(res.sol, intended, hidden)) {
        var hiddenSet = {};
        hidden.forEach(function (k) {
          hiddenSet[k] = true;
        });
        var canon =
          "integrama|" +
          dif +
          "|N" +
          band.N +
          "|n" +
          band.n +
          "|" +
          allNumKeys
            .sort()
            .map(function (k) {
              return k + "=" + structure.cells[k].value;
            })
            .join(";") +
          "|" +
          structure.equations
            .map(function (e) {
              return e.cells.join(">") + ":" + e.op;
            })
            .join(";") +
          "|" +
          hidden.slice().sort().join(",");
        return {
          tip: "integrama",
          dificultate: dif,
          n: band.n,
          N: band.N,
          structure: structure,
          hidden: hidden,
          hiddenSet: hiddenSet,
          nrAscunse: hidden.length,
          seed: seed,
          semnatura: Sig.md5(canon).slice(0, 12),
        };
      }
    }
    throw new Error(
      "VERIFICARE EȘUATĂ: nu am generat o integramă UNICĂ pentru " + dif,
    );
  }

  function signature(item) {
    return item.semnatura;
  }

  // ---------- RANDARE ----------
  function cellHtml(item, r, c, mode) {
    var st = item.structure;
    var k = key(r, c);
    var cell = st.cells[k];
    if (!cell) return '<div class="ig-cell ig-x"></div>';
    if (cell.kind === "op") {
      return '<div class="ig-cell ig-op">' + OP_GLYPH[cell.op] + "</div>";
    }
    // num
    var hidden = !!item.hiddenSet[k];
    if (!hidden) return '<div class="ig-cell ig-num">' + cell.value + "</div>";
    if (mode === "answer")
      return (
        '<div class="ig-cell ig-num ig-blank ig-fill">' + cell.value + "</div>"
      );
    if (mode === "interactive")
      return (
        '<div class="ig-cell ig-num ig-blank"><span class="ig-ans">' +
        cell.value +
        "</span></div>"
      );
    return '<div class="ig-cell ig-num ig-blank"></div>';
  }

  // coloanele "=" nu au celulă în `cells` (sunt goluri intenționate) — le randăm separat
  function eqMarkerHtml(item, r, c) {
    // "=" apare imediat DUPĂ fiecare bloc de 3 celule (a,op,b) pe rândurile 3/7 (brațe verticale)
    // și pe rândul spine (4) la col+3 relativ la fiecare centru/bloc inițial.
    return '<div class="ig-cell ig-eq">=</div>';
  }

  function gridHtml(item, mode) {
    var st = item.structure;
    var out = [];
    for (var r = 0; r < st.rows; r++) {
      for (var c = 0; c < st.cols; c++) {
        var k = key(r, c);
        if (st.cells[k]) {
          out.push(cellHtml(item, r, c, mode));
        } else if (isEqPosition(item, r, c)) {
          out.push(eqMarkerHtml(item, r, c));
        } else {
          out.push('<div class="ig-cell ig-x"></div>');
        }
      }
    }
    var cls = "ig-grid" + (mode === "answer" ? " show-solution" : "");
    return (
      '<div class="' +
      cls +
      '" style="grid-template-columns:repeat(' +
      st.cols +
      "," +
      DIFF[item.dificultate].cellMM +
      'mm);">' +
      out.join("") +
      "</div>"
    );
  }

  // poziții "=" cunoscute prin construcție: col3 (bloc inițial) pe rândul 4;
  // col 4*i+3 pt fiecare i=1..n pe rândul 4; și col fixă pe rândurile 3/7 pt
  // fiecare centru (brațele verticale).
  function isEqPosition(item, r, c) {
    var n = item.n;
    if (r === 4) {
      if (c === 3) return true;
      for (var j = 1; j <= n; j++) if (c === 4 * j + 3) return true;
      return false;
    }
    if (r === 3 || r === 7) {
      for (var k = 1; k <= n; k++) if (c === 4 * k) return true;
      return false;
    }
    return false;
  }

  // ---------- geometrie ecuațiilor, re-derivată INDEPENDENT de cellsFromRaw ----------
  // (folosită DOAR la round-trip-ul HTML — nu împarte cod cu construcția, doar
  // convenția de poziționare documentată în antetul fișierului). Centrul morii i
  // e la coloana 4*i; rândul 4 = coloana vertebrală; brațul SUS = rândurile 0-3;
  // brațul JOS = rândurile 5-8 (aceeași coloană ca centrul).
  function equationLayout(n) {
    var eqs = [];
    eqs.push({ cells: [key(4, 0), key(4, 2), key(4, 4)], opCell: key(4, 1) });
    for (var i = 1; i <= n; i++) {
      var c = 4 * i;
      eqs.push({ cells: [key(0, c), key(2, c), key(4, c)], opCell: key(1, c) });
      eqs.push({ cells: [key(4, c), key(6, c), key(8, c)], opCell: key(5, c) });
      if (i < n) {
        var cNext = 4 * (i + 1);
        eqs.push({
          cells: [key(4, c), key(4, c + 2), key(4, cNext)],
          opCell: key(4, c + 1),
        });
      } else {
        eqs.push({
          cells: [key(4, c), key(4, c + 2), key(4, c + 4)],
          opCell: key(4, c + 1),
        });
      }
    }
    return eqs;
  }

  function domainSentence(item) {
    return (
      "Completează căsuțele goale cu numere de la 1 la " +
      item.N +
      " (toate numerele din desen, inclusiv cele din centrul crucilor, sunt în acest interval)."
    );
  }

  function paginaPrint(item, nr, total, raspuns) {
    var clasa = raspuns ? "page-a4 pagina-raspuns" : "page-a4";
    var antet, sub, corp;
    if (raspuns) {
      antet =
        '<div class="header-title">Răspuns &mdash; Integramă ' + nr + "</div>";
      sub =
        '<div class="nota-parinte">Pentru părinte &mdash; nu se printează. Căsuțele completate sunt evidențiate.</div>';
      corp =
        '<div class="exercise-block">' + gridHtml(item, "answer") + "</div>";
    } else {
      antet =
        '<div class="header-title">Integramă &mdash; ecuații încrucișate</div>' +
        '<div class="header-fields"><div>Nume: ____________</div><div>Data: __________</div></div>';
      sub =
        '<div class="subtitlu">' +
        domainSentence(item) +
        " Fiecare cruce e formată din 4 ecuații scurte (2 numere + operator = rezultat) care se citesc separat. &bull; " +
        item.dificultate +
        " &bull; Integramă " +
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
    "  .ig-grid { display:grid; grid-auto-rows:14mm 8mm 14mm 8mm 14mm 8mm 14mm 8mm 14mm; margin:0 auto; }\n" +
    "  .ig-cell { display:flex; align-items:center; justify-content:center; }\n" +
    "  .ig-num { border:2px solid #111; font-size:1.4rem; font-weight:bold; }\n" +
    "  .ig-blank { background:#f4f4f4; }\n" +
    "  .ig-op { font-size:1.25rem; font-weight:bold; }\n" +
    "  .ig-eq { font-size:1.25rem; font-weight:bold; }\n" +
    "  .ig-fill { color:#1a7a3a; background:#e8ffe8; }\n";

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
    "  .page-a4 { display:flex; flex-direction:column; page-break-after:always; width:210mm; min-height:297mm; padding:12mm; }\n" +
    "  .header-row { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6mm; }\n" +
    "  .header-title { font-size:1.5rem; font-weight:bold; }\n" +
    "  .header-fields { display:flex; gap:20px; font-size:1.02rem; }\n" +
    "  .subtitlu { font-size:0.95rem; color:#333; margin-bottom:8mm; }\n" +
    "  .nota-parinte { font-size:0.95rem; color:#333; margin-bottom:8mm; font-style:italic; }\n" +
    "  .exercise-block { flex-grow:1; display:flex; align-items:center; justify-content:center; overflow:auto; }\n" +
    GRID_CSS;

  var INTERACTIVE_CSS =
    ".integrama-sheet { background:#fff; color:#111; border-radius:10px; padding:16px; margin:0 auto; max-width:100%; overflow:auto; font-family:'Patrick Hand', ui-rounded, 'Segoe UI', system-ui, sans-serif; }\n" +
    ".integrama-sheet .integrama-head { display:flex; justify-content:space-between; align-items:baseline; font-weight:bold; margin-bottom:6px; }\n" +
    ".integrama-sheet .integrama-sub { font-size:0.85rem; color:#333; margin-bottom:14px; }\n" +
    ".integrama-sheet .ig-grid { display:grid; grid-auto-rows:38px 22px 38px 22px 38px 22px 38px 22px 38px; margin:0 auto; }\n" +
    ".integrama-sheet .ig-cell { display:flex; align-items:center; justify-content:center; }\n" +
    ".integrama-sheet .ig-num { border:2px solid #111; font-size:1.15rem; font-weight:bold; }\n" +
    ".integrama-sheet .ig-blank { background:#f4f4f4; }\n" +
    ".integrama-sheet .ig-op, .integrama-sheet .ig-eq { font-size:1.05rem; font-weight:bold; }\n" +
    ".integrama-sheet .ig-ans { display:none; color:#1a7a3a; }\n" +
    ".integrama-sheet .ig-grid.show-solution .ig-blank { background:#e8ffe8; }\n" +
    ".integrama-sheet .ig-grid.show-solution .ig-ans { display:inline; }\n";

  function renderPages(item, nr, total) {
    return {
      puzzle: paginaPrint(item, nr, total, false),
      answer: paginaPrint(item, nr, total, true),
    };
  }

  function render(item) {
    var pg = renderPages(item, 1, 1);
    var interactive =
      '<div class="integrama-sheet">' +
      '<div class="integrama-head"><span>Integramă &bull; ' +
      item.dificultate +
      " &bull; " +
      item.nrAscunse +
      " căsuțe de completat</span></div>" +
      '<div class="integrama-sub">' +
      domainSentence(item) +
      "</div>" +
      gridHtml(item, "interactive") +
      "</div>";
    return {
      pages: [pg.puzzle, pg.answer],
      css: PRINT_CSS,
      interactive: interactive,
      interactiveCss: INTERACTIVE_CSS,
    };
  }

  // ---------- ROUND-TRIP pe HTML TIPĂRIT (parsare INDEPENDENTĂ, nu ia `item`) ----------
  // n/cols se deduc din nr de celule parsate (rows fix = 9), NU din structura internă.
  // Ecuațiile se reconstruiesc din `equationLayout` + glifele PARSATE — nu din `st`.
  function parsePuzzleHtml(html) {
    var re = /<div class="ig-cell([^"]*)">([^<]*)<\/div>/g;
    var cellsFlat = [],
      m;
    while ((m = re.exec(html))) cellsFlat.push({ cls: m[1], txt: m[2].trim() });
    var ROWS = 9;
    if (cellsFlat.length % ROWS !== 0)
      throw new Error(
        "nr celule parsate = " +
          cellsFlat.length +
          " (nu e multiplu de " +
          ROWS +
          ")",
      );
    var cols = cellsFlat.length / ROWS;
    var n = (cols - 5) / 4;
    if (!(n >= 1 && Math.floor(n) === n))
      throw new Error(
        "cols=" + cols + " parsat nu corespunde niciunui n valid",
      );

    var parsedNum = {},
      parsedOp = {},
      parsedHidden = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < cols; c++) {
        var k = key(r, c);
        var cell = cellsFlat[r * cols + c];
        if (cell.cls.indexOf("ig-num") !== -1) {
          if (cell.txt === "") parsedHidden.push(k);
          else parsedNum[k] = parseInt(cell.txt, 10);
        } else if (cell.cls.indexOf("ig-op") !== -1) {
          var op = REV_OP[cell.txt];
          if (!op)
            throw new Error("glif operator necunoscut: '" + cell.txt + "'");
          parsedOp[k] = op;
        } else if (cell.cls.indexOf("ig-eq") !== -1) {
          if (cell.txt !== "=") throw new Error("celulă-egal fără '=' la " + k);
        }
      }
    }
    var mn = html.match(/de la 1 la (\d+)/);
    var N = mn ? parseInt(mn[1], 10) : null;
    var equations = equationLayout(n).map(function (eqPos) {
      var op = parsedOp[eqPos.opCell];
      if (!op) throw new Error("operator lipsă/nedetectat la " + eqPos.opCell);
      return { cells: eqPos.cells, op: op };
    });
    return {
      N: N,
      n: n,
      num: parsedNum,
      hidden: parsedHidden,
      equations: equations,
    };
  }

  function checkItem(item) {
    var st = item.structure;
    // 1) toate valorile numerice în domeniu 1..N
    Object.keys(st.cells).forEach(function (k) {
      var cell = st.cells[k];
      if (cell.kind === "num" && !(cell.value >= 1 && cell.value <= item.N))
        throw new Error(
          "valoare în afara domeniului la " + k + ": " + cell.value,
        );
    });
    // 2) toate ecuațiile consistente (forward) + toate 4 operațiile prezente per moară
    st.equations.forEach(function (e) {
      var vals = e.cells.map(function (k) {
        return st.cells[k].value;
      });
      if (e.op === "/" && (vals[1] === 0 || vals[0] % vals[1] !== 0))
        throw new Error("ecuație ÷ neexactă: " + e.cells.join(","));
      if (evalOp(e.op, vals[0], vals[1]) !== vals[2])
        throw new Error("ecuație inconsistentă: " + e.cells.join(","));
    });
    // 2b) fiecare moară are toate 4 operațiile distincte pe cele 4 brațe (L,R,U,D)
    for (var i = 1; i <= item.n; i++) {
      var opU = st.cells[key(1, 4 * i)].op;
      var opD = st.cells[key(5, 4 * i)].op;
      var opL = st.cells[key(4, 4 * (i - 1) + 1)].op;
      var opR = st.cells[key(4, 4 * i + 1)].op;
      var setArm = {};
      [opU, opD, opL, opR].forEach(function (o) {
        setArm[o] = true;
      });
      if (Object.keys(setArm).length !== 4)
        throw new Error(
          "moara " +
            i +
            " nu are 4 operații distincte: " +
            [opL, opR, opU, opD].join(","),
        );
    }

    // 3) nr ascunse == țintă
    if (item.nrAscunse !== DIFF[item.dificultate].hide)
      throw new Error(
        "nr ascunse " +
          item.nrAscunse +
          " != țintă " +
          DIFF[item.dificultate].hide,
      );

    // 4) SOLUȚIE UNICĂ (verificator independent, pe obiectul în memorie)
    var allNumKeys = Object.keys(st.cells).filter(function (k) {
      return st.cells[k].kind === "num";
    });
    var shown = {},
      intended = {};
    allNumKeys.forEach(function (k) {
      intended[k] = st.cells[k].value;
      if (item.hiddenSet[k] !== true) shown[k] = st.cells[k].value;
    });
    var res = countSolutions(st, item.N, item.hidden, shown, 2);
    if (res.count !== 1)
      throw new Error("nr soluții = " + res.count + " (nu 1)");
    if (!sameSol(res.sol, intended, item.hidden))
      throw new Error("soluția găsită != cea intenționată");

    // 5) ROUND-TRIP pe HTML-ul TIPĂRIT (parsare + reconstrucție INDEPENDENTE de `st`)
    var puz = paginaPrint(item, 1, 1, false);
    var p = parsePuzzleHtml(puz);
    if (p.N !== item.N)
      throw new Error("domeniu tipărit " + p.N + " != solver " + item.N);
    if (p.n !== item.n)
      throw new Error("n reconstruit din HTML " + p.n + " != " + item.n);
    allNumKeys.forEach(function (k) {
      var isHidden = item.hiddenSet[k] === true;
      if (isHidden) {
        if (p.hidden.indexOf(k) === -1)
          throw new Error("celulă ascunsă " + k + " nu apare goală în HTML");
      } else {
        if (p.num[k] !== st.cells[k].value)
          throw new Error(
            "valoare tipărită greșit la " +
              k +
              ": " +
              p.num[k] +
              " != " +
              st.cells[k].value,
          );
      }
    });
    // operatorii TIPĂRIȚI (parsați din glife) trebuie să coincidă cu cei interni,
    // ecuație-cu-ecuație (aceeași ordine — vezi equationLayout vs cellsFromRaw).
    if (p.equations.length !== st.equations.length)
      throw new Error(
        "nr ecuații reconstruite " +
          p.equations.length +
          " != intern " +
          st.equations.length,
      );
    p.equations.forEach(function (eq, idx) {
      if (eq.op !== st.equations[idx].op)
        throw new Error(
          "operator tipărit greșit la ecuația " +
            idx +
            " (" +
            eq.cells.join(",") +
            "): " +
            eq.op +
            " != " +
            st.equations[idx].op,
        );
    });
    // re-rezolvă puzzle-ul RECONSTRUIT (valori + operatori PARSATE din HTML, NU `st`)
    var shown2 = {};
    allNumKeys.forEach(function (k) {
      if (p.hidden.indexOf(k) === -1) shown2[k] = p.num[k];
    });
    var structure2 = { equations: p.equations };
    var res2 = countSolutions(structure2, p.N, p.hidden, shown2, 2);
    if (res2.count !== 1)
      throw new Error("puzzle-ul TIPĂRIT are " + res2.count + " soluții");
    if (!sameSol(res2.sol, intended, item.hidden))
      throw new Error("soluția puzzle-ului TIPĂRIT != intenționata");

    // 6) render nu aruncă + structură
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

    // 0) oracol evalOp / solveSecond / solveFirst (independent de generator)
    try {
      var cases = [
        ["+", 5, 3, 8],
        ["-", 9, 4, 5],
        ["*", 6, 7, 42],
        ["/", 42, 6, 7],
        ["/", 42, 5, null],
      ];
      cases.forEach(function (c) {
        var v = evalOp(c[0], c[1], c[2]);
        if (v !== c[3])
          throw new Error(
            "evalOp(" + c.join(",") + ") != " + c[3] + " (a dat " + v + ")",
          );
      });
      if (solveSecond("+", 5, 8) !== 3) throw new Error("solveSecond + greșit");
      if (solveSecond("-", 9, 5) !== 4) throw new Error("solveSecond - greșit");
      if (solveSecond("*", 6, 42) !== 7)
        throw new Error("solveSecond * greșit");
      if (solveSecond("/", 42, 7) !== 6)
        throw new Error("solveSecond / greșit");
      if (solveFirst("+", 3, 8) !== 5) throw new Error("solveFirst + greșit");
      if (solveFirst("-", 4, 5) !== 9) throw new Error("solveFirst - greșit");
      if (solveFirst("*", 7, 42) !== 6) throw new Error("solveFirst * greșit");
      if (solveFirst("/", 6, 7) !== 42) throw new Error("solveFirst / greșit");
      detalii.push(
        "[OK] evalOp/solveSecond/solveFirst — oracol 4 operații + ÷ neexact",
      );
    } catch (e) {
      fail("oracol aritmetic: " + e.message);
    }

    // 1) fiecare dificultate × mai multe seed-uri: unic + round-trip + nr ascunse + determinism
    for (var dif in DIFF) {
      var seeds = 24;
      var okCount = 0,
        hitTarget = 0;
      var firstErr = null;
      var allOpsSeen = {};
      for (var seed = 0; seed < seeds; seed++) {
        try {
          var it = buildOne({ dificultate: dif }, seed);
          checkItem(it);
          var it2 = buildOne({ dificultate: dif }, seed);
          var geomA = JSON.stringify([
            Object.keys(it.structure.cells)
              .sort()
              .map(function (k) {
                var c = it.structure.cells[k];
                return c.kind === "num" ? c.value : c.op;
              }),
            it.hidden.slice().sort(),
          ]);
          var geomB = JSON.stringify([
            Object.keys(it2.structure.cells)
              .sort()
              .map(function (k) {
                var c = it2.structure.cells[k];
                return c.kind === "num" ? c.value : c.op;
              }),
            it2.hidden.slice().sort(),
          ]);
          if (geomA !== geomB) throw new Error("nedeterminist");
          it.structure.equations.forEach(function (e) {
            allOpsSeen[e.op] = true;
          });
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
          dif + " — nr ascunse a atins ținta doar " + hitTarget + "/" + seeds,
        );
      else if (Object.keys(allOpsSeen).length !== 4)
        fail(
          dif + " — nu toate 4 operațiile au apărut în " + seeds + " seed-uri",
        );
      else
        detalii.push(
          "[OK] " +
            dif +
            " x" +
            seeds +
            " seed-uri -> soluție UNICĂ, round-trip HTML, " +
            DIFF[dif].hide +
            " ascunse, determinist, toate 4 operațiile prezente",
        );
    }

    // 2) negative control — o ecuație cu 2 necunoscute și nimic altceva care le
    //    fixeze NU e unică (dovadă că countSolutions chiar numără, nu doar confirmă).
    try {
      var st2 = {
        cells: {
          "0,0": { kind: "num", value: 2 },
          "0,1": { kind: "op", op: "+" },
          "0,2": { kind: "num", value: 4 },
        },
        equations: [{ cells: ["0,0", "0,2", "0,3"], op: "+" }],
        rows: 1,
        cols: 4,
      };
      st2.cells["0,3"] = { kind: "num", value: 6 };
      var resNeg = countSolutions(st2, 8, ["0,0", "0,2"], { "0,3": 6 }, 5);
      if (resNeg.count < 2)
        throw new Error(
          "ecuație cu 2 necunoscute ar trebui să dea ≥2 soluții pe domeniu 1..8, dă " +
            resNeg.count,
        );
      detalii.push(
        "[OK] control negativ — 2+3+... 'a+b=6' cu ambele ascunse dă " +
          resNeg.count +
          " soluții (solverul chiar numără)",
      );
    } catch (e) {
      fail("control negativ: " + e.message);
    }

    return { ok: ok, detalii: detalii };
  }

  root.PlanseGen = root.PlanseGen || {};
  root.PlanseGen.integrama = {
    DIFF: DIFF,
    buildOne: buildOne,
    render: render,
    renderPages: renderPages,
    countSolutions: countSolutions,
    evalOp: evalOp,
    printCss: PRINT_CSS,
    interactiveCss: INTERACTIVE_CSS,
    selftest: selftest,
    signature: signature,
  };
})(typeof window !== "undefined" ? window : globalThis);
