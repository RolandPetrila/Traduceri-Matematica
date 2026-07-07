// Service Worker — network-first pentru pagina (HTML) ca sa NU mai apara versiuni vechi dupa deploy,
// cache-first pentru asset-uri statice (iconite/manifest). Apelurile AI (/api/*) NU se cache-uiesc.
const CACHE = "asistent-ai-v18";
const SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (e) => {
  // NU mai facem skipWaiting automat — noul SW asteapta confirmarea user-ului
  // (toast "Versiune noua · Reincarca" -> postMessage SKIP_WAITING). Evita flash mid-sesiune.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});

// Update opt-in: pagina trimite SKIP_WAITING cand user-ul apasa "Reincarca"
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) =>
        Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Cross-origin (CDN: Tailwind/FontAwesome/marked/etc.) — NU intercepta.
  // Altfel SW face fetch() catre ele, blocat de CSP connect-src 'self' -> CDN-urile cad -> layout rupt.
  if (url.origin !== location.origin) return;
  // API: mereu reteaua (zero cache pe apeluri AI)
  if (url.pathname.startsWith("/api/")) return;
  if (req.method !== "GET") return;

  const isNavigation =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    // Network-first: pagina proaspata cand esti online, cache cand esti offline
    e.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches
            .open(CACHE)
            .then((c) => c.put("/index.html", copy))
            .catch(() => {});
          return resp;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match("/index.html")),
        ),
    );
    return;
  }

  // Asset-uri statice: cache-first cu update in fundal
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === "basic") {
            const copy = resp.clone();
            caches
              .open(CACHE)
              .then((c) => c.put(req, copy))
              .catch(() => {});
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
