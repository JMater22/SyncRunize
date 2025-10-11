// controllers/stats_controller.js
import * as StatsModel from "../models/stats_model.js";

export const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period, start_date, end_date } = req.query;

    const stats = await StatsModel.getUserStats(userId, period, start_date, end_date);
    res.json(stats);
  } catch (err) {
    console.error("Stats retrieval error:", err);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};
