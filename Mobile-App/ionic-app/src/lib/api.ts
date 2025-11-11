import axios from 'axios';
import { supabase } from './supabaseClient';

const baseURL = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  timeout: 30000  // 30 second timeout
});

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
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

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please check your connection.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // Better handling of auth errors
    if (error.response.status === 401 || error.response.status === 403) {
      console.error('[API] Authentication failed:', error.response.data);
      return Promise.reject(new Error('Authentication failed. Please log in again.'));
    }

    return Promise.reject(error);
  }
);

export default api;

