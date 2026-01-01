import axios from 'axios';
import { supabase } from './supabaseClient';
import { ToastService } from './toastService';

const baseURL = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  timeout: 60000  // 60 second timeout - Render free tier cold starts can take 30-45s
});

// ✅ CRITICAL FIX: Cache auth session in memory to avoid blocking localStorage fetch on EVERY request
// This was causing 1-5 second delays before each API call!
let cachedSession: { access_token: string; expires_at?: number } | null = null;
let lastSessionFetch = 0;
const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Mutex to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

// Track consecutive failures to distinguish transient vs permanent issues
let consecutiveRefreshFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3; // Show warning only after 3 consecutive failures

// Constants for retry logic
const REFRESH_TIMEOUT_MS = 3000; // Reduced from 5s to 3s for faster failure detection
const MAX_REFRESH_RETRIES = 2; // Retry twice on timeout (3 total attempts)
const RETRY_DELAY_BASE_MS = 1000; // Exponential backoff: 1s, 2s
const MAX_REFRESH_AGE_MS = 30000; // Consider refresh stuck if running for >30s

// Initialize session cache with timeout
const refreshSessionCache = async (): Promise<void> => {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    console.log('[API] Refresh already in progress - waiting for completion');
    return refreshPromise;
  }

  // Set mutex flag and track start time
  isRefreshing = true;
  refreshStartTime = Date.now();

  // Create the refresh promise
  refreshPromise = (async () => {
    let lastError: Error | null = null;

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= MAX_REFRESH_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 1s, 2s, 4s...
          const delayMs = RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 1);
          console.log(`[API] Retry attempt ${attempt}/${MAX_REFRESH_RETRIES} after ${delayMs}ms delay`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session refresh timeout')), REFRESH_TIMEOUT_MS)
        );

        const sessionPromise = supabase.auth.getSession();

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        // Check for Supabase errors
        if (error) {
          throw new Error(`Supabase auth error: ${error.message}`);
        }

        // SUCCESS: Session retrieved
        if (session && session.access_token) {
          cachedSession = {
            access_token: session.access_token,
            expires_at: session.expires_at
          };
          lastSessionFetch = Date.now();
          consecutiveRefreshFailures = 0; // Reset failure counter on success

          console.log('[API] Session cache refreshed successfully');
          return; // Exit retry loop
        }

        // No session but no error - could be logged out or refresh token expired
        // Try one more time before giving up
        if (attempt < MAX_REFRESH_RETRIES) {
          lastError = new Error('Session is null - retrying');
          continue;
        }

        // After all retries, session is still null - this is a permanent failure
        console.warn('[API] Refresh token expired after all retries - triggering auto-logout');
        cachedSession = null;
        lastSessionFetch = Date.now();
        consecutiveRefreshFailures++;

        // Only show warning if we've had multiple consecutive failures
        // This prevents false positives from single transient issues
        if (consecutiveRefreshFailures >= MAX_CONSECUTIVE_FAILURES) {
          ToastService.warning('Session expired. Please log in again.', 5000);

          // Trigger logout
          try {
            await supabase.auth.signOut();
          } catch (signOutErr) {
            console.error('[API] Auto-logout failed:', signOutErr);
          }
        } else {
          console.log(`[API] Consecutive failure ${consecutiveRefreshFailures}/${MAX_CONSECUTIVE_FAILURES} - not showing warning yet`);
        }

        return;

      } catch (err: any) {
        lastError = err;
        console.error(`[API] Session refresh attempt ${attempt + 1} failed:`, err.message);

        // If this is the last attempt, handle the failure
        if (attempt === MAX_REFRESH_RETRIES) {
          // Timeout or network error - this is likely transient
          if (err.message.includes('timeout') || err.message.includes('network')) {
            console.warn('[API] Session refresh failed due to timeout/network - checking cached session');
            consecutiveRefreshFailures++;

            // Check if cached session is still valid (not expired)
            const now = Date.now();
            const tokenExpired = cachedSession?.expires_at
              ? (cachedSession.expires_at * 1000) <= now
              : true; // Assume expired if no expiry time

            // Only keep cached session if it's not expired
            if (cachedSession && !tokenExpired) {
              console.log('[API] Using valid cached session as fallback');
              lastSessionFetch = Date.now(); // Update timestamp to prevent immediate retry
            } else {
              // Token is expired or missing - force clear to prevent 401 cascade
              if (cachedSession && tokenExpired) {
                console.warn('[API] Cached session is expired - clearing to prevent 401 cascade');
              }
              cachedSession = null;
              lastSessionFetch = 0; // Allow immediate retry on next request

              // Only show warning after multiple consecutive failures
              if (consecutiveRefreshFailures >= MAX_CONSECUTIVE_FAILURES) {
                ToastService.warning('Unable to refresh session. Please check your connection.', 4000);
              }
            }
          } else {
            // Other errors (auth errors, etc) - treat as potentially permanent
            console.error('[API] Session refresh failed with auth error:', err);
            cachedSession = null;
            lastSessionFetch = Date.now();
            consecutiveRefreshFailures++;

            if (consecutiveRefreshFailures >= MAX_CONSECUTIVE_FAILURES) {
              ToastService.warning('Session expired. Please log in again.', 5000);

              try {
                await supabase.auth.signOut();
              } catch (signOutErr) {
                console.error('[API] Auto-logout failed:', signOutErr);
              }
            }
          }
        }
        // Continue to next retry attempt
      }
    }
  })();

  try {
    await refreshPromise;
  } finally {
    // Always clear mutex when done
    isRefreshing = false;
    refreshPromise = null;
  }
};

// ✅ FIX: Export function to clear session cache (called on logout)
export const clearSessionCache = () => {
  console.log('[API] Clearing session cache');
  cachedSession = null;
  lastSessionFetch = 0;
  consecutiveRefreshFailures = 0; // Reset failure counter on explicit cache clear
  isRefreshing = false; // Reset mutex
  refreshPromise = null; // Clear any pending refresh
};

// ✅ FIX: Export function to force reset refresh state (emergency recovery)
export const resetRefreshState = () => {
  console.warn('[API] Force resetting refresh state');
  isRefreshing = false;
  refreshPromise = null;
  // Don't clear cached session or failure counter - just unlock the mutex
};

// ✅ FIX: Detect and recover from stuck refresh when app returns from background
// Track when refresh started to detect stuck refreshes
let refreshStartTime = 0;

// Setup app state listener for mobile (Capacitor)
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  import('@capacitor/app').then(({ App }) => {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('[API] App returned to foreground');

        // Check if refresh is stuck (running for >30 seconds)
        const refreshAge = Date.now() - refreshStartTime;
        if (isRefreshing && refreshAge > MAX_REFRESH_AGE_MS) {
          console.warn(`[API] Refresh was stuck for ${(refreshAge / 1000).toFixed(1)}s - resetting`);
          resetRefreshState();

          // Force a fresh session check
          cachedSession = null;
          lastSessionFetch = 0;
        }
      }
    });
    console.log('[API] App state listener registered');
  }).catch(err => {
    console.log('[API] Capacitor not available (likely web environment):', err.message);
  });
}

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  // ✅ FIX: Track request start time for performance monitoring
  (config as any).metadata = { startTime: Date.now() };
  console.log(`[API] Starting request: ${config.method?.toUpperCase()} ${config.url}`);

  try {
    // ✅ FIX: Check both cache age AND token expiration
    const now = Date.now();
    const cacheAge = now - lastSessionFetch;
    const tokenExpired = cachedSession?.expires_at
      ? (cachedSession.expires_at * 1000) <= now + 300000 // Refresh if expires in < 5 minutes
      : false;

    if (!cachedSession || cacheAge > SESSION_CACHE_DURATION || tokenExpired) {
      if (tokenExpired) {
        console.log('[API] Token expired or expiring soon, refreshing...');
        // Show toast during testing to see when refresh happens
        if (import.meta.env.DEV) {
          ToastService.info('Refreshing session...', 2000);
        }
      } else {
        console.log(`[API] Session cache stale (${(cacheAge / 1000).toFixed(1)}s old), refreshing...`);
      }
      await refreshSessionCache();
    }

    if (cachedSession?.access_token) {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${cachedSession.access_token}`;
    } else {
      // Log when token is missing for debugging
      if (import.meta.env.DEV) {
        console.warn('[API] Request made without auth token:', config.url);
      }
    }
  } catch (err) {
    console.error('[API] Error attaching auth token:', err);
  }

  console.log(`[API] Request ready after ${Date.now() - (config as any).metadata.startTime}ms`);
  return config;
});

// ✅ FIX: Enhanced response interceptor with performance monitoring and detailed error logging
api.interceptors.response.use(
  response => {
    // Log slow requests for performance debugging
    const duration = Date.now() - (response.config as any).metadata?.startTime;
    if (duration > 5000) {
      console.warn(`[API] Slow request detected: ${response.config.method?.toUpperCase()} ${response.config.url} took ${duration}ms`);
    } else if (import.meta.env.DEV && duration > 2000) {
      console.info(`[API] Request: ${response.config.method?.toUpperCase()} ${response.config.url} took ${duration}ms`);
    }
    return response;
  },
  async (error) => {
    // Calculate request duration even on error
    const duration = Date.now() - ((error.config as any)?.metadata?.startTime || Date.now());

    // Detailed error logging for debugging
    console.error(`[API] Request failed after ${duration}ms:`, {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.message,
      data: error.response?.data
    });

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error(`Request timed out after ${duration}ms. Please check your connection.`));
    }

    // Handle network errors (backend unreachable)
    if (!error.response) {
      return Promise.reject(new Error(`Network error - cannot reach backend at ${baseURL}. Please verify backend is running and device is on the same network.`));
    }

    // Better handling of auth errors - try refresh once before logout
    if (error.response.status === 401 || error.response.status === 403) {
      console.error('[API] Authentication failed:', error.response.data);

      // Check if this is already a retry attempt
      const isRetry = error.config.headers?.['X-Retry-After-Auth'];

      if (!isRetry) {
        console.log('[API] First auth failure - attempting token refresh...');

        // Clear stale cache and try to refresh
        cachedSession = null;
        lastSessionFetch = 0;

        try {
          await refreshSessionCache();

          // If we got a valid token, retry the request
          // @ts-ignore - TypeScript cannot track that refreshSessionCache modifies cachedSession
          if (cachedSession !== null && cachedSession.access_token) {
            console.log('[API] Token refreshed successfully - retrying request');
            consecutiveRefreshFailures = 0; // Reset on successful refresh
            error.config.headers = error.config.headers || {};
            // @ts-ignore
            error.config.headers.Authorization = `Bearer ${cachedSession.access_token}`;
            error.config.headers['X-Retry-After-Auth'] = 'true'; // Mark as retry
            return api.request(error.config);
          }
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
        }
      }

      // If retry failed or this is already a retry, force logout
      console.log('[API] Authentication cannot be recovered - logging out');
      ToastService.error('Session expired. Logging out...', 3000);

      setTimeout(() => {
        supabase.auth.signOut().then(() => {
          window.location.href = '/log-in';
        }).catch(() => {
          window.location.href = '/log-in';
        });
      }, 1000);

      return Promise.reject(new Error('Authentication failed. Please log in again.'));
    }

    // Pass through other errors with original details
    return Promise.reject(error);
  }
);

export default api;

