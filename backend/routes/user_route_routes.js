import express from "express";
import { authenticate } from "../utils/auth_middleware.js";
import * as RouteController from "../controllers/user_route_controller.js";

const router = express.Router();

// Save new run or route
router.post("/", authenticate, RouteController.createRoute);

export default router;
