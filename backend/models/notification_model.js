import { supabase } from "../utils/supabase.js";

// ✅ Get unread notifications with actor details
export const getUnreadNotifications = async (userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      actor:actor_id (
        user_id,
        name,
        username,
        profile_picture
      )
    `)
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// ✅ Get ALL notifications (both read and unread) with actor details
export const getAllNotifications = async (userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      actor:actor_id (
        user_id,
        name,
        username,
        profile_picture
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50); // Limit to last 50 notifications

  if (error) throw new Error(error.message);
  return data;
};

// ✅ Mark notification as read
export const markNotificationRead = async (notificationId) => {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("notification_id", notificationId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// ✅ Clear all notifications for a user
export const clearNotifications = async (userId) => {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return { message: "All notifications cleared" };
};

// ✅ Create a new notification
export const createNotification = async (payload) => {
  const { data, error } = await supabase
    .from("notifications")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};
