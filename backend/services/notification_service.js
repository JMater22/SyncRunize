// services/notification_service.js
// Handles push notifications via Firebase or Supabase

export const sendNotification = async (userId, message) => {
  try {
    // Stub implementation — replace with Supabase/Firebase SDK
    console.log(`🔔 Notify user ${userId}: ${message}`);
    return { success: true, userId, message };
  } catch (err) {
    console.error("Notification service error:", err.message);
    throw err;
  }
};
