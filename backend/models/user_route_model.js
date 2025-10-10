// models/user_route_model.js
import pool from "../utils/db.js";

/**
 * Estimate calories burned (simplified formula)
 * MET × weight(kg) × time(hours)
 * - Running ~ 9.8 MET average (light jog)
 */
const estimateCalories = (distance, durationSeconds, userWeightKg = 70) => {
  // Convert seconds to hours
  const durationHours = durationSeconds / 3600;
  // Base MET for jogging (moderate pace)
  const MET = 9.8;

  const calories = MET * userWeightKg * durationHours;
  return Math.round(calories * 100) / 100; // 2 decimal places
};

/**
 * Create and store a route
 */
export const createRoute = async (data) => {
  const {
    user_id,
    start_lat,
    start_lng,
    end_lat,
    end_lng,
    chosen_path,
    distance,
    duration_seconds,
    average_pace,
    risk_score = 0,
    user_weight = 70, // optional, if you later store user profile weight
  } = data;

  const estimated_calories = estimateCalories(distance, duration_seconds, user_weight);

  const result = await pool.query(
    `INSERT INTO user_routes (
      user_id, start_lat, start_lng, end_lat, end_lng,
      chosen_path, distance, duration_seconds, average_pace,
      risk_score, estimated_calories, created_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()
    ) RETURNING *`,
    [
      user_id,
      start_lat,
      start_lng,
      end_lat,
      end_lng,
      JSON.stringify(chosen_path),
      distance,
      duration_seconds,
      average_pace,
      risk_score,
      estimated_calories,
    ]
  );

  return result.rows[0];
};
