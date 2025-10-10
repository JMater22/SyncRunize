// routes/stats_routes.js
import express from "express";
import { authenticate } from "../utils/auth_middleware.js";
import * as StatsController from "../controllers/stats_controller.js";

const router = express.Router();

// Get user stats by range (week, month, or custom)
router.get("/", authenticate, StatsController.getStats);

// Get monthly stats summary (for graph/dashboard)
router.get("/monthly", authenticate, StatsController.getMonthlyStats);

export default router;
