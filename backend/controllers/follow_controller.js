import * as FollowModel from "../models/follow_model.js";

// GET followers
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await FollowModel.getFollowers(userId);
    res.json(followers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch followers" });
  }
};

// GET following
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await FollowModel.getFollowing(userId);
    res.json(following);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch following" });
  }
};

// POST follow
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params; // user being followed
    const followerId = req.user.userId; // from JWT
    if (parseInt(userId) === followerId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }
    const follow = await FollowModel.followUser(followerId, userId);
    if (!follow) return res.status(200).json({ message: "Already following" });
    res.status(201).json(follow);
  } catch (err) {
    res.status(500).json({ error: "Failed to follow user" });
  }
};

// DELETE unfollow
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.userId;
    const result = await FollowModel.unfollowUser(followerId, userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to unfollow user" });
  }
};
