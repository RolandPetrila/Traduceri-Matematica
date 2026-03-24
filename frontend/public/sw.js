// Service Worker — Sistem Traduceri Matematica
// Cache version auto-generated from build timestamp
const CACHE_VERSION = "v6-" + "20260324b";
const CACHE_NAME = "sistem-traduceri-" + CACHE_VERSION;
const STATIC_ASSETS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: cache static assets, skip waiting to activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete ALL old caches, claim all clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => {
      // Notify all open tabs that a new version is active
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "SW_UPDATED", version: CACHE_VERSION });
        });
      });
    })
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
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first only for static assets (icons, manifest, fonts)
  if (STATIC_ASSETS.some((a) => url.pathname === a) || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Network-first for everything else (JS, CSS bundles — updated on each deploy)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
