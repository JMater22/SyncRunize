// routes/user_route_routes.js
import express from "express";
import { authenticate, optionalAuth } from "../utils/auth_middleware.js";
import * as RouteController from "../controllers/user_route_controller.js";
import { getUnSavedPublicRoutesController } from "../controllers/route_controller.js";

const router = express.Router();

// ⭐ IMPORTANT: Order matters! Most specific routes first, then dynamic params

// Static routes first (exact matches)
router.get("/public", optionalAuth, getUnSavedPublicRoutesController);
router.get("/badges/:userId", RouteController.getUserChallengesWithBadge);
router.get("/badges/detail/:userChallengeId", RouteController.getUserChallengeWithBadge);
router.get("/challenges/:userId", RouteController.getUserChallenges);

// ✅ Fetch all routes for the logged-in user (must come before /:id)
// Supports query params: ?activities_only=true&route_status=completed
router.get("/", authenticate, RouteController.getUserRoutes);

// Allow unauthenticated viewers but apply visibility rules inside controller
router.get("/user/:userId", optionalAuth, RouteController.getUserRoutesByUserId);

// ✅ NEW: Generate a route (status: 'generated') - doesn't update challenges
router.post("/generate", authenticate, RouteController.generateRoute);

// ✅ NEW: Complete a run (status: 'completed') - updates challenges/badges
router.post("/complete", authenticate, RouteController.completeRun);

// ✅ NEW: Save a generated route (updates status to 'saved')
router.post("/save/:routeId", authenticate, RouteController.saveGeneratedRoute);

// ✅ LEGACY: Save new run or route (defaults to 'completed' for backward compatibility)
router.post("/", authenticate, RouteController.createRoute);

// Dynamic param routes last (because they match anything)
// ✅ Fetch a specific route by ID
router.get("/:id", authenticate, RouteController.getRouteById);


router.delete("/:routeId", RouteController.deleteRoute);

export default router;
