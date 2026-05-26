import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Application from "expo-application";

const STORAGE_KEY = "drive.device.id.v1";

let cached: string | null = null;

/**
 * Stable per-device identifier. Uses Apple's identifierForVendor on iOS
 * and the AndroidId on Android, falling back to a locally generated UUID
 * persisted in AsyncStorage when neither is available (e.g. web).
 */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    if (Platform.OS === "ios") {
      const id = await Application.getIosIdForVendorAsync();
      if (id) {
        cached = id;
        return id;
      }
    } else if (Platform.OS === "android") {
      const id = Application.getAndroidId?.() ?? null;
      if (id) {
        cached = id;
        return id;
      }
    }
  } catch (e) {
    console.log("[deviceId] native lookup failed", e);
  }
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing) {
      cached = existing;
      return existing;
    }
    const generated = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(STORAGE_KEY, generated);
    cached = generated;
    return generated;
  } catch (e) {
    console.log("[deviceId] storage fallback failed", e);
    const last = `mem_${Date.now().toString(36)}`;
    cached = last;
    return last;
  }
}
