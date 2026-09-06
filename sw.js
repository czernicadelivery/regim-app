// ============================================================================
// REGIM — sw.js (Service Worker)
// 1) Cache offline dla działania PWA.
// 2) Lokalne, zaplanowane powiadomienia (rano / popołudnie / wieczór).
//
// UWAGA O OGRANICZENIACH: przeglądarki NIE budzą Service Workera samodzielnie
// o konkretnej godzinie, jeśli karta/aplikacja jest całkowicie zamknięta.
// To, co tutaj zaimplementowano, to najlepszy dostępny mechanizm czysto
// front-endowy: harmonogram sprawdzany przy każdym uruchomieniu aplikacji
// oraz — tam gdzie przeglądarka wspiera — Periodic Background Sync.
// Dla w pełni niezawodnych powiadomień "o 8:00 rano nawet gdy telefon śpi"
// potrzebny jest backend wysyłający Push (patrz poradnik w README /
// wiadomość końcowa) — to jest już poza zasięgiem samego Service Workera.
// ============================================================================

const CACHE_NAME = "regim-cache-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
];

// ----------------------------------------------------------------------------
// INSTALACJA — cache app shell
// ----------------------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ----------------------------------------------------------------------------
// AKTYWACJA — czyszczenie starych cache'y
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// FETCH — strategia: sieć najpierw, fallback do cache (offline-first fallback)
// ----------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  // Nie cache'ujemy requestów do Firebase / Firestore / zewnętrznych API —
  // te muszą zawsze iść przez sieć.
  const url = event.request.url;
  if (
    url.includes("firestore.googleapis.com") ||
    url.includes("googleapis.com") ||
    url.includes("firebaseio.com") ||
    event.request.method !== "GET"
  ) {
    return; // przepuść bez ingerencji Service Workera
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ----------------------------------------------------------------------------
// HARMONOGRAM POWIADOMIEŃ — treści zgodne ze specyfikacją
// ----------------------------------------------------------------------------
const NOTIFICATION_SCHEDULE = [
  {
    id: "morning",
    hour: 8,
    minute: 0,
    title: "REGIM // 08:00",
    body: "Wstawaj. Wpisz sen z zegarka i bierz D3.",
  },
  {
    id: "afternoon",
    hour: 15,
    minute: 30,
    title: "REGIM // 15:30",
    body: "Czas na trening. Nie ma wymówek.",
  },
  {
    id: "evening",
    hour: 20,
    minute: 0,
    title: "REGIM // 20:00",
    body: "Zrób trening mowy i odkładaj telefon.",
  },
];

function showNotification(entry) {
  return self.registration.showNotification(entry.title, {
    body: entry.body,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: entry.id, // ta sama "tag" nadpisuje poprzednie powiadomienie tego typu
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: "./" },
  });
}

// Klucz w IndexedDB/Cache API do zapamiętania, które powiadomienia dziś wysłano.
const SENT_LOG_CACHE = "regim-notif-log";

async function alreadySentToday(id) {
  const cache = await caches.open(SENT_LOG_CACHE);
  const todayKey = new Date().toISOString().slice(0, 10);
  const match = await cache.match(`/log/${id}/${todayKey}`);
  return !!match;
}

async function markSentToday(id) {
  const cache = await caches.open(SENT_LOG_CACHE);
  const todayKey = new Date().toISOString().slice(0, 10);
  await cache.put(`/log/${id}/${todayKey}`, new Response("sent"));
}

// Sprawdza harmonogram — wywoływane cyklicznie (patrz niżej: periodicsync oraz
// wiadomość "check-schedule" wysyłana z app.js co minutę, gdy karta jest otwarta).
async function checkSchedule() {
  const now = new Date();
  for (const entry of NOTIFICATION_SCHEDULE) {
    const isPastTrigger =
      now.getHours() > entry.hour ||
      (now.getHours() === entry.hour && now.getMinutes() >= entry.minute);
    const withinWindow =
      now.getHours() === entry.hour && now.getMinutes() < entry.minute + 5;

    if (withinWindow && !(await alreadySentToday(entry.id))) {
      await showNotification(entry);
      await markSentToday(entry.id);
    }
  }
}

// ----------------------------------------------------------------------------
// PERIODIC BACKGROUND SYNC (wspierane w Chrome/Android dla zainstalowanych PWA)
// Rejestracja odbywa się z app.js: reg.periodicSync.register(...)
// ----------------------------------------------------------------------------
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "regim-schedule-check") {
    event.waitUntil(checkSchedule());
  }
});

// ----------------------------------------------------------------------------
// Fallback dla przeglądarek bez Periodic Sync: strona wysyła "ping" co minutę,
// dopóki jest otwarta, a Service Worker weryfikuje harmonogram.
// ----------------------------------------------------------------------------
self.addEventListener("message", (event) => {
  if (event.data?.type === "check-schedule") {
    event.waitUntil(checkSchedule());
  }
});

// ----------------------------------------------------------------------------
// KLIKNIĘCIE W POWIADOMIENIE — otwórz/aktywuj aplikację
// ----------------------------------------------------------------------------
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
        return self.clients.openWindow(event.notification.data?.url || "./");
      }
    })
  );
});
