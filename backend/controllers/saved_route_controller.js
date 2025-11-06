// controllers/saved_route_controller.js
import * as SavedRouteModel from "../models/saved_route_model.js";

export const saveRoute = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { route_id } = req.body;

    if (!route_id) {
      return res.status(400).json({ error: "Route ID is required" });
    }

    const saved = await SavedRouteModel.saveRoute(user_id, route_id);
    res.status(201).json({ message: "Route saved successfully", saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const unsaveRoute = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { route_id } = req.body;

    if (!route_id) {
      return res.status(400).json({ error: "Route ID is required" });
    }

    await SavedRouteModel.unsaveRoute(user_id, route_id);
    res.status(200).json({ message: "Route unsaved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMySavedRoutes = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const savedRoutes = await SavedRouteModel.getSavedRoutesByUser(user_id);
    res.status(200).json(savedRoutes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkIfRouteSaved = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const route_id = parseInt(req.params.route_id);
    const isSaved = await SavedRouteModel.isRouteSaved(user_id, route_id);
    res.status(200).json({ route_id, isSaved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
