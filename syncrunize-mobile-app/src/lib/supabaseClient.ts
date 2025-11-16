import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isNative = Capacitor.isNativePlatform();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !isNative, // Disable URL session detection in native apps
    storage: window.localStorage,
    flowType: 'pkce', // Use PKCE flow for better security
  },
});

