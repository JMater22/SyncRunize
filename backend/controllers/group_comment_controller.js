import * as GroupCommentModel from "../models/group_comment_model.js";
import { supabase } from "../utils/supabase.js";

// ✅ GET comments
export const getComments = async (req, res) => {
  try {
    const { groupPostId } = req.params;

    const comments = await GroupCommentModel.getComments(parseInt(groupPostId, 10));

    res.json(comments);
  } catch (err) {
    console.error("❌ Error fetching comments:", err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

// ✅ GET comment count
export const getCommentCount = async (req, res) => {
  try {
    const { groupPostId } = req.params;

    const count = await GroupCommentModel.getCommentCount(parseInt(groupPostId, 10));

    res.json({ comments: count });
  } catch (err) {
    console.error("❌ Error counting comments:", err);
    res.status(500).json({ error: "Failed to count comments" });
  }
};

// ✅ POST comment
export const createComment = async (req, res) => {
  try {
    const { groupPostId } = req.params;
    const { content, userId } = req.body;

    // Use userId from body (sent by frontend) or get from auth
    let commentUserId = userId;
    
    if (!commentUserId && req.user) {
      // Get user_id from Supabase user
      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_id", req.user.id)
        .single();
      
      commentUserId = userData?.user_id;
    }

    if (!commentUserId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    const comment = await GroupCommentModel.createComment(
      parseInt(groupPostId, 10),
      commentUserId,
      content
    );

    res.status(201).json(comment);
  } catch (err) {
    console.error("❌ Error creating comment:", err);
    res.status(500).json({ error: "Failed to create comment" });
  }
};

// ✅ PUT comment
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    const comment = await GroupCommentModel.updateComment(
      parseInt(commentId, 10),
      content
    );

    res.json(comment);
  } catch (err) {
    console.error("❌ Error updating comment:", err);
    res.status(500).json({ error: "Failed to update comment" });
  }
};

// ✅ DELETE comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const result = await GroupCommentModel.deleteComment(parseInt(commentId, 10));

    res.json(result);
  } catch (err) {
    console.error("❌ Error deleting comment:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};