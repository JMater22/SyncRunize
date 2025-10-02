// routes/hazard_routes.js
import express from "express";
import { createHazard, getHazardsNearby } from "../controllers/hazard_controller.js";

const router = express.Router();

router.post("/", createHazard); // create + score + AI summarize
router.get("/nearby", getHazardsNearby); // get hazards by location

export default router;
