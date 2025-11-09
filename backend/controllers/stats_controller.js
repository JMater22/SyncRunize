// controllers/stats_controller.js
import * as StatsModel from "../models/stats_model.js";

/**
 * Get user statistics with optional filtering
 * Route: GET /stats/:userId
 * Query params: period (day|week|month), start_date, end_date
 */
export const getStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period, start_date, end_date } = req.query;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: "Invalid or missing user ID" });
    }

    const validPeriods = ["day", "week", "month"];
    const selectedPeriod = period?.toLowerCase() || "month";

    if (period && !validPeriods.includes(selectedPeriod)) {
      return res.status(400).json({ error: "Invalid period. Must be 'day', 'week', or 'month'" });
    }

    const startDate = start_date && start_date.trim() !== "" ? start_date : null;
    const endDate = end_date && end_date.trim() !== "" ? end_date : null;

    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({ error: "Invalid start_date format" });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({ error: "Invalid end_date format" });
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: "start_date cannot be after end_date" });
    }

    const stats = await StatsModel.getUserStats(
      parseInt(userId),
      selectedPeriod,
      startDate,
      endDate
    );

    res.json({
      user_id: parseInt(userId),
      period: selectedPeriod,
      date_range: { start: startDate, end: endDate },
      data: stats
    });
  } catch (err) {
    console.error("Stats retrieval failed:", err);
    res.status(500).json({ error: "Failed to fetch user stats" });
  }
};

/**
 * Get current period stats
 * Route: GET /stats/:userId/current
 * Query params: period (day|week|month)
 */
export const getCurrentStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: "Invalid or missing user ID" });
    }

    const validPeriods = ["day", "week", "month"];
    const selectedPeriod = period?.toLowerCase() || "month";

    if (period && !validPeriods.includes(selectedPeriod)) {
      return res.status(400).json({ error: "Invalid period. Must be 'day', 'week', or 'month'" });
    }

    const stats = await StatsModel.getCurrentPeriodStats(parseInt(userId), selectedPeriod);

    res.json({
      user_id: parseInt(userId),
      period: selectedPeriod,
      current: true,
      ...stats
    });
  } catch (err) {
    console.error("Current stats retrieval failed:", err);
    res.status(500).json({ error: "Failed to fetch current stats" });
  }
};

/**
 * Get personal records for a user
 * Route: GET /stats/:userId/records
 */
export const getPersonalRecords = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: "Invalid or missing user ID" });
    }

    const records = await StatsModel.getPersonalRecords(parseInt(userId));

    res.json({
      user_id: parseInt(userId),
      records,
    });
  } catch (err) {
    console.error("Personal records retrieval failed:", err);
    res.status(500).json({ error: "Failed to fetch personal records" });
  }
};
