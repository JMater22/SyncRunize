import * as CommentModel from "../models/comment_model.js";

// GET comments for a post
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await CommentModel.getCommentsByPost(postId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

// CREATE comment
export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.user_id; // ✅ Integer from users table
    const comment = await CommentModel.createComment(postId, userId, content);
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: "Failed to create comment" });
  }
};

// UPDATE comment
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const updated = await CommentModel.updateComment(id, content);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update comment" });
  }
};

// DELETE comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CommentModel.deleteComment(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
};
