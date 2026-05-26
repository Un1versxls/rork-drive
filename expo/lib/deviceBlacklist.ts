import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/deviceId";

/** Persisted on the device so the revoked screen survives app restarts. */
const REVOKED_FLAG_KEY = "drive.access.revoked.v1";

export async function setLocalRevokedFlag(value: boolean): Promise<void> {
  try {
    if (value) await AsyncStorage.setItem(REVOKED_FLAG_KEY, "1");
    else await AsyncStorage.removeItem(REVOKED_FLAG_KEY);
  } catch (e) {
    console.log("[blacklist] flag write failed", e);
  }
}

export async function readLocalRevokedFlag(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(REVOKED_FLAG_KEY);
    return v === "1";
  } catch {
    return false;
  }
}

/** True if this device is currently in the blacklist table. */
export async function isDeviceBlacklisted(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const id = await getDeviceId();
    if (!id) return false;
    const { data, error } = await supabase
      .from("blacklisted_devices")
      .select("device_id")
      .eq("device_id", id)
      .maybeSingle();
    if (error) {
      console.log("[blacklist] check error", error.message);
      return false;
    }
    return !!data;
  } catch (e) {
    console.log("[blacklist] check exception", e);
    return false;
  }
}

/** Add this device to the blacklist. Used by the admin revoke flow. */
export async function blacklistDeviceId(params: {
  deviceId: string;
  reason?: string | null;
  userId?: string | null;
  email?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase not configured" };
  try {
    const { error } = await supabase.from("blacklisted_devices").upsert({
      device_id: params.deviceId,
      reason: params.reason ?? "revoked",
      user_id: params.userId ?? null,
      email: params.email ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

/** Remove this device from the blacklist. */
export async function unblacklistDeviceId(deviceId: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase not configured" };
  try {
    const { error } = await supabase.from("blacklisted_devices").delete().eq("device_id", deviceId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

/** Stamp this device id onto the user's account rows so admin can revoke it. */
export async function stampDeviceOnAccount(params: { userId: string | null; email: string | null }): Promise<void> {
  if (!supabase) return;
  try {
    const id = await getDeviceId();
    if (!id) return;
    if (params.userId) {
      await supabase
        .from("user_accounts")
        .update({ last_device_id: id, updated_at: new Date().toISOString() })
        .eq("id", params.userId);
      await supabase
        .from("app_users")
        .update({ last_device_id: id, updated_at: new Date().toISOString() })
        .eq("user_id", params.userId);
    } else if (params.email) {
      const lowered = params.email.trim().toLowerCase();
      await supabase
        .from("app_users")
        .update({ last_device_id: id, updated_at: new Date().toISOString() })
        .eq("email", lowered);
    }
  } catch (e) {
    console.log("[blacklist] stamp device error", e);
  }
}
