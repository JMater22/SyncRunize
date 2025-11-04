import express from "express";
import { authenticate } from "../utils/auth_middleware.js";
import { getUnSavedPublicRoutesController } from "../controllers/route_controller.js";

const router = express.Router();

// GET /routes/public/unsaved
router.get("/public", authenticate, getUnSavedPublicRoutesController);

export default router;
