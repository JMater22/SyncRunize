import express from "express";
import * as HazardController from "../controllers/hazard_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// ✅ NEW: Create hazard (image URL in request body - no file upload)
router.post(
  "/",
  authenticate,
  HazardController.createHazard
);


// Getting nearby hazards (public okay)
router.get("/nearby", HazardController.getHazardsNearby);


// Get all hazards created by logged-in user
router.get("/my-hazards", authenticate, HazardController.getUserHazards);

// ✅ NEW: Update hazard (owner only) - accepts image_url in body
router.put(
  "/:id",
  authenticate,
  HazardController.updateHazard
);

// Delete hazard (owner only)
router.delete("/:id", authenticate, HazardController.deleteHazard);

export default router;
