// routes/saved_route_routes.js
import express from "express";
import * as SavedRouteController from "../controllers/saved_route_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// ✅ All routes below require authentication
router.post("/save", authenticate, SavedRouteController.saveRoute);
router.delete("/unsave", authenticate, SavedRouteController.unsaveRoute);
router.get("/my-saved", authenticate, SavedRouteController.getMySavedRoutes);
router.get("/check/:route_id", authenticate, SavedRouteController.checkIfRouteSaved);

export default router;
