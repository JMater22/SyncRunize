import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Deep Link Handler for Mobile App
 *
 * Handles deep links like:
 * - syncrunize://reset-password (from password reset emails)
 * - syncrunize://auth/callback (from OAuth flows)
 *
 * When user clicks email link with deep link, it opens the app directly
 * instead of opening in browser.
 */
export const useDeepLinks = () => {
  const history = useHistory();

  useEffect(() => {
    // Only set up deep link listener in native apps
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleDeepLink = (event: URLOpenListenerEvent) => {
      const url = event.url;
      console.log('[DeepLink] App opened with URL:', url);

      try {
        // Parse the deep link URL
        const urlObj = new URL(url);
        const path = urlObj.pathname || urlObj.host; // host is used for custom schemes

        console.log('[DeepLink] Path:', path);
        console.log('[DeepLink] Search params:', urlObj.searchParams.toString());

        // Handle password reset deep link
        // Format: syncrunize://reset-password?access_token=...&refresh_token=...
        if (path === 'reset-password' || path === '/reset-password') {
          console.log('[DeepLink] Detected password reset link');

          // Supabase automatically handles the access_token from URL
          // Just navigate to the reset password page
          setTimeout(() => {
            history.push('/reset-password');
          }, 100);
          return;
        }

        // Handle other deep links as needed
        // Example: syncrunize://profile/123
        if (path.startsWith('profile/') || path.startsWith('/profile/')) {
          const userId = path.split('/').pop();
          history.push(`/other-profile?userId=${userId}`);
          return;
        }

        console.log('[DeepLink] Unhandled path:', path);
      } catch (error) {
        console.error('[DeepLink] Error parsing deep link:', error);
      }
    };

    // Add listener for app URL opens
    const listener = App.addListener('appUrlOpen', handleDeepLink);

    console.log('[DeepLink] Listener registered for custom URL scheme');

    // Cleanup listener on unmount
    return () => {
      listener.then(l => l.remove());
    };
  }, [history]);
};

/**
 * Component wrapper for deep link handling
 * Add this to your App.tsx
 */
export const DeepLinkHandler: React.FC = () => {
  useDeepLinks();
  return null;
};
