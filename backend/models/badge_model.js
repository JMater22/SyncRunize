import pool from "../utils/db.js";

// Get badges by user
export const findUserBadges = async (userId) => {
  const { rows } = await pool.query(
    `SELECT b.*, c.title AS challenge_title
     FROM badges b
     JOIN challenges c ON b.challenge_id = c.challenge_id
     WHERE b.user_id = $1
     ORDER BY b.awarded_at DESC`,
    [userId]
  );
  return rows;
};

// Delete badge (admin only)
export const removeBadge = async (id) => {
  const { rowCount } = await pool.query(
    `DELETE FROM badges WHERE badge_id = $1`,
    [id]
  );
  return rowCount > 0;
};
