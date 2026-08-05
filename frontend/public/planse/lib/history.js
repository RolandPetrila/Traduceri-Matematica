/* history.js — P4: „coș" de planșe (din ORICE generator) → un singur document
 * PDF/print + unicitate PERSISTENTĂ între sesiuni (localStorage).
 *
 * Strat PUR DE DATE (ca prng.js/signature.js) — NU atinge DOM-ul. UI-ul
 * (butoane „Adaugă în coș" / panoul „Coș & Istoric") trăiește în app.js.
 *
 * Schemă localStorage (o singură cheie, un singur blob JSON):
 *   { seen: { "<semnatura>": { tip, ts } }, cart: [ { tip, semnatura, item, ts } ] }
 * - `seen` = semnături ÎNTÂLNITE (adăugate în coș sau printate) — verificate de
 *   fiecare generator la generate() ca să nu ofere de două ori EXACT aceeași
 *   planșă copilului. Plafonat la MAX_SEEN (evicție FIFO pe `ts`) — degradare
 *   blândă (o planșă foarte veche poate re-apărea), nu contract matematic dur.
 * - `cart` = coșul curent, NEprintat încă — persistă la reload de pagină.
 *
 * Fail-open: dacă localStorage e indisponibil (mod privat strict / quota), toate
 * funcțiile devin no-op sigure (coșul trăiește doar în memorie pe durata sesiunii,
 * `isKnown` răspunde mereu false) — planșele tot funcționează, doar fără persistență.
 */
(function (root) {
  "use strict";

  var KEY = "planse:history:v1";
  var MAX_SEEN = 300;
  var MAX_CART = 60;

  function hasLS() {
    try {
      var k = "__planse_ls_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }
  var LS_OK = typeof window !== "undefined" && hasLS();

  var mem = { seen: {}, cart: [] }; // fallback in-memory dacă LS indisponibil

  function load() {
    if (!LS_OK) return mem;
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return { seen: {}, cart: [] };
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return { seen: {}, cart: [] };
      return { seen: data.seen || {}, cart: data.cart || [] };
    } catch (e) {
      return { seen: {}, cart: [] };
    }
  }
  function save(data) {
    if (!LS_OK) {
      mem = data;
      return;
    }
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      // quota depășită etc. — fail-open, nu aruncă
    }
  }

  function isKnown(sig) {
    var data = load();
    return !!data.seen[sig];
  }

  function remember(sig, tip) {
    if (!sig) return;
    var data = load();
    if (!data.seen[sig]) {
      data.seen[sig] = { tip: tip || "?", ts: Date.now() };
      var keys = Object.keys(data.seen);
      if (keys.length > MAX_SEEN) {
        keys
          .sort(function (a, b) {
            return data.seen[a].ts - data.seen[b].ts;
          })
          .slice(0, keys.length - MAX_SEEN)
          .forEach(function (k) {
            delete data.seen[k];
          });
      }
    }
    save(data);
  }

  function getCart() {
    return load().cart;
  }

  // adaugă o listă de {tip, semnatura, item} în coș (dedup pe semnătură în coș,
  // dar NU pe `seen` global — un item deja printat cândva tot poate fi re-adăugat
  // manual dacă userul chiar vrea, doar generate()-ul automat îl evită implicit).
  function addToCart(entries) {
    var data = load();
    var have = {};
    data.cart.forEach(function (e) {
      have[e.semnatura] = true;
    });
    var added = 0;
    entries.forEach(function (e) {
      if (!e || !e.semnatura || have[e.semnatura]) return;
      if (data.cart.length >= MAX_CART) return;
      data.cart.push({
        tip: e.tip,
        semnatura: e.semnatura,
        item: e.item,
        ts: Date.now(),
      });
      have[e.semnatura] = true;
      added++;
      if (!data.seen[e.semnatura])
        data.seen[e.semnatura] = { tip: e.tip, ts: Date.now() };
    });
    save(data);
    return added;
  }

  function removeFromCart(sig) {
    var data = load();
    var before = data.cart.length;
    data.cart = data.cart.filter(function (e) {
      return e.semnatura !== sig;
    });
    save(data);
    return before - data.cart.length;
  }

  function clearCart() {
    var data = load();
    data.cart = [];
    save(data);
  }

  // ---------- SELFTEST (invarianți — pură logică, fără DOM) ----------
  function selftest() {
    var detalii = [];
    var ok = true;
    function fail(msg) {
      ok = false;
      detalii.push("[FAIL] " + msg);
    }
    // rulează izolat pe o cheie de test, ca să nu strice istoricul real al userului
    var REAL_KEY = KEY;
    KEY = "__planse_history_selftest__";
    try {
      save({ seen: {}, cart: [] }); // curăță cheia de test

      // 1) isKnown/remember round-trip
      if (isKnown("abc"))
        throw new Error("isKnown('abc') ar trebui fals la pornire");
      remember("abc", "numere");
      if (!isKnown("abc")) throw new Error("remember apoi isKnown tot fals");
      detalii.push("[OK] isKnown/remember — round-trip persistență");

      // 2) addToCart dedup pe semnătură + conținut corect
      save({ seen: {}, cart: [] });
      var added1 = addToCart([
        { tip: "numere", semnatura: "s1", item: { x: 1 } },
        { tip: "numere", semnatura: "s1", item: { x: 1 } }, // duplicat -> nu se adaugă a 2-a oară
        { tip: "integrama", semnatura: "s2", item: { x: 2 } },
      ]);
      if (added1 !== 2)
        throw new Error(
          "addToCart ar trebui să adauge 2 (dedup pe semnătură), a adăugat " +
            added1,
        );
      var cart1 = getCart();
      if (cart1.length !== 2)
        throw new Error("coș ar trebui să aibă 2 iteme, are " + cart1.length);
      if (!isKnown("s1") || !isKnown("s2"))
        throw new Error(
          "addToCart ar trebui să înregistreze automat în `seen`",
        );
      detalii.push("[OK] addToCart — dedup pe semnătură + auto-remember");

      // 3) removeFromCart
      var nRemoved = removeFromCart("s1");
      if (nRemoved !== 1)
        throw new Error(
          "removeFromCart('s1') ar trebui să șteargă 1, a șters " + nRemoved,
        );
      if (getCart().length !== 1)
        throw new Error("coș ar trebui să rămână cu 1 item");
      detalii.push("[OK] removeFromCart — șterge exact itemul cerut");

      // 4) clearCart
      clearCart();
      if (getCart().length !== 0) throw new Error("clearCart nu a golit coșul");
      detalii.push("[OK] clearCart — golește coșul, `seen` rămâne intact");
      if (!isKnown("s2"))
        throw new Error("clearCart NU trebuie să șteargă `seen`");

      // 5) persistență REALĂ peste „reload" (re-citire directă din localStorage, nu din cache RAM)
      if (LS_OK) {
        save({ seen: {}, cart: [] });
        addToCart([{ tip: "dictare", semnatura: "s3", item: {} }]);
        var raw2 = window.localStorage.getItem(KEY);
        var reparsed = JSON.parse(raw2);
        if (
          !reparsed.cart ||
          reparsed.cart.length !== 1 ||
          reparsed.cart[0].semnatura !== "s3"
        )
          throw new Error("coșul nu a persistat corect în localStorage");
        detalii.push(
          "[OK] persistență reală în localStorage (re-parsat din raw)",
        );
      } else {
        detalii.push(
          "[OK] localStorage indisponibil — fallback in-memory activ (fail-open)",
        );
      }

      // 6) plafon MAX_SEEN — evicție FIFO (control negativ: probează că plafonul chiar taie)
      save({ seen: {}, cart: [] });
      for (var i = 0; i < MAX_SEEN + 10; i++) remember("sig" + i, "test");
      var data6 = load();
      var count6 = Object.keys(data6.seen).length;
      if (count6 > MAX_SEEN)
        throw new Error(
          "plafonul MAX_SEEN nu a evictat — " + count6 + " > " + MAX_SEEN,
        );
      if (isKnown("sig0"))
        throw new Error("cel mai vechi semn (sig0) ar fi trebuit evictat FIFO");
      if (!isKnown("sig" + (MAX_SEEN + 9)))
        throw new Error(
          "cel mai recent semn ar trebui să supraviețuiască plafonului",
        );
      detalii.push(
        "[OK] plafon MAX_SEEN=" +
          MAX_SEEN +
          " — evicție FIFO are dinți (cel mai vechi dispare, cel mai nou rămâne)",
      );
    } catch (e) {
      fail(e.message);
    } finally {
      save({ seen: {}, cart: [] }); // curăță cheia de test
      KEY = REAL_KEY;
    }
    return { ok: ok, detalii: detalii };
  }

  root.PlanseHistory = {
    isKnown: isKnown,
    remember: remember,
    getCart: getCart,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    selftest: selftest,
  };
})(typeof window !== "undefined" ? window : globalThis);
