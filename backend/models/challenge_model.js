// models/challenge_model.js
import pool from "../utils/db.js";

export const getAllChallenges = async () => {
  const { rows } = await pool.query(
    `SELECT challenge_id, slug, name, description, target_distance_km, duration_days, intensity
     FROM challenges ORDER BY created_at DESC`
  );
  return rows;
};

export const getChallengeById = async (challengeId) => {
  const { rows } = await pool.query(
    `SELECT challenge_id, slug, name, description, target_distance_km, duration_days, intensity
     FROM challenges WHERE challenge_id = $1`,
    [challengeId]
  );
  return rows[0];
};
