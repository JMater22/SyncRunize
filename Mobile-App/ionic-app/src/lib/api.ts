import axios from 'axios';
import { supabase } from './supabaseClient';

const baseURL = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  timeout: 30000  // 30 second timeout
});

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  // ✅ FIX: Track request start time for performance monitoring
  (config as any).metadata = { startTime: Date.now() };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${session.access_token}`;
    } else {
      // Log when token is missing for debugging
      if (import.meta.env.DEV) {
        console.warn('[API] Request made without auth token:', config.url);
      }
    }
  } catch (err) {
    console.error('[API] Error attaching auth token:', err);
  }
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

