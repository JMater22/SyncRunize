// services/hazard_service.js
import axios from "axios";
import axiosRetry from "axios-retry";

const ALGO_ENGINE_URL = process.env.ALGORITHM_ENGINE_URL || "http://127.0.0.1:8000"; // FastAPI engine

// ✅ FIX: Configure retry logic for algorithm engine API calls
// Retries on network errors and 5xx server errors (Render cold starts, timeouts)
axiosRetry(axios, {
  retries: 3, // Retry up to 3 times
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff: 1s, 2s, 4s
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status >= 500 && error.response?.status < 600);
  },
  onRetry: (retryCount, error) => {
    console.warn(`[Retry ${retryCount}/3] Algorithm API call failed:`, error.message);
  }
});

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
      timeout: 30000, // ✅ FIX: 30-second timeout for heavy load scenarios
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
      timeout: 30000, // ✅ FIX: 30-second timeout for heavy load scenarios
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
