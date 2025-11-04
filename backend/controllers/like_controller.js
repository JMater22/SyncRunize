import * as LikeModel from "../models/like_model.js";

// GET: count likes for a post
export const getLikesCount = async (req, res) => {
  try {
    const { postId } = req.params;
    const count = await LikeModel.countLikes(postId);
    res.json({ postId, likes: count });
  } catch (err) {
    res.status(500).json({ error: "Failed to count likes" });
  }
};

// POST: like a post
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.user_id; // ✅ Integer from users table
    const like = await LikeModel.addLike(postId, userId);
    if (!like) return res.status(200).json({ message: "Already liked" });
    res.status(201).json(like);
  } catch (err) {
    res.status(500).json({ error: "Failed to like post" });
  }
};

// DELETE: unlike a post
export const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.user_id; // ✅ Integer from users table
    const result = await LikeModel.removeLike(postId, userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to unlike post" });
  }
};

// ✅ NEW: Toggle like (like if not liked, unlike if already liked)
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.user_id;
    const result = await LikeModel.toggleLike(postId, userId);
    res.json(result);
  } catch (err) {
    console.error("Toggle like error:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
};
