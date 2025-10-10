// models/stats_model.js
import pool from "../utils/db.js";

/**
 * Retrieve summarized statistics for a user over a custom date range.
 * @param {number} userId - Current logged-in user's ID.
 * @param {string} startDate - ISO start date (YYYY-MM-DD)
 * @param {string} endDate - ISO end date (YYYY-MM-DD)
 */
export const getUserStatsByRange = async (userId, startDate, endDate) => {
  const query = `
    SELECT
      COUNT(*) AS runs_count,
      COALESCE(SUM(distance), 0) AS total_distance,
      COALESCE(AVG(average_pace), 0) AS avg_pace,
      COALESCE(SUM(estimated_calories), 0) AS total_calories
    FROM user_routes
    WHERE user_id = $1
      AND created_at BETWEEN $2 AND $3;
  `;
  const { rows } = await pool.query(query, [userId, startDate, endDate]);
  return rows[0];
};

/**
 * Retrieve monthly stats aggregation (grouped by month).
 */
export const getUserStatsByMonth = async (userId) => {
  const query = `
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      COUNT(*) AS runs_count,
      COALESCE(SUM(distance), 0) AS total_distance,
      COALESCE(AVG(average_pace), 0) AS avg_pace,
      COALESCE(SUM(estimated_calories), 0) AS total_calories
    FROM user_routes
    WHERE user_id = $1
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};
