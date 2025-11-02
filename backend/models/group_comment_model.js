import pool from "../utils/db.js";

// Get comments by group post
export const getComments = async (groupPostId) => {
  const result = await pool.query(
    `SELECT gc.*, u.username, u.profile_picture
     FROM group_comments gc
     JOIN users u ON gc.user_id = u.user_id
     WHERE gc.group_post_id = $1
     ORDER BY gc.created_at ASC`,
    [groupPostId]
  );
  return result.rows;
};

// Create comment
export const createComment = async (groupPostId, userId, content) => {
  const result = await pool.query(
    `INSERT INTO group_comments (group_post_id, user_id, content)
     VALUES ($1, $2, $3) RETURNING *`,
    [groupPostId, userId, content]
  );
  return result.rows[0];
};

// Update comment
export const updateComment = async (commentId, content) => {
  const result = await pool.query(
    `UPDATE group_comments SET content=$1 WHERE comment_id=$2 RETURNING *`,
    [content, commentId]
  );
  return result.rows[0];
};

// Delete comment
export const deleteComment = async (commentId) => {
  await pool.query("DELETE FROM group_comments WHERE comment_id=$1", [commentId]);
  return { message: "Group comment deleted" };
};
