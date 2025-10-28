import pool from "../utils/db.js";

// Retrieve moderation history for a hazard report
export const getModerationLogs = async (reportId) => {
  const result = await pool.query(
    `SELECT * FROM moderation_logs WHERE report_id = $1 ORDER BY created_at DESC`,
    [reportId]
  );
  return result.rows;
};

// Insert a new moderation log
export const addModerationLog = async (reportId, moderatorId, action, reason) => {
  const result = await pool.query(
    `INSERT INTO moderation_logs (report_id, moderator_id, action, reason) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [reportId, moderatorId, action, reason]
  );
  return result.rows[0];
};
