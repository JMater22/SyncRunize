// controllers/hazard_controller.js
import * as Hazard from "../models/hazard_model.js";
import { computeAgreement, computeTrust } from "../services/hazard_service.js";
import { summarizeHazard, summarizeNearbyHazards } from "../services/ai_service.js";

// Create hazard with scoring + AI summary
export const createHazard = async (req, res) => {
  try {
    const userId = req.user?.userId; // comes from JWT
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Override user_id to ensure it's from JWT
    const hazardData = { ...req.body, user_id: userId };

    // Step 1: Create new hazard
    const newHazard = await Hazard.create(hazardData);

    // Step 2: Find neighbors within ~300m
    const neighbors = await Hazard.findHazardsNearLocation(
      newHazard.lat,
      newHazard.lng,
      0.3
    );

    // Step 3: Compute agreement and trust
    const agreement = await computeAgreement(newHazard, neighbors);
    const trust = await computeTrust([...neighbors, newHazard]);

    // Step 4: Update hazard with computed scores
    const updated = await Hazard.modifyHazard(newHazard.report_id, {
      agreement_score: agreement,
      trust_score: trust,
    });

    // Step 5: AI-generated summary
    const summary = await summarizeHazard(updated);

    res.status(201).json({
      hazard: updated,
      ai_summary: summary,
    });
  } catch (err) {
    console.error("Failed to create hazard:", err);
    res.status(500).json({ error: "Failed to create hazard" });
  }
};

// Get hazards near location
export const getHazardsNearby = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    const hazards = await Hazard.findHazardsNearLocation(lat, lng, radius);

    if (!hazards.length) {
      return res.json({
        message: "✅ No hazards found nearby.",
        hazards: [],
        ai_nearby_summary: "No hazards reported in your area. Safe to run!",
      });
    }

    // Generate AI summaries for each hazard
    const hazardsWithSummaries = await Promise.all(
      hazards.map(async (hazard) => {
        try {
          const summary = await summarizeHazard(hazard);
          return { ...hazard, ai_summary: summary };
        } catch (e) {
          console.warn("⚠️ AI summary failed for hazard:", hazard.report_id, e.message);
          return { ...hazard, ai_summary: null };
        }
      })
    );

    // Generate a single summarized overview for all nearby hazards
    const ai_nearby_summary = await summarizeNearbyHazards(hazardsWithSummaries);

    res.json({
      message: "✅ Nearby hazards with AI summaries generated.",
      hazards: hazardsWithSummaries,
      ai_nearby_summary,
    });
  } catch (err) {
    console.error(" Error fetching nearby hazards:", err);
    res.status(500).json({ error: "Failed to fetch hazards" });
  }
};
