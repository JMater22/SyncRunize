// services/hazard_service.js
// Handles hazard trust/agreement scoring via Python FastAPI

import axios from "axios";

const HAZARD_API_URL = process.env.HAZARD_API_URL || "http://localhost:8000";

export const recalculateHazardScores = async (reportId) => {
  try {
    // Stub call — adjust endpoint once Python backend is ready
    const res = await axios.post(`${HAZARD_API_URL}/hazards/recalculate`, {
      reportId,
    });
    return res.data;
  } catch (err) {
    console.error("Hazard service error:", err.message);
    throw err;
  }
};
