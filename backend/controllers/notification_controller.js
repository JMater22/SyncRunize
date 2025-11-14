import * as NotificationModel from "../models/notification_model.js";
import * as NotificationService from "../services/notification_service.js";
import { createNotificationForPost } from "../services/createNotificationForPost.js";

// 🔍 Get all unread notifications for the authenticated user
export const getUnreadNotifications = async (req, res) => {
  try {
    // Use authenticated user ID from middleware
    const userId = req.user.user_id;

    const notifications = await NotificationModel.getUnreadNotifications(userId);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 🔍 Get ALL notifications (read and unread) for the authenticated user
export const getAllNotifications = async (req, res) => {
  try {
    // Use authenticated user ID from middleware
    const userId = req.user.user_id;

    const notifications = await NotificationModel.getAllNotifications(userId);
    console.log(`📥 [getAllNotifications] Fetched ${notifications.length} notifications for user ${userId}`);
    if (notifications.length > 0) {
      console.log('📥 [getAllNotifications] First notification:', JSON.stringify(notifications[0], null, 2));
      console.log('📥 [getAllNotifications] First notification actor:', notifications[0].actor);
    }
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark a notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, error: "Invalid notification ID" });
    }

    const notification = await NotificationModel.markNotificationRead(notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

//  Clear all notifications for the authenticated user
export const clearNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await NotificationModel.clearNotifications(userId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 📨 Create a new notification
export const createNotification = async (req, res) => {
  try {
    const {
      user_id,
      actor_id = null,
      message,
      type,
      post_id = null,
      group_post_id = null,
      group_id = null,
      report_id = null,
      distance_km = null
    } = req.body;

    // Validate required fields
    if (!user_id || !type || !message) {
      return res.status(400).json({ success: false, error: "Missing required fields: user_id, type, message" });
    }

    const payload = {
      user_id,
      actor_id,
      message,
      type,
      post_id,
      group_post_id,
      group_id,
      report_id,
      distance_km,
      is_read: false,
      push_status: "pending"
    };

    const notification = await NotificationModel.createNotification(payload);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/notifications/test
// Quickly generate notifications for manual testing.
// Body examples:
//  - { scenario: 'like', postId: 123 }
//  - { scenario: 'group_like', groupPostId: 45, groupId: 9 }
//  - { scenario: 'follow', followedUserId: 22 }
export const testNotification = async (req, res) => {
  try {
    const { scenario } = req.body || {};
    if (!scenario) {
      return res.status(400).json({ success: false, error: "scenario is required" });
    }

    const actorId = req.body.actorId || req.user?.user_id;
    if (!actorId) return res.status(401).json({ success: false, error: "No actorId and no authenticated user" });

    let result = null;
    switch (scenario) {
      case 'like': {
        const { postId } = req.body;
        if (!postId) return res.status(400).json({ success: false, error: "postId is required for like" });
        // Fanout helper resolves post author and inserts/updates
        result = await createNotificationForPost({ type: 'like', actorId, postId });
        break;
      }
      case 'group_like': {
        const { groupPostId, groupId } = req.body;
        if (!groupPostId) return res.status(400).json({ success: false, error: "groupPostId is required for group_like" });
        result = await createNotificationForPost({ type: 'group_like', actorId, groupPostId, groupId });
        break;
      }
      case 'follow': {
        const { followedUserId } = req.body;
        if (!followedUserId) return res.status(400).json({ success: false, error: "followedUserId is required for follow" });
        await NotificationService.notifyFollow(followedUserId, actorId);
        result = { message: 'follow notification queued' };
        break;
      }
      default:
        return res.status(400).json({ success: false, error: `Unsupported scenario: ${scenario}` });
    }

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in testNotification:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
