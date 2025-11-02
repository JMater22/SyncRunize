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
    const userId = req.user.id; // from JWT
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
    const userId = req.user.id;
    const result = await LikeModel.removeLike(postId, userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to unlike post" });
  }
};
