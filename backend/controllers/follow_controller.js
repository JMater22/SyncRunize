import * as FollowModel from "../models/follow_model.js";


// GET follower count
export const getFollowerCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await FollowModel.countFollowers(userId);
    res.json({ userId, followers: count });
  } catch (err) {
    console.error("Error counting followers:", err);
    res.status(500).json({ error: "Failed to count followers" });
  }
};

// GET following count
export const getFollowingCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await FollowModel.countFollowing(userId);
    res.json({ userId, following: count });
  } catch (err) {
    console.error("Error counting following:", err);
    res.status(500).json({ error: "Failed to count following" });
  }
};

// GET both counts at once
export const getFollowCounts = async (req, res) => {
  try {
    const { userId } = req.params;
    const counts = await FollowModel.getFollowCounts(userId);
    res.json({ userId, ...counts });
  } catch (err) {
    console.error("Error getting follow counts:", err);
    res.status(500).json({ error: "Failed to get follow counts" });
  }
};

// GET followers
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await FollowModel.getFollowers(userId);
    res.json(followers);
  } catch (err) {
    console.error("Error fetching followers:", err);
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
    console.error("Error fetching following:", err);
    res.status(500).json({ error: "Failed to fetch following" });
  }
};

// POST follow
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params; // user being followed
    const followerId = req.user.userId; // ⚠️ FIXED: Changed from req.user.id to req.user.userId
    
    if (userId === followerId.toString()) { // ⚠️ FIXED: Consistent string comparison
      return res.status(400).json({ error: "You cannot follow yourself" });
    }
    
    const follow = await FollowModel.followUser(followerId, userId);
    
    if (!follow) {
      return res.status(200).json({ message: "Already following" });
    }
    
    res.status(201).json(follow);
  } catch (err) {
    console.error("Error following user:", err);
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
    console.error("Error unfollowing user:", err);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
};