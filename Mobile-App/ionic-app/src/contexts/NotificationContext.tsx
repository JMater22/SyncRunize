import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NotificationsApi, Notification } from '../services/notifications';
import { supabase } from '../lib/supabaseClient';
import { useUser } from './UserContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safely calculate unread count - ensure notifications is always an array
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0;

  const fetchNotifications = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const data = await NotificationsApi.getAllNotifications(currentUser.user_id);
      // Ensure data is always an array
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
      setNotifications([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await NotificationsApi.markAsRead(notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  };

  const clearAll = async () => {
    if (!currentUser) return;

    try {
      await NotificationsApi.clearAll(currentUser.user_id);
      setNotifications([]);
    } catch (err: any) {
      console.error('Failed to clear notifications:', err);
      throw err;
    }
  };

  // Fetch notifications when user changes
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.user_id}`,
        },
        async (payload) => {
          console.log('New notification received:', payload);

          // Add new notification to state
          const newNotification = payload.new as Notification;

          // Fetch full notification with actor details if needed
          // For now, just add it
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.user_id}`,
        },
        async (payload) => {
          console.log('Notification updated:', payload);

          // Update notification in state
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n =>
              n.notification_id === updatedNotification.notification_id
                ? updatedNotification
                : n
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
