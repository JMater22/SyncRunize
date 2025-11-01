// routes/stats_routes.js
import express from "express";
import * as StatsController from "../controllers/stats_controller.js";

const router = express.Router();

// Example routes:
// GET /stats/:userId?period=week&start_date=2025-10-01&end_date=2025-10-31
router.get("/:userId", StatsController.getStats);

// GET /stats/:userId/current?period=day
router.get("/:userId/current", StatsController.getCurrentStats);

export default router;
