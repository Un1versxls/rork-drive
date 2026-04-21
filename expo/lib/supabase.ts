import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseReady: boolean = Boolean(url && anon);

export const supabase = supabaseReady
  ? createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
