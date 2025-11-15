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

export const sendPushNotification = async ({ userId, title, body, data, priority = 'high' }) => {
  if (!ensureFirebaseApp()) return { sent: 0, failed: 0 };

  const tokens = await DeviceTokens.getActiveTokensForUser(userId);
  if (!tokens || tokens.length === 0) {
    console.log(`[Push] ⚠️  No device tokens found for user ${userId}`);
    return { sent: 0, failed: 0 };
  }

  console.log(`[Push] 📱 Found ${tokens.length} device token(s) for user ${userId}`);

  let sentCount = 0;
  let failedCount = 0;

  await Promise.all(
    tokens.map(async ({ token, platform }) => {
      try {
        const message = {
          token,
          notification: {
            title,
            body,
          },
          android: {
            priority: priority, // 'high' or 'normal'
            notification: {
              channelId: DEFAULT_CHANNEL_ID,
              sound: "default",
              priority: priority === 'high' ? 'high' : 'default',
              defaultSound: true,
              defaultVibrateTimings: true,
              defaultLightSettings: true,
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
              },
            },
          },
          data: buildFirebaseData(data),
        };

        const response = await admin.messaging().send(message);
        sentCount++;
        console.log(`[Push] ✅ Sent to user ${userId} (${platform}):`, response);
        console.log(`[Push] 📨 Notification: "${title}" - "${body.substring(0, 100)}${body.length > 100 ? '...' : ''}"`);
      } catch (error) {
        failedCount++;
        console.error(`[Push] ❌ Failed to send to user ${userId} (${platform}):`, error.message);

        const tokenInvalid =
          error.code === "messaging/registration-token-not-registered" ||
          error.code === "messaging/invalid-registration-token";

        if (tokenInvalid) {
          console.log(`[Push] Marking token as invalid for user ${userId}`);
          await DeviceTokens.markTokenAsFailed(token);
        }
      }
    })
  );

  console.log(`[Push] Delivery summary for user ${userId}: ${sentCount} sent, ${failedCount} failed`);
  return { sent: sentCount, failed: failedCount };
};

export const sendAlertPush = async ({ userId, summary, type, metadata = {} }) => {
  // ✅ Determine notification title based on alert type
  let title;
  switch (type) {
    case "traffic_alert":
      title = "Traffic Alert";
      break;
    case "batch_alert":
      title = "Multiple Alerts Nearby"; // ✅ Batch alerts have dedicated title
      break;
    case "hazard_alert":
    default:
      title = "Hazard Nearby";
      break;
  }

  // ✅ Alerts sent as ephemeral push notifications (no database storage)
  // Only social notifications persist in the database for notification center
  await sendPushNotification({
    userId,
    title,
    body: summary,
    data: {
      type,
      alert_count: metadata.alert_count ?? null,
      distance_km: metadata.distance_km ?? null,
      timestamp: new Date().toISOString(),
    },
  });
};
