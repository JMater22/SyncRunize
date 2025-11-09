import axios from "axios";
import * as DeviceTokens from "../models/device_token_model.js";

const FCM_ENDPOINT = "https://fcm.googleapis.com/fcm/send";
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;
const DEFAULT_CHANNEL_ID = process.env.FCM_ANDROID_CHANNEL_ID || "syncrunize-alerts";

const isPushConfigured = () => {
  if (!FCM_SERVER_KEY) {
    console.warn("[Push] FCM_SERVER_KEY missing; skipping push dispatch.");
    return false;
  }
  return true;
};

const buildPayload = ({ token, title, body, data }) => ({
  to: token,
  notification: {
    title,
    body,
    android_channel_id: DEFAULT_CHANNEL_ID,
    sound: "default",
  },
  data,
});

const sendFcmMessage = async (payload) => {
  await axios.post(FCM_ENDPOINT, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `key=${FCM_SERVER_KEY}`,
    },
    timeout: 5000,
  });
};

export const sendPushNotification = async ({ userId, title, body, data }) => {
  if (!isPushConfigured()) return;
  const tokens = await DeviceTokens.getActiveTokensForUser(userId);
  if (!tokens || tokens.length === 0) {
    console.log(`[Push] No device tokens found for user ${userId}`);
    return;
  }

  await Promise.all(
    tokens.map(async ({ token }) => {
      try {
        await sendFcmMessage(
          buildPayload({
            token,
            title,
            body,
            data,
          })
        );
      } catch (error) {
        console.error("[Push] Failed to send push", error.response?.data || error.message);
        if (error.response?.status === 400 || error.response?.status === 404) {
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

