// routes/user_route_routes.js
import express from "express";
import { authenticate } from "../utils/auth_middleware.js";
import * as RouteController from "../controllers/user_route_controller.js";

const router = express.Router();

// ⭐ IMPORTANT: Order matters! Most specific routes first, then dynamic params

// Static routes first (exact matches)
router.get("/badges/:userId", RouteController.getUserChallengesWithBadge);
router.get("/badges/detail/:userChallengeId", RouteController.getUserChallengeWithBadge);
router.get("/challenges/:userId", RouteController.getUserChallenges);

// ✅ Fetch all routes for the logged-in user (must come before /:id)
router.get("/", authenticate, RouteController.getUserRoutes);

router.get("/user/:userId", RouteController.getUserRoutesByUserId);

// ✅ Save new run or route (also updates challenges automatically)
router.post("/", authenticate, RouteController.createRoute);

// Dynamic param routes last (because they match anything)
// ✅ Fetch a specific route by ID
router.get("/:id", authenticate, RouteController.getRouteById);


router.delete("/:routeId", RouteController.deleteRoute);

export default router;