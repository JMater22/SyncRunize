// controllers/hazard_report_controller.js
import * as HazardModel from "../models/hazard_report_model.js";
import { supabase } from "../utils/supabase.js";

/**
 * Helper: Get user ID from auth token
 */
const fetchUserIdFromAuth = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error("Missing Authorization header");

  const token = authHeader.split(' ')[1];
  if (!token) throw new Error("Invalid Authorization header");

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('users')
    .select('user_id')
    .eq('auth_id', user.id)
    .single();

  if (error) throw error;
  return data.user_id;
};

/**
 * Create a new hazard report
 * POST /api/hazards
 */
export const createHazardReport = async (req, res) => {
  try {
    const userId = await fetchUserIdFromAuth(req);

    const {
      incident_type,
      title,
      description,
      lat,
      lng,
      image_url,
      severity_weight
    } = req.body;

    // Validation
    if (!incident_type || !title || !lat || !lng) {
      return res.status(400).json({
        error: "Missing required fields: incident_type, title, lat, lng"
      });
    }

    const newReport = await HazardModel.createHazardReport({
      user_id: userId,
      incident_type,
      title,
      description,
      lat,
      lng,
      image_url,
      severity_weight
    });

    res.status(201).json({
      message: "Hazard report created successfully",
      report: newReport
    });
  } catch (err) {
    console.error("❌ Create hazard report failed:", err);
    res.status(500).json({ error: err.message || "Failed to create hazard report" });
  }
};

/**
 * Get hazards within map bounds
 * GET /api/hazards/bounds?minLat=...&maxLat=...&minLng=...&maxLng=...
 */
export const getHazardsInBounds = async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng, status } = req.query;

    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({
        error: "Missing required query params: minLat, maxLat, minLng, maxLng"
      });
    }

    const hazards = await HazardModel.getHazardsInBounds({
      minLat: parseFloat(minLat),
      maxLat: parseFloat(maxLat),
      minLng: parseFloat(minLng),
      maxLng: parseFloat(maxLng),
      status: status || 'active'
    });

    res.json(hazards);
  } catch (err) {
    console.error("❌ Get hazards in bounds failed:", err);
    res.status(500).json({ error: err.message || "Failed to fetch hazards" });
  }
};

/**
 * Get a single hazard by ID
 * GET /api/hazards/:reportId
 */
export const getHazardById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const hazard = await HazardModel.getHazardById(parseInt(reportId));

    if (!hazard) {
      return res.status(404).json({ error: "Hazard report not found" });
    }

    res.json(hazard);
  } catch (err) {
    console.error("❌ Get hazard by ID failed:", err);
    res.status(500).json({ error: err.message || "Failed to fetch hazard" });
  }
};

/**
 * Get user's hazard reports
 * GET /api/hazards/user/:userId
 */
export const getUserHazardReports = async (req, res) => {
  try {
    const { userId } = req.params;
    const filters = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      status: req.query.status
    };

    const hazards = await HazardModel.getUserHazardReports(parseInt(userId), filters);

    res.json(hazards);
  } catch (err) {
    console.error("❌ Get user hazards failed:", err);
    res.status(500).json({ error: err.message || "Failed to fetch user hazards" });
  }
};

/**
 * Get authenticated user's own hazard reports
 * GET /api/hazards/my-reports
 */
export const getMyHazardReports = async (req, res) => {
  try {
    const userId = await fetchUserIdFromAuth(req);

    const filters = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      status: req.query.status
    };

    const hazards = await HazardModel.getUserHazardReports(userId, filters);

    res.json(hazards);
  } catch (err) {
    console.error("❌ Get my hazards failed:", err);
    res.status(500).json({ error: err.message || "Failed to fetch your hazards" });
  }
};

/**
 * Update hazard status
 * PATCH /api/hazards/:reportId/status
 */
export const updateHazardStatus = async (req, res) => {
  try {
    const userId = await fetchUserIdFromAuth(req);
    const { reportId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const updatedHazard = await HazardModel.updateHazardStatus(
      parseInt(reportId),
      status,
      userId
    );

    res.json({
      message: "Hazard status updated successfully",
      hazard: updatedHazard
    });
  } catch (err) {
    console.error("❌ Update hazard status failed:", err);
    res.status(500).json({ error: err.message || "Failed to update hazard status" });
  }
};

/**
 * Delete hazard report
 * DELETE /api/hazards/:reportId
 */
export const deleteHazardReport = async (req, res) => {
  try {
    const userId = await fetchUserIdFromAuth(req);
    const { reportId } = req.params;

    const deleted = await HazardModel.deleteHazardReport(parseInt(reportId), userId);

    res.json({
      message: "Hazard report deleted successfully",
      report: deleted
    });
  } catch (err) {
    console.error("❌ Delete hazard failed:", err);
    res.status(500).json({ error: err.message || "Failed to delete hazard report" });
  }
};

/**
 * Get all incident types
 * GET /api/hazards/incident-types
 */
export const getIncidentTypes = async (req, res) => {
  try {
    const types = await HazardModel.getIncidentTypes();
    res.json(types);
  } catch (err) {
    console.error("❌ Get incident types failed:", err);
    res.status(500).json({ error: err.message || "Failed to fetch incident types" });
  }
};

/**
 * Get hazards near a route (for route safety calculation)
 * POST /api/hazards/near-route
 */
export const getHazardsNearRoute = async (req, res) => {
  try {
    const { coordinates, radiusKm = 0.5 } = req.body;

    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ error: "coordinates array is required" });
    }

    // Get hazards near each coordinate point
    const allHazards = [];
    const seenIds = new Set();

    for (const coord of coordinates) {
      const { lat, lng } = coord;
      const nearbyHazards = await HazardModel.getHazardsNearPoint(lat, lng, radiusKm);

      // Deduplicate
      for (const hazard of nearbyHazards) {
        if (!seenIds.has(hazard.report_id)) {
          seenIds.add(hazard.report_id);
          allHazards.push(hazard);
        }
      }
    }

    res.json(allHazards);
  } catch (err) {
    console.error("❌ Get hazards near route failed:", err);
    res.status(500).json({ error: err.message || "Failed to fetch hazards near route" });
  }
};
