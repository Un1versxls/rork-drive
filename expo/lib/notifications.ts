import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        const result = await window.Notification.requestPermission();
        return result === "granted";
      }
    } catch (e) {
      console.log("[notifications] web permission error", e);
    }
    return false;
  }
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch (e) {
    console.log("[notifications] native permission error", e);
    return false;
  }
}

export async function scheduleDailyReminder(hour: number): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Your DRIVE tasks are ready",
        body: "Remember why you started. Five minutes is all it takes.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  } catch (e) {
    console.log("[notifications] schedule error", e);
  }
}
