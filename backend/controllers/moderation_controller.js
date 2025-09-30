import * as ModerationModel from "../models/moderation_model.js";

// Get logs for a report
export const getModerationLogs = async (req, res) => {
  try {
    const { reportId } = req.params;
    const logs = await ModerationModel.getModerationLogs(reportId);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new log
export const addModerationLog = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { moderatorId, action, reason } = req.body;
    const log = await ModerationModel.addModerationLog(
      reportId,
      moderatorId,
      action,
      reason
    );
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
