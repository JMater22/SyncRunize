// models/user_challenge_model.js
import pool from "../utils/db.js";

export const createUserChallenge = async (userId, challengeId) => {
  const { rows } = await pool.query(
    `INSERT INTO user_challenges (user_id, challenge_id) VALUES ($1, $2) RETURNING *`,
    [userId, challengeId]
  );
  return rows[0];
};

export const deleteUserChallenge = async (userChallengeId) => {
  await pool.query(
    `DELETE FROM user_challenges WHERE user_challenge_id = $1`,
    [userChallengeId]
  );
};

export const getUserChallenges = async (userId) => {
  const { rows } = await pool.query(
    `SELECT * FROM user_challenges WHERE user_id = $1`,
    [userId]
  );
  return rows;
};

export const updateProgress = async (userChallengeId, { add_distance, add_runs }) => {
  const { rows } = await pool.query(
    `UPDATE user_challenges
     SET total_distance_km = total_distance_km + $1,
         total_runs = total_runs + $2,
         updated_at = NOW()
     WHERE user_challenge_id = $3
     RETURNING *`,
    [add_distance, add_runs, userChallengeId]
  );
  console.log("📊 Updating progress for:", { userChallengeId, add_distance, add_runs });

  return rows[0];
};

export const setProgress = async (userChallengeId, fields) => {
  const {
    total_distance_km,
    total_runs,
    progress_percent,
    completed,
    awarded_badge_id,
  } = fields;

  const { rows } = await pool.query(
    `UPDATE user_challenges
     SET total_distance_km = $1,
         total_runs = $2,
         progress_percent = $3,
         completed = $4,
         awarded_badge_id = $5,
         updated_at = NOW()
     WHERE user_challenge_id = $6
     RETURNING *`,
    [
      total_distance_km,
      total_runs,
      progress_percent,
      completed,
      awarded_badge_id,
      userChallengeId,
    ]
  );
  return rows[0];
};
