/* integrama.js — generator „Integramă" (ecuații scurte `a op b = c` care se
 * ÎNCRUCIȘEAZĂ într-o celulă centrală comună — o „moară" — toate 4 operațiile
 * +,−,×,÷ prezente per moară). Contract §5 (ca numere.js/dictare.js):
 *   buildOne(params, seed) -> item   // params = {forma, dificultate}
 *   render(item, mm?) -> { pages:[puzzle, answer], css, interactive, interactiveCss }
 *   renderPages(item, nr, total, mm?) -> { puzzle, answer }
 *   selftest() -> { ok, detalii }
 *   signature(item) -> string
 *
 * MOTOR (comun tuturor formelor, topologie-agnostic — verificat 2026-08-08):
 * `buildRaw` construiește un LANȚ ABSTRACT de n mori (X[1..n], link-uri,
 * brațe U/D) folosind DOAR rolurile abstracte {L,R,U,D} per moară — NU știe
 * nimic despre poziții pe grilă. `countSolutions`/`canForcePropagate`/`evalOp`
 * la fel: iau `structure.equations` ca DATE, nu topologie hardcodată.
 * SINGURUL lucru care diferă între forme e EMBEDDING-UL (row,col) al acestui
 * lanț abstract — funcțiile `cellsFromRaw*`/`equationLayout*` per formă.
 *
 * FORME (catalog, ca la dictare.js/uneste.js — selector „Formă" paralel cu
 * „Dificultate"; per dificultate se alege o formă din DIFF[forma]):
 *  - „moara" — lanț DREPT (confirmată de Roland via mock, 2026-08-07). Fiecare
 *    moară: SUS (p op q = X_i), JOS (X_i op r = s), STÂNGA/DREAPTA = link cu
 *    moara vecină (sau frunze proprii la capete). Coloană vertebrală
 *    orizontală: a0 op0 b0 = X1 op1 b1 = X2 ... = X_n opN bFinal = rFinal.
 *  - „zigzag" — ACELAȘI lanț abstract, dar coloana vertebrală face 1-2 coturi
 *    de 90° (dreapta→jos, posibil →dreapta din nou la Greu) în loc să rămână
 *    dreaptă (confirmată de Roland via mock, 2026-08-08). La fiecare moară,
 *    cele 4 roluri L/R/U/D ocupă cele 4 direcții cardinale N/E/S/V — L/R
 *    "ocupă" direcția de intrare/ieșire a coloanei vertebrale LOCALE (poate
 *    diferi de E/V dacă moara e pivot), iar U/D ocupă cele 2 direcții
 *    RĂMASE. Vezi `DIR_ZZ` + `cellsFromRawZigzag` pt algoritmul complet.
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

  // ---------- direcții cardinale (folosite de geometria „zigzag") ----------
  var DIRV = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
  var DIR_ORDER = ["N", "E", "S", "W"]; // ordine canonică -> asignare deterministă U/D
  function oppositeDir(d) {
    return { N: "S", S: "N", E: "W", W: "E" }[d];
  }

  // Dificultate per FORMĂ: n mori (înlănțuite/pivotate), domeniu 1..N, nr
  // celule ascunse, lățime col (mm, DOAR la „moara" — „zigzag" își calculează
  // dinamic dimensiunile grilei, vezi gridHtmlZigzag).
  var DIFF = {
    moara: {
      Usor: { n: 1, N: 12, hide: 3, cellMM: 16, opMM: 9 },
      Standard: { n: 2, N: 16, hide: 5, cellMM: 13, opMM: 8 },
      Greu: { n: 3, N: 20, hide: 7, cellMM: 10, opMM: 7 },
    },
    // dirOut[i] = direcția în care pleacă legătura DIN moara i (spre moara
    // i+1, sau spre blocul final la ultima). dirOut[1] pornește mereu E
    // (blocul inițial e mereu la vest de moara 1, ca la „moara").
    zigzag: {
      Usor: { n: 2, N: 12, hide: 3, dirOut: ["E", "S"] },
      Standard: { n: 3, N: 16, hide: 5, dirOut: ["E", "S", "S"] },
      Greu: { n: 4, N: 20, hide: 7, dirOut: ["E", "S", "S", "E"] },
    },
    // nH/nV = nr mori pe brațul orizontal/vertical, INCLUSIV hub-ul comun
    // (nH=1 înseamnă „doar hub-ul", braț orizontal = bloc terminal, ca la
    // moara n=1). Hub-ul are 4 brațe LINK (V/E/N/S), fără brațe U/D proprii —
    // vezi buildRawCruce.
    // INVARIANT DE COLIZIUNE (verificat empiric, rundă advisor 2026-08-08):
    // dacă AMBELE brațe au nH>=2 ȘI nV>=2, brațul liber al morii orizontale 2
    // și cel al morii verticale 2 ajung pe ACEEAȘI celulă (colț comun la pas
    // 4 pe ambele axe) — coliziune reală de date (valori diferite pe aceeași
    // celulă), nu doar vizuală. `cellsFromRawCruce` are un mecanism WIDE_GAP
    // (pas dublu pe hop-ul hub->V2) care REZOLVĂ coliziunea de date, dar la
    // eyeball live arată ecuația verticală RUPTĂ de goluri (rânduri goale
    // între fiecare element) — respins după probă. Decizie: NICIO bandă de
    // dificultate de mai jos nu are nH>=2 ȘI nV>=2 simultan (doar UN braț
    // crește per dificultate) — WIDE_GAP rămâne cod mort/plasă de siguranță,
    // nu calea activă.
    cruce: {
      Usor: { nH: 1, nV: 1, N: 12, hide: 3 },
      Standard: { nH: 2, nV: 1, N: 16, hide: 5 },
      Greu: { nH: 1, nV: 3, N: 20, hide: 7 },
    },
  };
  var FORME = Object.keys(DIFF);
  var FORM_LABELS = {
    moara: "Moară de vânt (lanț drept)",
    zigzag: "Zigzag (coloană cotită)",
    cruce: "Cruce (2 lanțuri perpendiculare)",
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
  // forcedX1/forcedPerm (opționale, folosite DOAR de „cruce" — vezi buildRawCruce):
  // permit unui al 2-lea lanț să pornească din ACELAȘI X1 și cu un `perm`
  // ales astfel încât cele 4 operații de la moara comună (hub) să rămână
  // distincte. Omise -> comportament IDENTIC cu înainte (moara/zigzag).
  function buildRaw(rng, n, N, forcedX1, forcedPerm) {
    var perm = forcedPerm || ALL_OPS.slice();
    if (!forcedPerm) rng.shuffle(perm);

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
    X[1] = forcedX1 !== undefined ? forcedX1 : rng.randint(Xmin, Xmax);

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

  // ---------- CONSTRUCȚIE „cruce" (2 lanțuri buildRaw, hub comun) ----------
  // Construiește lanțul ORIZONTAL normal (X1 liber), apoi lanțul VERTICAL cu
  // X1 FORȚAT să fie ACELAȘI cu orizontalului (hub comun) — `forcedX1`. Ca
  // hub-ul să aibă toate 4 operații distincte pe cele 4 brațe-link (nu doar
  // 2, ca la moara normală), `vPerm` e construit EXPLICIT din operațiile
  // NEFOLOSITE de orizontal la L/R (adică exact U/D-ul orizontalului) —
  // garantează 4 distincte prin construcție, nu prin respingere/reîncercare.
  function buildRawCruce(rng, nH, nV, N) {
    var hRaw = buildRaw(rng, nH, N);
    if (!hRaw) return null;
    var hArm1 = armOps(hRaw.perm, 1);
    var vPerm = [hArm1.U, hArm1.D, hArm1.L, hArm1.R];
    var vRaw = buildRaw(rng, nV, N, hRaw.X[1], vPerm);
    if (!vRaw) return null;
    return { h: hRaw, v: vRaw, nH: nH, nV: nV, N: N };
  }

  // Construiește harta de celule (forma „cruce"). Hub la (4,4) — 4 brațe
  // LINK (L=vest/bloc inițial orizontal, R=est/lanț orizontal, U=nord/bloc
  // inițial vertical, D=sud/lanț vertical), FĂRĂ brațe U/D proprii (spre
  // deosebire de o moară normală). Morile 2..nH (est) și 2..nV (sud) au
  // brațe U/D normale (perpendiculare pe direcția lanțului lor).
  // WIDE_GAP (rundă advisor 2026-08-08): dacă AMBELE brațe cresc (nH>=2 ȘI
  // nV>=2), hop-ul hub->V2 folosește pas 8 (nu 4) — la pas 4 pe ambele axe,
  // brațul liber al morii orizontale 2 (care ajunge la (8,8)) s-ar suprapune
  // EXACT cu brațul liber al morii verticale 2 (care ajunge tot la (8,8)) —
  // valori DIFERITE, generate independent, deci coliziune reală de date, nu
  // doar vizuală. Sub-pasul (op/leaf/marker/rezultat) se scalează UNIFORM
  // (vSub = gap/4) ca toate cele 4 poziții să rămână egal-spațiate.
  function cellsFromRawCruce(hRaw, vRaw, nH, nV) {
    var cells = {},
      equations = [],
      markers = {},
      armCells = {};
    function setNum(r, c, v) {
      cells[key(r, c)] = { kind: "num", value: v };
    }
    function setOp(r, c, op) {
      cells[key(r, c)] = { kind: "op", op: op };
    }
    function setMarker(r, c) {
      markers[key(r, c)] = true;
    }
    function eq(a, b, c, op) {
      equations.push({ cells: [a, b, c], op: op });
    }

    var HR = 4,
      HC = 4;
    setNum(HR, HC, hRaw.X[1]); // == vRaw.X[1] (hub comun, forțat la construcție)
    armCells.hub = {};

    // ---- V: blocul inițial ORIZONTAL (hub.L) — mereu terminal ----
    setNum(HR, HC - 4, hRaw.a0);
    setOp(HR, HC - 3, hRaw.linkOp(0));
    setNum(HR, HC - 2, hRaw.b0);
    setMarker(HR, HC - 1);
    eq(key(HR, HC - 4), key(HR, HC - 2), key(HR, HC), hRaw.linkOp(0));
    armCells.hub.L = key(HR, HC - 3);

    // ---- N: blocul inițial VERTICAL (hub.U) — mereu terminal ----
    setNum(HR - 4, HC, vRaw.a0);
    setOp(HR - 3, HC, vRaw.linkOp(0));
    setNum(HR - 2, HC, vRaw.b0);
    setMarker(HR - 1, HC);
    eq(key(HR - 4, HC), key(HR - 2, HC), key(HR, HC), vRaw.linkOp(0));
    armCells.hub.U = key(HR - 3, HC);

    // ---- E: continuarea ORIZONTALĂ (hub.R) — spre mora 2 sau bloc final ----
    if (nH < 2) {
      setOp(HR, HC + 1, hRaw.linkOp(1));
      setNum(HR, HC + 2, hRaw.bFinal);
      setMarker(HR, HC + 3);
      setNum(HR, HC + 4, hRaw.rFinal);
      eq(key(HR, HC), key(HR, HC + 2), key(HR, HC + 4), hRaw.linkOp(1));
    } else {
      setOp(HR, HC + 1, hRaw.linkOp(1));
      setNum(HR, HC + 2, hRaw.innerB[1]);
      setMarker(HR, HC + 3);
      setNum(HR, HC + 4, hRaw.X[2]);
      eq(key(HR, HC), key(HR, HC + 2), key(HR, HC + 4), hRaw.linkOp(1));
    }
    armCells.hub.R = key(HR, HC + 1);

    // ---- S: continuarea VERTICALĂ (hub.D) — spre mora 2 sau bloc final ----
    var wideGap = nH >= 2 && nV >= 2;
    var vGap1 = wideGap ? 8 : 4;
    var vSub = vGap1 / 4;
    if (nV < 2) {
      setOp(HR + vSub, HC, vRaw.linkOp(1));
      setNum(HR + 2 * vSub, HC, vRaw.bFinal);
      setMarker(HR + 3 * vSub, HC);
      setNum(HR + 4 * vSub, HC, vRaw.rFinal);
      eq(
        key(HR, HC),
        key(HR + 2 * vSub, HC),
        key(HR + 4 * vSub, HC),
        vRaw.linkOp(1),
      );
    } else {
      setOp(HR + vSub, HC, vRaw.linkOp(1));
      setNum(HR + 2 * vSub, HC, vRaw.innerB[1]);
      setMarker(HR + 3 * vSub, HC);
      setNum(HR + 4 * vSub, HC, vRaw.X[2]);
      eq(
        key(HR, HC),
        key(HR + 2 * vSub, HC),
        key(HR + 4 * vSub, HC),
        vRaw.linkOp(1),
      );
    }
    armCells.hub.D = key(HR + vSub, HC);

    // ---- lanț ORIZONTAL, morile 2..nH (spre EST, pas 4, ca la „moara") ----
    for (var i = 2; i <= nH; i++) {
      var c = HC + 4 * (i - 1);
      var hk = "H" + i;
      armCells[hk] = {};
      armCells[hk].L = i === 2 ? armCells.hub.R : armCells["H" + (i - 1)].R;
      setNum(HR - 4, c, hRaw.upLeaf1[i]);
      setOp(HR - 3, c, armOps(hRaw.perm, i).U);
      setNum(HR - 2, c, hRaw.upLeaf2[i]);
      setMarker(HR - 1, c);
      eq(key(HR - 4, c), key(HR - 2, c), key(HR, c), armOps(hRaw.perm, i).U);
      armCells[hk].U = key(HR - 3, c);
      setOp(HR + 1, c, armOps(hRaw.perm, i).D);
      setNum(HR + 2, c, hRaw.downLeaf1[i]);
      setMarker(HR + 3, c);
      setNum(HR + 4, c, hRaw.downLeaf2[i]);
      eq(key(HR, c), key(HR + 2, c), key(HR + 4, c), armOps(hRaw.perm, i).D);
      armCells[hk].D = key(HR + 1, c);
      if (i < nH) {
        setOp(HR, c + 1, hRaw.linkOp(i));
        setNum(HR, c + 2, hRaw.innerB[i]);
        setMarker(HR, c + 3);
        setNum(HR, c + 4, hRaw.X[i + 1]);
        eq(key(HR, c), key(HR, c + 2), key(HR, c + 4), hRaw.linkOp(i));
      } else {
        setOp(HR, c + 1, hRaw.linkOp(nH));
        setNum(HR, c + 2, hRaw.bFinal);
        setMarker(HR, c + 3);
        setNum(HR, c + 4, hRaw.rFinal);
        eq(key(HR, c), key(HR, c + 2), key(HR, c + 4), hRaw.linkOp(nH));
      }
      armCells[hk].R = key(HR, c + 1);
    }

    // ---- lanț VERTICAL, morile 2..nV (spre SUD, pas 4 după primul hop) ----
    var vRowOf2 = HR + vGap1;
    for (var j = 2; j <= nV; j++) {
      var r = j === 2 ? vRowOf2 : vRowOf2 + 4 * (j - 2);
      var vk = "V" + j;
      armCells[vk] = {};
      armCells[vk].L = j === 2 ? armCells.hub.D : armCells["V" + (j - 1)].R;
      // brațele libere ale morilor verticale 2..nV = EST/VEST (nu N/S, ocupate de lanț)
      setNum(r, HC + 4, vRaw.upLeaf1[j]);
      setOp(r, HC + 3, armOps(vRaw.perm, j).U);
      setNum(r, HC + 2, vRaw.upLeaf2[j]);
      setMarker(r, HC + 1);
      eq(key(r, HC + 4), key(r, HC + 2), key(r, HC), armOps(vRaw.perm, j).U);
      armCells[vk].U = key(r, HC + 3);
      setOp(r, HC - 1, armOps(vRaw.perm, j).D);
      setNum(r, HC - 2, vRaw.downLeaf1[j]);
      setMarker(r, HC - 3);
      setNum(r, HC - 4, vRaw.downLeaf2[j]);
      eq(key(r, HC), key(r, HC - 2), key(r, HC - 4), armOps(vRaw.perm, j).D);
      armCells[vk].D = key(r, HC - 1);
      if (j < nV) {
        var rNext = vRowOf2 + 4 * (j - 1);
        setOp(r + 1, HC, vRaw.linkOp(j));
        setNum(r + 2, HC, vRaw.innerB[j]);
        setMarker(r + 3, HC);
        setNum(rNext, HC, vRaw.X[j + 1]);
        eq(key(r, HC), key(r + 2, HC), key(rNext, HC), vRaw.linkOp(j));
      } else {
        setOp(r + 1, HC, vRaw.linkOp(nV));
        setNum(r + 2, HC, vRaw.bFinal);
        setMarker(r + 3, HC);
        setNum(r + 4, HC, vRaw.rFinal);
        eq(key(r, HC), key(r + 2, HC), key(r + 4, HC), vRaw.linkOp(nV));
      }
      armCells[vk].R = key(r + 1, HC);
    }

    var maxR = 0,
      maxC = 0,
      minR = 0,
      minC = 0;
    Object.keys(cells)
      .concat(Object.keys(markers))
      .forEach(function (kk) {
        var parts = kk.split(",");
        var rr = parseInt(parts[0], 10),
          cc = parseInt(parts[1], 10);
        maxR = Math.max(maxR, rr);
        maxC = Math.max(maxC, cc);
        minR = Math.min(minR, rr);
        minC = Math.min(minC, cc);
      });
    if (minR !== 0 || minC !== 0)
      throw new Error(
        "cruce: coordonată negativă neașteptată (" + minR + "," + minC + ")",
      );

    return {
      cells: cells,
      equations: equations,
      markers: markers,
      armCells: armCells,
      rows: maxR + 1,
      cols: maxC + 1,
    };
  }

  // Construiește harta de celule + lista de ecuații din structura brută
  // (forma „moara" — lanț DREPT). Coordonate: coloana centrului morii i =
  // 4*i. Rând spine = 4. Braț SUS = rândurile 0-3 (p,op,q,=) pe coloana
  // centrului. Braț JOS = rândurile 5-8 (op,r,=,s). Coloana 0-3 = blocul
  // inițial (a0,op0,b0,=). `armCells[i]` = {L,R,U,D: opCellKey} — folosit
  // GENERIC de checkItem (nu hardcodează poziții per formă).
  function cellsFromRawMoara(raw) {
    var n = raw.n;
    var cells = {}; // key -> {kind:'num'|'op', value, op}
    var equations = [];
    var armCells = {};

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
      armCells[i] = {};
      armCells[i].L = key(4, c - 3); // = op-ul link-ului DINSPRE moara i-1 (sau bloc inițial)
      // SUS: rând0=p, rând1=op, rând2=q, rând3="=" , rând4=X_i (deja setat)
      setNum(0, c, raw.upLeaf1[i]);
      setOp(1, c, armOps(raw.perm, i).U);
      setNum(2, c, raw.upLeaf2[i]);
      eq(key(0, c), key(2, c), key(4, c), armOps(raw.perm, i).U);
      armCells[i].U = key(1, c);
      // JOS: rând4=X_i, rând5=op, rând6=r, rând7="=", rând8=s
      setOp(5, c, armOps(raw.perm, i).D);
      setNum(6, c, raw.downLeaf1[i]);
      setNum(8, c, raw.downLeaf2[i]);
      eq(key(4, c), key(6, c), key(8, c), armOps(raw.perm, i).D);
      armCells[i].D = key(5, c);

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
      armCells[i].R = key(4, c + 1);
    }

    var cols = 4 * n + 5;
    return {
      cells: cells,
      equations: equations,
      rows: 9,
      cols: cols,
      armCells: armCells,
    };
  }

  // Construiește harta de celule + lista de ecuații din structura brută
  // (forma „zigzag" — ACELAȘI lanț abstract ca „moara", doar EMBEDDING-UL
  // (row,col) diferă). Pentru fiecare moară i: direcția de INTRARE dirIn[i]
  // (=dirOut[i-2] din DIFF, sau E fix la i=1) și de IEȘIRE dirOut[i-1] (index
  // 0-based în array-ul din DIFF) ocupă 2 din cele 4 direcții cardinale;
  // celelalte 2 RĂMASE (ordine canonică N,E,S,V) devin U/D. Fiecare "braț" =
  // 5 poziții (2 operanzi+op+"="+rezultat) plasate de-a lungul direcției
  // sale, pas de 1 celulă — identic geometric cu „moara", doar rotit.
  function cellsFromRawZigzag(raw, dirOut) {
    var n = raw.n;
    var cells = {},
      equations = [],
      markers = {},
      armCells = {};

    function setNum(r, c, v) {
      if (r < 0 || c < 0)
        throw new Error("zigzag: coordonată negativă (" + r + "," + c + ")");
      cells[key(r, c)] = { kind: "num", value: v };
    }
    function setOp(r, c, op) {
      if (r < 0 || c < 0)
        throw new Error("zigzag: coordonată negativă (" + r + "," + c + ")");
      cells[key(r, c)] = { kind: "op", op: op };
    }
    function setMarker(r, c) {
      markers[key(r, c)] = true;
    }
    function eq(cellA, cellB, cellC, op) {
      equations.push({ cells: [cellA, cellB, cellC], op: op });
    }
    // pattern A ("depărtare→centru"): [operand1,op,operand2,"=",centru=rezultat]
    function placeA(center, dir, leaf1, opGlyph, leaf2) {
      var d = DIRV[dir];
      var far = [center[0] + 4 * d[0], center[1] + 4 * d[1]];
      function slot(k) {
        return [far[0] - k * d[0], far[1] - k * d[1]];
      }
      var p0 = slot(0),
        p1 = slot(1),
        p2 = slot(2),
        p3 = slot(3);
      setNum(p0[0], p0[1], leaf1);
      setOp(p1[0], p1[1], opGlyph);
      setNum(p2[0], p2[1], leaf2);
      setMarker(p3[0], p3[1]);
      eq(
        key(p0[0], p0[1]),
        key(p2[0], p2[1]),
        key(center[0], center[1]),
        opGlyph,
      );
      return key(p1[0], p1[1]);
    }
    // pattern B ("centru→depărtare"): [centru=operand1,op,operand2,"=",rezultat]
    function placeB(center, dir, leaf, opGlyph, result) {
      var d = DIRV[dir];
      function slot(k) {
        return [center[0] + k * d[0], center[1] + k * d[1]];
      }
      var p1 = slot(1),
        p2 = slot(2),
        p3 = slot(3),
        p4 = slot(4);
      setOp(p1[0], p1[1], opGlyph);
      setNum(p2[0], p2[1], leaf);
      setMarker(p3[0], p3[1]);
      setNum(p4[0], p4[1], result);
      eq(
        key(center[0], center[1]),
        key(p2[0], p2[1]),
        key(p4[0], p4[1]),
        opGlyph,
      );
      return key(p1[0], p1[1]);
    }

    // centrele X[1..n] + direcția de INTRARE per moară (geometrie pură)
    var centers = { 1: [4, 4] };
    var dirIn = { 1: "E" };
    for (var i = 2; i <= n; i++) {
      var din = dirOut[i - 2];
      dirIn[i] = din;
      var v = DIRV[din];
      centers[i] = [centers[i - 1][0] + 4 * v[0], centers[i - 1][1] + 4 * v[1]];
    }

    // per-moară: centru + brațe U/D (rolurile RĂMASE după L/R)
    for (var m = 1; m <= n; m++) {
      var C = centers[m];
      setNum(C[0], C[1], raw.X[m]);
      var occIn = oppositeDir(dirIn[m]); // direcția ocupată de link-ul de INTRARE
      var occOut = dirOut[m - 1]; // direcția ocupată de link-ul de IEȘIRE
      var free = DIR_ORDER.filter(function (d) {
        return d !== occIn && d !== occOut;
      });
      if (free.length !== 2)
        throw new Error(
          "zigzag: moara " + m + " nu are exact 2 direcții libere",
        );
      armCells[m] = {};
      armCells[m].U = placeA(
        C,
        free[0],
        raw.upLeaf1[m],
        armOps(raw.perm, m).U,
        raw.upLeaf2[m],
      );
      armCells[m].D = placeB(
        C,
        free[1],
        raw.downLeaf1[m],
        armOps(raw.perm, m).D,
        raw.downLeaf2[m],
      );
    }

    // legăturile L/R (coloana vertebrală, cu coturile din `dirOut`)
    armCells[1].L = placeA(
      centers[1],
      oppositeDir(dirIn[1]),
      raw.a0,
      raw.linkOp(0),
      raw.b0,
    );
    for (var j = 1; j <= n; j++) {
      var outDir = dirOut[j - 1];
      if (j < n) {
        armCells[j].R = placeB(
          centers[j],
          outDir,
          raw.innerB[j],
          raw.linkOp(j),
          raw.X[j + 1],
        );
      } else {
        armCells[j].R = placeB(
          centers[j],
          outDir,
          raw.bFinal,
          raw.linkOp(n),
          raw.rFinal,
        );
      }
    }
    for (var k = 2; k <= n; k++) armCells[k].L = armCells[k - 1].R;

    var maxR = 0,
      maxC = 0;
    Object.keys(cells).forEach(function (kk) {
      var parts = kk.split(",");
      maxR = Math.max(maxR, parseInt(parts[0], 10));
      maxC = Math.max(maxC, parseInt(parts[1], 10));
    });
    Object.keys(markers).forEach(function (kk) {
      var parts = kk.split(",");
      maxR = Math.max(maxR, parseInt(parts[0], 10));
      maxC = Math.max(maxC, parseInt(parts[1], 10));
    });

    return {
      cells: cells,
      equations: equations,
      markers: markers,
      armCells: armCells,
      rows: maxR + 1,
      cols: maxC + 1,
    };
  }

  var GEOM = {
    moara: {
      cellsFromRaw: cellsFromRawMoara,
      build: function (rng, band) {
        return buildRaw(rng, band.n, band.N);
      },
      nOf: function (band) {
        return band.n;
      },
    },
    zigzag: {
      cellsFromRaw: function (raw, band) {
        return cellsFromRawZigzag(raw, band.dirOut);
      },
      build: function (rng, band) {
        return buildRaw(rng, band.n, band.N);
      },
      nOf: function (band) {
        return band.n;
      },
    },
  };

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
    var rng = new PyRandom(seed);
    var forma = params.forma;
    if (!forma || forma === "aleator") forma = rng.choice(FORME);
    if (!(forma in DIFF)) throw new Error("formă necunoscută: " + forma);
    var dif = params.dificultate;
    if (!(dif in DIFF[forma]))
      throw new Error("dificultate necunoscută pt " + forma + ": " + dif);
    var band = DIFF[forma][dif];
    var nDisplay = GEOM[forma].nOf(band);

    for (var attempt = 0; attempt < 1500; attempt++) {
      var raw = GEOM[forma].build(rng, band);
      if (!raw) continue;
      var structure = GEOM[forma].cellsFromRaw(raw, band);
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
          forma +
          "|" +
          dif +
          "|N" +
          band.N +
          "|n" +
          nDisplay +
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
          forma: forma,
          dificultate: dif,
          n: nDisplay,
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
      "VERIFICARE EȘUATĂ: nu am generat o integramă UNICĂ pentru " +
        forma +
        "/" +
        dif,
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

  function trackSizes(count) {
    // alternanță 14mm(num/centru)/8mm(op/marker) — verificată identică cu
    // șirul fix folosit de „moara" (14 8 14 8 ... pt 9 rânduri).
    var out = [];
    for (var i = 0; i < count; i++) out.push(i % 2 === 0 ? "14mm" : "8mm");
    return out.join(" ");
  }

  function gridHtml(item, mode) {
    var st = item.structure;
    var forma = item.forma || "moara";
    var out = [];
    for (var r = 0; r < st.rows; r++) {
      for (var c = 0; c < st.cols; c++) {
        var k = key(r, c);
        if (st.cells[k]) {
          out.push(cellHtml(item, r, c, mode));
        } else if (
          forma === "moara" ? isEqPosition(item, r, c) : st.markers[k]
        ) {
          out.push(eqMarkerHtml(item, r, c));
        } else {
          out.push('<div class="ig-cell ig-x"></div>');
        }
      }
    }
    var cls = "ig-grid" + (mode === "answer" ? " show-solution" : "");
    var style =
      forma !== "moara"
        ? "grid-template-columns:" +
          trackSizes(st.cols) +
          ";grid-template-rows:" +
          trackSizes(st.rows) +
          ";"
        : "grid-template-columns:repeat(" +
          st.cols +
          "," +
          DIFF.moara[item.dificultate].cellMM +
          "mm);";
    return (
      '<div class="' +
      cls +
      '" data-forma="' +
      forma +
      '" data-dif="' +
      item.dificultate +
      '" data-rows="' +
      st.rows +
      '" data-cols="' +
      st.cols +
      '" style="' +
      style +
      '">' +
      out.join("") +
      "</div>"
    );
  }

  // poziții "=" cunoscute prin construcție (DOAR „moara"): col3 (bloc
  // inițial) pe rândul 4; col 4*i+3 pt fiecare i=1..n pe rândul 4; și col
  // fixă pe rândurile 3/7 pt fiecare centru (brațele verticale). „zigzag"
  // folosește `structure.markers` (calculat direct de cellsFromRawZigzag).
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

  // ---------- geometrie ecuațiilor, re-derivată INDEPENDENT de cellsFromRaw* ----------
  // (folosită DOAR la round-trip-ul HTML — nu apelează cellsFromRaw*/`structure`,
  // doar reimplementează convenția de poziționare documentată în antet).
  // „moara": centrul morii i e la coloana 4*i; rândul 4 = coloana vertebrală;
  // brațul SUS = rândurile 0-3; brațul JOS = rândurile 5-8 (aceeași coloană).
  function equationLayoutMoara(n) {
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

  // „zigzag": aceeași convenție geometrică ca `cellsFromRawZigzag` (centre +
  // direcții din `dirOut`), REIMPLEMENTATĂ independent (fără a apela funcția
  // de construcție). Ordinea push-urilor trebuie să coincidă EXACT cu
  // `cellsFromRawZigzag`: U/D per moară (m=1..n), apoi link-ul inițial (L),
  // apoi link-urile R (j=1..n) — verificat de checkItem poziție-cu-poziție.
  function equationLayoutZigzag(n, dirOut) {
    function slotsA(center, dir) {
      var d = DIRV[dir];
      var far = [center[0] + 4 * d[0], center[1] + 4 * d[1]];
      return {
        p0: far,
        p1: [far[0] - d[0], far[1] - d[1]],
        p2: [far[0] - 2 * d[0], far[1] - 2 * d[1]],
      };
    }
    function slotsB(center, dir) {
      var d = DIRV[dir];
      return {
        p1: [center[0] + d[0], center[1] + d[1]],
        p2: [center[0] + 2 * d[0], center[1] + 2 * d[1]],
        p4: [center[0] + 4 * d[0], center[1] + 4 * d[1]],
      };
    }
    var centers = { 1: [4, 4] };
    var dirIn = { 1: "E" };
    for (var i = 2; i <= n; i++) {
      var din = dirOut[i - 2];
      dirIn[i] = din;
      var v = DIRV[din];
      centers[i] = [centers[i - 1][0] + 4 * v[0], centers[i - 1][1] + 4 * v[1]];
    }
    var eqs = [];
    for (var m = 1; m <= n; m++) {
      var C = centers[m];
      var occIn = oppositeDir(dirIn[m]);
      var occOut = dirOut[m - 1];
      var free = DIR_ORDER.filter(function (d) {
        return d !== occIn && d !== occOut;
      });
      var sU = slotsA(C, free[0]);
      eqs.push({
        cells: [
          key(sU.p0[0], sU.p0[1]),
          key(sU.p2[0], sU.p2[1]),
          key(C[0], C[1]),
        ],
        opCell: key(sU.p1[0], sU.p1[1]),
      });
      var sD = slotsB(C, free[1]);
      eqs.push({
        cells: [
          key(C[0], C[1]),
          key(sD.p2[0], sD.p2[1]),
          key(sD.p4[0], sD.p4[1]),
        ],
        opCell: key(sD.p1[0], sD.p1[1]),
      });
    }
    var sA1 = slotsA(centers[1], oppositeDir(dirIn[1]));
    eqs.push({
      cells: [
        key(sA1.p0[0], sA1.p0[1]),
        key(sA1.p2[0], sA1.p2[1]),
        key(centers[1][0], centers[1][1]),
      ],
      opCell: key(sA1.p1[0], sA1.p1[1]),
    });
    for (var j = 1; j <= n; j++) {
      var outDir = dirOut[j - 1];
      var sR = slotsB(centers[j], outDir);
      eqs.push({
        cells: [
          key(centers[j][0], centers[j][1]),
          key(sR.p2[0], sR.p2[1]),
          key(sR.p4[0], sR.p4[1]),
        ],
        opCell: key(sR.p1[0], sR.p1[1]),
      });
    }
    return eqs;
  }

  GEOM.moara.equationLayout = function (n) {
    return equationLayoutMoara(n);
  };
  GEOM.zigzag.equationLayout = function (n, band) {
    return equationLayoutZigzag(n, band.dirOut);
  };

  // „cruce": aceeași convenție geometrică ca `cellsFromRawCruce`,
  // REIMPLEMENTATĂ independent (fără a apela funcția de construcție).
  // Ordinea push-urilor trebuie să coincidă EXACT: W,N,E,S (hub), apoi
  // U/D/R per moară orizontală 2..nH, apoi U/D/R per moară verticală 2..nV.
  function equationLayoutCruce(nH, nV) {
    var HR = 4,
      HC = 4;
    var eqs = [];
    // W (hub.L)
    eqs.push({
      cells: [key(HR, HC - 4), key(HR, HC - 2), key(HR, HC)],
      opCell: key(HR, HC - 3),
    });
    // N (hub.U)
    eqs.push({
      cells: [key(HR - 4, HC), key(HR - 2, HC), key(HR, HC)],
      opCell: key(HR - 3, HC),
    });
    // E (hub.R)
    eqs.push({
      cells: [key(HR, HC), key(HR, HC + 2), key(HR, HC + 4)],
      opCell: key(HR, HC + 1),
    });
    // S (hub.D)
    var wideGap = nH >= 2 && nV >= 2;
    var vGap1 = wideGap ? 8 : 4;
    var vSub = vGap1 / 4;
    eqs.push({
      cells: [key(HR, HC), key(HR + 2 * vSub, HC), key(HR + 4 * vSub, HC)],
      opCell: key(HR + vSub, HC),
    });
    // orizontal, morile 2..nH
    for (var i = 2; i <= nH; i++) {
      var c = HC + 4 * (i - 1);
      eqs.push({
        cells: [key(HR - 4, c), key(HR - 2, c), key(HR, c)],
        opCell: key(HR - 3, c),
      });
      eqs.push({
        cells: [key(HR, c), key(HR + 2, c), key(HR + 4, c)],
        opCell: key(HR + 1, c),
      });
      eqs.push({
        cells: [key(HR, c), key(HR, c + 2), key(HR, c + 4)],
        opCell: key(HR, c + 1),
      });
    }
    // vertical, morile 2..nV
    var vRowOf2 = HR + vGap1;
    for (var j = 2; j <= nV; j++) {
      var r = j === 2 ? vRowOf2 : vRowOf2 + 4 * (j - 2);
      eqs.push({
        cells: [key(r, HC + 4), key(r, HC + 2), key(r, HC)],
        opCell: key(r, HC + 3),
      });
      eqs.push({
        cells: [key(r, HC), key(r, HC - 2), key(r, HC - 4)],
        opCell: key(r, HC - 1),
      });
      var rNext = j < nV ? vRowOf2 + 4 * (j - 1) : r + 4;
      eqs.push({
        cells: [key(r, HC), key(r + 2, HC), key(rNext, HC)],
        opCell: key(r + 1, HC),
      });
    }
    return eqs;
  }
  GEOM.cruce = {
    cellsFromRaw: function (raw, band) {
      return cellsFromRawCruce(raw.h, raw.v, band.nH, band.nV);
    },
    equationLayout: function (n, band) {
      return equationLayoutCruce(band.nH, band.nV);
    },
    build: function (rng, band) {
      return buildRawCruce(rng, band.nH, band.nV, band.N);
    },
    nOf: function (band) {
      return band.nH + band.nV - 1;
    },
  };

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
  // forma/dif/rows/cols se citesc din atributele `data-*` TIPĂRITE pe grilă
  // (declarate, ca domeniul N din text) — NU inferate din structura internă.
  // Ecuațiile se reconstruiesc din `GEOM[forma].equationLayout` + glifele
  // PARSATE — nu din `st`.
  function parsePuzzleHtml(html) {
    var gridMatch = html.match(
      /<div class="ig-grid[^"]*" data-forma="([^"]*)" data-dif="([^"]*)" data-rows="(\d+)" data-cols="(\d+)"/,
    );
    if (!gridMatch)
      throw new Error(
        "nu am găsit atributele grilei (data-forma/dif/rows/cols) în HTML",
      );
    var forma = gridMatch[1];
    var dif = gridMatch[2];
    var ROWS = parseInt(gridMatch[3], 10);
    var cols = parseInt(gridMatch[4], 10);
    if (!(forma in DIFF) || !(dif in DIFF[forma]))
      throw new Error(
        "formă/dificultate tipărite necunoscute: " + forma + "/" + dif,
      );
    var band = DIFF[forma][dif];

    var re = /<div class="ig-cell([^"]*)">([^<]*)<\/div>/g;
    var cellsFlat = [],
      m;
    while ((m = re.exec(html))) cellsFlat.push({ cls: m[1], txt: m[2].trim() });
    if (cellsFlat.length !== ROWS * cols)
      throw new Error(
        "nr celule parsate " +
          cellsFlat.length +
          " != rows*cols declarat (" +
          ROWS +
          "*" +
          cols +
          "=" +
          ROWS * cols +
          ")",
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
    var eqPositions = GEOM[forma].equationLayout(GEOM[forma].nOf(band), band);
    var equations = eqPositions.map(function (eqPos) {
      var op = parsedOp[eqPos.opCell];
      if (!op) throw new Error("operator lipsă/nedetectat la " + eqPos.opCell);
      return { cells: eqPos.cells, op: op };
    });
    return {
      N: N,
      n: GEOM[forma].nOf(band),
      forma: forma,
      dificultate: dif,
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
    // 2b) fiecare moară are toate 4 operațiile distincte pe cele 4 brațe
    // (L,R,U,D) — generic pe `st.armCells` (populat de cellsFromRaw*, NU
    // hardcodează poziții per formă).
    Object.keys(st.armCells).forEach(function (i) {
      var arm = st.armCells[i];
      var ops = ["L", "R", "U", "D"].map(function (role) {
        return st.cells[arm[role]].op;
      });
      var setArm = {};
      ops.forEach(function (o) {
        setArm[o] = true;
      });
      if (Object.keys(setArm).length !== 4)
        throw new Error(
          "moara " + i + " nu are 4 operații distincte: " + ops.join(","),
        );
    });

    // 3) nr ascunse == țintă
    var band3 = DIFF[item.forma][item.dificultate];
    if (item.nrAscunse !== band3.hide)
      throw new Error(
        "nr ascunse " + item.nrAscunse + " != țintă " + band3.hide,
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
    if (p.forma !== item.forma)
      throw new Error("formă tipărită " + p.forma + " != " + item.forma);
    if (p.dificultate !== item.dificultate)
      throw new Error(
        "dificultate tipărită " + p.dificultate + " != " + item.dificultate,
      );
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

    // -1) invariant „cruce": nicio bandă de dificultate nu are nH>=2 ȘI
    // nV>=2 simultan (ar declanșa WIDE_GAP -> ecuație verticală cu goluri la
    // print, respins la eyeball 2026-08-08). Asertat AICI (nu doar în cod)
    // ca o modificare viitoare a DIFF.cruce să nu strice tăcut vizualul.
    try {
      for (var dc in DIFF.cruce) {
        var bc = DIFF.cruce[dc];
        if (bc.nH >= 2 && bc.nV >= 2)
          throw new Error(
            "cruce/" +
              dc +
              " are nH=" +
              bc.nH +
              " ȘI nV=" +
              bc.nV +
              " (ambele >=2) -> declanșează WIDE_GAP, respins la eyeball",
          );
      }
      detalii.push(
        "[OK] invariant cruce — nicio dificultate nu crește ambele brațe simultan",
      );
    } catch (e) {
      fail(e.message);
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

    // 1) fiecare FORMĂ × dificultate × mai multe seed-uri: unic + round-trip
    //    (poziție ȘI glif) + nr ascunse + determinism
    FORME.forEach(function (forma) {
      for (var dif in DIFF[forma]) {
        var seeds = 24;
        var okCount = 0,
          hitTarget = 0;
        var firstErr = null;
        var allOpsSeen = {};
        for (var seed = 0; seed < seeds; seed++) {
          try {
            var it = buildOne({ forma: forma, dificultate: dif }, seed);
            checkItem(it);
            var it2 = buildOne({ forma: forma, dificultate: dif }, seed);
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
            if (it.nrAscunse === DIFF[forma][dif].hide) hitTarget++;
            okCount++;
          } catch (e) {
            if (!firstErr) firstErr = "seed=" + seed + ": " + e.message;
          }
        }
        var tag = forma + "/" + dif;
        if (okCount !== seeds)
          fail(
            tag + " — " + okCount + "/" + seeds + " OK; primul: " + firstErr,
          );
        else if (hitTarget !== seeds)
          fail(
            tag + " — nr ascunse a atins ținta doar " + hitTarget + "/" + seeds,
          );
        else if (Object.keys(allOpsSeen).length !== 4)
          fail(
            tag +
              " — nu toate 4 operațiile au apărut în " +
              seeds +
              " seed-uri",
          );
        else
          detalii.push(
            "[OK] " +
              tag +
              " x" +
              seeds +
              " seed-uri -> soluție UNICĂ, round-trip HTML (poziție+glif), " +
              DIFF[forma][dif].hide +
              " ascunse, determinist, toate 4 operațiile prezente",
          );
      }
    });

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
    FORME: FORME,
    FORM_LABELS: FORM_LABELS,
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
