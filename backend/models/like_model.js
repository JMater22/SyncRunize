import pool from "../utils/db.js";

// Count likes for a post
export const countLikes = async (postId) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM likes WHERE post_id = $1`,
    [postId]
  );
  return parseInt(result.rows[0].count, 10);
};

// Add a like
export const addLike = async (postId, userId) => {
  const result = await pool.query(
    `INSERT INTO likes (post_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, post_id) DO NOTHING
     RETURNING *`,
    [postId, userId]
  );
  return result.rows[0]; // null if already liked
};

// Remove a like (unlike)
export const removeLike = async (postId, userId) => {
  await pool.query(
    `DELETE FROM likes WHERE post_id = $1 AND user_id = $2`,
    [postId, userId]
  );
  return { message: "Unliked successfully" };
};
