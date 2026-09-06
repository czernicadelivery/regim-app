// ============================================================================
// REGIM — functions/index.js
// 1) mentorAI — bezpieczny proxy do Google Gemini.
//    Klucz API trzymany jest jako Firebase Secret (GEMINI_API_KEY).
// 2) morningPush / afternoonPush / eveningPush — zaplanowany push (Firebase
//    Cloud Messaging) o 8:00 / 15:30 / 20:00 czasu Warszawy.
// ============================================================================
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// ----------------------------------------------------------------------------
// MENTOR AI — proxy do Google Gemini API
// Deploy: firebase deploy --only functions:mentorAI
// Ustaw sekret raz: firebase functions:secrets:set GEMINI_API_KEY
// ----------------------------------------------------------------------------
exports.mentorAI = onRequest(
  { secrets: [GEMINI_API_KEY], cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Użyj POST" });
      return;
    }

    const { system, user } = req.body || {};
    if (!system || !user) {
      res.status(400).json({ error: "Brak pól 'system' lub 'user' w body" });
      return;
    }

    try {
      const fullPrompt = `${system}\n\nDane użytkownika:\n${user}`;
      const apiKey = GEMINI_API_KEY.value();

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: fullPrompt }]
            }]
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        logger.error("Błąd Gemini API", response.status, errText);
        res.status(502).json({ error: "Błąd modelu AI" });
        return;
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!reply) {
        res.status(502).json({ error: "Pusta odpowiedź modelu" });
        return;
      }

      res.status(200).json({ reply });
    } catch (e) {
      logger.error("mentorAI błąd:", e);
      res.status(500).json({ error: "Błąd serwera" });
    }
  }
);

// ----------------------------------------------------------------------------
// PUSH — istniejąca logika (bez zmian funkcjonalnych)
// ----------------------------------------------------------------------------
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
