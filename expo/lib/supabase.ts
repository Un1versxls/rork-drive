import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseReady: boolean = Boolean(url && anon);

export const supabase = supabaseReady
  ? createClient(url, anon, {
      auth: {
        storage: Platform.OS === "web" ? undefined : AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
