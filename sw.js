// ============================================================================
// LOCK IN 2027 — sw.js (v5)
// Cache offline: CSS + JS + CDN. Poprawki S1 (message) + S5 (offline fallback).
// ============================================================================

const CACHE_NAME = "lockin-cache-v5";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/theme.css",
  "./css/layout.css",
  "./css/components.css",
  "./js/main.js",
  "./js/firebase.js",
  "./js/router.js",
  "./js/state.js",
  "./js/core/utils.js",
  "./js/core/storage.js",
  "./js/core/constants.js",
  "./js/core/data.js",
  "./js/components/nav.js",
  "./js/components/toast.js",
  "./js/components/modal.js",
  "./js/components/chart.js",
  "./js/modules/overview.js",
  "./js/modules/health.js",
  "./js/modules/training.js",
  "./js/modules/tasks.js",
  "./js/modules/progress.js",
  "./js/modules/coach.js",
  "./js/modules/nutrition.js",
  "./js/modules/supplements.js",
  "./js/modules/settings.js",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"
];

// --- Install --------------------------------------------------------------
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          fetch(url, { mode: "no-cors" })
            .then((res) => cache.put(url, res))
            .catch(() => null)
        )
      );
    })
  );
});

// --- Activate -------------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// --- Fetch ----------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = event.request.url;

  // Nigdy nie cache'uj Firebase / Cloud Functions
  if (
    url.includes("firestore.googleapis.com") ||
    url.includes("googleapis.com/identitytoolkit") ||
    url.includes("firebaseio.com") ||
    url.includes("cloudfunctions.net")
  ) {
    return;
  }

  const isExternal = PRECACHE_URLS.some(
    (u) => u.startsWith("http") && url.startsWith(u)
  );

  if (isExternal) {
    // Cache-first dla CDN
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        });
      })
    );
  } else {
    // Network-first dla własnych plików + offline fallback
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // S5: offline fallback
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }))
    );
  }
});

// --- Message (S1) ---------------------------------------------------------
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.delete(CACHE_NAME).then(() => {
      if (event.source) event.source.postMessage({ type: "CACHE_CLEARED" });
    });
  }
});

// --- Notification click ---------------------------------------------------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("./index.html");
      }
    })
  );
});
