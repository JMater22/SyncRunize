import { Capacitor } from '@capacitor/core';

/**
 * Gets the appropriate redirect URL for auth operations based on the platform
 *
 * Flow for password reset from mobile app:
 * 1. User requests password reset from mobile app
 * 2. Email is sent with link redirecting to WEB APP's /reset-password page
 * 3. User clicks email link → opens in browser → completes reset on web app
 * 4. User returns to mobile app and logs in with new password
 */
export const getAuthRedirectUrl = (path: string): string | undefined => {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    // For password reset, always redirect to web app (not deep link)
    // User will complete password reset in browser, then return to app
    if (path === '/reset-password') {
      const webAppUrl = import.meta.env.VITE_WEB_APP_URL || 'https://syncrunize-website.vercel.app';
      return `${webAppUrl}${path}`;
    }

    // For OAuth callbacks, use deep link to return to app
    const customScheme = 'syncrunize';
    return `${customScheme}://${path.replace(/^\//, '')}`;
  }

  // For web app, use the current origin
  return `${window.location.origin}${path}`;
};

/**
 * Check if running in native Capacitor app
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};
