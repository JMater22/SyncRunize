import express from "express";
import * as HazardController from "../controllers/hazard_controller.js";
import { authenticate } from "../utils/auth_middleware.js";
import { uploadHazardImage } from "../config/multer_config.js";

const router = express.Router();

// Create hazard (with optional image)
router.post(
  "/",
  authenticate,
  uploadHazardImage.single("image"), // optional image when creating
  HazardController.createHazard
);


// Getting nearby hazards (public okay)
router.get("/nearby", HazardController.getHazardsNearby);


// Get all hazards created by logged-in user
router.get("/my-hazards", authenticate, HazardController.getUserHazards);

// Update hazard (owner only) with optional new image
router.put(
  "/:id",
  authenticate,
  uploadHazardImage.single("image"), // optional image replacement
  HazardController.updateHazard
);

// Delete hazard (owner only)
router.delete("/:id", authenticate, HazardController.deleteHazard);

export default router;
