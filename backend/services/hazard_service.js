// services/hazard_service.js
import axios from "axios";

const ALGO_ENGINE_URL = "http://127.0.0.1:8000"; // FastAPI engine

// 🧮 Agreement scoring
export const computeAgreement = async (report, neighbors) => {
  try {
    // ✅ CRITICAL FIX: Ensure reported_at is always a valid datetime
    // Supabase might not populate reported_at immediately in the returned object
    const reportedAt = report.reported_at || report.created_at || new Date().toISOString();

    const formattedReport = {
      id: report.report_id,
      user_id: report.user_id,
      incident_type: report.incident_type, // 🔥 match Python model
      description: report.description,
      lat: report.lat,
      lng: report.lng,
      reported_at: reportedAt,  // ✅ FIX: Use fallback datetime
      agreement_score: report.agreement_score || null,
    };

    const formattedNeighbors = neighbors.map((n) => ({
      id: n.report_id,
      user_id: n.user_id,
      incident_type: n.incident_type,
      description: n.description,
      lat: n.lat,
      lng: n.lng,
      reported_at: n.reported_at || n.created_at || new Date().toISOString(),  // ✅ FIX: Fallback
      agreement_score: n.agreement_score || null,
    }));

    const res = await axios.post(`${ALGO_ENGINE_URL}/agreement`, {
      report: formattedReport,
      neighbors: formattedNeighbors,
    }, {
      timeout: 10000, // ✅ FIX: 10-second timeout to prevent hanging if engine is down
    });

    return res.data.agreement_score;
  } catch (err) {
    console.error("❌ Agreement API error:", err.response?.data || err.message);
    if (err.response?.data?.detail) {
      console.error("❌ FastAPI validation error:", JSON.stringify(err.response.data.detail, null, 2));
    }
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
      reported_at: r.reported_at || r.created_at || new Date().toISOString(),  // ✅ FIX: Fallback
      agreement_score: r.agreement_score || null,
    }));

    const res = await axios.post(`${ALGO_ENGINE_URL}/trust`, formattedReports, {
      timeout: 10000, // ✅ FIX: 10-second timeout to prevent hanging if engine is down
    });
    return res.data.trust_score;
  } catch (err) {
    console.error("❌ Trust API error:", err.response?.data || err.message);
    if (err.response?.data?.detail) {
      console.error("❌ FastAPI validation error:", JSON.stringify(err.response.data.detail, null, 2));
    }
    return null;
  }
};
