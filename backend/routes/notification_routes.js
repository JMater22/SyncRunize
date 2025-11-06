import express from "express";
import * as NotificationController from "../controllers/notification_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// Routes protected by Supabase auth
router.get("/unread/:user_id", authenticate, NotificationController.getUnreadNotifications);
router.get("/all/:user_id", authenticate, NotificationController.getAllNotifications);
router.put("/read/:id", authenticate, NotificationController.markNotificationRead);
router.delete("/clear/:user_id", authenticate, NotificationController.clearNotifications);
router.post("/create", authenticate, NotificationController.createNotification);

// Dev/Test helper: generate notifications (like, group_like, follow, etc.)
// Body: { scenario: 'like'|'group_like'|'follow', postId?, groupPostId?, groupId?, followedUserId?, actorId? }
router.post("/test", authenticate, NotificationController.testNotification);

export default router;
