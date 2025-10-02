// services/hazard_service.js
import axios from "axios";

const ALGO_ENGINE_URL = "http://localhost:8000"; // FastAPI engine

// Agreement scoring
export const computeAgreement = async (report, neighbors) => {
  try {
    const res = await axios.post(`${ALGO_ENGINE_URL}/agreement`, {
      report,
      neighbors,
    });
    return res.data.agreement_score;
  } catch (err) {
    console.error("Agreement error:", err.message);
    return null;
  }
};

// Trust scoring
export const computeTrust = async (reports) => {
  try {
    const res = await axios.post(`${ALGO_ENGINE_URL}/trust`, reports);
    return res.data.trust_score;
  } catch (err) {
    console.error("Trust error:", err.message);
    return null;
  }
};
