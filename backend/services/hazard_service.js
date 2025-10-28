// services/hazard_service.js
import axios from "axios";

const ALGO_ENGINE_URL = "http://127.0.0.1:8000"; // FastAPI engine

// 🧮 Agreement scoring
export const computeAgreement = async (report, neighbors) => {
  try {
    const formattedReport = {
      id: report.report_id,
      user_id: report.user_id,
      incident_type: report.incident_type, // 🔥 match Python model
      description: report.description,
      lat: report.lat,
      lng: report.lng,
      reported_at: report.reported_at,
      agreement_score: report.agreement_score || null,
    };

    const formattedNeighbors = neighbors.map((n) => ({
      id: n.report_id,
      user_id: n.user_id,
      incident_type: n.incident_type,
      description: n.description,
      lat: n.lat,
      lng: n.lng,
      reported_at: n.reported_at,
      agreement_score: n.agreement_score || null,
    }));

    const res = await axios.post(`${ALGO_ENGINE_URL}/agreement`, {
      report: formattedReport,
      neighbors: formattedNeighbors,
    });

    return res.data.agreement_score;
  } catch (err) {
    console.error("Agreement error:", err.response?.data || err.message);
    return null;
  }
};

// 🧮 Trust scoring
export const computeTrust = async (reports) => {
  try {
    const formattedReports = reports.map((r) => ({
      id: r.report_id,
      user_id: r.user_id,
      incident_type: r.incident_type, // 🔥 consistent naming
      description: r.description,
      lat: r.lat,
      lng: r.lng,
      reported_at: r.reported_at,
      agreement_score: r.agreement_score || null,
    }));

    const res = await axios.post(`${ALGO_ENGINE_URL}/trust`, formattedReports);
    return res.data.trust_score;
  } catch (err) {
    console.error("Trust error:", err.response?.data || err.message);
    return null;
  }
};
