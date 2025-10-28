import * as GroupLikeModel from "../models/group_like_model.js";

// GET count likes
export const countLikes = async (req, res) => {
  try {
    const count = await GroupLikeModel.countLikes(req.params.groupPostId);
    res.json({ likes: count });
  } catch (err) {
    res.status(500).json({ error: "Failed to count likes" });
  }
};

// POST like
export const addLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const like = await GroupLikeModel.addLike(req.params.groupPostId, userId);
    res.status(201).json(like);
  } catch (err) {
    res.status(500).json({ error: "Failed to like" });
  }
};

// DELETE unlike
export const removeLike = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await GroupLikeModel.removeLike(req.params.groupPostId, userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to unlike" });
  }
};
