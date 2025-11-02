import {
  findIncidents,
  modifyIncident,
  removeIncident,
} from "../models/official_incident_model.js";

export const getOfficialIncidents = async (req, res) => {
  try {
    const { startDate, endDate, lat, lng, radius } = req.query;
    const incidents = await findIncidents(startDate, endDate, lat, lng, radius);
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await modifyIncident(id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await removeIncident(id);
    res.json({ success: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
