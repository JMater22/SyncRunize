import { supabase } from "../utils/supabase.js";

// Get all followers of a user
export const getFollowers = async (userId) => {
  const { data, error } = await supabase
    .from("follows")
    .select(`
      follower_id,
      users!follows_follower_id_fkey(username, profile_picture)
    `)
    .eq("followed_id", userId);

  if (error) throw error;
  return data || [];
};

// Get all users a person is following
export const getFollowing = async (userId) => {
  const { data, error } = await supabase
    .from("follows")
    .select(`
      followed_id,
      users!follows_followed_id_fkey(username, profile_picture)
    `)
    .eq("follower_id", userId);

  if (error) throw error;
  return data || [];
};

// Follow a user
export const followUser = async (followerId, followedId) => {
  const { data, error } = await supabase
    .from("follows")
    .insert({
      follower_id: followerId,
      followed_id: followedId,
    })
    .select()
    .single();

  // Handle duplicate key error (already following)
  if (error) {
    if (error.code === "23505") return null; // Unique constraint violation
    throw error;
  }
  return data;
};

// Unfollow a user
export const unfollowUser = async (followerId, followedId) => {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("followed_id", followedId);

  if (error) throw error;
  return { message: "Unfollowed successfully" };
};
