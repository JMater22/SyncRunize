// controllers/user_route_controller.js
import * as RouteModel from "../models/user_route_model.js";

/**
 * POST /api/routes
 * Create a new route entry for the user
 */
export const createRoute = async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT
    const routeData = { ...req.body, user_id: userId };

    const route = await RouteModel.createRoute(routeData);

    res.status(201).json({
      message: "Route recorded successfully",
      route,
    });
  } catch (err) {
    console.error("Error creating route:", err);
    res.status(500).json({ error: "Failed to save route" });
  }
};
