import { supabase } from "../utils/supabase.js";

// Retrieve unread notifications for a user
export const getUnreadNotifications = async (userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Mark notification as read
export const markNotificationRead = async (notificationId) => {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("notification_id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Clear all notifications for a user
export const clearNotifications = async (userId) => {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
  return { message: "All notifications cleared" };
};
