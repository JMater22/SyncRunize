// controllers/routing_controller.js
import { getSafestRoute } from "../services/routing_service.js";

export const getRoute = async (req, res) => {
  try {
    const { start, end, alpha } = req.body;
    const coords = await getSafestRoute(start, end, alpha);
    res.json({ coordinates: coords });
  } catch (err) {
    res.status(500).json({ error: "Failed to get route" });
  }
};
