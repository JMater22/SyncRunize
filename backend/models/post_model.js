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
  return data;
};

// ✅ NEW: Get personalized feed (following + privacy filter)
export const getFeed = async (currentUserId, limit = 20, offset = 0) => {
  const { data: followedUsers, error: followError } = await supabase
    .from("follows")
    .select("followed_id")
    .eq("follower_id", currentUserId);

  if (followError) throw followError;

  const followedIds = followedUsers.map(f => f.followed_id);
  followedIds.push(currentUserId); // Include own posts

  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      users:user_id (
        name,
        username,
        profile_picture
      )
    `)
    .in("user_id", followedIds)
    .or(`visibility.eq.public,user_id.eq.${currentUserId}`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Get likes and comments count for each post
  const postsWithCounts = await Promise.all(data.map(async (post) => {
    const [likesResult, commentsResult, isLikedResult] = await Promise.all([
      supabase.from("likes").select("like_id", { count: "exact" }).eq("post_id", post.post_id),
      supabase.from("comments").select("comment_id", { count: "exact" }).eq("post_id", post.post_id),
      supabase.from("likes").select("like_id").eq("post_id", post.post_id).eq("user_id", currentUserId).single()
    ]);

    return {
      ...post,
      author_name: post.users?.name,
      author_username: post.users?.username,
      author_avatar: post.users?.profile_picture,
      likes_count: likesResult.count || 0,
      comments_count: commentsResult.count || 0,
      is_liked: !!isLikedResult.data
    };
  }));

  return postsWithCounts;
};

// ✅ NEW: Get current user's own posts
export const getMyPosts = async (userId, limit = 20, offset = 0) => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const postsWithCounts = await Promise.all(data.map(async (post) => {
    const [likesResult, commentsResult] = await Promise.all([
      supabase.from("likes").select("like_id", { count: "exact" }).eq("post_id", post.post_id),
      supabase.from("comments").select("comment_id", { count: "exact" }).eq("post_id", post.post_id)
    ]);

    return {
      ...post,
      likes_count: likesResult.count || 0,
      comments_count: commentsResult.count || 0
    };
  }));

  return postsWithCounts;
};

// ✅ NEW: Get another user's posts (with privacy filter)
export const getUserPosts = async (targetUserId, currentUserId = null, limit = 20, offset = 0) => {
  // Check if current user follows target user
  let isFollowing = false;
  if (currentUserId) {
    const { data: followData } = await supabase
      .from("follows")
      .select("follow_id")
      .eq("follower_id", currentUserId)
      .eq("followed_id", targetUserId)
      .single();

    isFollowing = !!followData;
  }

  // Build query with privacy filter
  let query = supabase
    .from("posts")
    .select(`
      *,
      users:user_id (
        name,
        username,
        profile_picture
      )
    `)
    .eq("user_id", targetUserId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply privacy filter
  if (currentUserId && parseInt(currentUserId) === parseInt(targetUserId)) {
    // Own posts - show all
  } else if (isFollowing) {
    // Following - show public and private
    query = query.in("visibility", ["public", "private"]);
  } else {
    // Not following - show only public
    query = query.eq("visibility", "public");
  }

  const { data, error } = await query;
  if (error) throw error;

  // Get likes and comments count for each post
  const postsWithCounts = await Promise.all(data.map(async (post) => {
    const [likesResult, commentsResult, isLikedResult] = await Promise.all([
      supabase.from("likes").select("like_id", { count: "exact" }).eq("post_id", post.post_id),
      supabase.from("comments").select("comment_id", { count: "exact" }).eq("post_id", post.post_id),
      currentUserId
        ? supabase.from("likes").select("like_id").eq("post_id", post.post_id).eq("user_id", currentUserId).single()
        : Promise.resolve({ data: null })
    ]);

    return {
      ...post,
      author_name: post.users?.name,
      author_username: post.users?.username,
      author_avatar: post.users?.profile_picture,
      likes_count: likesResult.count || 0,
      comments_count: commentsResult.count || 0,
      is_liked: !!isLikedResult.data
    };
  }));

  return postsWithCounts;
};

// ✅ NEW: Create post from completed route
export const createPostFromRoute = async (postData) => {
  const {
    userId,
    routeId,
    content,
    routeName,
    distanceKm,
    durationSeconds,
    averagePace,
    estimatedCalories,
    snapshotUrl,
    visibility = 'public'
  } = postData;

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert([{
      user_id: userId,
      route_id: routeId,
      content: content,
      route_name: routeName,
      distance_km: distanceKm,
      duration_seconds: durationSeconds,
      average_pace: averagePace,
      estimated_calories: estimatedCalories,
      snapshot_url: snapshotUrl,
      visibility: visibility
    }])
    .select()
    .single();

  if (postError) throw postError;

  // Mark route as shared
  if (routeId) {
    await supabase
      .from("user_routes")
      .update({
        is_shared: true,
        post_id: post.post_id
      })
      .eq("route_id", routeId);
  }

  return post;
};

// Create a new post (original - keep for backward compatibility)
export const createPost = async (userId, content, imageUrl = null) => {
  const { data, error } = await supabase
    .from("posts")
    .insert([{
      user_id: userId,
      content: content,
      image_url: imageUrl
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a post
export const updatePost = async (postId, updates) => {
  const updateData = {};

  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
  if (updates.visibility !== undefined) updateData.visibility = updates.visibility;

  const { data, error } = await supabase
    .from("posts")
    .update(updateData)
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
