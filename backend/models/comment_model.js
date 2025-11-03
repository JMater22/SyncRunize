import { supabase } from "../utils/supabase.js";

// Get comments for a post
export const getCommentsByPost = async (postId) => {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      comment_id,
      content,
      created_at,
      users(username, profile_picture)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
};

// Create new comment
export const createComment = async (postId, userId, content) => {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: userId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update comment
export const updateComment = async (commentId, content) => {
  const { data, error } = await supabase
    .from("comments")
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("comment_id", commentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete comment
export const deleteComment = async (commentId) => {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("comment_id", commentId);

  if (error) throw error;
  return { message: "Comment deleted" };
};
