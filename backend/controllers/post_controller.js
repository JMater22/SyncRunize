import * as PostModel from "../models/post_model.js";

// GET all posts (or by user_id)
export const getPosts = async (req, res) => {
  try {
    const { userId } = req.query;
    const posts = await PostModel.getAllPosts(userId);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// CREATE new post
export const createPost = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    const userId = req.user.id; // from JWT
    const post = await PostModel.createPost(userId, content, imageUrl);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to create post" });
  }
};

// UPDATE post
export const updatePost = async (req, res) => {
  try {
    const  id  = req.user.id;
    const { content, imageUrl } = req.body;
    const updated = await PostModel.updatePost(id, content, imageUrl);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update post" });
  }
};

// DELETE post
export const deletePost = async (req, res) => {
  try {
    const  id  = req.user.id;
    const result = await PostModel.deletePost(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
};
