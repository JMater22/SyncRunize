import { summarizeHazard, summarizeTrafficAlert } from "../services/ai_service.js";
import * as NotificationModel from "../models/notification_model.js";
import { sendAlertPush } from "../services/push_service.js";

const ALERT_DISTANCE_KM = (distanceMeters) => {
  if (typeof distanceMeters !== "number") return null;
  return Number((distanceMeters / 1000).toFixed(3));
};

export const createHazardAlert = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { hazard, distance_m: distanceMeters } = req.body || {};
    if (!hazard?.lat || !hazard?.lng) {
      return res.status(400).json({ success: false, error: "Hazard payload with coordinates is required" });
    }

    const summary = await summarizeHazard(hazard);
    const notification = await NotificationModel.createNotification({
      user_id: userId,
      actor_id: null,
      message: summary,
      type: "hazard_alert",
      report_id: hazard.report_id ?? null,
      distance_km: ALERT_DISTANCE_KM(distanceMeters),
      is_read: false,
      push_status: "pending",
    });

    await sendAlertPush({
      userId,
      summary,
      type: "hazard_alert",
      notification,
    });

    res.status(201).json({
      success: true,
      data: {
        summary,
        notification,
      },
    });
  } catch (error) {
    console.error("Error creating hazard alert:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createTrafficAlert = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { traffic, distance_m: distanceMeters } = req.body || {};
    if (!traffic?.lat || !traffic?.lng) {
      return res.status(400).json({ success: false, error: "Traffic payload with coordinates is required" });
    }

    const summary = await summarizeTrafficAlert(traffic);
    const notification = await NotificationModel.createNotification({
      user_id: userId,
      actor_id: null,
      message: summary,
      type: "traffic_alert",
      report_id: traffic.report_id ?? null,
      distance_km: ALERT_DISTANCE_KM(distanceMeters),
      is_read: false,
      push_status: "pending",
    });

    await sendAlertPush({
      userId,
      summary,
      type: "traffic_alert",
      notification,
    });

    res.status(201).json({
      success: true,
      data: {
        summary,
        notification,
      },
    });
  } catch (error) {
    console.error("Error creating traffic alert:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
