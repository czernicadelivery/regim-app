// ============================================================================
// REGIM — functions/index.js
// Trzy zaplanowane funkcje wysyłają prawdziwy push (Firebase Cloud Messaging)
// do wszystkich zapisanych tokenów, o stałych porach czasu Warszawy.
// Wymaga planu Blaze (Cloud Scheduler + Cloud Functions nie działają na Spark).
// ============================================================================

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Wysyła powiadomienie do wszystkich tokenów zapisanych w
 * users/{uid}/pushTokens/{token} (collectionGroup zbiera je ze wszystkich userów).
 * Usuwa tokeny, które przeglądarka unieważniła.
 */
async function sendToAllTokens(title, body) {
  const snap = await admin.firestore().collectionGroup("pushTokens").get();
  if (snap.empty) {
    logger.info("Brak zapisanych tokenów push — pomijam wysyłkę.");
    return;
  }

  const tokens = snap.docs.map((d) => d.id);
  const message = {
    notification: { title, body },
    webpush: {
      notification: { icon: "icons/icon-192.png", badge: "icons/icon-192.png" },
      fcmOptions: { link: "./index.html" },
    },
    tokens,
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  logger.info(`Push wysłany: ${response.successCount}/${tokens.length} sukces.`);

  const cleanupPromises = [];
  response.responses.forEach((res, idx) => {
    if (!res.success) {
      const code = res.error?.code;
      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        cleanupPromises.push(snap.docs[idx].ref.delete().catch(() => null));
      }
    }
  });
  await Promise.all(cleanupPromises);
}

exports.morningPush = onSchedule(
  { schedule: "0 8 * * *", timeZone: "Europe/Warsaw" },
  async () => {
    await sendToAllTokens("REGIM // 08:00", "Wstawaj. Wpisz sen z zegarka i bierz D3.");
  }
);

exports.afternoonPush = onSchedule(
  { schedule: "30 15 * * *", timeZone: "Europe/Warsaw" },
  async () => {
    await sendToAllTokens("REGIM // 15:30", "Czas na trening. Nie ma wymówek.");
  }
);

exports.eveningPush = onSchedule(
  { schedule: "0 20 * * *", timeZone: "Europe/Warsaw" },
  async () => {
    await sendToAllTokens("REGIM // 20:00", "Zrób trening mowy, wpisz kalorie i odkładaj telefon.");
  }
);
