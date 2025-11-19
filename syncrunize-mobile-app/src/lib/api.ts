import axios from 'axios';
import { supabase } from './supabaseClient';

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

    cachedSession = session?.access_token ? {
      access_token: session.access_token,
      expires_at: session.expires_at
    } : null;
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
      ? (cachedSession.expires_at * 1000) <= now + 60000 // Refresh if expires in < 1 minute
      : false;

    if (!cachedSession || cacheAge > SESSION_CACHE_DURATION || tokenExpired) {
      if (tokenExpired) {
        console.log('[API] Token expired or expiring soon, refreshing...');
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
  error => {
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

    // Better handling of auth errors
    if (error.response.status === 401 || error.response.status === 403) {
      console.error('[API] Authentication failed:', error.response.data);
      return Promise.reject(new Error('Authentication failed. Please log in again.'));
    }

    // Pass through other errors with original details
    return Promise.reject(error);
  }
);

export default api;

