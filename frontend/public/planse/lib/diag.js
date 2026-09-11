/* diag.js — FAZA 1 („repară orbirea diagnostică"), 2026-09-08.
 *
 * Planșe e un modul OFFLINE, vanilla JS: nu poate importa `src/lib/failure.ts`.
 * Până acum, un generator care crăpa scria doar `console.error` — adică nimic
 * pentru cine nu stă cu consola deschisă. Aici trimitem același tip de rând ca
 * restul aplicației (cod + cauză + context) către `/api/logs`.
 *
 * Reguli:
 *  - fail-open TOTAL: modulul trebuie să funcționeze offline, deci orice eșec de
 *    logare se înghite în tăcere;
 *  - raportăm eșecul de FLUX (lotul n-a ieșit complet), nu fiecare încercare din
 *    bucla de generare — altfel un lot de 10 fișe ar produce sute de rânduri.
 */
(function () {
  "use strict";

  var LOGS_URL = "/api/logs";

  function device() {
    var ua = navigator.userAgent || "";
    var type = /Mobi|Android/i.test(ua)
      ? "mobile"
      : /iPad|Tablet/i.test(ua)
        ? "tablet"
        : "desktop";
    var os = /Windows/i.test(ua)
      ? "Windows"
      : /iPhone|iPad|iPod/i.test(ua)
        ? "iOS"
        : /Android/i.test(ua)
          ? "Android"
          : /Mac/i.test(ua)
            ? "macOS"
            : /Linux/i.test(ua)
              ? "Linux"
              : "Unknown";
    var browser =
      /Chrome/i.test(ua) && !/Edge/i.test(ua)
        ? "Chrome"
        : /Firefox/i.test(ua)
          ? "Firefox"
          : /Edge/i.test(ua)
            ? "Edge"
            : /Safari/i.test(ua)
              ? "Safari"
              : "Unknown";
    return {
      type: type,
      os: os,
      browser: browser,
      screenWidth: screen.width,
      screenHeight: screen.height,
      pwa:
        (window.matchMedia &&
          window.matchMedia("(display-mode: standalone)").matches) ||
        navigator.standalone === true,
    };
  }

  /**
   * Raportează un lot de planșe care n-a ieșit complet.
   * @param {string} generator - labirint | cautare | uneste | dictare | numere | integrama
   * @param {object} params - parametrii cu care s-a cerut lotul (nivel, formă, nr…)
   * @param {number} requested - câte s-au cerut
   * @param {number} produced - câte au ieșit
   * @param {Error|null} lastError - ultima excepție din buclă, dacă a fost vreuna
   */
  function fail(generator, params, requested, produced, lastError) {
    try {
      var cause = lastError
        ? lastError.message || String(lastError)
        : "Bucla de generare nu a produs destule fise (fara exceptie) - " +
          "parametrii pot fi imposibil de satisfacut sau istoricul anti-repetare e plin";
      var payload = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        timestamp: new Date().toISOString(),
        level: "error",
        message: "planse." + generator + " | " + cause,
        errorCode: "E-PLAN-001",
        stack: lastError && lastError.stack ? lastError.stack : undefined,
        source: "planse." + generator,
        device: device(),
        page: location.pathname,
        userAgent: navigator.userAgent || "",
        context: {
          flow: "planse." + generator,
          kind: lastError ? "logic" : "unknown",
          cause: cause,
          generator: generator,
          requested: requested,
          produced: produced,
          params: params,
          netCallSeen: false,
        },
      };
      if (window.console) console.error("[planse:" + generator + "]", cause);
      fetch(LOGS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(function () {
        /* offline — modulul trebuie sa mearga oricum */
      });
    } catch (e) {
      /* diagnosticul nu are voie sa rupa generarea */
    }
  }

  /**
   * Lot incomplet — SPUNE-I UTILIZATORULUI, nu doar jurnalului.
   *
   * Găsit de auditorul de cerințe (08.09.2026): `fail()` scria corect în jurnal,
   * dar pe ecran rămânea „3 labirinturi · seed bază X". Cristina cerea 5 fișe,
   * primea 3 și NU afla niciodată că ceva a eșuat. Mențiunea lui Roland cere ca
   * la orice eroare să i se scrie clar, acolo, ce s-a întâmplat și ce are de făcut.
   *
   * @param {HTMLElement} metaEl elementul în care se scrie rezumatul
   * @param {number} cerute     câte fișe a cerut
   * @param {number} obtinute   câte au ieșit
   * @param {string} [advice]   text de sfat, ÎN LOC de default-ul "Mai apasă o
   *   dată pentru altele noi." — necesar la dictare/uneste (2026-09-12), unde
   *   catalogul de forme e FIX (23/36 rezultate posibile total, vezi
   *   config/error_codes.json E-PLAN-001): reîncercarea NU produce nimic nou
   *   dacă toate formele posibile la acea dificultate au fost deja văzute, deci
   *   sfatul generic ar fi înșelător. Omis → comportament identic ca înainte
   *   (labirint/căutare/numere/integramă, spațiu de semnături practic
   *   nelimitat, unde "mai apasă o dată" chiar ajută).
   */
  function notaLot(metaEl, requested, produced, advice) {
    if (!metaEl) return;

    // `meta` trăiește ÎNĂUNTRUL barei `.gen-actions`, care rămâne ascunsă când nu
    // s-a generat nimic. Deci exact în cazul cel mai grav — 0 din 5 — mesajul de
    // mai jos ar fi fost invizibil. Punem unul ȘI în afara barei, lângă ea.
    // (Defect de ordinul doi, semnalat de auditorul de regresie 08.09.2026.)
    var bar = metaEl.closest ? metaEl.closest(".gen-actions") : null;
    var host = bar && bar.parentNode;
    var warn = host ? host.querySelector(".lot-incomplet") : null;

    if (produced >= requested) {
      if (warn && warn.parentNode) warn.parentNode.removeChild(warn);
      return;
    }

    var msg =
      "⚠ Doar " +
      produced +
      " din " +
      requested +
      " au putut fi generate. " +
      (advice || "Mai apasă o dată pentru altele noi.");

    metaEl.textContent += " · " + msg;

    if (!host) return;
    if (!warn) {
      warn = document.createElement("p");
      warn.className = "lot-incomplet";
      warn.setAttribute("role", "alert");
      warn.style.cssText =
        "margin:8px 0;color:#ffd166;font-weight:600;font-size:0.95em";
      host.insertBefore(warn, bar);
    }
    warn.textContent = msg;
  }

  window.PlanseDiag = { fail: fail, notaLot: notaLot };
})();
