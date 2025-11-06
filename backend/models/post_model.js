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

  // For followed users (including self), show ALL posts (public + private)
  // This is correct because we only fetch from users we follow
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
    // No additional visibility filter needed - we only show posts from people we follow
    // and those users' posts should all be visible to us (both public and private)
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
  console.log(`[getUserPosts] targetUserId: ${targetUserId}, currentUserId: ${currentUserId}`);

  // Check if current user follows target user
  let isFollowing = false;
  if (currentUserId) {
    const { data: followData, error: followError } = await supabase
      .from("follows")
      .select("follow_id")
      .eq("follower_id", currentUserId)
      .eq("followed_id", targetUserId)
      .single();

    console.log(`[getUserPosts] Follow check result:`, { followData, followError: followError?.code });

    // PGRST116 means no rows found, which is fine - just means not following
    if (followError && followError.code !== 'PGRST116') {
      console.error('Error checking follow status:', followError);
    }

    isFollowing = !!followData;
    console.log(`[getUserPosts] isFollowing: ${isFollowing}`);
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
    console.log(`[getUserPosts] Showing own posts (all visibility)`);
  } else if (isFollowing) {
    // Following - show public and private
    console.log(`[getUserPosts] Following - showing public and private posts`);
    query = query.in("visibility", ["public", "private"]);
  } else {
    // Not following - show only public
    console.log(`[getUserPosts] Not following - showing only public posts`);
    query = query.eq("visibility", "public");
  }

  const { data, error } = await query;
  if (error) throw error;

  console.log(`[getUserPosts] Found ${data?.length || 0} posts`);

  // Debug: Check total posts for this user without filters
  const { data: allPosts } = await supabase
    .from("posts")
    .select("post_id, visibility")
    .eq("user_id", targetUserId);
  console.log(`[getUserPosts] DEBUG - Total posts for user ${targetUserId}:`, allPosts?.length || 0);
  if (allPosts && allPosts.length > 0) {
    console.log(`[getUserPosts] DEBUG - Post visibilities:`, allPosts.map(p => ({ id: p.post_id, visibility: p.visibility })));
  }

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

// Get a single post by ID with basic author info
export const getPostById = async (postId) => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:user_id (
        user_id,
        username,
        name,
        profile_picture
      )
    `)
    .eq("post_id", postId)
    .single();

  if (error) throw error;
  return data;
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
export const updatePost = async (postId, updates, userId) => {
  // First, verify ownership
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("user_id")
    .eq("post_id", postId)
    .single();

  if (fetchError) throw fetchError;
  if (!post) throw new Error("Post not found");
  if (post.user_id !== userId) throw new Error("Unauthorized: You can only update your own posts");

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
export const deletePost = async (postId, userId) => {
  // First, verify ownership
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("user_id, route_id")
    .eq("post_id", postId)
    .single();

  if (fetchError) throw fetchError;
  if (!post) throw new Error("Post not found");
  if (post.user_id !== userId) throw new Error("Unauthorized: You can only delete your own posts");

  // Unlink from user_routes if this post is linked
  if (post.route_id) {
    await supabase
      .from("user_routes")
      .update({ post_id: null, is_shared: false })
      .eq("post_id", postId);
  }

  // Delete the post
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("post_id", postId);

  if (error) throw error;
  return { message: "Post deleted successfully" };
};
