import { findUserBadges, removeBadge } from "../models/badge_model.js";

// GET badges for user
export const getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const badges = await findUserBadges(userId);
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE badge
export const deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await removeBadge(id);
    res.json({ success: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
