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
    .insert([{
      post_id: postId,
      user_id: userId
    }])
    .select()
    .single();

  if (error) {
    // If duplicate, return null (already liked)
    if (error.code === '23505') return null;
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

// ✅ NEW: Toggle like (like if not liked, unlike if already liked)
export const toggleLike = async (postId, userId) => {
  try {
    // Check if already liked (use maybeSingle to avoid throwing on 0 rows)
    const { data: existing, error: checkError } = await supabase
      .from("likes")
      .select("like_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      console.error('[LikeModel.error] toggleLike check existing failed:', checkError, { postId, userId });
      throw checkError;
    }

    if (existing) {
      // Unlike
      await removeLike(postId, userId);
      const count = await countLikes(postId);
      return { liked: false, likes: count };
    } else {
      // Like
      await addLike(postId, userId);
      const count = await countLikes(postId);
      return { liked: true, likes: count };
    }
  } catch (err) {
    console.error('[LikeModel.error] toggleLike failed:', err?.message || err, { postId, userId });
    throw err;
  }
};

// Get list of users who liked a post
export const getLikers = async (postId) => {
  const { data, error } = await supabase
    .from("likes")
    .select(`
      user_id,
      users:user_id (
        user_id,
        name,
        username,
        profile_picture
      )
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Format the response
  return data.map(like => ({
    user_id: like.users.user_id,
    name: like.users.name,
    username: like.users.username,
    profile_picture: like.users.profile_picture
  }));
};
