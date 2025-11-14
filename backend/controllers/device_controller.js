import * as DeviceTokens from "../models/device_token_model.js";

export const registerDeviceToken = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { token, platform } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, error: "Device token is required" });
    }

    const record = await DeviceTokens.upsertDeviceToken({
      userId,
      token,
      platform: platform || req.headers["x-device-platform"] || "unknown",
    });

    return res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("[Devices] Failed to register token:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const unregisterDeviceToken = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, error: "Device token is required" });
    }

    await DeviceTokens.removeDeviceToken(token);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Devices] Failed to remove token:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

