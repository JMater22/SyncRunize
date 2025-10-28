import pool from "../utils/db.js";

// Get all followers of a user
export const getFollowers = async (userId) => {
  const result = await pool.query(
    `SELECT f.follower_id, u.username, u.profile_picture
     FROM follows f
     JOIN users u ON f.follower_id = u.user_id
     WHERE f.followed_id = $1`,
    [userId]
  );
  return result.rows;
};

// Get all users a person is following
export const getFollowing = async (userId) => {
  const result = await pool.query(
    `SELECT f.followed_id, u.username, u.profile_picture
     FROM follows f
     JOIN users u ON f.followed_id = u.user_id
     WHERE f.follower_id = $1`,
    [userId]
  );
  return result.rows;
};

// Follow a user
export const followUser = async (followerId, followedId) => {
  const result = await pool.query(
    `INSERT INTO follows (follower_id, followed_id)
     VALUES ($1, $2)
     ON CONFLICT (follower_id, followed_id) DO NOTHING
     RETURNING *`,
    [followerId, followedId]
  );
  return result.rows[0]; // null if already followed
};

// Unfollow a user
export const unfollowUser = async (followerId, followedId) => {
  await pool.query(
    `DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2`,
    [followerId, followedId]
  );
  return { message: "Unfollowed successfully" };
};
