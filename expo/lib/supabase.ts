import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseReady: boolean = Boolean(url && anon);

if (supabaseReady) {
  console.log("[supabase] initialized", url.replace(/^https?:\/\//, "").split(".")[0]);
} else {
  console.log("[supabase] missing env vars — client disabled");
}

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
  if (!supabaseReady || !url || !anon) {
    return { ok: false, latencyMs: 0, error: "Supabase keys missing" };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${url}/rest/v1/?select=*`, {
      method: "GET",
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - started;
    if (res.ok || res.status === 404 || res.status === 401) {
      console.log("[supabase] ping ok", latencyMs, "ms status", res.status);
      return { ok: true, latencyMs };
    }
    console.log("[supabase] ping bad status", res.status);
    return { ok: false, latencyMs, error: `HTTP ${res.status}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    console.log("[supabase] ping exception", msg);
    return { ok: false, latencyMs: Date.now() - started, error: msg };
  }
}
