// controllers/stats_controller.js
import * as StatsModel from "../models/stats_model.js";

/**
 * Get user statistics within a specific date range.
 * Example: ?range=week OR ?range=month OR custom ?start=2025-10-01&end=2025-10-09
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { range, start, end } = req.query;

    let startDate, endDate;
    const today = new Date();

    if (range === "week") {
      endDate = today;
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (range === "month") {
      endDate = today;
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
    } else {
      return res.status(400).json({ error: "Specify range=week|month or start/end dates" });
    }

    const stats = await StatsModel.getUserStatsByRange(
      userId,
      startDate.toISOString(),
      endDate.toISOString()
    );

    res.json({
      range: range || "custom",
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      ...stats,
    });
  } catch (err) {
    console.error("Failed to fetch stats:", err);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};

/**
 * Get monthly summaries (for charts or dashboard)
 */
export const getMonthlyStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await StatsModel.getUserStatsByMonth(userId);
    res.json(stats);
  } catch (err) {
    console.error("Failed to fetch monthly stats:", err);
    res.status(500).json({ error: "Failed to fetch monthly statistics" });
  }
};
