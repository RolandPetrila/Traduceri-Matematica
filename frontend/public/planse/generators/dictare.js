/* dictare.js — generator „Dictare grafică" (graphical dictation on a grid).
 * Contract §5 (ca uneste.js / cautare.js):
 *   buildOne(params, seed) -> item
 *   render(item, mm?) -> { pages:[puzzle, answer], css, interactive, interactiveCss }
 *   renderPages(item, nr, total, mm?) -> { puzzle, answer }
 *   selftest() -> { ok, detalii }
 *   signature(item) -> string
 *
 * Copilul pornește dintr-un punct marcat pe grilă și urmează pași cardinali
 * („3 căsuțe jos ↓", „2 căsuțe dreapta →", …), desenând linia pe liniile grilei;
 * la final apare o formă. Conturul = poligon RECTILINIU închis (doar N/S/E/V).
 *
 * Catalog de FORME = liste de mișcări [direcție, nr căsuțe] pe o grilă întreagă.
 * Din mișcări se calculează vârfurile; din vârfuri se derivă PAȘII afișați. Astfel
 * „pașii reproduc conturul" e o proprietate structurală, iar selftest-ul o verifică
 * (inclusiv un check invers pe textul VIZIBIL al pasului → prinde o hartă de etichete
 * inversată, singurul bug pe care invarianții geometrici nu-l văd).
 *
 * Dificultatea folosește AMBELE pârghii (cerința: „mărime grilă + nr pași"):
 *   Ușor = grilă mică + forme cu puțini pași; Greu = grilă mare + forme complexe.
 * Fără solver (exercițiul e determinist: conturul e dat). RNG seedabil doar pentru
 * alegerea formei la „Amestecat" (același seed → aceeași planșă).
 *
 * Convenție coordonate: (col, row), row crește ÎN JOS (ca SVG). Deci D=[0,+1]="jos".
 */
(function (root) {
  "use strict";

  var PyRandom = root.PlansePRNG.PyRandom;
  var Sig = root.PlanseSig;

  // Mișcare = [direcție, nr căsuțe]. Direcții: R/L (dreapta/stânga), U/D (sus/jos).
  var DELTA = { R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1] };
  // Eticheta VIZIBILĂ a direcției (cu săgeată). E textul tipărit pe planșă ȘI cel
  // verificat de selftest — dacă o inversezi aici, selftest #reverse-label pică.
  var LABEL = { R: "dreapta →", L: "stânga ←", U: "sus ↑", D: "jos ↓" };

  // Benzi de dificultate: grilă de bază + interval de nr de pași (fără suprapunere,
  // ca Greu ≠ Standard). Grila crește automat dacă o formă e mai mare (vezi buildOne).
  var DIFF = {
    Usor: { grid: 10, minSteps: 4, maxSteps: 8 },
    Standard: { grid: 13, minSteps: 9, maxSteps: 13 },
    Greu: { grid: 16, minSteps: 14, maxSteps: 99 },
  };

  // --- Catalog de forme rectilinii (mișcări închise; verificate de selftest) -----
  var SHAPES = {
    // Ușor (4–8 pași)
    patrat: {
      label: "Pătrat",
      moves: [
        ["R", 5],
        ["D", 5],
        ["L", 5],
        ["U", 5],
      ],
    },
    litera_l: {
      label: "Litera L",
      moves: [
        ["D", 6],
        ["R", 4],
        ["U", 2],
        ["L", 2],
        ["U", 4],
        ["L", 2],
      ],
    },
    scari: {
      label: "Scări",
      moves: [
        ["D", 3],
        ["R", 1],
        ["U", 1],
        ["R", 1],
        ["U", 1],
        ["R", 1],
        ["U", 1],
        ["L", 3],
      ],
    },
    litera_t: {
      label: "Litera T",
      moves: [
        ["R", 6],
        ["D", 2],
        ["L", 2],
        ["D", 4],
        ["L", 2],
        ["U", 4],
        ["L", 2],
        ["U", 2],
      ],
    },
    cupa: {
      label: "Cupă (U)",
      moves: [
        ["D", 6],
        ["R", 6],
        ["U", 6],
        ["L", 2],
        ["D", 4],
        ["L", 2],
        ["U", 4],
        ["L", 2],
      ],
    },
    casa: {
      label: "Casă",
      moves: [
        ["U", 8],
        ["R", 2],
        ["U", 2],
        ["R", 4],
        ["D", 2],
        ["R", 2],
        ["D", 8],
        ["L", 8],
      ],
    },

    // Standard (9–13 pași)
    cruce: {
      label: "Cruce (+)",
      moves: [
        ["R", 2],
        ["D", 2],
        ["R", 2],
        ["D", 2],
        ["L", 2],
        ["D", 2],
        ["L", 2],
        ["U", 2],
        ["L", 2],
        ["U", 2],
        ["R", 2],
        ["U", 2],
      ],
    },
    cruce_mare: {
      label: "Cruce mare",
      moves: [
        ["R", 3],
        ["D", 3],
        ["R", 3],
        ["D", 3],
        ["L", 3],
        ["D", 3],
        ["L", 3],
        ["U", 3],
        ["L", 3],
        ["U", 3],
        ["R", 3],
        ["U", 3],
      ],
    },
    litera_h: {
      label: "Litera H",
      moves: [
        ["D", 6],
        ["R", 2],
        ["U", 2],
        ["R", 2],
        ["D", 2],
        ["R", 2],
        ["U", 6],
        ["L", 2],
        ["D", 2],
        ["L", 2],
        ["U", 2],
        ["L", 2],
      ],
    },
    litera_i: {
      label: "Litera I",
      moves: [
        ["R", 6],
        ["D", 2],
        ["L", 2],
        ["D", 2],
        ["R", 2],
        ["D", 2],
        ["L", 6],
        ["U", 2],
        ["R", 2],
        ["U", 2],
        ["L", 2],
        ["U", 2],
      ],
    },
    litera_e: {
      label: "Litera E",
      moves: [
        ["R", 5],
        ["D", 2],
        ["L", 3],
        ["D", 1],
        ["R", 3],
        ["D", 2],
        ["L", 3],
        ["D", 1],
        ["R", 3],
        ["D", 2],
        ["L", 5],
        ["U", 8],
      ],
    },
    munte: {
      label: "Munte",
      moves: [
        ["U", 2],
        ["R", 2],
        ["U", 2],
        ["R", 2],
        ["U", 2],
        ["R", 2],
        ["D", 2],
        ["R", 2],
        ["D", 2],
        ["R", 2],
        ["D", 2],
        ["L", 10],
      ],
    },
    robot: {
      label: "Robot",
      moves: [
        ["R", 4],
        ["D", 4],
        ["R", 1],
        ["D", 7],
        ["L", 2],
        ["U", 2],
        ["L", 2],
        ["D", 2],
        ["L", 2],
        ["U", 7],
        ["R", 1],
        ["U", 4],
      ],
    },

    // Greu (14+ pași)
    coroana: {
      label: "Coroană",
      moves: [
        ["U", 6],
        ["R", 2],
        ["D", 3],
        ["R", 2],
        ["U", 3],
        ["R", 2],
        ["D", 3],
        ["R", 2],
        ["U", 3],
        ["R", 2],
        ["D", 3],
        ["R", 2],
        ["U", 3],
        ["R", 2],
        ["D", 6],
        ["L", 14],
      ],
    },
    cetate: {
      label: "Cetate",
      moves: [
        ["R", 2],
        ["D", 2],
        ["R", 2],
        ["U", 2],
        ["R", 2],
        ["D", 2],
        ["R", 2],
        ["U", 2],
        ["R", 2],
        ["D", 2],
        ["R", 2],
        ["U", 2],
        ["R", 2],
        ["D", 6],
        ["L", 14],
        ["U", 6],
      ],
    },
    munte_mare: {
      label: "Munte mare",
      moves: [
        ["U", 2],
        ["R", 2],
        ["U", 2],
        ["R", 2],
        ["U", 2],
        ["R", 2],
        ["U", 2],
        ["R", 2],
        ["D", 2],
        ["R", 2],
        ["D", 2],
        ["R", 2],
        ["D", 2],
        ["R", 2],
        ["D", 2],
        ["L", 14],
      ],
    },
    scara_mare: {
      label: "Scări mari",
      moves: [
        ["D", 8],
        ["R", 1],
        ["U", 1],
        ["R", 1],
        ["U", 1],
        ["R", 1],
        ["U", 1],
        ["R", 1],
        ["U", 1],
        ["R", 1],
        ["U", 1],
        ["R", 1],
        ["U", 1],
        ["R", 1],
        ["U", 1],
        ["R", 1],
        ["U", 1],
        ["L", 8],
      ],
    },
  };
  var SHAPE_IDS = Object.keys(SHAPES);

  // Precalcul: vârfuri (din origine), bbox, nr pași. Se face o dată la încărcare.
  function rawWalk(moves) {
    var verts = [[0, 0]];
    var col = 0,
      row = 0;
    for (var i = 0; i < moves.length; i++) {
      var d = DELTA[moves[i][0]];
      if (!d) throw new Error("direcție necunoscută: " + moves[i][0]);
      var cnt = moves[i][1];
      if (!(cnt >= 1)) throw new Error("nr căsuțe invalid: " + cnt);
      col += d[0] * cnt;
      row += d[1] * cnt;
      verts.push([col, row]);
    }
    var xs = verts.map(function (p) {
        return p[0];
      }),
      ys = verts.map(function (p) {
        return p[1];
      });
    var minCol = Math.min.apply(null, xs),
      maxCol = Math.max.apply(null, xs);
    var minRow = Math.min.apply(null, ys),
      maxRow = Math.max.apply(null, ys);
    return {
      verts: verts,
      minCol: minCol,
      minRow: minRow,
      w: maxCol - minCol,
      h: maxRow - minRow,
      steps: moves.length,
    };
  }

  (function precompute() {
    for (var i = 0; i < SHAPE_IDS.length; i++) {
      var sh = SHAPES[SHAPE_IDS[i]];
      var r = rawWalk(sh.moves);
      sh._verts = r.verts;
      sh._minCol = r.minCol;
      sh._minRow = r.minRow;
      sh._w = r.w;
      sh._h = r.h;
      sh._steps = r.steps;
    }
  })();

  // Formele eligibile la o dificultate pentru „Amestecat": nr pași în banda ei.
  function eligibleFor(dif) {
    var band = DIFF[dif];
    return SHAPE_IDS.filter(function (id) {
      var s = SHAPES[id]._steps;
      return s >= band.minSteps && s <= band.maxSteps;
    });
  }

  function buildOne(params, seed) {
    var dif = params.dificultate;
    if (!(dif in DIFF)) throw new Error("dificultate necunoscută: " + dif);
    var band = DIFF[dif];
    var rng = new PyRandom(seed);

    var forma = params.forma;
    if (!forma || forma === "aleator") {
      var elig = eligibleFor(dif);
      if (!elig.length) throw new Error("nicio formă eligibilă la " + dif);
      forma = rng.choice(elig);
    }
    if (!(forma in SHAPES)) throw new Error("formă necunoscută: " + forma);
    var sh = SHAPES[forma];

    // Grila crește ca să încapă forma (cu 1 căsuță margine pe fiecare latură).
    var grid = Math.max(band.grid, sh._w + 2, sh._h + 2);
    var ox = -sh._minCol + Math.floor((grid - sh._w) / 2);
    var oy = -sh._minRow + Math.floor((grid - sh._h) / 2);
    var verts = sh._verts.map(function (p) {
      return [p[0] + ox, p[1] + oy];
    });

    // Pașii AFIȘAȚI se derivă din vârfuri (nu din mișcările brute) — așa selftest-ul
    // verifică o proprietate reală: fiecare latură e pur cardinală, lungime ≥ 1.
    var steps = [];
    for (var i = 0; i < verts.length - 1; i++) {
      var dc = verts[i + 1][0] - verts[i][0];
      var dr = verts[i + 1][1] - verts[i][1];
      var dir, len;
      if (dc !== 0 && dr === 0) {
        dir = dc > 0 ? "R" : "L";
        len = Math.abs(dc);
      } else if (dr !== 0 && dc === 0) {
        dir = dr > 0 ? "D" : "U";
        len = Math.abs(dr);
      } else {
        throw new Error("latură necardinală în " + forma + " la pasul " + i);
      }
      steps.push({ dir: dir, len: len, label: LABEL[dir] });
    }

    return {
      tip: "dictare",
      forma: forma,
      formaLabel: sh.label,
      dificultate: dif,
      grid: grid,
      verts: verts,
      start: verts[0],
      steps: steps,
      nrPasi: steps.length,
      seed: seed,
      semnatura: Sig.md5("dictare|" + forma + "|" + dif).slice(0, 12),
    };
  }

  function signature(item) {
    return item.semnatura;
  }

  // ---------- RANDARE (SVG grilă + traseu ascuns până la .show-solution) ----------
  function f(x) {
    return Math.round(x * 100) / 100;
  }

  function svgHtml(item) {
    var n = item.grid;
    var g = [];
    // linii grilă
    for (var k = 0; k <= n; k++) {
      g.push(
        '<line class="gl" x1="' +
          k +
          '" y1="0" x2="' +
          k +
          '" y2="' +
          n +
          '"/>',
      );
      g.push(
        '<line class="gl" x1="0" y1="' +
          k +
          '" x2="' +
          n +
          '" y2="' +
          k +
          '"/>',
      );
    }
    // chenar
    g.push(
      '<rect class="frame" x="0" y="0" width="' + n + '" height="' + n + '"/>',
    );
    // traseu-soluție (ascuns până la .show-solution)
    var pts = item.verts
      .map(function (p) {
        return f(p[0]) + "," + f(p[1]);
      })
      .join(" ");
    g.push('<polyline class="sol-line" points="' + pts + '"/>');
    // punct de start (mereu vizibil)
    g.push(
      '<circle class="start-dot" cx="' +
        f(item.start[0]) +
        '" cy="' +
        f(item.start[1]) +
        '" r="0.28"/>',
    );
    var pad = 0.6;
    return (
      '<svg viewBox="' +
      -pad +
      " " +
      -pad +
      " " +
      (n + 2 * pad) +
      " " +
      (n + 2 * pad) +
      '" class="dict-svg" preserveAspectRatio="xMidYMid meet">' +
      g.join("") +
      "</svg>"
    );
  }

  function stepsHtml(item) {
    var lis = item.steps
      .map(function (s) {
        return (
          "<li>" +
          s.len +
          " " +
          (s.len === 1 ? "căsuță" : "căsuțe") +
          " " +
          s.label +
          "</li>"
        );
      })
      .join("");
    return '<ol class="dict-steps">' + lis + "</ol>";
  }

  function paginaPrint(item, nr, total, raspuns) {
    var clasa = raspuns ? "page-a4 pagina-raspuns" : "page-a4";
    var gridTxt = item.grid + "×" + item.grid;
    var antet, corp;
    if (raspuns) {
      antet =
        '<div class="header-title">Răspuns &mdash; Dictare ' + nr + "</div>";
      corp =
        '<div class="nota-parinte">Pentru părinte &mdash; nu se printează. Forma completă: <b>' +
        item.formaLabel +
        "</b>.</div>" +
        '<div class="exercise-block"><div class="dict-draw show-solution">' +
        svgHtml(item) +
        "</div></div>";
    } else {
      antet =
        '<div class="header-title">Dictare grafică</div>' +
        '<div class="header-fields"><div>Nume: ____________</div><div>Data: __________</div></div>';
      corp =
        '<div class="subtitlu">Pornește de la punctul negru (&#9679;) și desenează linia urmând pașii pe liniile grilei. Ce formă apare? &bull; ' +
        item.dificultate +
        " &bull; grilă " +
        gridTxt +
        " &bull; Planșă " +
        nr +
        "/" +
        total +
        "</div>" +
        stepsHtml(item) +
        '<div class="exercise-block"><div class="dict-draw">' +
        svgHtml(item) +
        "</div></div>";
    }
    return (
      '<div class="' +
      clasa +
      '">\n  <div class="header-row">' +
      antet +
      "</div>\n  " +
      corp +
      "\n</div>"
    );
  }

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
    "  .header-row { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4mm; }\n" +
    "  .header-title { font-size:1.6rem; font-weight:bold; }\n" +
    "  .header-fields { display:flex; gap:20px; font-size:1.05rem; }\n" +
    "  .subtitlu { font-size:1.02rem; color:#333; margin-bottom:4mm; }\n" +
    "  .nota-parinte { font-size:0.95rem; color:#333; margin-bottom:6mm; font-style:italic; }\n" +
    "  .dict-steps { columns:3; column-gap:10mm; margin:0 0 5mm 6mm; font-size:1.05rem; line-height:1.5; }\n" +
    "  .dict-steps li { break-inside:avoid; }\n" +
    "  .exercise-block { flex-grow:1; display:flex; align-items:flex-start; justify-content:center; }\n" +
    "  .dict-draw { width:150mm; max-width:100%; }\n" +
    "  .dict-svg { display:block; width:100%; height:auto; }\n" +
    "  .dict-svg .gl { stroke:#c8c8c8; stroke-width:0.03; }\n" +
    "  .dict-svg .frame { fill:none; stroke:#444; stroke-width:0.07; }\n" +
    "  .dict-svg .start-dot { fill:#111; }\n" +
    "  .dict-svg .sol-line { fill:none; stroke:#1a7a3a; stroke-width:0.16; stroke-linejoin:round; stroke-linecap:round; display:none; }\n" +
    "  .dict-draw.show-solution .sol-line { display:inline; }";

  var INTERACTIVE_CSS =
    ".dict-sheet { background:#fff; color:#111; border-radius:10px; padding:16px; margin:0 auto; max-width:100%; font-family:'Patrick Hand', ui-rounded, 'Segoe UI', system-ui, sans-serif; }\n" +
    ".dict-sheet .dict-head { display:flex; justify-content:space-between; align-items:baseline; font-weight:bold; margin-bottom:6px; }\n" +
    ".dict-sheet .dict-sub { font-size:0.9rem; color:#333; margin-bottom:10px; }\n" +
    ".dict-sheet .dict-steps { columns:3; column-gap:16px; margin:0 0 12px 18px; font-size:0.95rem; line-height:1.5; }\n" +
    ".dict-sheet .dict-steps li { break-inside:avoid; }\n" +
    ".dict-sheet .dict-draw { width:min(440px,100%); margin:0 auto; }\n" +
    ".dict-sheet .dict-svg { display:block; width:100%; height:auto; }\n" +
    ".dict-sheet .dict-svg .gl { stroke:#c8c8c8; stroke-width:0.03; }\n" +
    ".dict-sheet .dict-svg .frame { fill:none; stroke:#444; stroke-width:0.07; }\n" +
    ".dict-sheet .dict-svg .start-dot { fill:#111; }\n" +
    ".dict-sheet .dict-svg .sol-line { fill:none; stroke:#1a7a3a; stroke-width:0.16; stroke-linejoin:round; stroke-linecap:round; display:none; }\n" +
    ".dict-sheet .dict-draw.show-solution .sol-line { display:inline; }";

  function renderPages(item, nr, total) {
    return {
      puzzle: paginaPrint(item, nr, total, false),
      answer: paginaPrint(item, nr, total, true),
    };
  }

  function render(item) {
    var pg = renderPages(item, 1, 1);
    var interactive =
      '<div class="dict-sheet">' +
      '<div class="dict-head"><span>Dictare grafică &bull; ' +
      item.formaLabel +
      " &bull; " +
      item.dificultate +
      " &bull; grilă " +
      item.grid +
      "×" +
      item.grid +
      "</span></div>" +
      '<div class="dict-sub">Pornește de la punctul negru și urmează pașii pe liniile grilei.</div>' +
      stepsHtml(item) +
      '<div class="dict-draw">' +
      svgHtml(item) +
      "</div></div>";
    return {
      pages: [pg.puzzle, pg.answer],
      css: PRINT_CSS,
      interactive: interactive,
      interactiveCss: INTERACTIVE_CSS,
    };
  }

  // ---------- SELFTEST (invarianți) ----------
  // Hartă INVERSĂ scrisă independent, din textul VIZIBIL al pasului → deltă.
  // Dacă LABEL (harta directă) e inversată, walk-ul de mai jos NU va reproduce
  // conturul → FAIL. E singurul check care discriminează generatorul corect de
  // unul „plauzibil" (invarianții geometrici nu văd o etichetă greșită).
  var REV_LABEL = {
    "dreapta →": [1, 0],
    "stânga ←": [-1, 0],
    "sus ↑": [0, -1],
    "jos ↓": [0, 1],
  };

  // Intersecție de segmente (inclusiv atingere) — pentru poligon simplu.
  function onSeg(p, q, r) {
    return (
      Math.min(p[0], r[0]) <= q[0] &&
      q[0] <= Math.max(p[0], r[0]) &&
      Math.min(p[1], r[1]) <= q[1] &&
      q[1] <= Math.max(p[1], r[1])
    );
  }
  function orient(p, q, r) {
    var v = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    return v > 0 ? 1 : v < 0 ? 2 : 0;
  }
  function segIntersect(p1, p2, p3, p4) {
    var o1 = orient(p1, p2, p3),
      o2 = orient(p1, p2, p4),
      o3 = orient(p3, p4, p1),
      o4 = orient(p3, p4, p2);
    if (o1 !== o2 && o3 !== o4) return true;
    if (o1 === 0 && onSeg(p1, p3, p2)) return true;
    if (o2 === 0 && onSeg(p1, p4, p2)) return true;
    if (o3 === 0 && onSeg(p3, p1, p4)) return true;
    if (o4 === 0 && onSeg(p3, p2, p4)) return true;
    return false;
  }

  function checkItem(item) {
    var v = item.verts;
    var m = v.length - 1; // nr de laturi (ultima închide)
    // 1) închis
    if (v[0][0] !== v[m][0] || v[0][1] !== v[m][1])
      throw new Error("contur neînchis");
    // 2) în cadru [0, grid]
    for (var i = 0; i < v.length; i++) {
      if (
        v[i][0] < 0 ||
        v[i][0] > item.grid ||
        v[i][1] < 0 ||
        v[i][1] > item.grid
      )
        throw new Error("vârf în afara grilei: " + v[i]);
    }
    // 3) fiecare pas e cardinal, lungime ≥ 1, fără same-dir/backtrack consecutiv
    for (var s = 0; s < item.steps.length; s++) {
      if (!(item.steps[s].len >= 1)) throw new Error("pas lungime < 1");
      if (s > 0) {
        var a = item.steps[s - 1].dir,
          b = item.steps[s].dir;
        if (a === b)
          throw new Error("pași consecutivi în aceeași direcție (nemerge)");
        var opp = { R: "L", L: "R", U: "D", D: "U" };
        if (opp[a] === b) throw new Error("pas înapoi (backtrack) la " + s);
      }
    }
    // 4) reverse-label: mergi după TEXTUL vizibil al pașilor → reproduce conturul
    var col = v[0][0],
      row = v[0][1];
    for (var t = 0; t < item.steps.length; t++) {
      var d = REV_LABEL[item.steps[t].label];
      if (!d) throw new Error("etichetă necunoscută: " + item.steps[t].label);
      col += d[0] * item.steps[t].len;
      row += d[1] * item.steps[t].len;
      if (col !== v[t + 1][0] || row !== v[t + 1][1])
        throw new Error(
          "textul pasului " +
            (t + 1) +
            " nu reproduce conturul (hartă etichete inversată?)",
        );
    }
    // 5) poligon SIMPLU: nicio pereche de laturi ne-adiacente nu se intersectează
    for (var e1 = 0; e1 < m; e1++) {
      for (var e2 = e1 + 1; e2 < m; e2++) {
        if (e2 === e1 + 1) continue; // adiacente (împart un vârf)
        if (e1 === 0 && e2 === m - 1) continue; // prima↔ultima (adiacente prin start)
        if (segIntersect(v[e1], v[e1 + 1], v[e2], v[e2 + 1]))
          throw new Error("laturi care se intersectează: " + e1 + " și " + e2);
      }
    }
    // 6) render nu aruncă + structură corectă
    var r = render(item);
    if (!r || r.pages.length !== 2 || typeof r.interactive !== "string")
      throw new Error("render invalid");
  }

  function nativeBand(shapeId) {
    var s = SHAPES[shapeId]._steps;
    for (var dif in DIFF)
      if (s >= DIFF[dif].minSteps && s <= DIFF[dif].maxSteps) return dif;
    return null;
  }

  function selftest() {
    var detalii = [];
    var ok = true;
    function fail(msg) {
      ok = false;
      detalii.push("[FAIL] " + msg);
    }

    // A) fiecare formă, la banda ei nativă
    for (var i = 0; i < SHAPE_IDS.length; i++) {
      var id = SHAPE_IDS[i];
      var dif = nativeBand(id);
      try {
        if (!dif)
          throw new Error(
            "nu are bandă nativă (nr pași " + SHAPES[id]._steps + ")",
          );
        var it = buildOne({ forma: id, dificultate: dif }, 0);
        checkItem(it);
        // determinism pe GEOMETRIE (semnătura e seed-independentă → n-ar dovedi nimic)
        var it2 = buildOne({ forma: id, dificultate: dif }, 0);
        if (JSON.stringify(it.verts) !== JSON.stringify(it2.verts))
          throw new Error("nedeterminist (vârfuri)");
        var txt = it.steps
            .map(function (s) {
              return s.len + s.label;
            })
            .join("|"),
          txt2 = it2.steps
            .map(function (s) {
              return s.len + s.label;
            })
            .join("|");
        if (txt !== txt2) throw new Error("nedeterminist (pași)");
        detalii.push(
          "[OK] " +
            id +
            " (" +
            dif +
            ", " +
            it.nrPasi +
            " pași, grilă " +
            it.grid +
            ") -> închis, cardinal, simplu, text↔contur",
        );
      } catch (err) {
        fail(id + "/" + dif + ": " + err.message);
      }
    }

    // B) fiecare dificultate: ≥3 forme eligibile + „aleator" pe câteva seed-uri
    for (var d in DIFF) {
      var elig = eligibleFor(d);
      if (elig.length < 3)
        fail(
          "dificultatea " +
            d +
            " are doar " +
            elig.length +
            " forme eligibile (<3)",
        );
      else
        detalii.push(
          "[OK] " +
            d +
            " -> " +
            elig.length +
            " forme eligibile pentru Amestecat",
        );
      for (var seed = 0; seed < 6; seed++) {
        try {
          var al = buildOne({ forma: "aleator", dificultate: d }, seed);
          if (elig.indexOf(al.forma) === -1)
            throw new Error("aleator a ales o formă neeligibilă: " + al.forma);
          checkItem(al);
        } catch (e) {
          fail("aleator " + d + " seed=" + seed + ": " + e.message);
        }
      }
    }

    return { ok: ok, detalii: detalii };
  }

  root.PlanseGen = root.PlanseGen || {};
  root.PlanseGen.dictare = {
    SHAPES: SHAPES,
    SHAPE_IDS: SHAPE_IDS,
    DIFF: DIFF,
    eligibleFor: eligibleFor,
    buildOne: buildOne,
    render: render,
    renderPages: renderPages,
    printCss: PRINT_CSS,
    interactiveCss: INTERACTIVE_CSS,
    selftest: selftest,
    signature: signature,
  };
})(typeof window !== "undefined" ? window : globalThis);
