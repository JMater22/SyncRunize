// controllers/stats_controller.js
import * as StatsModel from "../models/stats_model.js";

/**
 * Get user statistics with optional filtering
 * Query params: period (day|week|month), start_date, end_date
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period, start_date, end_date } = req.query;

    // Validate period
    const validPeriods = ["day", "week", "month"];
    const selectedPeriod = period?.toLowerCase() || "month";
    
    if (period && !validPeriods.includes(selectedPeriod)) {
      return res.status(400).json({ 
        error: "Invalid period. Must be 'day', 'week', or 'month'" 
      });
    }

    // Validate dates if provided
    const startDate = start_date && start_date.trim() !== "" ? start_date : null;
    const endDate = end_date && end_date.trim() !== "" ? end_date : null;

    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({ error: "Invalid start_date format" });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({ error: "Invalid end_date format" });
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ 
        error: "start_date cannot be after end_date" 
      });
    }

    const stats = await StatsModel.getUserStats(
      userId,
      selectedPeriod,
      startDate,
      endDate
    );

    res.json({
      period: selectedPeriod,
      date_range: {
        start: startDate,
        end: endDate
      },
      data: stats
    });

  } catch (err) {
    console.error("Stats retrieval failed:", err);
    res.status(500).json({ error: "Failed to fetch user stats" });
  }
};

/**
 * Get current period stats (simplified endpoint)
 * Query params: period (day|week|month)
 */
export const getCurrentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period } = req.query;

    const validPeriods = ["day", "week", "month"];
    const selectedPeriod = period?.toLowerCase() || "month";

    if (period && !validPeriods.includes(selectedPeriod)) {
      return res.status(400).json({ 
        error: "Invalid period. Must be 'day', 'week', or 'month'" 
      });
    }

    const stats = await StatsModel.getCurrentPeriodStats(userId, selectedPeriod);

    res.json({
      period: selectedPeriod,
      current: true,
      ...stats
    });

  } catch (err) {
    console.error("Current stats retrieval failed:", err);
    res.status(500).json({ error: "Failed to fetch current stats" });
  }
};