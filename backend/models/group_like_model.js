import pool from "../utils/db.js";

// Count likes
export const countLikes = async (groupPostId) => {
  const result = await pool.query(
    "SELECT COUNT(*) FROM group_likes WHERE group_post_id=$1",
    [groupPostId]
  );
  return parseInt(result.rows[0].count, 10);
};

// Add like
export const addLike = async (groupPostId, userId) => {
  const result = await pool.query(
    `INSERT INTO group_likes (group_post_id, user_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
    [groupPostId, userId]
  );
  return result.rows[0];
};

// Remove like
export const removeLike = async (groupPostId, userId) => {
  await pool.query("DELETE FROM group_likes WHERE group_post_id=$1 AND user_id=$2", [
    groupPostId,
    userId,
  ]);
  return { message: "Like removed" };
};
