import api from '../lib/api';

export interface Notification {
  notification_id: number;
  user_id: number;
  actor_id?: number;
  message: string;
  type: 'follow' | 'like' | 'comment' | 'group_like' | 'group_comment' | 'group_invite' | 'challenge_progress' | 'badge_earned';
  post_id?: number;
  group_post_id?: number;
  group_id?: number;
  challenge_id?: number;
  badge_name?: string;
  badge_image_url?: string;
  like_count?: number;
  comment_count?: number;
  is_read: boolean;
  push_status: string;
  created_at: string;
  actor?: {
    user_id: number;
    name: string;
    username: string;
    profile_picture?: string;
  };
}

export const NotificationsApi = {
  // Get all notifications for user
  getAllNotifications: async (userId: number): Promise<Notification[]> => {
    const { data } = await api.get(`/notifications/all/${userId}`);
    return data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: number): Promise<void> => {
    await api.put(`/notifications/read/${notificationId}`);
  },

  // Clear all notifications
  clearAll: async (userId: number): Promise<void> => {
    await api.delete(`/notifications/clear/${userId}`);
  },
};
