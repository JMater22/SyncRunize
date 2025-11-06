// controllers/hazard_controller.js
import * as Hazard from "../models/hazard_model.js";
import { computeAgreement, computeTrust } from "../services/hazard_service.js";
import { summarizeHazard, summarizeNearbyHazards } from "../services/ai_service.js";
import fs from "fs";
import path from "path";
import { safeDeleteFile } from "../utils/file_utils.js";

// Create hazard with scoring + AI summary
// Create hazard with scoring + AI summary (safe version)
export const createHazard = async (req, res) => {
  let imagePath = null; // Track uploaded file path for cleanup

  try {
    const userId = req.user.user_id; // ✅ Integer from users table
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // ✅ Handle optional image upload
    if (req.file) {
      imagePath = `/uploads/hazards/${req.file.filename}`;
    }

    const hazardData = {
      ...req.body,
      user_id: userId,
      image_url: imagePath,
      lat: parseFloat(req.body.lat),
      lng: parseFloat(req.body.lng),
    };
    if (isNaN(hazardData.lat) || isNaN(hazardData.lng)) {
      return res.status(400).json({ error: "Invalid latitude or longitude." });
    }

    // Step 1: Insert into DB
    const newHazard = await Hazard.create(hazardData);
    if (!newHazard) throw new Error("Failed to insert hazard");

    // Step 2: Find nearby hazards
    const neighbors = await Hazard.findHazardsNearLocation(
      newHazard.lat,
      newHazard.lng,
      0.3
    );

    // Step 3: Compute agreement & trust
    const agreement = await computeAgreement(newHazard, neighbors);
    const trust = await computeTrust([...neighbors, newHazard]);

    // Step 4: Update scores
    const updated = await Hazard.modifyHazard(newHazard.report_id, {
      agreement_score: agreement,
      trust_score: trust,
    });

    // Step 5: AI summary
    const summary = await summarizeHazard(updated);

    res.status(201).json({
      message: "✅ Hazard created successfully",
      hazard: updated,
      ai_summary: summary,
    });
  } catch (err) {
    console.error("❌ Failed to create hazard:", err);

    // 🧹 Cleanup: delete uploaded image if DB insert failed
    if (imagePath) {
      safeDeleteFile(`/uploads/hazards/${req.file.filename}`);
    }

    res.status(500).json({ error: "Failed to create hazard" });
  }
};


// Get hazards near location
export const getHazardsNearby = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius || 0.3);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ error: "Invalid latitude or longitude" });
    }

    const hazards = await Hazard.findHazardsNearLocation(latNum, lngNum, radiusNum);


    if (!hazards.length) {
      return res.json({
        message: "✅ No hazards found nearby.",
        hazards: [],
        ai_nearby_summary: "No hazards reported in your area. Safe to run!",
      });
    }

    // Generate AI summaries for each hazard (non-blocking, optional)
    const hazardsWithSummaries = await Promise.allSettled(
      hazards.map(async (hazard) => {
        try {
          const summary = await summarizeHazard(hazard);
          return { ...hazard, ai_summary: summary };
        } catch (e) {
          console.warn("⚠️ AI summary failed for hazard:", hazard.report_id, e.message);
          return { ...hazard, ai_summary: null };
        }
      })
    ).then(results =>
      results.map((result, idx) =>
        result.status === 'fulfilled' ? result.value : { ...hazards[idx], ai_summary: null }
      )
    );

    // Generate a single summarized overview for all nearby hazards (optional, non-blocking)
    let ai_nearby_summary = "Hazards reported in this area.";
    try {
      ai_nearby_summary = await summarizeNearbyHazards(hazardsWithSummaries);
    } catch (e) {
      console.warn("⚠️ AI nearby summary failed:", e.message);
    }

    res.json({
      message: "✅ Nearby hazards retrieved successfully.",
      hazards: hazardsWithSummaries,
      ai_nearby_summary,
    });
  } catch (err) {
    console.error("❌ Error fetching nearby hazards:", err);
    res.status(500).json({ error: "Failed to fetch hazards" });
  }
};



// GET /api/hazards/my-hazards
export const getUserHazards = async (req, res) => {
  try {
    const userId = req.user?.user_id; // ✅ Integer from users table
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const hazards = await Hazard.findByUser(userId);
    return res.status(200).json({
      message: "✅ Your reported hazards loaded successfully.",
      hazards,
    });
  } catch (err) {
    console.error("Error fetching user hazards:", err);
    return res.status(500).json({ error: "Failed to fetch your hazards." });
  }
};

// PUT /api/hazards/:id  (with optional file upload)
export const updateHazard = async (req, res) => {
  try {
    const userId = req.user?.user_id; // ✅ Integer from users table
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // If an image file was uploaded via multer, build image_url
    let image_url = null;
    if (req.file) {
      image_url = `/uploads/hazards/${req.file.filename}`;
    }

    // Build updates object (only provide fields that exist in request)
    const updates = {
      title: req.body.title ?? null,
      incident_type: req.body.incident_type ?? null,
      description: req.body.description ?? null,
      lat: req.body.lat ? parseFloat(req.body.lat) : null,
      lng: req.body.lng ? parseFloat(req.body.lng) : null,
      severity_weight: req.body.severity_weight ? parseFloat(req.body.severity_weight) : null,
      image_url, // will be null if no new image uploaded
      status: req.body.status ?? null,
    };
    
    if ((updates.lat && isNaN(updates.lat)) || (updates.lng && isNaN(updates.lng))) {
      return res.status(400).json({ error: "Invalid latitude or longitude." });
    }


    const updated = await Hazard.updateHazard(id, userId, updates);

    if (!updated) {
      return res.status(404).json({ error: "Hazard not found or not owned by you." });
    }

    return res.status(200).json({
      message: "✅ Hazard updated successfully.",
      hazard: updated,
    });
  } catch (err) {
      console.error("Error updating hazard:", err);
        // 🧹 Cleanup orphaned uploaded file if DB update failed
        if (req.file) {
          safeDeleteFile(`/uploads/hazards/${req.file.filename}`);
        }
        return res.status(500).json({ error: "Failed to update hazard." });
    }
};

// DELETE /api/hazards/:id
export const deleteHazard = async (req, res) => {
  try {
    const userId = req.user?.user_id; // ✅ Integer from users table
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const deleted = await Hazard.deleteHazard(id, userId);

    if (!deleted) {
      return res.status(404).json({ error: "Hazard not found or not owned by you." });
    }

    return res.status(200).json({
      message: "🗑️ Hazard deleted successfully.",
      deleted_hazard: deleted,
    });
  } catch (err) {
    console.error("Error deleting hazard:", err);
    return res.status(500).json({ error: "Failed to delete hazard." });
  }
};