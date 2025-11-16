import { summarizeHazard, summarizeTrafficAlert, summarizeBatchAlerts } from "../services/ai_service.js";
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

export const createBatchAlert = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { hazards = [], clusters = [] } = req.body || {};

    // Validate that we have at least one alert
    if (hazards.length === 0 && clusters.length === 0) {
      return res.status(400).json({ success: false, error: "At least one hazard or cluster is required" });
    }

    // Calculate average distance for the batch (for notification metadata)
    const allDistances = [
      ...hazards.map(h => h.distance_m).filter(d => typeof d === 'number'),
      ...clusters.map(c => c.distance_m).filter(d => typeof d === 'number')
    ];
    const avgDistanceMeters = allDistances.length > 0
      ? allDistances.reduce((sum, d) => sum + d, 0) / allDistances.length
      : null;

    // Generate AI summary combining all alerts
    const summary = await summarizeBatchAlerts(hazards, clusters);

    if (!summary) {
      return res.status(500).json({ success: false, error: "Failed to generate alert summary" });
    }

    // ✅ Alerts are sent as PUSH NOTIFICATIONS ONLY (no database entry)
    // Social notifications use real-time subscriptions (database + Supabase)
    // This keeps alerts ephemeral and real-time, while social interactions persist

    // Send push notification banner (FCM)
    await sendAlertPush({
      userId,
      summary,
      type: "batch_alert",
      metadata: {
        alert_count: hazards.length + clusters.length,
        distance_km: ALERT_DISTANCE_KM(avgDistanceMeters),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        summary,
        alert_count: hazards.length + clusters.length,
        hazard_count: hazards.length,
        cluster_count: clusters.length,
        delivery: "push_notification", // Sent as FCM push banner only
      },
    });
  } catch (error) {
    console.error("Error creating batch alert:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
