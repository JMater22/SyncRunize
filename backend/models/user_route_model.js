// models/user_route_model.js
import pool from "../utils/db.js";

/**
 * Estimate calories burned based on average pace and duration.
 * Default user weight = 70 kg (can later be personalized).
 */
const estimateCalories = (paceMinPerKm, durationSec, weightKg = 70) => {
  // Convert duration to hours
  const durationHrs = durationSec / 3600;

  // Determine MET value
  let MET;
  if (paceMinPerKm >= 8) MET = 7.0;
  else if (paceMinPerKm >= 7) MET = 8.3;
  else if (paceMinPerKm >= 6) MET = 9.8;
  else MET = 11.5;

  // Compute calories
  return +(MET * weightKg * durationHrs).toFixed(2);
};

/**
 * Create new route record with automatic calorie estimate
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
    route_name = 'Unnamed Route', // Changed from null to 'Unnamed Route'
  } = data;

  const estimated_calories = estimateCalories(average_pace, duration_seconds);

  const result = await pool.query(
    `INSERT INTO user_routes 
      (user_id, start_lat, start_lng, end_lat, end_lng, chosen_path, distance,
       duration_seconds, average_pace, risk_score, estimated_calories, route_name, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
     RETURNING *`,
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
      route_name,
    ]
  );

  return result.rows[0];
};