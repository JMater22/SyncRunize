import { supabase } from "../utils/supabase.js";

// Get all posts in a group
export const getGroupPosts = async (groupId) => {
  const { data, error } = await supabase
    .from("group_posts")
    .select(`
      *,
      users(username, profile_picture)
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Create post in group
export const createGroupPost = async (groupId, userId, content, imageUrl) => {
  const { data, error } = await supabase
    .from("group_posts")
    .insert({
      group_id: groupId,
      user_id: userId,
      content,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update post
export const updateGroupPost = async (postId, content, imageUrl) => {
  const { data, error } = await supabase
    .from("group_posts")
    .update({
      content,
      image_url: imageUrl,
    })
    .eq("group_post_id", postId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete post
export const deleteGroupPost = async (postId) => {
  const { error } = await supabase
    .from("group_posts")
    .delete()
    .eq("group_post_id", postId);

  if (error) throw error;
  return { message: "Group post deleted" };
};
