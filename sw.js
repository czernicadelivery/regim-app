// ============================================================================
// REGIM — sw.js (Service Worker)
// Cache offline dla działania PWA (cache-first dla CDN, network-first dla
// własnych plików).
// ============================================================================
const CACHE_NAME = "regim-cache-v4";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://cdn.tailwindcss.com",
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js",
];
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) =>
          fetch(url, { mode: "no-cors" }).then((res) => cache.put(url, res)).catch(() => null)
        )
      )
    )
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const isExternal = PRECACHE_URLS.some((u) => u.startsWith("http") && e.request.url.startsWith(u));
  if (
    e.request.url.includes("firestore.googleapis.com") ||
    e.request.url.includes("googleapis.com/identitytoolkit") ||
    e.request.url.includes("firebaseio.com") ||
    e.request.url.includes("cloudfunctions.net")
  ) {
    return; // nigdy nie cache'uj ruchu do Firebase / Cloud Functions
  }
  if (isExternal) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return res;
      }))
    );
  } else {
    e.respondWith(
      fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./index.html");
    })
  );
});
