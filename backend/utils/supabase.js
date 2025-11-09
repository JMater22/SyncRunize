// utils/supabase.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config(); // <- load .env variables

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer service role key on the server to avoid RLS issues when inserting notifications
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const usedKey = serviceRoleKey ? 'SERVICE_ROLE' : 'ANON';
if (!supabaseUrl) {
  console.error('[Supabase] SUPABASE_URL is not set. Please configure backend/.env');
}
if (!serviceRoleKey && !supabaseAnonKey) {
  console.error('[Supabase] No Supabase key found. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
}
console.log(`[Supabase] Initializing client with ${usedKey} key`);

export const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
  