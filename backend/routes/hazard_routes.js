import express from "express";
import {
  getHazardsNearLocation,
  updateHazard,
  deleteHazard,
} from "../controllers/hazard_controller.js";

const router = express.Router();

// Retrieve active hazards near a location (lat/lng + radius)
router.get("/nearby", getHazardsNearLocation);

// Update hazard trust/agreement/status
router.put("/:id", updateHazard);

// Delete or resolve a hazard (admin/moderator)
router.delete("/:id", deleteHazard);

export default router;
