import * as PostModel from "../models/post_model.js";
import { invalidatePostCache } from "../utils/cache_invalidation.js";

// GET all posts (or by user_id) - LEGACY
export const getPosts = async (req, res) => {
  try {
    const { userId } = req.query;
    const posts = await PostModel.getAllPosts(userId);
    res.json(posts);
  } catch (err) {
    console.error("Get posts error:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// ✅ NEW: GET personalized feed
export const getFeed = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { limit = 20, offset = 0 } = req.query;

    const posts = await PostModel.getFeed(userId, parseInt(limit), parseInt(offset));
    res.json(posts);
  } catch (err) {
    console.error("Get feed error:", err);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
};

// ✅ NEW: GET current user's posts
export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { limit = 20, offset = 0 } = req.query;

    const posts = await PostModel.getMyPosts(userId, parseInt(limit), parseInt(offset));
    res.json(posts);
  } catch (err) {
    console.error("Get my posts error:", err);
    res.status(500).json({ error: "Failed to fetch your posts" });
  }
};

// ✅ NEW: GET another user's posts (with privacy filter)
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.user_id || null;
    const { limit = 20, offset = 0 } = req.query;

    console.log(`[post_controller.getUserPosts] targetUserId: ${userId}, currentUserId: ${currentUserId}, hasAuth: ${!!req.user}`);

    const posts = await PostModel.getUserPosts(userId, currentUserId, parseInt(limit), parseInt(offset));

    console.log(`[post_controller.getUserPosts] Returning ${posts.length} posts`);
    res.json(posts);
  } catch (err) {
    console.error("Get user posts error:", err);
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
};

// Get a single post by ID
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await PostModel.getPostById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    console.error("Get post by id error:", err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

// ✅ OPTIMIZED: CREATE post from route with cache invalidation
export const createPostFromRoute = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      routeId,
      content,
      routeName,
      distanceKm,
      durationSeconds,
      averagePace,
      estimatedCalories,
      snapshotUrl,
      visibility
    } = req.body;

    const post = await PostModel.createPostFromRoute({
      userId,
      routeId,
      content,
      routeName,
      distanceKm,
      durationSeconds,
      averagePace,
      estimatedCalories,
      snapshotUrl,
      visibility
    });

    // Invalidate caches
    await invalidatePostCache({ user_id: userId });

    res.status(201).json(post);
  } catch (err) {
    console.error("Create post from route error:", err);
    res.status(500).json({ error: "Failed to create post from route" });
  }
};

// ✅ OPTIMIZED: CREATE new post with cache invalidation
export const createPost = async (req, res) => {
  try {
    const { content, imageUrl, route_id, image_url, visibility } = req.body;
    const userId = req.user.user_id;

    let post;
    // If route_id is provided, use the from-route flow
    if (route_id) {
      post = await PostModel.createPostFromRouteId({
        userId,
        routeId: route_id,
        content,
        snapshotUrl: image_url || imageUrl,
        visibility
      });
    } else {
      // Otherwise, create a generic text/image post
      post = await PostModel.createPost(userId, content, imageUrl);
    }

    // Invalidate caches
    await invalidatePostCache({ user_id: userId });

    res.status(201).json(post);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
};

// ✅ OPTIMIZED: UPDATE post with cache invalidation
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // {content, imageUrl, visibility}
    const userId = req.user.user_id;

    const updated = await PostModel.updatePost(id, updates, userId);

    // Invalidate caches
    await invalidatePostCache({ user_id: userId });

    res.json(updated);
  } catch (err) {
    console.error("Update post error:", err);

    // Handle specific errors
    if (err.message && err.message.includes("Unauthorized")) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message && err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to update post" });
  }
};

// ✅ OPTIMIZED: DELETE post with cache invalidation
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const result = await PostModel.deletePost(id, userId);

    // Invalidate caches
    await invalidatePostCache({ user_id: userId });

    res.json(result);
  } catch (err) {
    console.error("Delete post error:", err);

    // Handle specific errors
    if (err.message && err.message.includes("Unauthorized")) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message && err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to delete post" });
  }
};
