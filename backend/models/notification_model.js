import pool from "../utils/db.js";

// Retrieve unread notifications for a user
export const getUnreadNotifications = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

// Mark notification as read
export const markNotificationRead = async (notificationId) => {
  const result = await pool.query(
    `UPDATE notifications SET is_read = true WHERE notification_id = $1 RETURNING *`,
    [notificationId]
  );
  return result.rows[0];
};

// Clear all notifications for a user
export const clearNotifications = async (userId) => {
  await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
  return { message: "All notifications cleared" };
};
