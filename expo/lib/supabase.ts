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

export interface SupabasePing {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export async function pingSupabase(): Promise<SupabasePing> {
  const started = Date.now();
  if (!supabase) {
    return { ok: false, latencyMs: 0, error: "Supabase keys missing" };
  }
  try {
    const { error } = await supabase
      .from("user_accounts")
      .select("id", { count: "exact", head: true })
      .limit(1);
    const latencyMs = Date.now() - started;
    if (error && error.code !== "PGRST116") {
      console.log("[supabase] ping error", error.message, error.code);
      if (error.message.toLowerCase().includes("relation") || error.code === "42P01") {
        return { ok: true, latencyMs, error: "Tables not created yet" };
      }
      return { ok: false, latencyMs, error: error.message };
    }
    console.log("[supabase] ping ok", latencyMs, "ms");
    return { ok: true, latencyMs };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    console.log("[supabase] ping exception", msg);
    return { ok: false, latencyMs: Date.now() - started, error: msg };
  }
}
