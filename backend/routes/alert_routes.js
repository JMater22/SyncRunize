import express from "express";
import { authenticate } from "../utils/auth_middleware.js";
import { createHazardAlert, createTrafficAlert } from "../controllers/alert_controller.js";

const router = express.Router();

// Alerts triggered while a runner is active
router.post("/hazard", authenticate, createHazardAlert);
router.post("/traffic", authenticate, createTrafficAlert);

export default router;
