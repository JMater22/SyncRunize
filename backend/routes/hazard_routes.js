import express from "express";
import * as HazardController from "../controllers/hazard_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// Secure hazard creation
router.post("/", authenticate, HazardController.createHazard);

// Getting nearby hazards (public okay)
router.get("/nearby", HazardController.getHazardsNearby);

export default router;
