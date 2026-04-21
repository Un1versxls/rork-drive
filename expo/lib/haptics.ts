import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export type HapticKind =
  | "tap"
  | "select"
  | "success"
  | "warning"
  | "error"
  | "celebrate"
  | "doubleTap"
  | "heavy";

export function triggerHaptic(kind: HapticKind, enabled: boolean = true): void {
  if (!enabled) return;
  if (Platform.OS === "web") return;
  try {
    switch (kind) {
      case "tap":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "select":
        Haptics.selectionAsync();
        break;
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "error":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "heavy":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "doubleTap":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        }, 90);
        break;
      case "celebrate":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }, 120);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        }, 260);
        break;
    }
  } catch {}
}
