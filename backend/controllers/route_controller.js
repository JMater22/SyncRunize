import { getUnSavedPublicRoutes } from "../models/route_model.js";
import { generateRouteSafetyWarnings } from "../services/ai_service.js";

export const getUnSavedPublicRoutesController = async (req, res) => {
  try {
    const userId = req.user?.user_id || null;
    const routes = await getUnSavedPublicRoutes(userId);

    return res.status(200).json({
      message: "Un-saved public routes retrieved successfully",
      routes,
    });
  } catch (error) {
    console.error("Error fetching un-saved public routes:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/routes/enhance-safety-warnings
 * Enhances route safety warnings with AI-generated text
 */
export const enhanceSafetyWarnings = async (req, res) => {
  try {
    const { safetyAnalysis } = req.body;

    if (!safetyAnalysis || !safetyAnalysis.warnings) {
      return res.status(400).json({ error: "Missing safetyAnalysis in request body" });
    }

    const enhancedWarnings = await generateRouteSafetyWarnings(safetyAnalysis);

    return res.status(200).json({
      message: "Safety warnings enhanced successfully",
      warnings: enhancedWarnings,
      stats: safetyAnalysis.stats
    });
  } catch (error) {
    console.error("Error enhancing safety warnings:", error);
    // Return original warnings on error
    return res.status(200).json({
      message: "Using original safety warnings (AI enhancement failed)",
      warnings: req.body.safetyAnalysis?.warnings || [],
      stats: req.body.safetyAnalysis?.stats || {}
    });
  }
};
