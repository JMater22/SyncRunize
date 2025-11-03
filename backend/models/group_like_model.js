import { supabase } from "../utils/supabase.js";

// Count likes
export const countLikes = async (groupPostId) => {
  const { count, error } = await supabase
    .from("group_likes")
    .select("*", { count: "exact", head: true })
    .eq("group_post_id", groupPostId);

  if (error) throw error;
  return count || 0;
};

// Add like
export const addLike = async (groupPostId, userId) => {
  const { data, error } = await supabase
    .from("group_likes")
    .insert([{ group_post_id: groupPostId, user_id: userId }])
    .select()
    .single();

  // Handle conflict gracefully (already liked)
  if (error?.code === "23505") return null;
  if (error) throw error;

  return data;
};

// Remove like
export const removeLike = async (groupPostId, userId) => {
  const { error } = await supabase
    .from("group_likes")
    .delete()
    .eq("group_post_id", groupPostId)
    .eq("user_id", userId);

  if (error) throw error;

  return { message: "Like removed" };
};
