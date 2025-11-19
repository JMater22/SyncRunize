import { Capacitor } from '@capacitor/core';

/**
 * Gets the appropriate redirect URL for auth operations based on the platform
 *
 * Flow for password reset from mobile app:
 * 1. User requests password reset from mobile app
 * 2. Email is sent with deep link to MOBILE APP (syncrunize://reset-password)
 * 3. User clicks email link → opens mobile app directly
 * 4. User completes password reset in mobile app
 */
export const getAuthRedirectUrl = (path: string): string | undefined => {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    // Use deep link for all auth flows (OAuth + password reset)
    // This opens the mobile app directly instead of browser
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
