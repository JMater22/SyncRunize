import * as GroupLikeModel from "../models/group_like_model.js";
import { supabase } from "../utils/supabase.js";

// ✅ GET count likes
export const countLikes = async (req, res) => {
  try {
    const count = await GroupLikeModel.countLikes(req.params.groupPostId);
    res.json({ likes: count });
  } catch (err) {
    console.error("❌ Error counting likes:", err);
    res.status(500).json({ error: "Failed to count likes" });
  }
};

// ✅ POST like
export const addLike = async (req, res) => {
  try {
    const { groupPostId } = req.params;
    const { userId } = req.body;

    // Use userId from body (sent by frontend) or get from auth
    let likeUserId = userId;
    
    if (!likeUserId && req.user) {
      // Get user_id from Supabase user
      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_id", req.user.id)
        .single();
      
      likeUserId = userData?.user_id;
    }

    if (!likeUserId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const like = await GroupLikeModel.addLike(
      parseInt(groupPostId, 10), 
      likeUserId
    );

    // If null, user already liked (duplicate)
    if (!like) {
      return res.status(200).json({ message: "Already liked" });
    }

    // Get updated count
    const count = await GroupLikeModel.countLikes(parseInt(groupPostId, 10));

    res.status(201).json({ 
      like, 
      likes: count,
      liked: true 
    });
  } catch (err) {
    console.error("❌ Error adding like:", err);
    res.status(500).json({ error: "Failed to like" });
  }
};

// ✅ DELETE unlike
export const removeLike = async (req, res) => {
  try {
    const { groupPostId } = req.params;
    const { userId } = req.body;

    // Use userId from body or get from auth
    let unlikeUserId = userId;
    
    if (!unlikeUserId && req.user) {
      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_id", req.user.id)
        .single();
      
      unlikeUserId = userData?.user_id;
    }

    if (!unlikeUserId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const result = await GroupLikeModel.removeLike(
      parseInt(groupPostId, 10), 
      unlikeUserId
    );

    // Get updated count
    const count = await GroupLikeModel.countLikes(parseInt(groupPostId, 10));

    res.json({ 
      ...result, 
      likes: count,
      liked: false 
    });
  } catch (err) {
    console.error("❌ Error removing like:", err);
    res.status(500).json({ error: "Failed to unlike" });
  }
};

// ✅ TOGGLE like (convenience endpoint)
export const toggleLike = async (req, res) => {
  try {
    const { groupPostId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Check if already liked
    const { data: existing } = await supabase
      .from("group_likes")
      .select("like_id")
      .eq("group_post_id", parseInt(groupPostId, 10))
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Unlike
      await GroupLikeModel.removeLike(parseInt(groupPostId, 10), userId);
      const count = await GroupLikeModel.countLikes(parseInt(groupPostId, 10));
      res.json({ liked: false, likes: count });
    } else {
      // Like
      await GroupLikeModel.addLike(parseInt(groupPostId, 10), userId);
      const count = await GroupLikeModel.countLikes(parseInt(groupPostId, 10));
      res.json({ liked: true, likes: count });
    }
  } catch (err) {
    console.error("❌ Error toggling like:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
};