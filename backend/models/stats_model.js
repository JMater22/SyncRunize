// models/stats_model.js
import pool from "../utils/db.js";

/**
 * Fetch user statistics grouped by day, week, or month
 * Optionally filter by date range
 */
export const getUserStats = async (userId, period = "month", start_date = null, end_date = null) => {
  let groupByClause;

  switch (period) {
    case "day":
      groupByClause = `TO_CHAR(created_at, 'YYYY-MM-DD')`;
      break;
    case "week":
      groupByClause = `TO_CHAR(created_at, 'IYYY-IW')`;
      break;
    case "month":
    default:
      groupByClause = `TO_CHAR(created_at, 'YYYY-MM')`;
      break;
  }

  // Base query with explicit NUMERIC casting
  let query = `
    SELECT 
      ${groupByClause} AS period,
      COUNT(*) AS total_runs,
      ROUND(SUM(distance)::NUMERIC, 2) AS total_distance,
      ROUND(AVG(average_pace)::NUMERIC, 2) AS avg_pace,
      ROUND(SUM(estimated_calories)::NUMERIC, 2) AS total_calories
    FROM user_routes
    WHERE user_id = $1
  `;

  const params = [userId];
  let paramIndex = 2;

  // Add date filters dynamically
  if (start_date) {
    query += ` AND created_at >= $${paramIndex++}`;
    params.push(start_date);
  }
  if (end_date) {
    query += ` AND created_at <= $${paramIndex++}`;
    params.push(end_date);
  }

  query += `
    GROUP BY period
    ORDER BY period ASC;
  `;

  const { rows } = await pool.query(query, params);
  return rows;
};