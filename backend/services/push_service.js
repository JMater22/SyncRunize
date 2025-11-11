import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import * as DeviceTokens from "../models/device_token_model.js";

const DEFAULT_CHANNEL_ID = process.env.FCM_ANDROID_CHANNEL_ID || "syncrunize-alerts";
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_CREDENTIALS || null;
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || null;

const loadServiceAccount = () => {
  if (SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(SERVICE_ACCOUNT_JSON);
    } catch (err) {
      console.error("[Push] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", err.message);
    }
  }

  if (SERVICE_ACCOUNT_PATH) {
    try {
      const resolved = path.resolve(SERVICE_ACCOUNT_PATH);
      const raw = fs.readFileSync(resolved, "utf-8");
      return JSON.parse(raw);
    } catch (err) {
      console.error("[Push] Failed to load FIREBASE_CREDENTIALS file:", err.message);
    }
  }

  return null;
};

const ensureFirebaseApp = () => {
  if (admin.apps.length) return true;

  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    console.warn("[Push] Firebase credentials not configured; push delivery disabled.");
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return true;
  } catch (err) {
    console.error("[Push] Failed to initialize Firebase Admin:", err.message);
    return false;
  }
};

const buildFirebaseData = (data = {}) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    acc[key] = typeof value === "string" ? value : String(value);
    return acc;
  }, {});
};

export const sendPushNotification = async ({ userId, title, body, data }) => {
  if (!ensureFirebaseApp()) return;

  const tokens = await DeviceTokens.getActiveTokensForUser(userId);
  if (!tokens || tokens.length === 0) {
    console.log(`[Push] No device tokens found for user ${userId}`);
    return;
  }

  await Promise.all(
    tokens.map(async ({ token }) => {
      try {
        await admin.messaging().send({
          token,
          notification: {
            title,
            body,
          },
          android: {
            notification: {
              channelId: DEFAULT_CHANNEL_ID,
              sound: "default",
            },
          },
          data: buildFirebaseData(data),
        });
      } catch (error) {
        console.error("[Push] Failed to send push", error.message);
        const tokenInvalid =
          error.code === "messaging/registration-token-not-registered" ||
          error.code === "messaging/invalid-registration-token";
        if (tokenInvalid) {
          await DeviceTokens.markTokenAsFailed(token);
        }
      }
    })
  );
};

export const sendAlertPush = async ({ userId, summary, type, notification }) => {
  await sendPushNotification({
    userId,
    title: type === "traffic_alert" ? "Traffic alert" : "Hazard nearby",
    body: summary,
    data: {
      type,
      notification_id: notification?.notification_id ?? null,
      report_id: notification?.report_id ?? null,
      distance_km: notification?.distance_km ?? null,
    },
  });
};
