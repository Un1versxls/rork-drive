import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, Check, ChevronLeft, Clock, Flame, Heart, Sparkles, Trophy } from "lucide-react-native";

import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { triggerHaptic } from "@/lib/haptics";
import { requestNotificationPermission, scheduleDailyReminder } from "@/lib/notifications";
import { useApp } from "@/providers/AppProvider";
import type { NotificationPrefs } from "@/types";

type Stage = "ask" | "types";

interface TypeOption {
  key: keyof Omit<NotificationPrefs, "dailyReminderHour">;
  label: string;
  description: string;
  Icon: React.ComponentType<{ color: string; size: number }>;
}

const TYPES: TypeOption[] = [
  { key: "dailyReminders", label: "Daily task reminders", description: "A gentle nudge at your chosen time", Icon: Bell },
  { key: "streakProtection", label: "Streak protection", description: "End-of-day warning if tasks aren't done", Icon: Flame },
  { key: "achievementUnlocks", label: "Achievement unlocks", description: "Know the moment you hit a milestone", Icon: Trophy },
  { key: "businessMilestones", label: "Business milestone nudges", description: "Checkpoints tied to your chosen business", Icon: Sparkles },
  { key: "motivating", label: "Motivating reminders", description: "\"Remember why you started\" — when it counts", Icon: Heart },
];

const HOURS = [6, 7, 8, 9, 10, 12, 17, 19, 21];

export default function NotificationsOnboarding() {
  const router = useRouter();
  const { state, setProfileField, setNotificationPrefs, completeOnboarding } = useApp();
  const [stage, setStage] = useState<Stage>("ask");
  const [prefs, setPrefs] = useState<NotificationPrefs>(state.profile.notificationPrefs);
  const [saving, setSaving] = useState<boolean>(false);

  const togglePref = (k: TypeOption["key"]) => {
    triggerHaptic("select", state.profile.hapticsEnabled);
    setPrefs((p) => ({ ...p, [k]: !p[k] }));
  };

  const setHour = (h: number) => {
    triggerHaptic("select", state.profile.hapticsEnabled);
    setPrefs((p) => ({ ...p, dailyReminderHour: h }));
  };

  const onAllow = async () => {
    setSaving(true);
    triggerHaptic("tap", state.profile.hapticsEnabled);
    const granted = await requestNotificationPermission();
    setProfileField("notificationsEnabled", granted);
    setProfileField("notificationPromptSeen", true);
    setSaving(false);
    if (granted) {
      setStage("types");
    } else {
      finish();
    }
  };

  const onSkip = () => {
    triggerHaptic("tap", state.profile.hapticsEnabled);
    setProfileField("notificationsEnabled", false);
    setProfileField("notificationPromptSeen", true);
    finish();
  };

  const onSaveTypes = async () => {
    triggerHaptic("celebrate", state.profile.hapticsEnabled);
    setNotificationPrefs(prefs);
    if (prefs.dailyReminders) {
      await scheduleDailyReminder(prefs.dailyReminderHour).catch(() => {});
    }
    finish();
  };

  const finish = () => {
    completeOnboarding();
    router.replace("/(tabs)/tasks");
  };

  if (stage === "ask") {
    return (
      <View style={styles.root}>
        <BackgroundGlow />
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <ChevronLeft color={Colors.text} size={22} />
          </Pressable>

          <View style={styles.askCenter}>
            <View style={styles.bellWrap}>
              <LinearGradient
                colors={["#d4af37", "#c9a87c", "#8b7355"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bell}
              >
                <Bell color="#faf9f6" size={36} />
              </LinearGradient>
            </View>

            <Text style={styles.eyebrow}>ONE LAST THING</Text>
            <Text style={styles.title}>Want reminders to keep{`\n`}your momentum?</Text>
            <Text style={styles.subtitle}>
              Most people finish their tasks when there&apos;s a gentle nudge. You can change or turn these off anytime.
            </Text>
          </View>

          <View style={styles.footer}>
            <GradientButton title="Allow notifications" onPress={onAllow} loading={saving} testID="notif-allow" />
            <Pressable onPress={onSkip} style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]} testID="notif-skip">
              <Text style={styles.skipText}>Not now</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <Pressable onPress={() => setStage("ask")} style={styles.backBtn} hitSlop={12}>
          <ChevronLeft color={Colors.text} size={22} />
        </Pressable>

        <ScrollView contentContainerStyle={styles.typesScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>PICK YOUR REMINDERS</Text>
          <Text style={styles.title}>What should{`\n`}we nudge you about?</Text>
          <Text style={styles.subtitle}>Choose anything — you can tweak these later in Profile.</Text>

          <View style={{ height: 18 }} />

          {TYPES.map((t) => {
            const on = prefs[t.key];
            const Icon = t.Icon;
            return (
              <Pressable
                key={t.key}
                onPress={() => togglePref(t.key)}
                style={({ pressed }) => [styles.typeCard, on && styles.typeCardOn, pressed && { opacity: 0.95 }]}
                testID={`notif-type-${t.key}`}
              >
                <View style={[styles.typeIcon, on && styles.typeIconOn]}>
                  <Icon color={on ? "#faf9f6" : Colors.accentDeep} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.typeLabel}>{t.label}</Text>
                  <Text style={styles.typeDesc}>{t.description}</Text>
                </View>
                <View style={[styles.checkBox, on && styles.checkBoxOn]}>
                  {on ? <Check color="#faf9f6" size={14} strokeWidth={3} /> : null}
                </View>
              </Pressable>
            );
          })}

          {prefs.dailyReminders ? (
            <View style={styles.hourBox}>
              <View style={styles.hourHead}>
                <Clock color={Colors.accentDeep} size={14} />
                <Text style={styles.hourLabel}>Reminder time</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourRow}>
                {HOURS.map((h) => {
                  const on = prefs.dailyReminderHour === h;
                  return (
                    <Pressable
                      key={h}
                      onPress={() => setHour(h)}
                      style={({ pressed }) => [styles.hourPill, on && styles.hourPillOn, pressed && { opacity: 0.85 }]}
                    >
                      <Text style={[styles.hourText, on && styles.hourTextOn]}>
                        {formatHour(h)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton title="Save & continue" onPress={onSaveTypes} testID="notif-save" />
        </View>
      </SafeAreaView>
    </View>
  );
}

function formatHour(h: number): string {
  const am = h < 12;
  const n = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${n}:00 ${am ? "AM" : "PM"}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1, paddingHorizontal: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
  askCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  bellWrap: { shadowColor: "#8b7355", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, marginBottom: 26 },
  bell: { width: 92, height: 92, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: Colors.accent, letterSpacing: 3, fontWeight: "800", fontSize: 11, textAlign: "center" },
  title: { color: Colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.5, marginTop: 8, textAlign: "center", lineHeight: 36 },
  subtitle: { color: Colors.textDim, fontSize: 15, marginTop: 12, textAlign: "center", lineHeight: 22, maxWidth: 340 },
  footer: { paddingBottom: 8, paddingTop: 8, gap: 8 },
  skipBtn: { alignSelf: "center", paddingVertical: 12 },
  skipText: { color: Colors.textDim, fontSize: 14, fontWeight: "700" },
  typesScroll: { paddingTop: 8, paddingBottom: 24 },
  typeCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  typeCardOn: { borderColor: Colors.accent, backgroundColor: "#fdfbf6", shadowColor: Colors.accent, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  typeIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.accentDim, alignItems: "center", justifyContent: "center" },
  typeIconOn: { backgroundColor: Colors.accentDeep },
  typeLabel: { color: Colors.text, fontSize: 15, fontWeight: "800" },
  typeDesc: { color: Colors.textDim, fontSize: 12, marginTop: 2 },
  checkBox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  checkBoxOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  hourBox: { marginTop: 6, padding: 14, borderRadius: 16, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border },
  hourHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  hourLabel: { color: Colors.accentDeep, fontWeight: "800", fontSize: 11, letterSpacing: 1 },
  hourRow: { gap: 8 },
  hourPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  hourPillOn: { backgroundColor: Colors.accentDeep, borderColor: Colors.accentDeep },
  hourText: { color: Colors.textDim, fontWeight: "800", fontSize: 12 },
  hourTextOn: { color: "#faf9f6" },
});
