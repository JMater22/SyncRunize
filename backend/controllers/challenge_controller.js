import {
  findChallenges,
  modifyChallenge,
  removeChallenge,
} from "../models/challenge_model.js";

// GET challenges
export const getChallenges = async (req, res) => {
  try {
    const challenges = await findChallenges();
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT update challenge
export const updateChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await modifyChallenge(id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE challenge
export const deleteChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await removeChallenge(id);
    res.json({ success: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
