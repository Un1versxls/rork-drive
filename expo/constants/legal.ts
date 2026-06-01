import { Linking, Platform } from "react-native";

/**
 * Legal links surfaced in the paywall and Profile.
 *
 * TERMS_URL uses Apple's standard Terms of Use (EULA) so the App Review
 * requirement (3.1.2c) is satisfied out of the box. Replace PRIVACY_URL
 * with your own hosted privacy policy before shipping.
 */
export const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

// TODO: Replace with your real hosted privacy policy URL.
export const PRIVACY_URL = "https://rork.com/privacy";

export async function openURL(url: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.open(url, "_blank");
      return;
    }
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
    else await Linking.openURL(url);
  } catch (e) {
    console.log("[legal] openURL failed", e);
  }
}
