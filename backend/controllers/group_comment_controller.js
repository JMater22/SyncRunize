import * as GroupCommentModel from "../models/group_comment_model.js";

// GET comments
export const getComments = async (req, res) => {
  try {
    const comments = await GroupCommentModel.getComments(req.params.groupPostId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

// POST comment
export const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.userId;
    const comment = await GroupCommentModel.createComment(req.params.groupPostId, userId, content);
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: "Failed to create comment" });
  }
};

// PUT comment
export const updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await GroupCommentModel.updateComment(req.params.commentId, content);
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: "Failed to update comment" });
  }
};

// DELETE comment
export const deleteComment = async (req, res) => {
  try {
    const result = await GroupCommentModel.deleteComment(req.params.commentId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
};
