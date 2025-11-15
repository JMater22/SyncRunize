import { useEffect } from 'react';
import { usePushNotifications } from './push-notification';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * PushNotificationInitializer
 *
 * Initializes push notifications at the app level (mounted in App.tsx).
 * This ensures push notification listeners are active throughout the entire app session,
 * regardless of which page the user is on.
 *
 * Benefits:
 * - Single initialization per app session (no duplicate registrations)
 * - Background notifications work even when user is on different pages
 * - Device token registered immediately after authentication
 * - Centralized notification event handling
 */
export const PushNotificationInitializer: React.FC = () => {
  const { fetchNotifications } = useNotifications();

  usePushNotifications({
    onTokenReceived: (token) => {
      console.log('[PushInit] ✅ Device token registered with backend:', token.substring(0, 20) + '...');
    },
    onNotificationReceived: (notification) => {
      console.log('[PushInit] 📨 Notification received in foreground:', notification);
      // Refresh notification list when new notification arrives
      fetchNotifications();
    },
    onNotificationActionPerformed: (notification) => {
      console.log('[PushInit] 👆 Notification tapped by user:', notification);
      // Refresh notification list when user interacts with notification
      fetchNotifications();
      // TODO: Add navigation logic based on notification type
      // e.g., if (notification.data.type === 'batch_alert') navigate to RunTrackerPage
    },
  });

  // This component doesn't render anything - it just initializes push notifications
  return null;
};
