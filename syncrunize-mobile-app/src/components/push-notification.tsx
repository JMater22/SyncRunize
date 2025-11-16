import { useEffect } from 'react';
import {
  PushNotifications,
  Token,
  ActionPerformed,
  PushNotificationSchema,
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { DevicesApi, type DevicePlatform } from '../services/devices';

let hasLoggedWebWarning = false;

const normalizePlatform = (platform: string): DevicePlatform => {
  if (platform === 'ios' || platform === 'android' || platform === 'web') {
    return platform;
  }
  return 'unknown';
};

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
        console.log('[Push] Current permission status:', JSON.stringify(permStatus));

        if (permStatus.receive !== 'granted') {
          console.log('[Push] Requesting notification permissions...');
          const requestStatus = await PushNotifications.requestPermissions();
          console.log('[Push] Permission request result:', JSON.stringify(requestStatus));

          if (requestStatus.receive !== 'granted') {
            console.warn('[Push] ❌ Push notification permission denied by user');
            alert('Please enable notifications in Settings → Apps → SyncRunize → Notifications to receive safety alerts while running.');
            return;
          }
        }

        console.log('[Push] ✅ Permission granted. Registering for push notifications...');
        await PushNotifications.register();

        // ✅ Listeners
        const tokenListener = await PushNotifications.addListener(
          'registration',
          async (token: Token) => {
            console.log('[Push] Registration success. Token:', token.value);
            try {
              await DevicesApi.register({
                token: token.value,
                platform: normalizePlatform(platform),
              });
            } catch (err) {
              console.warn('[Push] Failed to register device token', err);
            }
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
          async (notification: PushNotificationSchema) => {
            // Check if app is in foreground or background
            const appState = await App.getState();
            const isActive = appState.isActive;

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`[Push] 📨 Notification received!`);
            console.log(`[Push] 🎯 App State: ${isActive ? '🟢 FOREGROUND' : '⚫ BACKGROUND'}`);
            console.log(`[Push] 📋 Title: "${notification.title}"`);
            console.log(`[Push] 💬 Body: "${notification.body}"`);
            console.log(`[Push] 📦 Data:`, notification.data);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
