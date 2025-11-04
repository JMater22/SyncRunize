import { supabase } from "../utils/supabase.js";

// Get comments for a post
export const getCommentsByPost = async (postId) => {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      comment_id,
      content,
      created_at,
      user_id,
      users:user_id (
        username,
        name,
        profile_picture
      )
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data.map(comment => ({
    comment_id: comment.comment_id,
    content: comment.content,
    created_at: comment.created_at,
    user_id: comment.user_id,
    username: comment.users?.username,
    name: comment.users?.name,
    profile_picture: comment.users?.profile_picture
  }));
};

// Create new comment
export const createComment = async (postId, userId, content) => {
  const { data, error } = await supabase
    .from("comments")
    .insert([{
      post_id: postId,
      user_id: userId,
      content: content
    }])
    .select(`
      *,
      users:user_id (
        username,
        name,
        profile_picture
      )
    `)
    .single();

  if (error) throw error;

  return {
    ...data,
    username: data.users?.username,
    name: data.users?.name,
    profile_picture: data.users?.profile_picture
  };
};

// Update comment
export const updateComment = async (commentId, content) => {
  const { data, error } = await supabase
    .from("comments")
    .update({ content: content })
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
