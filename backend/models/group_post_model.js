import pool from "../utils/db.js";

// Get all posts in a group
export const getGroupPosts = async (groupId) => {
  const result = await pool.query(
    `SELECT gp.*, u.username, u.profile_picture
     FROM group_posts gp
     JOIN users u ON gp.user_id = u.user_id
     WHERE gp.group_id = $1
     ORDER BY gp.created_at DESC`,
    [groupId]
  );
  return result.rows;
};

// Create post in group
export const createGroupPost = async (groupId, userId, content, imageUrl) => {
  const result = await pool.query(
    `INSERT INTO group_posts (group_id, user_id, content, image_url)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [groupId, userId, content, imageUrl]
  );
  return result.rows[0];
};

// Update post
export const updateGroupPost = async (postId, content, imageUrl) => {
  const result = await pool.query(
    `UPDATE group_posts SET content=$1, image_url=$2
     WHERE group_post_id=$3 RETURNING *`,
    [content, imageUrl, postId]
  );
  return result.rows[0];
};

// Delete post
export const deleteGroupPost = async (postId) => {
  await pool.query("DELETE FROM group_posts WHERE group_post_id=$1", [postId]);
  return { message: "Group post deleted" };
};
