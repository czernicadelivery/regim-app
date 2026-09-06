importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");
const firebaseConfig = {
  apiKey: "AIzaSyChzU-QWJ_lyE7kLePHCvYltIayMZuXlL8",
  authDomain: "regim-web.firebaseapp.com",
  projectId: "regim-web",
  storageBucket: "regim-web.firebasestorage.app",
  messagingSenderId: "1025631760665",
  appId: "1:1025631760665:web:93c5b62295bd8b0b675588"
};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "REGIM";
  const body = payload.notification?.body || "";
  self.registration.showNotification(title, {
    body,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    vibrate: [200, 100, 200],
    data: { url: "./index.html" },
  });
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data?.url || "./index.html");
    })
  );
});
