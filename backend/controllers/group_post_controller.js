import * as GroupPostModel from "../models/group_post_model.js";

// ✅ GET posts
export const getGroupPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 20, offset = 0, userId } = req.query;

    const posts = await GroupPostModel.getGroupPosts(
      parseInt(groupId, 10),
      parseInt(limit, 10),
      parseInt(offset, 10),
      userId ? parseInt(userId, 10) : null
    );

    res.json(posts);
  } catch (err) {
    console.error("❌ Error fetching group posts:", err);
    res.status(500).json({ error: "Failed to fetch group posts" });
  }
};

// ✅ POST create post
export const createGroupPost = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, title, images, userId } = req.body;

    console.log("📥 Received create post request:", { groupId, userId, content, title, images });

    // Use userId from body (sent by frontend) or from auth
    let authorId = userId;
    
    if (!authorId && req.user) {
      // ✅ Use user_id directly from auth middleware
      authorId = req.user.user_id;
    }

    if (!authorId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    console.log("✅ Creating post with:", { groupId, authorId, content, title, images });

    const post = await GroupPostModel.createGroupPost(
      parseInt(groupId, 10),
      authorId,
      content.trim(),
      title?.trim() || null,
      images || null
    );

    console.log("✅ Post created successfully:", post);

    res.status(201).json(post);
  } catch (err) {
    console.error("❌ Error creating group post:", err);
    console.error("Error details:", err.message);
    res.status(500).json({ error: "Failed to create group post", details: err.message });
  }
};

// ✅ PUT update post
export const updateGroupPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, title, images } = req.body;

    const post = await GroupPostModel.updateGroupPost(
      parseInt(postId, 10),
      content,
      title || null,
      images || null
    );

    res.json(post);
  } catch (err) {
    console.error("❌ Error updating group post:", err);
    res.status(500).json({ error: "Failed to update group post" });
  }
};

// ✅ DELETE post
export const deleteGroupPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await GroupPostModel.deleteGroupPost(parseInt(postId, 10));

    res.json(result);
  } catch (err) {
    console.error("❌ Error deleting group post:", err);
    res.status(500).json({ error: "Failed to delete group post" });
  }
};