import pool from "../utils/db.js";

// Get all posts (optionally by user_id)
export const getAllPosts = async (userId = null) => {
  if (userId) {
    const result = await pool.query(
      "SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows;
  }
  const result = await pool.query(
    "SELECT * FROM posts ORDER BY created_at DESC"
  );
  return result.rows;
};

// Create a new post
export const createPost = async (userId, content, imageUrl = null) => {
  const result = await pool.query(
    `INSERT INTO posts (user_id, content, image_url) 
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, content, imageUrl]
  );
  return result.rows[0];
};

// Update a post
export const updatePost = async (postId, content, imageUrl) => {
  const result = await pool.query(
    `UPDATE posts SET content = $1, image_url = $2, updated_at = NOW()
     WHERE post_id = $3 RETURNING *`,
    [content, imageUrl, postId]
  );
  return result.rows[0];
};

// Delete a post (likes & comments cascade in DB)
export const deletePost = async (postId) => {
  await pool.query("DELETE FROM posts WHERE post_id = $1", [postId]);
  return { message: "Post deleted" };
};
