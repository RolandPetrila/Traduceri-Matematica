// Regresie pt bug-ul P4 găsit la audit: Set (pasaje/wordCells) nu supraviețuiește
// JSON.stringify în coșul persistent (history.js) → TypeError la print batch.
// Rulează fișierele generatoare direct în Node (sunt IIFE care se atașează pe
// globalThis când `window` lipsește) + un localStorage minimal shim.
"use strict";
const fs = require("fs");
const path = require("path");

const DIR = path.resolve(__dirname, "../frontend/public/planse");

// localStorage minimal, în memorie (suficient pt history.js).
const store = {};
global.window = global;
global.window.localStorage = {
  getItem: (k) =>
    Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
  setItem: (k, v) => {
    store[k] = String(v);
  },
  removeItem: (k) => {
    delete store[k];
  },
};

function load(file) {
  const code = fs.readFileSync(path.join(DIR, file), "utf8");
  // eslint-disable-next-line no-eval
  (0, eval)(code);
}

load("lib/prng.js");
load("lib/signature.js");
load("lib/history.js");
load("generators/labirint.js");
load("generators/cautare.js");

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.log("  ❌ " + msg);
  } else {
    console.log("  ✓ " + msg);
  }
}

console.log("=== Regresie P4: labirint prin coș (JSON round-trip real) ===");
{
  const Lab = global.PlanseGen && global.PlanseGen.labirint;
  // fallback dacă modulul nu se auto-înregistrează pe PlanseGen (verificăm ambele căi)
  const gen = Lab || global.__labirint_test_hook__;
  if (!gen) {
    console.log("  ❌ modulul labirint nu s-a încărcat (verifică export)");
    failures++;
  } else {
    const item = gen.buildOne({ nivel: "Usor" }, 42);
    assert(
      Array.isArray(item.pasaje),
      "buildOne() întoarce pasaje ca Array (JSON-safe), nu Set",
    );

    // Simulează EXACT calea reală: addToCart -> localStorage (JSON.stringify) -> getCart (JSON.parse)
    global.PlanseHistory.addToCart([
      { tip: "labirint", semnatura: item.semnatura, item: item },
    ]);
    const cart = global.PlanseHistory.getCart();
    assert(cart.length === 1, "itemul a ajuns în coș");
    const roundTripped = cart[0].item;
    assert(
      Array.isArray(roundTripped.pasaje) &&
        roundTripped.pasaje.length === item.pasaje.length,
      "pasaje SUPRAVIEȚUIEȘTE round-trip-ul JSON real (nu mai devine {})",
    );

    // Înainte de fix: gen.renderPages(roundTripped,...) arunca TypeError (pasaje.has is not a function)
    let threw = false;
    let pages;
    try {
      pages = gen.renderPages(roundTripped, 1, 1);
    } catch (e) {
      threw = true;
      console.log("     eroare: " + e.message);
    }
    assert(
      !threw,
      "renderPages() pe itemul din coș NU aruncă (exact scenariul care rupea print batch-ul P4)",
    );
    assert(
      pages && pages.puzzle.indexOf('class="labirint"') !== -1,
      "HTML-ul randat conține grila labirintului",
    );
  }
}

console.log("\n=== Regresie P4: căutare prin coș (JSON round-trip real) ===");
{
  const gen = global.PlanseGen && global.PlanseGen.cautare;
  if (!gen) {
    console.log("  ❌ modulul cautare nu s-a încărcat (verifică export)");
    failures++;
  } else {
    const item = gen.buildOne({ tema: "animale", dificultate: "Usor" }, 7);
    assert(
      Array.isArray(item.wordCells),
      "buildOne() întoarce wordCells ca Array (JSON-safe), nu Set",
    );

    global.PlanseHistory.clearCart();
    global.PlanseHistory.addToCart([
      { tip: "cautare", semnatura: item.semnatura, item: item },
    ]);
    const cart = global.PlanseHistory.getCart();
    const roundTripped = cart[0].item;
    assert(
      Array.isArray(roundTripped.wordCells) &&
        roundTripped.wordCells.length === item.wordCells.length,
      "wordCells SUPRAVIEȚUIEȘTE round-trip-ul JSON real",
    );

    let threw = false;
    let pages;
    try {
      pages = gen.renderPages(roundTripped, 1, 1);
    } catch (e) {
      threw = true;
      console.log("     eroare: " + e.message);
    }
    assert(!threw, "renderPages() pe itemul din coș NU aruncă");
    assert(
      pages && pages.answer.indexOf("background:#ffe08a") !== -1,
      "pagina-răspuns evidențiază cuvintele (wordCells încă funcțional)",
    );
  }
}

console.log("\n=== Selftest-urile proprii (invarianți neschimbați de fix) ===");
{
  const labSelf = global.PlanseGen.labirint.selftest();
  console.log(
    "  labirint.selftest(): " +
      (labSelf.ok ? "OK" : "FAIL") +
      " (" +
      labSelf.detalii.length +
      " verificări)",
  );
  if (!labSelf.ok) {
    failures++;
    labSelf.detalii
      .filter((d) => d.indexOf("FAIL") === 0)
      .forEach((d) => console.log("    " + d));
  }

  const cautSelf = global.PlanseGen.cautare.selftest();
  console.log(
    "  cautare.selftest(): " +
      (cautSelf.ok ? "OK" : "FAIL") +
      " (" +
      cautSelf.detalii.length +
      " verificări)",
  );
  if (!cautSelf.ok) {
    failures++;
    cautSelf.detalii
      .filter((d) => d.indexOf("FAIL") === 0)
      .forEach((d) => console.log("    " + d));
  }

  const histSelf = global.PlanseHistory.selftest();
  console.log(
    "  history.selftest(): " +
      (histSelf.ok ? "OK" : "FAIL") +
      " (" +
      histSelf.detalii.length +
      " verificări)",
  );
  if (!histSelf.ok) {
    failures++;
    histSelf.detalii
      .filter((d) => d.indexOf("FAIL") === 0)
      .forEach((d) => console.log("    " + d));
  }
}

console.log(
  "\n=== TOTAL: " +
    (failures === 0 ? "TOATE OK" : failures + " EȘECURI") +
    " ===",
);
process.exit(failures > 0 ? 1 : 0);
