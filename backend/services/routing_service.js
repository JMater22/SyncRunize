// services/routing_service.js
import axios from "axios";

const ALGO_ENGINE_URL = process.env.ALGORITHM_ENGINE_URL || "http://127.0.0.1:8000";

export const getSafestRoute = async (start, end, alpha = 0.5) => {
  try {
    const res = await axios.post(`${ALGO_ENGINE_URL}/route-osm`, {
      start,
      end,
      alpha,
    });
    return res.data.coordinates;
  } catch (err) {
    console.error("Routing error:", err.message);
    return [];
  }
};
