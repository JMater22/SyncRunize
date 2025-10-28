import * as GroupPostModel from "../models/group_post_model.js";

// GET posts
export const getGroupPosts = async (req, res) => {
  try {
    const posts = await GroupPostModel.getGroupPosts(req.params.groupId);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group posts" });
  }
};

// POST create post
export const createGroupPost = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    const userId = req.user.userId; // from auth
    const post = await GroupPostModel.createGroupPost(req.params.groupId, userId, content, imageUrl);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to create group post" });
  }
};

// PUT update post
export const updateGroupPost = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    const post = await GroupPostModel.updateGroupPost(req.params.postId, content, imageUrl);
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to update group post" });
  }
};

// DELETE post
export const deleteGroupPost = async (req, res) => {
  try {
    const result = await GroupPostModel.deleteGroupPost(req.params.postId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete group post" });
  }
};
