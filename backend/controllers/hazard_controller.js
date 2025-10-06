// controllers/hazard_controller.js
import * as Hazard from "../models/hazard_model.js";
import { computeAgreement, computeTrust } from "../services/hazard_service.js";
import { summarizeHazard } from "../services/ai_service.js";

// Create hazard with scoring + AI summary
export const createHazard = async (req, res) => {
  try {
    const newHazard = await Hazard.create(req.body);

    // Get neighbors for agreement
    const neighbors = await Hazard.findHazardsNearLocation(
      newHazard.lat,
      newHazard.lng,
      0.3 // ~300m radius
    );

    // Compute agreement + trust
    const agreement = await computeAgreement(newHazard, neighbors);
    const trust = await computeTrust([...neighbors, newHazard]);

    // Update hazard
    const updated = await Hazard.modifyHazard(newHazard.report_id, {
      agreement_score: agreement,
      trust_score: trust,
    });

    // Summarize with AI
    const summary = await summarizeHazard(updated);

    res.status(201).json({
      hazard: updated,
      ai_summary: summary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create hazard" });
  }
};

// Get hazards near location
export const getHazardsNearby = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    const hazards = await Hazard.findHazardsNearLocation(lat, lng, radius);

    // Generate AI summaries for each hazard in parallel
    const hazardsWithSummaries = await Promise.all(
      hazards.map(async (hazard) => {
        try {
          const summary = await summarizeHazard(hazard);
          return { ...hazard, ai_summary: summary };
        } catch (e) {
          console.warn("AI summary failed for hazard:", hazard.report_id, e.message);
          return { ...hazard, ai_summary: null };
        }
      })
    );

    res.json(hazardsWithSummaries);
  } catch (err) {
    console.error("Error fetching nearby hazards:", err);
    res.status(500).json({ error: "Failed to fetch hazards" });
  }
};
