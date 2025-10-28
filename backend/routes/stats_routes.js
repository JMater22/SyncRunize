// routes/stats_routes.js
import express from "express";
import * as StatsController from "../controllers/stats_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

/**
 * GET /api/stats/current
 * Get current period stats (today/this week/this month)
 * Query params: period=day|week|month (default: month)
 */
router.get("/current", authenticate, StatsController.getCurrentStats);

/**
 * GET /api/stats
 * Get stats with optional date range filtering
 * Query params: 
 *   - period=day|week|month (default: month)
 *   - start_date=YYYY-MM-DD (optional)
 *   - end_date=YYYY-MM-DD (optional)
 */
router.get("/", authenticate, StatsController.getStats);

export default router;