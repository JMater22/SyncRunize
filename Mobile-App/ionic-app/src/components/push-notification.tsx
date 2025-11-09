import { useEffect } from 'react';
import {
  PushNotifications,
  Token,
  ActionPerformed,
  PushNotificationSchema,
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

let hasLoggedWebWarning = false;

interface PushNotificationHookProps {
  onTokenReceived?: (token: string) => void;
  onNotificationReceived?: (notification: PushNotificationSchema) => void;
  onNotificationActionPerformed?: (notification: ActionPerformed) => void;
}

export const usePushNotifications = ({
  onTokenReceived,
  onNotificationReceived,
  onNotificationActionPerformed,
}: PushNotificationHookProps = {}) => {
  useEffect(() => {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      if (!hasLoggedWebWarning) {
        console.log('[Push] Push notifications are only available on native platforms (Android/iOS).');
        hasLoggedWebWarning = true;
      }
      return;
    }

    const initPush = async () => {
      try {
        console.log('[Push] Checking notification permissions...');
        const permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive !== 'granted') {
          const requestStatus = await PushNotifications.requestPermissions();
          if (requestStatus.receive !== 'granted') {
            console.warn('[Push] Push notification permission denied.');
            return;
          }
        }

        console.log('[Push] Registering for push notifications...');
        await PushNotifications.register();

        // ✅ Listeners
        const tokenListener = await PushNotifications.addListener(
          'registration',
          (token: Token) => {
            console.log('[Push] Registration success. Token:', token.value);
            onTokenReceived?.(token.value);
          }
        );

        const errorListener = await PushNotifications.addListener(
          'registrationError',
          (error) => {
            console.error('[Push] Registration error:', error);
          }
        );

        const receivedListener = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotificationSchema) => {
            console.log('[Push] Notification received:', notification);
            onNotificationReceived?.(notification);
          }
        );

        const actionListener = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification: ActionPerformed) => {
            console.log('[Push] Notification action performed:', notification);
            onNotificationActionPerformed?.(notification);
          }
        );

        return () => {
          console.log('[Push] Cleaning up push notification listeners...');
          tokenListener.remove();
          errorListener.remove();
          receivedListener.remove();
          actionListener.remove();
        };
      } catch (err) {
        console.error('[Push] Failed to initialize push notifications:', err);
      }
    };

    initPush();
  }, [onTokenReceived, onNotificationReceived, onNotificationActionPerformed]);
};
