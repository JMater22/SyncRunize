// models/stats_model.js
import { supabase } from "../utils/supabase.js";

/**
 * Get aggregated run statistics by time period and optional date range
 * @param {number} userId
 * @param {"day"|"week"|"month"} period - Grouping period
 * @param {string|Date} startDate - Optional start date filter
 * @param {string|Date} endDate - Optional end date filter
 *
 * TODO: This uses PostgreSQL DATE_TRUNC. Create a PostgreSQL function in Supabase SQL Editor:
 *
 * CREATE OR REPLACE FUNCTION get_user_stats(
 *   p_user_id INT,
 *   p_period TEXT DEFAULT 'month',
 *   p_start_date TIMESTAMP DEFAULT NULL,
 *   p_end_date TIMESTAMP DEFAULT NULL
 * )
 * RETURNS TABLE (
 *   period_start TIMESTAMP,
 *   total_distance FLOAT,
 *   avg_pace FLOAT,
 *   total_calories FLOAT,
 *   runs_count BIGINT
 * ) AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT
 *     DATE_TRUNC(p_period, created_at) AS period_start,
 *     SUM(distance) AS total_distance,
 *     AVG(average_pace) AS avg_pace,
 *     SUM(estimated_calories) AS total_calories,
 *     COUNT(*) AS runs_count
 *   FROM user_routes
 *   WHERE user_id = p_user_id
 *     AND (p_start_date IS NULL OR created_at >= p_start_date)
 *     AND (p_end_date IS NULL OR created_at <= p_end_date)
 *     AND (p_start_date IS NOT NULL OR p_end_date IS NOT NULL OR created_at >= DATE_TRUNC(p_period, CURRENT_TIMESTAMP))
 *   GROUP BY period_start
 *   ORDER BY period_start ASC;
 * END;
 * $$ LANGUAGE plpgsql;
 */
export const getUserStats = async (userId, period = "month", startDate = null, endDate = null) => {
  const validPeriods = ["day", "week", "month"];
  if (!validPeriods.includes(period)) period = "month";

  const { data, error } = await supabase.rpc('get_user_stats', {
    p_user_id: userId,
    p_period: period,
    p_start_date: startDate,
    p_end_date: endDate
  });

  if (error) throw error;
  return data || [];
};

/**
 * Get statistics for the current period only (day/week/month)
 * @param {number} userId
 * @param {"day"|"week"|"month"} period
 *
 * TODO: Create PostgreSQL function in Supabase SQL Editor:
 *
 * CREATE OR REPLACE FUNCTION get_current_period_stats(
 *   p_user_id INT,
 *   p_period TEXT DEFAULT 'month'
 * )
 * RETURNS TABLE (
 *   total_distance FLOAT,
 *   avg_pace FLOAT,
 *   total_calories FLOAT,
 *   runs_count BIGINT,
 *   period_start TIMESTAMP
 * ) AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT
 *     SUM(distance) AS total_distance,
 *     AVG(average_pace) AS avg_pace,
 *     SUM(estimated_calories) AS total_calories,
 *     COUNT(*) AS runs_count,
 *     DATE_TRUNC(p_period, CURRENT_TIMESTAMP) AS period_start
 *   FROM user_routes
 *   WHERE user_id = p_user_id
 *     AND created_at >= DATE_TRUNC(p_period, CURRENT_TIMESTAMP);
 * END;
 * $$ LANGUAGE plpgsql;
 */
export const getCurrentPeriodStats = async (userId, period = "month") => {
  const validPeriods = ["day", "week", "month"];
  if (!validPeriods.includes(period)) period = "month";

  const { data, error } = await supabase.rpc('get_current_period_stats', {
    p_user_id: userId,
    p_period: period
  });

  if (error) throw error;

  return (data && data[0]) || {
    total_distance: 0,
    avg_pace: 0,
    total_calories: 0,
    runs_count: 0,
    period_start: null
  };
};