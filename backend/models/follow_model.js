import { supabase } from "../utils/supabase.js";



// Count followers of a user
export const countFollowers = async (userId) => {
  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("followed_id", userId);

  if (error) throw error;

  return count || 0;
};

// Count following of a user
export const countFollowing = async (userId) => {
  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);

  if (error) throw error;

  return count || 0;
};

// Get both counts at once (more efficient)
export const getFollowCounts = async (userId) => {
  const [followersCount, followingCount] = await Promise.all([
    countFollowers(userId),
    countFollowing(userId)
  ]);

  return {
    followers: followersCount,
    following: followingCount
  };
};



// Get all followers of a user
export const getFollowers = async (userId) => {
  const { data, error } = await supabase
    .from("follows")
    .select(`
      follower_id,
      follower:users!follower_id (
        name,
        profile_picture
      )
    `)
    .eq("followed_id", userId);

  if (error) throw error;

  // Transform the nested data to match your original structure
  return data.map(follow => ({
    follower_id: follow.follower_id,
    username: follow.follower.name, // Using 'name' from database but returning as 'username'
    profile_picture: follow.follower.profile_picture
  }));
};

// Get all users a person is following
export const getFollowing = async (userId) => {
  const { data, error } = await supabase
    .from("follows")
    .select(`
      followed_id,
      followed:users!followed_id (
        name,
        profile_picture
      )
    `)
    .eq("follower_id", userId);

  if (error) throw error;

  // Transform the nested data to match your original structure
  return data.map(follow => ({
    followed_id: follow.followed_id,
    username: follow.followed.name, // Using 'name' from database but returning as 'username'
    profile_picture: follow.followed.profile_picture
  }));
};

// Follow a user
export const followUser = async (followerId, followedId) => {
  const { data, error } = await supabase
    .from("follows")
    .insert([
      { follower_id: followerId, followed_id: followedId }
    ])
    .select()
    .single();

  // If error is due to unique constraint violation, return null (already following)
  if (error && error.code === "23505") {
    return null;
  }
  
  if (error) throw error;
  
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