import express from "express";
import {
  getModerationLogs,
  addModerationLog,
} from "../controllers/moderation_controller.js";

const router = express.Router();

router.get("/:reportId", getModerationLogs);
router.post("/:reportId", addModerationLog);

export default router;
