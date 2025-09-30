import express from "express";
import {
  getOfficialIncidents,
  updateIncident,
  deleteIncident,
} from "../controllers/official_incident_controller.js";

const router = express.Router();

// Retrieve by area or date
router.get("/", getOfficialIncidents);

// Update severity weight
router.put("/:id", updateIncident);

// Delete old incident
router.delete("/:id", deleteIncident);

export default router;
