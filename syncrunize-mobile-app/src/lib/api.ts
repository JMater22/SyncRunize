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

// Initialize session cache with timeout
const refreshSessionCache = async () => {
  try {
    // Add 5 second timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Session refresh timeout')), 5000)
    );

    const sessionPromise = supabase.auth.getSession();

    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

    // ✅ FIX: Auto-logout when refresh token expires
    if (!session || !session.access_token) {
      console.warn('[API] Refresh token expired - triggering auto-logout');
      cachedSession = null;
      lastSessionFetch = Date.now();

      // Show toast notification for testing/debugging
      ToastService.warning('Session expired. Please log in again.', 5000);

      // Trigger logout to clear all auth state and redirect to login
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.error('[API] Auto-logout failed:', signOutErr);
      }
      return;
    }

    cachedSession = {
      access_token: session.access_token,
      expires_at: session.expires_at
    };
    lastSessionFetch = Date.now();
    console.log('[API] Session cache refreshed');
  } catch (err) {
    console.error('[API] Error refreshing session cache:', err);
    // If refresh fails, try to use existing cached session
    if (!cachedSession) {
      cachedSession = null;
    }
    lastSessionFetch = Date.now(); // Still update timestamp to avoid retry loop
  }
};

// ✅ FIX: Export function to clear session cache (called on logout)
export const clearSessionCache = () => {
  console.log('[API] Clearing session cache');
  cachedSession = null;
  lastSessionFetch = 0;
};

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

