import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hooceemtoyucadhxuevx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vPUyS5ewiw_8XPg8YA06pA_PvvgbjQ1";


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
