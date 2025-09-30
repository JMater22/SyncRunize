import * as NotificationModel from "../models/notification_model.js";

// Get unread notifications
export const getUnreadNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await NotificationModel.getUnreadNotifications(userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark as read
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await NotificationModel.markNotificationRead(id);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clear all
export const clearNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await NotificationModel.clearNotifications(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
