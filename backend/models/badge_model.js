// models/badge_model.js
import pool from "../utils/db.js";

export const getBadgeByChallenge = async (challengeId) => {
  const { rows } = await pool.query(
    `SELECT b.* FROM badges b
     JOIN challenge_badges cb ON cb.badge_id = b.badge_id
     WHERE cb.challenge_id = $1
     LIMIT 1`,
    [challengeId]
  );
  return rows[0];
};
