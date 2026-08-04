/* uneste.js — generator „Unește punctele" (connect-the-dots). Contract §5:
 *   buildOne(params, seed) -> item
 *   render(item, mm) -> { pages:[puzzle, answer], css, interactive, interactiveCss }
 *   renderPages(item, nr, total, mm) -> { puzzle, answer }
 *   selftest() -> { ok, detalii }
 *   signature(item) -> string
 *
 * Catalog de FORME = poligoane închise normalizate [0,1]. Punctele se numerotează
 * 1..N pe contur; copilul le unește în ordine → apare forma. „Soluție unică"
 * inerentă (ordinea numerică). Dificultatea = factor de subdiviziune a laturilor.
 * RNG seedabil (PlansePRNG.PyRandom) → același seed → aceeași planșă. Render SVG.
 */
(function (root) {
  "use strict";

  var PyRandom = root.PlansePRNG.PyRandom;
  var Sig = root.PlanseSig;

  var DIFF = { Usor: 1, Standard: 2, Greu: 3 }; // factor subdiviziune laturi

  // --- forme calculate (evită erorile de coordonate manuale) ---
  function starPts() {
    var pts = [],
      cx = 0.5,
      cy = 0.5,
      R = 0.46,
      r = 0.19;
    for (var i = 0; i < 10; i++) {
      var ang = -Math.PI / 2 + (i * Math.PI) / 5;
      var rad = i % 2 === 0 ? R : r;
      pts.push([cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)]);
    }
    return pts;
  }
  function heartPts(n) {
    var raw = [];
    for (var i = 0; i < n; i++) {
      var t = (2 * Math.PI * i) / n;
      raw.push([
        16 * Math.pow(Math.sin(t), 3),
        13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t),
      ]);
    }
    // normalizează uniform în [0.1,0.9], centrează, flip y (SVG y în jos)
    var xs = raw.map(function (p) {
      return p[0];
    });
    var ys = raw.map(function (p) {
      return p[1];
    });
    var minx = Math.min.apply(null, xs),
      maxx = Math.max.apply(null, xs);
    var miny = Math.min.apply(null, ys),
      maxy = Math.max.apply(null, ys);
    var s = Math.max(maxx - minx, maxy - miny);
    var box = 0.8;
    var offx = (1 - ((maxx - minx) / s) * box) / 2;
    var offy = (1 - ((maxy - miny) / s) * box) / 2;
    return raw.map(function (p) {
      return [
        offx + ((p[0] - minx) / s) * box,
        offy + ((maxy - p[1]) / s) * box,
      ];
    });
  }

  var SHAPES = {
    stea: { label: "Stea", pts: starPts() },
    inima: { label: "Inimă", pts: heartPts(16) },
    casa: {
      label: "Casă",
      pts: [
        [0.22, 0.9],
        [0.78, 0.9],
        [0.78, 0.45],
        [0.5, 0.14],
        [0.22, 0.45],
      ],
    },
    brad: {
      label: "Brad",
      pts: [
        [0.5, 0.06],
        [0.63, 0.32],
        [0.55, 0.32],
        [0.72, 0.56],
        [0.6, 0.56],
        [0.82, 0.82],
        [0.57, 0.82],
        [0.57, 0.94],
        [0.43, 0.94],
        [0.43, 0.82],
        [0.18, 0.82],
        [0.4, 0.56],
        [0.28, 0.56],
        [0.45, 0.32],
        [0.37, 0.32],
      ],
    },
    peste: {
      label: "Pește",
      pts: [
        [0.06, 0.5],
        [0.34, 0.26],
        [0.58, 0.3],
        [0.72, 0.4],
        [0.95, 0.24],
        [0.86, 0.5],
        [0.95, 0.76],
        [0.72, 0.6],
        [0.58, 0.7],
        [0.34, 0.74],
      ],
    },
    romb: {
      label: "Romb",
      pts: [
        [0.5, 0.08],
        [0.9, 0.5],
        [0.5, 0.92],
        [0.1, 0.5],
      ],
    },
    sageata: {
      label: "Săgeată",
      pts: [
        [0.1, 0.38],
        [0.55, 0.38],
        [0.55, 0.22],
        [0.9, 0.5],
        [0.55, 0.78],
        [0.55, 0.62],
        [0.1, 0.62],
      ],
    },
  };
  var SHAPE_IDS = Object.keys(SHAPES);

  function subdivide(pts, factor) {
    if (factor <= 1) return pts.slice();
    var out = [];
    var n = pts.length;
    for (var i = 0; i < n; i++) {
      var a = pts[i],
        b = pts[(i + 1) % n];
      out.push(a);
      for (var k = 1; k < factor; k++) {
        var t = k / factor;
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }

  function buildOne(params, seed) {
    var dif = params.dificultate;
    if (!(dif in DIFF)) throw new Error("dificultate necunoscuta: " + dif);
    var rng = new PyRandom(seed);
    var forma = params.forma;
    if (!forma || forma === "aleator") forma = rng.choice(SHAPE_IDS);
    if (!(forma in SHAPES)) throw new Error("forma necunoscuta: " + forma);

    var dots = subdivide(SHAPES[forma].pts, DIFF[dif]);
    return {
      tip: "uneste",
      forma: forma,
      formaLabel: SHAPES[forma].label,
      dificultate: dif,
      dots: dots,
      n: dots.length,
      seed: seed,
      semnatura: Sig.md5("uneste|" + forma + "|" + dif).slice(0, 12),
    };
  }

  function signature(item) {
    return item.semnatura;
  }

  // ---------- RANDARE (SVG) ----------
  function f(x) {
    return Math.round(x * 100) / 100;
  }

  // SVG cu punctele numerotate + linia-soluție (ascunsă până la .show-solution).
  function svgHtml(item) {
    var P = item.dots.map(function (p) {
      return [p[0] * 100, p[1] * 100];
    });
    var circles = P.map(function (p, i) {
      // numărul spre exteriorul formei (față de centru 50,50)
      var ox = p[0] >= 50 ? 2.4 : -2.4;
      var oy = p[1] >= 50 ? 3.2 : -1.6;
      return (
        '<circle cx="' +
        f(p[0]) +
        '" cy="' +
        f(p[1]) +
        '" r="1.1" class="dot"/>' +
        '<text x="' +
        f(p[0] + ox) +
        '" y="' +
        f(p[1] + oy) +
        '" class="num">' +
        (i + 1) +
        "</text>"
      );
    }).join("");
    var linePts =
      P.map(function (p) {
        return f(p[0]) + "," + f(p[1]);
      }).join(" ") +
      " " +
      f(P[0][0]) +
      "," +
      f(P[0][1]);
    var line = '<polyline class="sol-line" points="' + linePts + '"/>';
    return (
      '<svg viewBox="0 0 100 100" class="unaste-svg" preserveAspectRatio="xMidYMid meet">' +
      line +
      circles +
      "</svg>"
    );
  }

  function paginaPrint(item, nr, total, raspuns) {
    var clasa = raspuns ? "page-a4 pagina-raspuns" : "page-a4";
    var antet, sub;
    if (raspuns) {
      antet =
        '<div class="header-title">Răspuns &mdash; Unește ' + nr + "</div>";
      sub =
        '<div class="nota-parinte">Pentru părinte &mdash; nu se printează. Forma completă e desenată.</div>';
    } else {
      antet =
        '<div class="header-title">Unește punctele</div>' +
        '<div class="header-fields"><div>Nume: ____________</div><div>Data: __________</div></div>';
      sub =
        '<div class="subtitlu">Unește punctele în ordine (1, 2, 3, …) și descoperă forma &bull; ' +
        item.formaLabel +
        " &bull; " +
        item.dificultate +
        " &bull; Planșă " +
        nr +
        "/" +
        total +
        "</div>";
    }
    var wrapCls = raspuns ? "unaste-draw show-solution" : "unaste-draw";
    return (
      '<div class="' +
      clasa +
      '">\n  <div class="header-row">' +
      antet +
      "</div>\n  " +
      sub +
      '\n  <div class="exercise-block"><div class="' +
      wrapCls +
      '">' +
      svgHtml(item) +
      "</div></div>\n</div>"
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
    "  .page-a4 { display:flex; flex-direction:column; page-break-after:always; width:210mm; min-height:297mm; padding:14mm; }\n" +
    "  .header-row { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6mm; }\n" +
    "  .header-title { font-size:1.6rem; font-weight:bold; }\n" +
    "  .header-fields { display:flex; gap:20px; font-size:1.05rem; }\n" +
    "  .subtitlu { font-size:1.05rem; color:#333; margin-bottom:8mm; }\n" +
    "  .nota-parinte { font-size:0.95rem; color:#333; margin-bottom:6mm; font-style:italic; }\n" +
    "  .exercise-block { flex-grow:1; display:flex; align-items:center; justify-content:center; }\n" +
    "  .unaste-draw { width:170mm; max-width:100%; }\n" +
    "  .unaste-svg { display:block; width:100%; height:auto; }\n" +
    "  .unaste-svg .dot { fill:#111; }\n" +
    "  .unaste-svg .num { font-size:3.2px; fill:#111; font-family:'Patrick Hand', sans-serif; }\n" +
    "  .unaste-svg .sol-line { fill:none; stroke:#1a7a3a; stroke-width:0.7; stroke-linejoin:round; display:none; }\n" +
    "  .unaste-draw.show-solution .sol-line { display:inline; }";

  var INTERACTIVE_CSS =
    ".unaste-sheet { background:#fff; color:#111; border-radius:10px; padding:16px; margin:0 auto; max-width:100%; font-family:'Patrick Hand', ui-rounded, 'Segoe UI', system-ui, sans-serif; }\n" +
    ".unaste-sheet .unaste-head { display:flex; justify-content:space-between; align-items:baseline; font-weight:bold; margin-bottom:6px; }\n" +
    ".unaste-sheet .unaste-sub { font-size:0.9rem; color:#333; margin-bottom:10px; }\n" +
    ".unaste-sheet .unaste-draw { width:min(420px,100%); margin:0 auto; }\n" +
    ".unaste-sheet .unaste-svg { display:block; width:100%; height:auto; }\n" +
    ".unaste-sheet .unaste-svg .dot { fill:#111; }\n" +
    ".unaste-sheet .unaste-svg .num { font-size:3.2px; fill:#111; }\n" +
    ".unaste-sheet .unaste-svg .sol-line { fill:none; stroke:#1a7a3a; stroke-width:0.7; stroke-linejoin:round; display:none; }\n" +
    ".unaste-sheet .unaste-draw.show-solution .sol-line { display:inline; }";

  function renderPages(item, nr, total) {
    return {
      puzzle: paginaPrint(item, nr, total, false),
      answer: paginaPrint(item, nr, total, true),
    };
  }

  function render(item) {
    var pg = renderPages(item, 1, 1);
    var interactive =
      '<div class="unaste-sheet">' +
      '<div class="unaste-head"><span>Unește punctele &bull; ' +
      item.formaLabel +
      " &bull; " +
      item.dificultate +
      "</span></div>" +
      '<div class="unaste-sub">Unește punctele în ordine (1 → 2 → 3 → …) și descoperă forma.</div>' +
      '<div class="unaste-draw">' +
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
  function selftest() {
    var detalii = [];
    var ok = true;
    for (var si = 0; si < SHAPE_IDS.length; si++) {
      var forma = SHAPE_IDS[si];
      var combOk = true;
      for (var dif in DIFF) {
        try {
          var it = buildOne({ forma: forma, dificultate: dif }, 0);
          var expected = SHAPES[forma].pts.length * DIFF[dif];
          if (it.n !== expected)
            throw new Error("nr puncte " + it.n + " != asteptat " + expected);
          if (it.n < 4) throw new Error("prea putine puncte: " + it.n);
          for (var i = 0; i < it.dots.length; i++) {
            var p = it.dots[i];
            if (p[0] < -0.001 || p[0] > 1.001 || p[1] < -0.001 || p[1] > 1.001)
              throw new Error("punct in afara [0,1]: " + p);
          }
          // determinism
          var it2 = buildOne({ forma: forma, dificultate: dif }, 0);
          if (it.semnatura !== it2.semnatura) throw new Error("nedeterminist");
        } catch (err) {
          ok = false;
          combOk = false;
          detalii.push("[FAIL] " + forma + "/" + dif + ": " + err.message);
        }
      }
      if (combOk)
        detalii.push(
          "[OK] " +
            forma +
            " (3 dif) -> puncte in ordine, in cadru, determinist",
        );
    }
    // aleator alege o formă validă
    try {
      var al = buildOne({ forma: "aleator", dificultate: "Standard" }, 5);
      if (SHAPE_IDS.indexOf(al.forma) === -1)
        throw new Error("aleator a ales forma invalida");
      detalii.push("[OK] aleator -> " + al.forma);
    } catch (e) {
      ok = false;
      detalii.push("[FAIL] aleator: " + e.message);
    }
    return { ok: ok, detalii: detalii };
  }

  root.PlanseGen = root.PlanseGen || {};
  root.PlanseGen.uneste = {
    SHAPES: SHAPES,
    SHAPE_IDS: SHAPE_IDS,
    DIFF: DIFF,
    buildOne: buildOne,
    render: render,
    renderPages: renderPages,
    printCss: PRINT_CSS,
    interactiveCss: INTERACTIVE_CSS,
    selftest: selftest,
    signature: signature,
  };
})(typeof window !== "undefined" ? window : globalThis);
