import {
  findHazardsNearLocation,
  modifyHazard,
  removeHazard,
} from "../models/hazard_model.js";

// GET hazards near location
export const getHazardsNearLocation = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    const hazards = await findHazardsNearLocation(lat, lng, radius);
    res.json(hazards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT update hazard
export const updateHazard = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedHazard = await modifyHazard(id, updates);
    res.json(updatedHazard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE hazard
export const deleteHazard = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await removeHazard(id);
    res.json({ success: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
