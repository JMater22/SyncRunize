import { supabase } from "../utils/supabase.js";

// Get all posts (optionally by user_id)
export const getAllPosts = async (userId = null) => {
  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

// Create a new post
export const createPost = async (userId, content, imageUrl = null) => {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      content,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a post
export const updatePost = async (postId, content, imageUrl) => {
  const { data, error } = await supabase
    .from("posts")
    .update({
      content,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("post_id", postId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a post (likes & comments cascade in DB)
export const deletePost = async (postId) => {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("post_id", postId);

  if (error) throw error;
  return { message: "Post deleted" };
};
