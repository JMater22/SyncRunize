import { supabase } from "../utils/supabase.js";

// Get comments by group post
export const getComments = async (groupPostId) => {
  const { data, error } = await supabase
    .from("group_comments")
    .select(`
      *,
      users(username, profile_picture)
    `)
    .eq("group_post_id", groupPostId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
};

// Create comment
export const createComment = async (groupPostId, userId, content) => {
  const { data, error } = await supabase
    .from("group_comments")
    .insert({
      group_post_id: groupPostId,
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
    .from("group_comments")
    .update({ content })
    .eq("comment_id", commentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete comment
export const deleteComment = async (commentId) => {
  const { error } = await supabase
    .from("group_comments")
    .delete()
    .eq("comment_id", commentId);

  if (error) throw error;
  return { message: "Group comment deleted" };
};
