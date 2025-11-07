import axios from 'axios';
import { supabase } from './supabaseClient';

const baseURL = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${session.access_token}`;
    }
  } catch (_) {
    // ignore; request can proceed without token on public endpoints
  }
  return config;
});

export default api;

