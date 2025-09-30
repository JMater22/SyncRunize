// services/routing_service.js
// Calls Python FastAPI for Dijkstra safe routing

import axios from "axios";

const ROUTING_API_URL = process.env.ROUTING_API_URL || "http://localhost:8000";

export const getSafeRoute = async (startLat, startLng, endLat, endLng) => {
  try {
    // Stub call — adjust endpoint later
    const res = await axios.post(`${ROUTING_API_URL}/route`, {
      start: [startLat, startLng],
      end: [endLat, endLng],
    });
    return res.data;
  } catch (err) {
    console.error("Routing service error:", err.message);
    throw err;
  }
};
