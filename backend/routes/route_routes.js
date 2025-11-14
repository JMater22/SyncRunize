import express from "express";
import { optionalAuth } from "../utils/auth_middleware.js";
import { getUnSavedPublicRoutesController, enhanceSafetyWarnings } from "../controllers/route_controller.js";

const router = express.Router();

// GET /routes/public (optionally authenticated)
router.get("/public", optionalAuth, getUnSavedPublicRoutesController);

// POST /routes/enhance-safety-warnings - No auth required for safety enhancement
router.post("/enhance-safety-warnings", enhanceSafetyWarnings);

export default router;
