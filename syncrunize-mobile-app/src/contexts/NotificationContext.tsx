import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode, useRef } from 'react';
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

// ✅ FIX: Add TTL to notification cache to prevent stale data
interface CachedNotifications {
  data: Notification[];
  timestamp: number;
}

const NOTIFICATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Safely calculate unread count - ensure notifications is always an array
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0;

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      console.log('[NotificationContext] Fetching notifications');
      const data = await NotificationsApi.getAllNotifications(currentUser.user_id);
      console.log('📥 [NotificationContext] Fetched notifications:', data);
      console.log('📥 [NotificationContext] First notification actor:', data[0]?.actor);

      // ✅ Filter out alerts - they're ephemeral push notifications only
      // Only show social notifications in the notification center
      const alertTypes = ['hazard_alert', 'traffic_alert', 'batch_alert'];
      const socialNotifications = Array.isArray(data)
        ? data.filter(notif => !alertTypes.includes(notif.type))
        : [];

      console.log(`📥 [NotificationContext] Filtered ${data?.length || 0} → ${socialNotifications.length} social notifications`);

      // Validate notifications before setting state - ensure actor data exists for social notifications
      const validatedNotifications = socialNotifications.map(notif => {
        // Notification types that require actor data
        const requiresActor = ['follow', 'like', 'comment', 'group_like', 'group_comment'].includes(notif.type);

        if (requiresActor && !notif.actor && notif.actor_id) {
          console.warn(`[NotificationContext] Notification ${notif.notification_id} missing actor data for type ${notif.type}, actor_id=${notif.actor_id}`);
        }

        return notif;
      });

      setNotifications(validatedNotifications);
      hasLoadedRef.current = true;

      // ✅ FIX: Cache notifications with timestamp for TTL checking
      const cachedData: CachedNotifications = {
        data: validatedNotifications,
        timestamp: Date.now()
      };
      sessionStorage.setItem(`notifications_${currentUser.user_id}`, JSON.stringify(cachedData));
      console.log('[NotificationContext] Cached', validatedNotifications.length, 'notifications with TTL');
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
      setNotifications([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await NotificationsApi.markAsRead(notificationId);

      // Update local state - preserve ALL notification data including actor
      const updatedNotifications = notifications.map(n => {
        if (n.notification_id === notificationId) {
          // Debug: Check if actor data exists before updating
          if (!n.actor && n.actor_id) {
            console.warn(`[NotificationContext] Notification ${notificationId} missing actor data, actor_id=${n.actor_id}`);
          }
          return { ...n, is_read: true };
        }
        return n;
      });
      setNotifications(updatedNotifications);

      // ✅ FIX: Update cache with timestamp for TTL
      if (currentUser) {
        const cachedData: CachedNotifications = {
          data: updatedNotifications,
          timestamp: Date.now()
        };
        sessionStorage.setItem(`notifications_${currentUser.user_id}`, JSON.stringify(cachedData));
        console.log(`[NotificationContext] Marked notification ${notificationId} as read and updated cache`);
      }
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  }, [notifications, currentUser]);

  const clearAll = useCallback(async () => {
    if (!currentUser) return;

    try {
      await NotificationsApi.clearAll(currentUser.user_id);
      setNotifications([]);

      // Clear cache
      sessionStorage.removeItem(`notifications_${currentUser.user_id}`);
    } catch (err: any) {
      console.error('Failed to clear notifications:', err);
      throw err;
    }
  }, [currentUser]);

  // Fetch notifications when user changes with caching
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      hasLoadedRef.current = false;
      return;
    }

    // ✅ FIX: Try to restore from cache with TTL check
    const cachedKey = `notifications_${currentUser.user_id}`;
    const cachedNotifications = sessionStorage.getItem(cachedKey);

    if (cachedNotifications && !hasLoadedRef.current) {
      try {
        const parsed = JSON.parse(cachedNotifications);

        // Check if this is new format with timestamp or old format (array)
        const isNewFormat = parsed && typeof parsed === 'object' && 'data' in parsed && 'timestamp' in parsed;

        if (!isNewFormat) {
          // Old format: clear and refetch
          console.log('[NotificationContext] Old cache format detected, clearing...');
          sessionStorage.removeItem(cachedKey);
          fetchNotifications();
          return;
        }

        const cachedData = parsed as CachedNotifications;
        const cacheAge = Date.now() - cachedData.timestamp;

        // Check if cache is expired (24 hours)
        if (cacheAge > NOTIFICATION_CACHE_TTL_MS) {
          console.log(`[NotificationContext] Cache expired (${(cacheAge / 1000 / 60 / 60).toFixed(1)}h old), clearing...`);
          sessionStorage.removeItem(cachedKey);
          fetchNotifications();
          return;
        }

        console.log(`[NotificationContext] Restoring ${cachedData.data.length} notifications from cache (${(cacheAge / 1000 / 60).toFixed(1)}m old)`);

        // Validate cached notifications - check for missing actor data
        const missingActorCount = cachedData.data.filter((n: Notification) => {
          const requiresActor = ['follow', 'like', 'comment', 'group_like', 'group_comment'].includes(n.type);
          return requiresActor && !n.actor && n.actor_id;
        }).length;

        if (missingActorCount > 0) {
          console.warn(`[NotificationContext] ⚠️ ${missingActorCount} cached notifications missing actor data - will refetch`);
          // Clear bad cache and fetch fresh data
          sessionStorage.removeItem(cachedKey);
          fetchNotifications();
          return;
        }

        setNotifications(cachedData.data);
        hasLoadedRef.current = true;

        // Still fetch in background to get latest (but don't show loading)
        fetchNotifications();
        return;
      } catch (err) {
        console.error('[NotificationContext] Failed to parse cached notifications:', err);
        sessionStorage.removeItem(cachedKey);
      }
    }

    // If no cache or already loaded, fetch normally
    if (!hasLoadedRef.current) {
      fetchNotifications();
    }
  }, [currentUser, fetchNotifications]);

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

          // ✅ Filter out alerts - they're sent as push notifications only
          // Only social notifications (likes, comments, follows, etc.) appear in notification center
          const alertTypes = ['hazard_alert', 'traffic_alert', 'batch_alert'];
          if (alertTypes.includes(payload.new.type)) {
            console.log('[Notifications] ⚠️ Skipping alert notification (sent as push banner):', payload.new.type);
            return;
          }

          // Fetch full notification with actor details
          const { data: newNotification, error } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:users!actor_id (
                user_id,
                name,
                username,
                profile_picture
              )
            `)
            .eq('notification_id', payload.new.notification_id)
            .single();

          if (error) {
            console.error('Error fetching new notification with actor:', error);

            // Don't add notification without actor data - instead trigger a refetch
            // This prevents cache corruption with incomplete data
            const requiresActor = ['follow', 'like', 'comment', 'group_like', 'group_comment'].includes(payload.new.type);

            if (requiresActor) {
              console.warn(`[NotificationContext] Skipping notification ${payload.new.notification_id} - missing actor data`);
              // Trigger background refetch to get complete data
              setTimeout(() => fetchNotifications(), 1000);
              return;
            }

            // For notifications that don't require actor (e.g., system notifications), add them
            const payloadNotif = payload.new as Notification;
            setNotifications(prev => {
              const updated = [payloadNotif, ...prev];
              // ✅ FIX: Update cache with timestamp
              if (currentUser) {
                const cachedData: CachedNotifications = {
                  data: updated,
                  timestamp: Date.now()
                };
                sessionStorage.setItem(`notifications_${currentUser.user_id}`, JSON.stringify(cachedData));
              }
              return updated;
            });
            return;
          }

          if (newNotification) {
            console.log('Adding new notification with actor:', newNotification);
            setNotifications(prev => {
              const updated = [newNotification, ...prev];
              // ✅ FIX: Update cache with timestamp
              if (currentUser) {
                const cachedData: CachedNotifications = {
                  data: updated,
                  timestamp: Date.now()
                };
                sessionStorage.setItem(`notifications_${currentUser.user_id}`, JSON.stringify(cachedData));
              }
              return updated;
            });
          }
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

          // Refetch full notification with actor details from Supabase
          try {
            const { data: updatedNotification, error } = await supabase
              .from('notifications')
              .select(`
                *,
                actor:users!actor_id (
                  user_id,
                  name,
                  username,
                  profile_picture
                )
              `)
              .eq('notification_id', payload.new.notification_id)
              .single();

            if (error) {
              console.error('Error fetching updated notification:', error);

              // Fallback: preserve existing actor data if available
              const payloadNotif = payload.new as Notification;
              const requiresActor = ['follow', 'like', 'comment', 'group_like', 'group_comment'].includes(payloadNotif.type);

              setNotifications(prev => {
                const existing = prev.find(n => n.notification_id === payloadNotif.notification_id);

                // If notification requires actor but existing doesn't have it, trigger refetch
                if (requiresActor && existing && !existing.actor && existing.actor_id) {
                  console.warn(`[NotificationContext] UPDATE fallback - existing notification ${payloadNotif.notification_id} missing actor data, triggering refetch`);
                  setTimeout(() => fetchNotifications(), 1000);
                  return prev; // Don't update state with broken data
                }

                // Preserve existing actor data in fallback
                const updated = prev.map(n =>
                  n.notification_id === payloadNotif.notification_id
                    ? { ...payloadNotif, actor: n.actor }
                    : n
                );

                // ✅ FIX: Update cache with timestamp
                if (currentUser) {
                  const cachedData: CachedNotifications = {
                    data: updated,
                    timestamp: Date.now()
                  };
                  sessionStorage.setItem(`notifications_${currentUser.user_id}`, JSON.stringify(cachedData));
                }

                return updated;
              });
              return;
            }

            if (updatedNotification) {
              // Verify actor data exists before updating
              const requiresActor = ['follow', 'like', 'comment', 'group_like', 'group_comment'].includes(updatedNotification.type);

              if (requiresActor && !updatedNotification.actor && updatedNotification.actor_id) {
                console.warn(`[NotificationContext] ⚠️ Supabase returned notification ${updatedNotification.notification_id} WITHOUT actor data - preserving existing`);
                // Preserve existing actor data if Supabase didn't return it
                setNotifications(prev => {
                  const existing = prev.find(n => n.notification_id === updatedNotification.notification_id);
                  const updated = prev.map(n =>
                    n.notification_id === updatedNotification.notification_id
                      ? { ...updatedNotification, actor: existing?.actor || n.actor }
                      : n
                  );
                  // ✅ FIX: Update cache with timestamp
                  if (currentUser) {
                    const cachedData: CachedNotifications = {
                      data: updated,
                      timestamp: Date.now()
                    };
                    sessionStorage.setItem(`notifications_${currentUser.user_id}`, JSON.stringify(cachedData));
                  }
                  return updated;
                });
              } else {
                // Update with full notification including actor details
                setNotifications(prev => {
                  const updated = prev.map(n =>
                    n.notification_id === updatedNotification.notification_id
                      ? updatedNotification
                      : n
                  );
                  // ✅ FIX: Update cache with timestamp
                  if (currentUser) {
                    const cachedData: CachedNotifications = {
                      data: updated,
                      timestamp: Date.now()
                    };
                    sessionStorage.setItem(`notifications_${currentUser.user_id}`, JSON.stringify(cachedData));
                  }
                  return updated;
                });
              }
            }
          } catch (err) {
            console.error('Failed to refetch notification:', err);

            // Fallback: preserve existing actor data
            const payloadNotif = payload.new as Notification;
            const requiresActor = ['follow', 'like', 'comment', 'group_like', 'group_comment'].includes(payloadNotif.type);

            setNotifications(prev => {
              const existing = prev.find(n => n.notification_id === payloadNotif.notification_id);

              // If notification requires actor but existing doesn't have it, trigger refetch
              if (requiresActor && existing && !existing.actor && existing.actor_id) {
                console.warn(`[NotificationContext] UPDATE catch fallback - existing notification ${payloadNotif.notification_id} missing actor data, triggering refetch`);
                setTimeout(() => fetchNotifications(), 1000);
                return prev; // Don't update with broken data
              }

              // Preserve existing actor data
              const updated = prev.map(n =>
                n.notification_id === payloadNotif.notification_id
                  ? { ...payloadNotif, actor: n.actor }
                  : n
              );

              // ✅ FIX: Update cache with timestamp
              if (currentUser) {
                const cachedData: CachedNotifications = {
                  data: updated,
                  timestamp: Date.now()
                };
                sessionStorage.setItem(`notifications_${currentUser.user_id}`, JSON.stringify(cachedData));
              }

              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      clearAll,
    }),
    [notifications, unreadCount, loading, error, fetchNotifications, markAsRead, clearAll]
  );

  return (
    <NotificationContext.Provider value={value}>
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
