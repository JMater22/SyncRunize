import { supabase } from "../utils/supabase.js";

// Count likes for a post
export const countLikes = async (postId) => {
  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) throw error;
  return count || 0;
};

// Add a like
export const addLike = async (postId, userId) => {
  const { data, error } = await supabase
    .from("likes")
    .insert({
      post_id: postId,
      user_id: userId,
    })
    .select()
    .single();

  // Handle duplicate key error (already liked)
  if (error) {
    if (error.code === "23505") return null; // Unique constraint violation
    throw error;
  }
  return data;
};

// Remove a like (unlike)
export const removeLike = async (postId, userId) => {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) throw error;
  return { message: "Unliked successfully" };
};
