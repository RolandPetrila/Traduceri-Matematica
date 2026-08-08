/* cautare.js — generator „Căutare cuvinte" (word-search). Contract §5:
 *   buildOne(params, seed) -> item
 *   render(item, mm) -> { pages:[puzzle, answer], css, interactive, interactiveCss }
 *   renderPages(item, nr, total, mm) -> { puzzle, answer }
 *   selftest() -> { ok, detalii }
 *   signature(item) -> string
 *
 * Fără „soluție unică" (exercițiul = a GĂSI cuvintele plasate). Corectitudinea =
 * fiecare cuvânt-țintă e chiar în grilă, lizibil la poziția lui, cu litere
 * consistente în încrucișări (garantat de plasare + re-verificat în selftest).
 * RNG seedabil (PlansePRNG.PyRandom) → același seed → aceeași planșă.
 * Litere fără diacritice (A–Z) — standard la careurile RO (TRIUNGHI, FRACTIE).
 */
(function (root) {
  "use strict";

  var PyRandom = root.PlansePRNG.PyRandom;
  var Sig = root.PlanseSig;

  // Direcții: forward = [→, ↓]; + diagonală ↘; greu = toate 8 (inclusiv inversate).
  var D_E = [0, 1],
    D_S = [1, 0],
    D_SE = [1, 1],
    D_W = [0, -1],
    D_N = [-1, 0],
    D_NW = [-1, -1],
    D_SW = [1, -1],
    D_NE = [-1, 1];

  var DIFF = {
    Usor: { n: 10, dirs: [D_E, D_S], defN: 6, maxN: 8 },
    Standard: { n: 12, dirs: [D_E, D_S, D_SE], defN: 8, maxN: 10 },
    Greu: {
      n: 15,
      dirs: [D_E, D_S, D_SE, D_W, D_N, D_NW, D_SW, D_NE],
      defN: 10,
      maxN: 12,
    },
  };

  var FILL = "ABCDEFGHIJLMNOPRSTUVZ"; // pool litere RO fără diacritice/rare (Q,W,Y,K)

  // Teme — liste de cuvinte RO (se normalizează la A–Z). Min ~24/temă pt varietate.
  var THEMES = {
    matematica: {
      label: "Matematică",
      words: [
        "triunghi",
        "patrat",
        "cerc",
        "fractie",
        "produs",
        "suma",
        "diferenta",
        "cat",
        "arie",
        "perimetru",
        "unghi",
        "dreapta",
        "numar",
        "adunare",
        "scadere",
        "inmultire",
        "impartire",
        "radical",
        "putere",
        "ecuatie",
        "grafic",
        "functie",
        "volum",
        "diagonala",
        "bisectoare",
        "mediana",
        "procent",
        "medie",
        "romb",
        "cub",
        "sfera",
        "linie",
        "punct",
        "raza",
      ],
    },
    animale: {
      label: "Animale",
      words: [
        "pisica",
        "caine",
        "elefant",
        "leu",
        "tigru",
        "urs",
        "vulpe",
        "iepure",
        "cal",
        "vaca",
        "oaie",
        "capra",
        "gaina",
        "rata",
        "peste",
        "delfin",
        "balena",
        "soarece",
        "lup",
        "cerb",
        "veverita",
        "arici",
        "broasca",
        "albina",
        "fluture",
        "girafa",
        "zebra",
        "maimuta",
        "papagal",
        "bufnita",
      ],
    },
    fructe: {
      label: "Fructe și legume",
      words: [
        "mar",
        "para",
        "pruna",
        "cirese",
        "capsuni",
        "banana",
        "portocala",
        "lamaie",
        "strugure",
        "pepene",
        "morcov",
        "cartof",
        "rosie",
        "ceapa",
        "usturoi",
        "varza",
        "ardei",
        "castravete",
        "vinete",
        "mazare",
        "fasole",
        "salata",
        "ridiche",
        "dovleac",
        "kiwi",
        "ananas",
        "piersica",
        "caisa",
      ],
    },
    natura: {
      label: "Natură",
      words: [
        "soare",
        "luna",
        "stea",
        "nor",
        "ploaie",
        "zapada",
        "vant",
        "munte",
        "rau",
        "mare",
        "padure",
        "copac",
        "floare",
        "iarba",
        "piatra",
        "nisip",
        "frunza",
        "radacina",
        "lac",
        "deal",
        "camp",
        "cer",
        "curcubeu",
        "furtuna",
        "insula",
        "vale",
        "izvor",
        "gheata",
      ],
    },
    scoala: {
      label: "Școală",
      words: [
        "carte",
        "caiet",
        "creion",
        "stilou",
        "guma",
        "rigla",
        "tabla",
        "creta",
        "ghiozdan",
        "banca",
        "profesor",
        "elev",
        "lectie",
        "tema",
        "nota",
        "pauza",
        "carioca",
        "penar",
        "harta",
        "glob",
        "compas",
        "raportor",
        "manual",
        "recreatie",
        "coleg",
        "clasa",
      ],
    },
    corp_uman: {
      label: "Corpul uman",
      words: [
        "cap",
        "ochi",
        "nas",
        "gura",
        "urechi",
        "par",
        "gat",
        "umar",
        "brat",
        "mana",
        "deget",
        "picior",
        "genunchi",
        "glezna",
        "spate",
        "piept",
        "inima",
        "plaman",
        "stomac",
        "creier",
        "muschi",
        "piele",
        "sprinceana",
        "gene",
        "obraz",
        "barbie",
        "calcai",
        "talpa",
        "cot",
      ],
    },
    meserii: {
      label: "Meserii",
      words: [
        "doctor",
        "profesor",
        "inginer",
        "pompier",
        "politist",
        "medic",
        "avocat",
        "judecator",
        "contabil",
        "bucatar",
        "frizer",
        "croitor",
        "zidar",
        "tamplar",
        "fermier",
        "pescar",
        "sofer",
        "pilot",
        "marinar",
        "actor",
        "cantaret",
        "pictor",
        "scriitor",
        "jurnalist",
        "veterinar",
        "farmacist",
        "brutar",
        "macelar",
        "electrician",
        "mecanic",
      ],
    },
    transport: {
      label: "Transport",
      words: [
        "masina",
        "bicicleta",
        "motocicleta",
        "autobuz",
        "tren",
        "avion",
        "vapor",
        "barca",
        "camion",
        "tramvai",
        "metrou",
        "elicopter",
        "submarin",
        "sanie",
        "trotineta",
        "karting",
        "ambulanta",
        "macara",
        "remorca",
        "autocar",
        "tractor",
        "roaba",
        "cisterna",
        "planor",
        "balon",
        "iaht",
      ],
    },
  };

  function stripDia(s) {
    return s
      .toUpperCase()
      .replace(/[ĂÂ]/g, "A")
      .replace(/Î/g, "I")
      .replace(/[ȘŞ]/g, "S")
      .replace(/[ȚŢ]/g, "T")
      .replace(/[^A-Z]/g, "");
  }

  function fits(grid, n, word, r, c, dr, dc) {
    for (var i = 0; i < word.length; i++) {
      var rr = r + dr * i,
        cc = c + dc * i;
      if (rr < 0 || rr >= n || cc < 0 || cc >= n) return false;
      var g = grid[rr][cc];
      if (g !== null && g !== word[i]) return false;
    }
    return true;
  }

  function placeWord(grid, word, r, c, dr, dc) {
    for (var i = 0; i < word.length; i++)
      grid[r + dr * i][c + dc * i] = word[i];
  }

  // O încercare de plasare a tuturor cuvintelor (cele mai lungi întâi). Întoarce
  // null dacă un cuvânt nu are nicio poziție validă (caller reîncearcă cu altă ordine).
  function tryPlace(n, dirs, words, rng) {
    var grid = [];
    for (var r = 0; r < n; r++) grid.push(new Array(n).fill(null));
    var placed = [];
    for (var wi = 0; wi < words.length; wi++) {
      var word = words[wi];
      var cands = [];
      for (var di = 0; di < dirs.length; di++) {
        var dr = dirs[di][0],
          dc = dirs[di][1];
        for (var rr = 0; rr < n; rr++) {
          for (var cc = 0; cc < n; cc++) {
            if (fits(grid, n, word, rr, cc, dr, dc))
              cands.push([rr, cc, dr, dc]);
          }
        }
      }
      if (!cands.length) return null;
      var p = cands[rng.randrange(cands.length)];
      placeWord(grid, word, p[0], p[1], p[2], p[3]);
      placed.push({
        word: word,
        r: p[0],
        c: p[1],
        dr: p[2],
        dc: p[3],
        len: word.length,
      });
    }
    return { grid: grid, placed: placed };
  }

  function buildOne(params, seed) {
    var dif = params.dificultate;
    if (!(dif in DIFF)) throw new Error("dificultate necunoscuta: " + dif);
    var cfg = DIFF[dif];
    var n = cfg.n;
    var temaId = params.tema;
    if (!(temaId in THEMES)) throw new Error("tema necunoscuta: " + temaId);

    var rng = new PyRandom(seed);

    // Pool: normalizat, unic, lungime 3..n. Amestecat cu RNG-ul seedat.
    var seen = {};
    var pool = [];
    var raw = THEMES[temaId].words;
    for (var i = 0; i < raw.length; i++) {
      var w = stripDia(raw[i]);
      if (w.length >= 3 && w.length <= n && !seen[w]) {
        seen[w] = true;
        pool.push(w);
      }
    }
    rng.shuffle(pool);

    var want = params.nrCuvinte || cfg.defN;
    want = Math.max(3, Math.min(want, cfg.maxN, pool.length));
    var chosen = pool.slice(0, want);
    // cele mai lungi întâi = împachetare mai bună
    chosen.sort(function (a, b) {
      return b.length - a.length;
    });

    // Reîncearcă plasarea reamestecând ordinea (RNG avansează → determinist pe seed).
    var res = null;
    for (var attempt = 0; attempt < 60 && !res; attempt++) {
      res = tryPlace(n, cfg.dirs, chosen, rng);
      if (!res) rng.shuffle(chosen);
    }
    if (!res) {
      // fallback rar: reduce cu 1 cuvânt până încape (nu ar trebui la aceste dimensiuni)
      while (!res && chosen.length > 3) {
        chosen.pop();
        res = tryPlace(n, cfg.dirs, chosen, rng);
      }
      if (!res)
        throw new Error(
          "VERIFICARE ESUATA: plasare imposibila " + temaId + "/" + dif,
        );
    }

    // Umple golurile cu litere aleatoare (determinist pe RNG).
    var grid = res.grid;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (grid[r][c] === null) grid[r][c] = FILL[rng.randrange(FILL.length)];
      }
    }

    // Celulele care aparțin cuvintelor (pt evidențierea soluției).
    var wordCells = new Set();
    for (var k = 0; k < res.placed.length; k++) {
      var pw = res.placed[k];
      for (var t = 0; t < pw.len; t++)
        wordCells.add(pw.r + pw.dr * t + "," + (pw.c + pw.dc * t));
    }

    var gridStr = grid
      .map(function (row) {
        return row.join("");
      })
      .join("/");

    return {
      tip: "cautare",
      tema: temaId,
      temaLabel: THEMES[temaId].label,
      dificultate: dif,
      n: n,
      grid: grid,
      words: res.placed,
      // Array, nu Set — Set nu supraviețuiește JSON.stringify (devine "{}"
      // fara nicio informație) în coșul P4/history.js. gridHtml() reconstruiește
      // Set-ul la randare pt lookup O(1).
      wordCells: Array.from(wordCells),
      seed: seed,
      semnatura: Sig.md5(temaId + "|" + dif + "|" + gridStr).slice(0, 12),
    };
  }

  function signature(item) {
    return item.semnatura;
  }

  // ---------- RANDARE ----------
  function cellMm(n) {
    return Math.round(Math.min(165.0 / n, 15.0) * 10) / 10;
  }

  function gridStyle(n, mm) {
    var m = mm || cellMm(n);
    return (
      "grid-template-columns:repeat(" +
      n +
      ", " +
      m +
      "mm);grid-template-rows:repeat(" +
      n +
      ", " +
      m +
      "mm);"
    );
  }

  // mode: 'puzzle' | 'answer' (inline highlight) | 'interactive' (class .sol togglabil)
  function gridHtml(item, mode) {
    var n = item.n,
      grid = item.grid,
      wc =
        item.wordCells instanceof Set
          ? item.wordCells
          : new Set(item.wordCells);
    var out = [];
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var st = [];
        var cls = "cauta-cel";
        var isWord = wc.has(r + "," + c);
        if (isWord) {
          if (mode === "interactive") cls += " sol";
          else if (mode === "answer") st.push("background:#ffe08a");
        }
        out.push(
          '<div class="' +
            cls +
            '"' +
            (st.length ? ' style="' + st.join(";") + '"' : "") +
            ">" +
            grid[r][c] +
            "</div>",
        );
      }
    }
    return out.join("");
  }

  function wordListHtml(item) {
    var ws = item.words
      .map(function (w) {
        return w.word;
      })
      .slice()
      .sort();
    var lis = ws
      .map(function (w) {
        return '<span class="cauta-word">' + w + "</span>";
      })
      .join("");
    return (
      '<div class="cauta-list"><div class="cauta-list-title">Găsește cuvintele:</div>' +
      '<div class="cauta-words">' +
      lis +
      "</div></div>"
    );
  }

  function paginaPrint(item, nr, total, raspuns, mm) {
    var n = item.n;
    var clasa = raspuns ? "page-a4 pagina-raspuns" : "page-a4";
    var antet, sub;
    if (raspuns) {
      antet =
        '<div class="header-title">Răspuns &mdash; Căutare ' + nr + "</div>";
      sub =
        '<div class="nota-parinte">Pentru părinte &mdash; nu se printează. Cuvintele găsite sunt evidențiate.</div>';
    } else {
      antet =
        '<div class="header-title">Căutare cuvinte</div>' +
        '<div class="header-fields"><div>Nume: ____________</div><div>Data: __________</div></div>';
      sub =
        '<div class="subtitlu">Găsește cuvintele ascunse &bull; Temă: ' +
        item.temaLabel +
        " &bull; " +
        item.dificultate +
        " &bull; Careu " +
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
      '\n  <div class="exercise-block">\n    <div class="cauta-grid" style="' +
      gridStyle(n, mm) +
      '">' +
      gridHtml(item, raspuns ? "answer" : "puzzle") +
      "</div>\n    " +
      wordListHtml(item) +
      "\n  </div>\n</div>"
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
    "  .exercise-block { flex-grow:1; display:flex; flex-direction:column; align-items:center; }\n" +
    "  .cauta-grid { display:grid; margin:0 auto; border:2px solid #000; }\n" +
    "  .cauta-cel { display:flex; align-items:center; justify-content:center; font-size:1.15rem; letter-spacing:0; border:0.5px solid #ccc; text-transform:uppercase; }\n" +
    "  .cauta-list { margin-top:8mm; width:100%; }\n" +
    "  .cauta-list-title { font-weight:bold; margin-bottom:3mm; font-size:1.1rem; }\n" +
    "  .cauta-words { display:flex; flex-wrap:wrap; gap:4mm 8mm; font-size:1.05rem; }\n" +
    "  .cauta-word::before { content:'\\2610  '; }";

  var INTERACTIVE_CSS =
    ".cauta-sheet { background:#fff; color:#111; border-radius:10px; padding:16px; margin:0 auto; max-width:100%; overflow:auto; font-family:'Patrick Hand', ui-rounded, 'Segoe UI', system-ui, sans-serif; }\n" +
    ".cauta-sheet .cauta-head { display:flex; justify-content:space-between; align-items:baseline; font-weight:bold; margin-bottom:6px; }\n" +
    ".cauta-sheet .cauta-sub { font-size:0.9rem; color:#333; margin-bottom:10px; }\n" +
    ".cauta-sheet .cauta-grid { display:grid; margin:0 auto; border:2px solid #000; }\n" +
    ".cauta-sheet .cauta-cel { display:flex; align-items:center; justify-content:center; font-size:1rem; border:0.5px solid #ccc; text-transform:uppercase; }\n" +
    ".cauta-sheet .cauta-list { margin-top:12px; }\n" +
    ".cauta-sheet .cauta-list-title { font-weight:bold; margin-bottom:6px; }\n" +
    ".cauta-sheet .cauta-words { display:flex; flex-wrap:wrap; gap:6px 16px; }\n" +
    ".cauta-sheet .cauta-word::before { content:'\\2610  '; }\n" +
    ".cauta-sheet .cauta-grid.show-solution .cauta-cel.sol { background:#ffe08a; }";

  function renderPages(item, nr, total, mm) {
    return {
      puzzle: paginaPrint(item, nr, total, false, mm),
      answer: paginaPrint(item, nr, total, true, mm),
    };
  }

  function render(item, mm) {
    var pg = renderPages(item, 1, 1, mm);
    var interactive =
      '<div class="cauta-sheet">' +
      '<div class="cauta-head"><span>Căutare &bull; ' +
      item.temaLabel +
      " &bull; " +
      item.dificultate +
      "</span></div>" +
      '<div class="cauta-sub">Găsește cuvintele ascunse (orizontal, vertical' +
      (item.dificultate === "Usor" ? "" : ", diagonal") +
      (item.dificultate === "Greu" ? ", inclusiv inversate" : "") +
      ")</div>" +
      '<div class="cauta-grid" style="' +
      gridStyle(item.n, mm) +
      '">' +
      gridHtml(item, "interactive") +
      "</div>" +
      wordListHtml(item) +
      "</div>";
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
    for (var temaId in THEMES) {
      for (var dif in DIFF) {
        var combOk = true;
        for (var seed = 0; seed < 4; seed++) {
          try {
            var it = buildOne({ tema: temaId, dificultate: dif }, seed);
            var n = it.n;
            // 1) fiecare cuvânt e lizibil la poziția lui
            for (var w = 0; w < it.words.length; w++) {
              var pw = it.words[w];
              var read = "";
              for (var i = 0; i < pw.len; i++) {
                var rr = pw.r + pw.dr * i,
                  cc = pw.c + pw.dc * i;
                if (rr < 0 || rr >= n || cc < 0 || cc >= n)
                  throw new Error("cuvant OOB: " + pw.word);
                read += it.grid[rr][cc];
              }
              if (read !== pw.word)
                throw new Error("cuvant necitibil: " + pw.word + " != " + read);
            }
            // 2) grila complet umplută (A–Z)
            for (var r = 0; r < n; r++)
              for (var c = 0; c < n; c++)
                if (!/^[A-Z]$/.test(it.grid[r][c]))
                  throw new Error("celula goala/invalida la " + r + "," + c);
            // 3) cel puțin 3 cuvinte plasate
            if (it.words.length < 3)
              throw new Error("prea putine cuvinte: " + it.words.length);
          } catch (err) {
            ok = false;
            combOk = false;
            detalii.push(
              "[FAIL] " +
                temaId +
                "/" +
                dif +
                " seed=" +
                seed +
                ": " +
                err.message,
            );
          }
        }
        if (combOk)
          detalii.push(
            "[OK] " +
              temaId +
              "/" +
              dif +
              " x4 seeds -> cuvinte lizibile, grila plina",
          );
      }
    }
    return { ok: ok, detalii: detalii };
  }

  root.PlanseGen = root.PlanseGen || {};
  root.PlanseGen.cautare = {
    THEMES: THEMES,
    DIFF: DIFF,
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
