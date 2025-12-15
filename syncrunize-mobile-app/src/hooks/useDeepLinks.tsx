import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabaseClient';

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
        const isHttps = urlObj.protocol === 'https:';
        const path = urlObj.pathname || urlObj.host; // host is used for custom schemes

        console.log('[DeepLink] Protocol:', urlObj.protocol);
        console.log('[DeepLink] Path:', path);
        console.log('[DeepLink] Hash:', urlObj.hash);
        console.log('[DeepLink] Search params:', urlObj.searchParams.toString());

        // ✅ Handle Android App Links (HTTPS from email)
        // Format: https://syncrunize-website.vercel.app/auth-redirect#access_token=...
        if (isHttps && path === '/auth-redirect') {
          console.log('[DeepLink] Detected HTTPS app link for auth redirect');

          // Extract tokens from hash (Supabase uses hash-based redirect)
          const hash = urlObj.hash.substring(1); // Remove '#'
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          console.log('[DeepLink] Token type:', type);
          console.log('[DeepLink] Has access token:', !!accessToken);

          if (accessToken && type === 'recovery') {
            // Password reset flow
            console.log('[DeepLink] Setting session for password reset...');
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            }).then(({ error }) => {
              if (error) {
                console.error('[DeepLink] Error setting session:', error);
                history.push('/log-in');
                return;
              }
              console.log('[DeepLink] Session established, navigating to reset password');
              setTimeout(() => {
                history.push('/reset-password');
              }, 100);
            });
          } else if (accessToken) {
            // OAuth sign-in flow
            console.log('[DeepLink] Setting session for OAuth...');
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            }).then(({ data: { session }, error }) => {
              if (error) {
                console.error('[DeepLink] Error establishing OAuth session:', error);
                history.push('/log-in');
                return;
              }
              if (session) {
                console.log('[DeepLink] OAuth session established, redirecting to home');
                setTimeout(() => {
                  history.push('/home');
                }, 100);
              } else {
                history.push('/log-in');
              }
            });
          } else {
            console.warn('[DeepLink] No tokens found in auth redirect');
            history.push('/log-in');
          }
          return;
        }

        // Handle OAuth callback (Google Sign-In)
        // Format: syncrunize://home#access_token=...&refresh_token=...
        if (path === 'home' || path === '/home') {
          console.log('[DeepLink] Detected OAuth redirect to home');

          // Check if URL contains auth tokens in the hash
          const hash = urlObj.hash.substring(1); // Remove the '#'
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');

          if (accessToken) {
            console.log('[DeepLink] OAuth tokens detected, establishing session...');

            // Get all required tokens from the hash
            const refreshToken = hashParams.get('refresh_token');
            const expiresIn = hashParams.get('expires_in');
            const tokenType = hashParams.get('token_type') || 'bearer';

            // Set the session explicitly with the tokens from the URL
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            }).then(({ data: { session }, error }) => {
              if (error) {
                console.error('[DeepLink] Error establishing OAuth session:', error);
                history.push('/log-in');
                return;
              }

              if (session) {
                console.log('[DeepLink] OAuth session established, redirecting to home');
                setTimeout(() => {
                  history.push('/home');
                }, 100);
              } else {
                console.warn('[DeepLink] No session found after OAuth, redirecting to login');
                history.push('/log-in');
              }
            });
          } else {
            // No tokens in URL, just navigate to home
            setTimeout(() => {
              history.push('/home');
            }, 100);
          }
          return;
        }

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
