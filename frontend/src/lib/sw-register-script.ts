/**
 * Scriptul inline de înregistrare a service worker-ului (injectat în <head> de
 * `app/layout.tsx`). Ținut ca șir într-un modul separat ca să poată fi rulat
 * și testat în jsdom (`sw-register-script.test.ts`).
 *
 * Verificarea periodică de update (la 60s) eșuează trecător (offline, laptop
 * trezit din sleep, rețea mobilă instabilă) — worker-ul curent continuă să
 * servească, deci UN eșec e zgomot. Înainte, `reg.update()` n-avea `.catch` și
 * fiecare eșec ajungea în Supabase ca `error` (R-DIAG-AUTO, 2026-09-23: 6 rânduri
 * Firefox/Chrome, perechi la 60s distanță). Acum raportăm doar un eșec PERSISTENT:
 * 3 consecutive cât browserul e online → o singură respingere netratată, preluată
 * (cu context) de handler-ul `unhandledrejection` din `monitoring.ts`.
 */
export const SW_UPDATE_FAIL_THRESHOLD = 3;

export const SW_REGISTER_SCRIPT = `
  if ('serviceWorker' in navigator) {
    // If a NEW service worker takes control, auto-reload ONCE so the
    // fresh build loads immediately — no stale shell can persist. Guard:
    // only reload when a controller already existed (an UPDATE), never on
    // first-ever install. This is what makes deploys reach every device
    // (fixes the "stuck on old version" class of bug).
    var __hadController = !!navigator.serviceWorker.controller;
    var __refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      if (__refreshing || !__hadController) return;
      __refreshing = true;
      window.location.reload();
    });
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(reg) {
        var __swFails = 0;
        var __swReported = false;
        function __checkUpdate() {
          reg.update().then(function() { __swFails = 0; }).catch(function(e) {
            if (!navigator.onLine) return;
            __swFails++;
            if (__swFails >= ${SW_UPDATE_FAIL_THRESHOLD} && !__swReported) {
              __swReported = true;
              // Deliberately unhandled: monitoring.ts logs it with context.
              Promise.reject(e);
            }
          });
        }
        __checkUpdate();
        setInterval(__checkUpdate, 60000);
        // A newly installed worker (while an old one controls) = update
        // ready: tell it to activate now instead of waiting.
        reg.addEventListener('updatefound', function() {
          var nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', function() {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      }).catch(function() {});
    });
  }
`;
