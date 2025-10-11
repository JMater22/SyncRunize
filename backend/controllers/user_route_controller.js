// controllers/user_route_controller.js
import * as RouteModel from "../models/user_route_model.js";

export const createRoute = async (req, res) => {
  try {
    const userId = req.user.userId;
    const newRoute = await RouteModel.createRoute({ ...req.body, user_id: userId });
    res.status(201).json(newRoute);
  } catch (err) {
    console.error("Route creation failed:", err);
    res.status(500).json({ error: "Failed to save route" });
  }
};
  