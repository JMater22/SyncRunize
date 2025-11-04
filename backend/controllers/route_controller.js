import { getUnSavedPublicRoutes } from "../models/route_model.js";

export const getUnSavedPublicRoutesController = async (req, res) => {
  try {
    const userId = req.user.user_id; // assuming `req.user` is set by auth middleware
    const routes = await getUnSavedPublicRoutes(userId);

    return res.status(200).json({
      message: "Un-saved public routes retrieved successfully",
      routes,
    });
  } catch (error) {
    console.error("Error fetching un-saved public routes:", error);
    return res.status(500).json({ error: error.message });
  }
};
