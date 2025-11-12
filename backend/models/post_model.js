import { supabase } from "../utils/supabase.js";
import validator from "validator";

/**
 * Sanitize post content to prevent XSS attacks
 * Strips HTML tags and escapes special characters
 */
const sanitizePostContent = (content) => {
  if (!content || typeof content !== 'string') return '';

  // Remove HTML tags and normalize whitespace
  let sanitized = validator.stripLow(content);
  sanitized = validator.trim(sanitized);

  // Escape HTML special characters to prevent XSS
  sanitized = validator.escape(sanitized);

  // Limit length to prevent DoS
  const MAX_CONTENT_LENGTH = 5000;
  if (sanitized.length > MAX_CONTENT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_CONTENT_LENGTH);
  }

  return sanitized;
};

/**
 * Validate and parse route ID to prevent injection
 */
const validateRouteId = (routeId) => {
  if (!routeId && routeId !== 0) return null; // Allow null for posts without routes

  const parsed = Number(routeId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid route ID format");
  }

  return parsed;
};

/**
 * Validate and parse post ID to prevent injection
 */
const validatePostId = (postId) => {
  if (!postId) throw new Error("Post ID is required");

  const parsed = Number(postId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid post ID format");
  }

  return parsed;
};

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
  // ✅ SECURITY: Validate post ID before use
  const validatedId = validatePostId(postId);

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
    .eq("post_id", validatedId)
    .single();

  if (error) throw error;
  return data;
};

// ✅ OPTIMIZED: Create post from route ID (fetches route data to avoid redundancy)
export const createPostFromRouteId = async (postData) => {
  const {
    userId,
    routeId,
    content,
    snapshotUrl,
    visibility = 'public'
  } = postData;

  // ✅ SECURITY: Validate route ID before use
  const validatedRouteId = validateRouteId(routeId);
  if (!validatedRouteId) throw new Error("Valid route ID is required");

  // Fetch the route data from user_routes table
  const { data: route, error: routeError } = await supabase
    .from("user_routes")
    .select("*")
    .eq("route_id", validatedRouteId)
    .eq("user_id", userId) // Security: ensure user owns this route
    .single();

  if (routeError) throw new Error(`Route not found: ${routeError.message}`);
  if (!route) throw new Error("Route not found or access denied");

  // ✅ SECURITY: Sanitize content to prevent XSS attacks
  const sanitizedContent = sanitizePostContent(content);

  // Create post with data fetched from route
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert([{
      user_id: userId,
      route_id: validatedRouteId,
      content: sanitizedContent,
      route_name: route.route_name,
      distance_km: route.distance_km,
      duration_seconds: route.duration_seconds,
      average_pace: route.average_pace,
      estimated_calories: route.estimated_calories,
      snapshot_url: snapshotUrl || route.snapshot_url, // Use provided or fallback to route's snapshot
      visibility: visibility
    }])
    .select()
    .single();

  if (postError) throw postError;

  // Mark route as shared
  await supabase
    .from("user_routes")
    .update({
      is_shared: true,
      post_id: post.post_id
    })
    .eq("route_id", routeId);

  console.log(`[Posts] Created post ${post.post_id} from route ${routeId}`);
  return post;
};

// ✅ LEGACY: Create post from route with explicit data (keep for backward compatibility)
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

  // ✅ SECURITY: Sanitize content to prevent XSS attacks
  const sanitizedContent = sanitizePostContent(content);

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert([{
      user_id: userId,
      route_id: routeId,
      content: sanitizedContent,
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
  // ✅ SECURITY: Sanitize content to prevent XSS attacks
  const sanitizedContent = sanitizePostContent(content);

  const { data, error } = await supabase
    .from("posts")
    .insert([{
      user_id: userId,
      content: sanitizedContent,
      image_url: imageUrl
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a post
export const updatePost = async (postId, updates, userId) => {
  // ✅ SECURITY: Validate post ID before use
  const validatedId = validatePostId(postId);

  // First, verify ownership
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("user_id")
    .eq("post_id", validatedId)
    .single();

  if (fetchError) throw fetchError;
  if (!post) throw new Error("Post not found");
  if (post.user_id !== userId) throw new Error("Unauthorized: You can only update your own posts");

  const updateData = {};

  // ✅ SECURITY: Sanitize content if being updated
  if (updates.content !== undefined) updateData.content = sanitizePostContent(updates.content);
  if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
  if (updates.visibility !== undefined) updateData.visibility = updates.visibility;
  if (updates.route_name !== undefined) updateData.route_name = updates.route_name;

  const { data, error } = await supabase
    .from("posts")
    .update(updateData)
    .eq("post_id", validatedId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a post (likes & comments cascade in DB)
export const deletePost = async (postId, userId) => {
  // ✅ SECURITY: Validate post ID before use
  const validatedId = validatePostId(postId);

  // First, verify ownership
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("user_id, route_id")
    .eq("post_id", validatedId)
    .single();

  if (fetchError) throw fetchError;
  if (!post) throw new Error("Post not found");
  if (post.user_id !== userId) throw new Error("Unauthorized: You can only delete your own posts");

  // Unlink from user_routes if this post is linked
  if (post.route_id) {
    await supabase
      .from("user_routes")
      .update({ post_id: null, is_shared: false })
      .eq("post_id", validatedId);
  }

  // Delete the post
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("post_id", validatedId);

  if (error) throw error;
  return { message: "Post deleted successfully" };
};
