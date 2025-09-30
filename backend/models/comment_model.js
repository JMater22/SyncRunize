import pool from "../utils/db.js";

// Get comments for a post
export const getCommentsByPost = async (postId) => {
  const result = await pool.query(
    `SELECT c.comment_id, c.content, c.created_at, u.username, u.profile_picture
     FROM comments c
     JOIN users u ON c.user_id = u.user_id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [postId]
  );
  return result.rows;
};

// Create new comment
export const createComment = async (postId, userId, content) => {
  const result = await pool.query(
    `INSERT INTO comments (post_id, user_id, content)
     VALUES ($1, $2, $3) RETURNING *`,
    [postId, userId, content]
  );
  return result.rows[0];
};

// Update comment
export const updateComment = async (commentId, content) => {
  const result = await pool.query(
    `UPDATE comments SET content = $1, updated_at = NOW()
     WHERE comment_id = $2 RETURNING *`,
    [content, commentId]
  );
  return result.rows[0];
};

// Delete comment
export const deleteComment = async (commentId) => {
  await pool.query(`DELETE FROM comments WHERE comment_id = $1`, [commentId]);
  return { message: "Comment deleted" };
};
