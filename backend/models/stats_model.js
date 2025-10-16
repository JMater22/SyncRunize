// models/stats_model.js
import pool from "../utils/db.js";

/**
 * Get aggregated run statistics by time period and optional date range
 * @param {number} userId
 * @param {"day"|"week"|"month"} period - Grouping period
 * @param {string|Date} startDate - Optional start date filter
 * @param {string|Date} endDate - Optional end date filter
 */
export const getUserStats = async (userId, period = "month", startDate = null, endDate = null) => {
  const validPeriods = ["day", "week", "month"];
  if (!validPeriods.includes(period)) period = "month";

  // Build dynamic WHERE clause
  let filters = [`user_id = $1`];
  let values = [userId];
  let paramIndex = 2;

  // If no date range provided, default to current period
  if (!startDate && !endDate) {
    filters.push(`created_at >= DATE_TRUNC('${period}', CURRENT_TIMESTAMP)`);
  } else {
    if (startDate) {
      filters.push(`created_at >= $${paramIndex++}`);
      values.push(startDate);
    }
    if (endDate) {
      filters.push(`created_at <= $${paramIndex++}`);
      values.push(endDate);
    }
  }

  const query = `
    SELECT 
      DATE_TRUNC('${period}', created_at) AS period_start,
      SUM(distance) AS total_distance,
      AVG(average_pace) AS avg_pace,
      SUM(estimated_calories) AS total_calories,
      COUNT(*) AS runs_count
    FROM user_routes
    WHERE ${filters.join(" AND ")}
    GROUP BY period_start
    ORDER BY period_start ASC;
  `;

  const { rows } = await pool.query(query, values);
  return rows;
};

/**
 * Get statistics for the current period only (day/week/month)
 * @param {number} userId
 * @param {"day"|"week"|"month"} period
 */
export const getCurrentPeriodStats = async (userId, period = "month") => {
  const validPeriods = ["day", "week", "month"];
  if (!validPeriods.includes(period)) period = "month";

  const query = `
    SELECT 
      SUM(distance) AS total_distance,
      AVG(average_pace) AS avg_pace,
      SUM(estimated_calories) AS total_calories,
      COUNT(*) AS runs_count,
      DATE_TRUNC('${period}', CURRENT_TIMESTAMP) AS period_start
    FROM user_routes
    WHERE user_id = $1
      AND created_at >= DATE_TRUNC('${period}', CURRENT_TIMESTAMP)
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0] || {
    total_distance: 0,
    avg_pace: 0,
    total_calories: 0,
    runs_count: 0,
    period_start: null
  };
};