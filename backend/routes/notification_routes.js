import express from "express";
import {
  getUnreadNotifications,
  markNotificationRead,
  clearNotifications,
} from "../controllers/notification_controller.js";

const router = express.Router();

router.get("/:userId", getUnreadNotifications);
router.put("/:id/read", markNotificationRead);
router.delete("/:userId/clear", clearNotifications);

export default router;
