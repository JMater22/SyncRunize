import express from "express";
import { authenticate } from "../utils/auth_middleware.js";
import * as StatsController from "../controllers/stats_controller.js";

const router = express.Router();

// Example: GET /api/stats?period=week
router.get("/", authenticate, StatsController.getStats);

export default router;
