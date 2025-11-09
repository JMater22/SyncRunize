import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import axios from 'axios';

interface Actor {
  user_id: number;
  name: string;
  username: string;
  profile_picture?: string;
}

interface Notification {
  notification_id: number;
  user_id: number;
  actor_id?: number;
  message: string;
  type: string;
  post_id?: number;
  group_post_id?: number;
  group_id?: number;
  report_id?: number;
  distance_km?: number;
  challenge_id?: number;
  badge_name?: string;
  badge_image_url?: string;
  like_count?: number;
  comment_count?: number;
  is_read: boolean;
  push_status: string;
  created_at: string;
  actor?: Actor;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current user and subscribe to auth changes
  useEffect(() => {
    let isMounted = true;
    let initialized = false;

    const fetchCurrentUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ NotificationContext: Session error:', sessionError);
          if (isMounted) {
            setLoading(false);
            setIsInitialized(true);
          }
          initialized = true;
          return;
        }

        if (!session?.user) {
          // Clear all state if no session
          console.log('🔄 NotificationContext: No session, clearing state');
          if (isMounted) {
            setCurrentUserId(null);
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            setIsInitialized(true);
          }
          initialized = true;
          return;
        }

        const { data: userRecord, error } = await supabase
          .from('users')
          .select('user_id')
          .eq('auth_id', session.user.id)
          .single();

        if (!isMounted) return;

        if (error) {
          console.error('❌ NotificationContext: Error fetching user record:', error);
          setLoading(false);
          setIsInitialized(true);
          initialized = true;
          return;
        }

        if (userRecord) {
          console.log('✅ NotificationContext: Current user ID:', userRecord.user_id);
          setCurrentUserId(userRecord.user_id);
          setIsInitialized(true);
        } else {
          console.warn('⚠️ NotificationContext: No user record found');
          setLoading(false);
          setIsInitialized(true);
        }
        initialized = true;
      } catch (error) {
        console.error('❌ NotificationContext: Error fetching current user:', error);
        if (isMounted) {
          setLoading(false);
          setIsInitialized(true);
        }
        initialized = true;
      }
    };

    fetchCurrentUser();

    // Subscribe to auth state changes to handle logout/login
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('🔔 NotificationContext: Auth event:', event);

      // Ignore INITIAL_SESSION and first SIGNED_IN during initialization
      if (event === 'INITIAL_SESSION' || (!initialized && event === 'SIGNED_IN')) {
        console.log('⏭️ NotificationContext: Skipping initial auth event');
        return;
      }

      // Only handle meaningful auth events
      if (event === 'SIGNED_OUT') {
        // User logged out - clear all state
        console.log('🔄 NotificationContext: User logged out, clearing state');
        setCurrentUserId(null);
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // User logged in - fetch new user data
        console.log('🔄 NotificationContext: User logged in, fetching user data');

        try {
          const { data: userRecord, error } = await supabase
            .from('users')
            .select('user_id')
            .eq('auth_id', session.user.id)
            .single();

          if (!isMounted) return;

          if (error) {
            console.error('❌ NotificationContext: Error fetching user on sign in:', error);
            return;
          }

          if (userRecord) {
            console.log('✅ NotificationContext: New user ID:', userRecord.user_id);
            setCurrentUserId(userRecord.user_id);
            // Reset notifications for new user
            setNotifications([]);
            setUnreadCount(0);
          }
        } catch (error) {
          console.error('❌ NotificationContext: Error in auth state change:', error);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 NotificationContext: Token refreshed');
        // Don't need to do anything for token refresh if we already have the user
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log('🔄 NotificationContext: Fetching notifications for user:', currentUserId);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/notifications/all/${currentUserId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.data.success) {
        console.log('✅ NotificationContext: Fetched notifications:', response.data.data);
        const allNotifications = response.data.data;
        setNotifications(allNotifications);
        setUnreadCount(allNotifications.filter((n: any) => !n.is_read).length);
      }
    } catch (error) {
      console.error('❌ NotificationContext: Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Initial fetch
  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId, fetchNotifications]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!currentUserId) return;

    console.log('🔌 NotificationContext: Setting up realtime subscription for user:', currentUserId);

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          console.log('🔔 NotificationContext: New notification INSERT:', payload);

          // Fetch the full notification with actor details
          const { data: newNotification, error } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:actor_id (
                user_id,
                name,
                username,
                profile_picture
              )
            `)
            .eq('notification_id', payload.new.notification_id)
            .single();

          if (error) {
            console.error('❌ NotificationContext: Error fetching new notification:', error);
            return;
          }

          if (newNotification) {
            console.log('✅ NotificationContext: Adding new notification to state:', newNotification);
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          console.log('🔄 NotificationContext: Notification UPDATE:', payload);

          // For consolidated notifications (like/comment), fetch full details with actor
          const { data: updatedNotification, error } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:users!notifications_actor_id_fkey (
                user_id,
                name,
                username,
                profile_picture
              )
            `)
            .eq('notification_id', payload.new.notification_id)
            .single();

          if (error) {
            console.error('❌ NotificationContext: Error fetching updated notification:', error);
            // Fallback: preserve existing actor data
            const payloadNew = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((notif) =>
                notif.notification_id === payloadNew.notification_id
                  ? { ...payloadNew, actor: notif.actor }
                  : notif
              )
            );
            // Update unread count if needed
            if (payloadNew.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            return;
          }

          if (updatedNotification) {
            console.log('✅ NotificationContext: Updating notification in state:', updatedNotification);

            // Update the notification in the list
            setNotifications((prev) =>
              prev.map((notif) =>
                notif.notification_id === updatedNotification.notification_id
                  ? updatedNotification
                  : notif
              )
            );

            // Recalculate unread count
            if (updatedNotification.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 NotificationContext: Realtime subscription status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('✅ NotificationContext: Successfully subscribed to realtime notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ NotificationContext: Realtime channel error');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ NotificationContext: Realtime subscription timed out');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ NotificationContext: Realtime channel closed');
        }
      });

    return () => {
      console.log('🔌 NotificationContext: Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log('📖 NotificationContext: Marking notification as read:', notificationId);

      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/notifications/read/${notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      // Update local state - DON'T delete, just mark as read
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notification_id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ NotificationContext: Error marking notification as read:', error);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    if (!currentUserId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log('🗑️ NotificationContext: Clearing all notifications');

      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/notifications/clear/${currentUserId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ NotificationContext: Error clearing notifications:', error);
    }
  };

  const refreshNotifications = async () => {
    console.log('🔄 NotificationContext: Manually refreshing notifications');
    await fetchNotifications();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        clearAll,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
