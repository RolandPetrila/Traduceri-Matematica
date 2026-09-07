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

  window.PlanseDiag = { fail: fail };
})();
