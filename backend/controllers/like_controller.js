import * as LikeModel from "../models/like_model.js";
import * as NotificationService from "../services/notification_service.js";
import { supabase } from "../utils/supabase.js";

// GET: count likes for a post
export const getLikesCount = async (req, res) => {
  try {
    const { postId } = req.params;
    const count = await LikeModel.countLikes(postId);
    res.json({ postId, likes: count });
  } catch (err) {
    res.status(500).json({ error: "Failed to count likes" });
  }
};

// POST: like a post
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.user_id; // ✅ Integer from users table
    const like = await LikeModel.addLike(postId, userId);
    if (!like) return res.status(200).json({ message: "Already liked" });

    // 🔔 Get post owner and send notification
    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("post_id", postId)
      .single();

    if (post) {
      console.log('[LikeController.debug] likePost notifyLike args:', {
        postOwnerId: post.user_id,
        likerId: userId,
        postId: Number(postId)
      });
      try {
        await NotificationService.notifyLike(post.user_id, userId, parseInt(postId));
        console.log('[LikeController.debug] likePost notifyLike done');
      } catch (e) {
        console.error('[LikeController.error] notifyLike failed (non-fatal):', e?.message || e);
      }
    }

    res.status(201).json(like);
  } catch (err) {
    res.status(500).json({ error: "Failed to like post" });
  }
};

// DELETE: unlike a post
export const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.user_id; // ✅ Integer from users table
    const result = await LikeModel.removeLike(postId, userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to unlike post" });
  }
};

// ✅ NEW: Toggle like (like if not liked, unlike if already liked)
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.user_id;

    // Toggle the like in the database
    const result = await LikeModel.toggleLike(postId, userId);

    console.log('[LikeController.debug] toggleLike result:', { postId: Number(postId), userId, result });

    // 🔔 Send notification if post was liked (not unliked)
    if (result.liked) {
      const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("post_id", postId)
        .single();

      if (post) {
        console.log('[LikeController.debug] toggleLike notifyLike args:', {
          postOwnerId: post.user_id,
          likerId: userId,
          postId: Number(postId)
        });
        try {
          await NotificationService.notifyLike(post.user_id, userId, parseInt(postId));
          console.log('[LikeController.debug] toggleLike notifyLike done');
        } catch (e) {
          console.error('[LikeController.error] notifyLike failed (non-fatal):', e?.message || e);
        }
      }
    }

    res.json(result);
  } catch (err) {
    console.error("Toggle like error:", err);
    res.status(500).json({ error: "Failed to toggle like", details: err.message });
  }
};


