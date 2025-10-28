// routes/user_route_routes.js
import express from "express";
import { authenticate } from "../utils/auth_middleware.js";
import * as RouteController from "../controllers/user_route_controller.js";

const router = express.Router();

// ✅ Save new run or route (also updates challenges automatically)
router.post("/", authenticate, RouteController.createRoute);

// ✅ Fetch all routes for the logged-in user
router.get("/", authenticate, RouteController.getUserRoutes);

// ✅ Fetch a specific route by ID
router.get("/:id", authenticate, RouteController.getRouteById);

export default router;
