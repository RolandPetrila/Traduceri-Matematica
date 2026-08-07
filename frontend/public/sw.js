// Service Worker — Sistem Traduceri Matematica
// Cache version auto-generated from build timestamp
const CACHE_VERSION = "v43-" + "20260807b";
const CACHE_NAME = "sistem-traduceri-" + CACHE_VERSION;
const STATIC_ASSETS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];
// P2 (§6): modulul Planșe = static self-contained → precache ca să meargă OFFLINE
// imediat după instalare (F1 promitea „offline"; înainte doar network-first le
// cacha DUPĂ prima vizită). selftest.html exclus. ⚠️ Precache-uit SEPARAT, NON-FATAL
// (`.catch`): `cache.addAll` e ATOMIC → dacă un `/planse/*` dă 404/3xx la install,
// ar rupe TOT precache-ul core (manifest+icons). Un miss aici = „P2 n-a ajutat",
// niciodată „P2 a rupt instalarea PWA".
const PLANSE_ASSETS = [
  "/planse/index.html",
  "/planse/app.js",
  "/planse/style.css",
  "/planse/generators/labirint.js",
  "/planse/generators/cautare.js",
  "/planse/generators/uneste.js",
  "/planse/generators/dictare.js",
  "/planse/generators/numere.js",
  "/planse/generators/integrama.js",
  "/planse/lib/prng.js",
  "/planse/lib/render.js",
  "/planse/lib/signature.js",
  "/planse/lib/history.js",
];

// Allow the page to force an immediately-installed worker to take over.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// Install: cache static assets, skip waiting to activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // CORE atomic (dacă pică, install eșuează — corect). PLANȘE non-fatal.
      cache.addAll(STATIC_ASSETS).then(() =>
        cache.addAll(PLANSE_ASSETS).catch((e) => {
          console.warn("[SW] precache Planșe eșuat (non-fatal):", e);
        }),
      ),
    ),
  );
  self.skipWaiting();
});

// Activate: delete ALL old caches, claim all clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => {
        // Notify all open tabs that a new version is active
        self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: "SW_UPDATED", version: CACHE_VERSION });
          });
        });
      }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // NEVER cache API calls — always go to network
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for HTML pages (navigation)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  // Cache-first only for static assets (icons, manifest, fonts, Planșe subtree)
  if (
    STATIC_ASSETS.some((a) => url.pathname === a) ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/planse/")
  ) {
    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => cached || fetch(event.request)),
    );
    return;
  }

  // Network-first for everything else (JS, CSS bundles — updated on each deploy)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
