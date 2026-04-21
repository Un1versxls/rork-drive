import React, { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Bell, Briefcase, ChevronRight, Clock, Flame, Heart, LogOut, Pencil, RefreshCw, Sparkles, Trophy, Vibrate } from "lucide-react-native";

import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { PLANS } from "@/constants/plans";
import { NameBadge } from "@/components/NameBadge";
import { triggerHaptic } from "@/lib/haptics";
import { requestNotificationPermission, scheduleDailyReminder } from "@/lib/notifications";
import { useApp } from "@/providers/AppProvider";
import type { NotificationPrefs, PlanId } from "@/types";

const GOAL_LABEL: Record<string, string> = {
  earn_income: "Earn extra income",
  build_skills: "Build skills",
  grow_business: "Grow my business",
  stay_productive: "Stay productive",
};
const EXP_LABEL: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert" };
const TIME_LABEL: Record<string, string> = { "15m": "15 minutes / day", "30m": "30 minutes / day", "1h": "1 hour / day", "2h": "2+ hours / day" };
const PRIO_LABEL: Record<string, string> = { flexibility: "Flexibility", earning: "Earning potential", learning: "Learning", speed: "Speed to results" };
const INDUSTRY_LABEL: Record<string, string> = { tech: "Tech & software", creative: "Creative & design", services: "Local services", ecommerce: "E-commerce", content: "Content & creator", education: "Coaching & education", health: "Health & wellness", food: "Food & hospitality", open: "Open to anything" };
const BUDGET_LABEL: Record<string, string> = { under_100: "Under $100", "100_500": "$100 – $500", "500_2000": "$500 – $2,000", "2000_plus": "$2,000+" };
const OBSTACLE_LABEL: Record<string, string> = { time: "Not enough time", money: "Not enough money", confidence: "Confidence", direction: "Too many ideas", accountability: "No accountability" };

export default function ProfileScreen() {
  const router = useRouter();
  const { state, currentPlan, setProfileField, setPlan, setNotificationPrefs, resetOnboarding, totalCompleted, level } = useApp();
  const [editing, setEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(state.profile.name);
  const [showPlans, setShowPlans] = useState<boolean>(false);

  const initials = (state.profile.name || "D").trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("") || "D";

  const saveName = () => {
    const n = name.trim() || "Driver";
    setProfileField("name", n);
    setEditing(false);
  };

  const onReset = () => {
    if (Platform.OS === "web") {
      const ok = typeof window !== "undefined" && window.confirm("Reset everything and redo onboarding? This will clear all progress.");
      if (ok) {
        resetOnboarding();
        router.replace("/onboarding");
      }
      return;
    }
    Alert.alert(
      "Reset DRIVE?",
      "This clears your progress and restarts onboarding.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => { resetOnboarding(); router.replace("/onboarding"); } },
      ]
    );
  };

  const rematchBusiness = () => {
    router.push("/onboarding/match");
  };

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Profile</Text>

          <GlassCard style={styles.userCard} padding={20} glow>
            <View style={styles.userRow}>
              <View style={styles.avatarWrap}>
                <LinearGradient
                  colors={["#d4af37", "#c9a87c", "#8b7355"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                {editing ? (
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    onBlur={saveName}
                    onSubmitEditing={saveName}
                    placeholder="Your name"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.nameInput}
                    autoFocus
                    returnKeyType="done"
                    testID="input-name"
                  />
                ) : (
                  <Pressable onPress={() => setEditing(true)} style={styles.nameRow}>
                    <NameBadge name={state.profile.name || "Driver"} effect={state.profile.equippedEffect} size={22} />
                    <Pencil color={Colors.textDim} size={14} />
                  </Pressable>
                )}
                <Text style={styles.userSub}>Level {level} • {totalCompleted} tasks done</Text>
              </View>
            </View>
          </GlassCard>

          {state.profile.business ? (
            <>
              <Text style={styles.sectionTitle}>Your business</Text>
              <GlassCard style={styles.bizCard} padding={18}>
                <View style={styles.bizTopRow}>
                  <View style={styles.bizIcon}>
                    <Briefcase color={Colors.accentDeep} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bizName}>{state.profile.business.name}</Text>
                    <Text style={styles.bizTag}>{state.profile.business.tagline}</Text>
                  </View>
                </View>
                <Text style={styles.bizDesc}>{state.profile.business.description}</Text>
                <Pressable onPress={rematchBusiness} style={({ pressed }) => [styles.rematchBtn, pressed && { opacity: 0.8 }]}>
                  <RefreshCw color={Colors.accentDeep} size={14} />
                  <Text style={styles.rematchText}>Find new matches</Text>
                </Pressable>
              </GlassCard>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Your plan</Text>
          <GlassCard padding={0} style={styles.planCard}>
            <Pressable onPress={() => setShowPlans((s) => !s)} style={styles.planRow}>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{currentPlan.name.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{currentPlan.price === 0 ? "Free plan" : `$${currentPlan.price}/month`}</Text>
                <Text style={styles.planSub}>{currentPlan.multiplier}x points • {currentPlan.taskLimit === 99 ? "unlimited" : currentPlan.taskLimit} daily tasks</Text>
              </View>
              <ChevronRight color={Colors.textDim} size={18} />
            </Pressable>

            {showPlans ? (
              <View style={styles.plansList}>
                {PLANS.map((p) => {
                  const selected = p.id === currentPlan.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => setPlan(p.id as PlanId)}
                      style={({ pressed }) => [styles.planOption, selected && styles.planOptionOn, pressed && { opacity: 0.85 }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.planOptionName, selected && { color: Colors.accentDeep }]}>{p.name}</Text>
                        <Text style={styles.planOptionMeta}>{p.multiplier}x • {p.taskLimit === 99 ? "unlimited" : p.taskLimit} tasks</Text>
                      </View>
                      <Text style={styles.planOptionPrice}>
                        {p.price === 0 ? "Free" : `$${p.price}/mo`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </GlassCard>

          <Text style={styles.sectionTitle}>Your setup</Text>
          <GlassCard padding={4} style={{ marginBottom: 20 }}>
            <SetupRow label="Goal" value={state.profile.goal ? GOAL_LABEL[state.profile.goal] : "-"} />
            <Sep />
            <SetupRow label="Experience" value={state.profile.experience ? EXP_LABEL[state.profile.experience] : "-"} />
            <Sep />
            <SetupRow label="Daily time" value={state.profile.time ? TIME_LABEL[state.profile.time] : "-"} />
            <Sep />
            <SetupRow label="Priority" value={state.profile.priority ? PRIO_LABEL[state.profile.priority] : "-"} />
            <Sep />
            <SetupRow label="Industry" value={state.profile.industry ? INDUSTRY_LABEL[state.profile.industry] : "-"} />
            <Sep />
            <SetupRow label="Budget" value={state.profile.budget ? BUDGET_LABEL[state.profile.budget] : "-"} />
            <Sep />
            <SetupRow label="Obstacle" value={state.profile.obstacle ? OBSTACLE_LABEL[state.profile.obstacle] : "-"} />
          </GlassCard>

          <Text style={styles.sectionTitle}>Notifications</Text>
          <GlassCard padding={4} style={{ marginBottom: 12 }}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}><Bell color={Colors.accentDeep} size={18} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Enabled</Text>
                <Text style={styles.settingDesc}>Master switch for all reminders</Text>
              </View>
              <Switch
                value={state.profile.notificationsEnabled}
                onValueChange={async (v) => {
                  triggerHaptic("select", state.profile.hapticsEnabled);
                  if (v) {
                    const granted = await requestNotificationPermission();
                    setProfileField("notificationsEnabled", granted);
                    if (granted && state.profile.notificationPrefs.dailyReminders) {
                      await scheduleDailyReminder(state.profile.notificationPrefs.dailyReminderHour).catch(() => {});
                    }
                  } else {
                    setProfileField("notificationsEnabled", false);
                  }
                }}
                trackColor={{ true: Colors.accent, false: "#d8d4cc" }}
                thumbColor="#fff"
              />
            </View>
            {state.profile.notificationsEnabled ? (
              <>
                <Sep />
                <NotifToggle
                  Icon={Bell}
                  label="Daily task reminders"
                  description={`At ${formatHour(state.profile.notificationPrefs.dailyReminderHour)}`}
                  value={state.profile.notificationPrefs.dailyReminders}
                  onChange={(v) => {
                    setNotificationPrefs({ dailyReminders: v });
                    if (v) scheduleDailyReminder(state.profile.notificationPrefs.dailyReminderHour).catch(() => {});
                  }}
                  hapticsEnabled={state.profile.hapticsEnabled}
                />
                <Sep />
                <NotifToggle
                  Icon={Flame}
                  label="Streak protection"
                  description="End-of-day alert if tasks aren't done"
                  value={state.profile.notificationPrefs.streakProtection}
                  onChange={(v) => setNotificationPrefs({ streakProtection: v })}
                  hapticsEnabled={state.profile.hapticsEnabled}
                />
                <Sep />
                <NotifToggle
                  Icon={Trophy}
                  label="Achievement unlocks"
                  description="When you hit new milestones"
                  value={state.profile.notificationPrefs.achievementUnlocks}
                  onChange={(v) => setNotificationPrefs({ achievementUnlocks: v })}
                  hapticsEnabled={state.profile.hapticsEnabled}
                />
                <Sep />
                <NotifToggle
                  Icon={Sparkles}
                  label="Business milestones"
                  description="Checkpoints on your chosen business"
                  value={state.profile.notificationPrefs.businessMilestones}
                  onChange={(v) => setNotificationPrefs({ businessMilestones: v })}
                  hapticsEnabled={state.profile.hapticsEnabled}
                />
                <Sep />
                <NotifToggle
                  Icon={Heart}
                  label="Motivating reminders"
                  description={'"Remember why you started"'}
                  value={state.profile.notificationPrefs.motivating}
                  onChange={(v) => setNotificationPrefs({ motivating: v })}
                  hapticsEnabled={state.profile.hapticsEnabled}
                />
                {state.profile.notificationPrefs.dailyReminders ? (
                  <>
                    <Sep />
                    <View style={styles.hourSection}>
                      <View style={styles.settingRow}>
                        <View style={styles.settingIcon}><Clock color={Colors.accentDeep} size={18} /></View>
                        <Text style={styles.settingLabel}>Reminder time</Text>
                      </View>
                      <ScrollHoursRow
                        hour={state.profile.notificationPrefs.dailyReminderHour}
                        onChange={(h) => {
                          triggerHaptic("select", state.profile.hapticsEnabled);
                          setNotificationPrefs({ dailyReminderHour: h });
                          scheduleDailyReminder(h).catch(() => {});
                        }}
                      />
                    </View>
                  </>
                ) : null}
              </>
            ) : null}
          </GlassCard>

          <Text style={styles.sectionTitle}>Feedback</Text>
          <GlassCard padding={4} style={{ marginBottom: 20 }}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}><Vibrate color={Colors.accentDeep} size={18} /></View>
              <Text style={styles.settingLabel}>Haptics</Text>
              <Switch
                value={state.profile.hapticsEnabled}
                onValueChange={(v) => {
                  setProfileField("hapticsEnabled", v);
                  if (v) triggerHaptic("success", true);
                }}
                trackColor={{ true: Colors.accent, false: "#d8d4cc" }}
                thumbColor="#fff"
              />
            </View>
          </GlassCard>

          <GradientButton
            title="Redo onboarding"
            variant="ghost"
            onPress={() => router.push("/onboarding/goal")}
            style={{ marginBottom: 10 }}
          />

          <Pressable onPress={onReset} style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.7 }]} testID="btn-reset">
            <LogOut color={Colors.danger} size={16} />
            <Text style={styles.dangerText}>Reset everything</Text>
          </Pressable>

          <Text style={styles.footer}>DRIVE v1.0 — built for momentum</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function formatHour(h: number): string {
  const am = h < 12;
  const n = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${n}:00 ${am ? "AM" : "PM"}`;
}

const HOURS = [6, 7, 8, 9, 10, 12, 17, 19, 21];

function ScrollHoursRow({ hour, onChange }: { hour: number; onChange: (h: number) => void }) {
  return (
    <View style={styles.hoursRow}>
      {HOURS.map((h) => {
        const on = hour === h;
        return (
          <Pressable key={h} onPress={() => onChange(h)} style={({ pressed }) => [styles.hourPill, on && styles.hourPillOn, pressed && { opacity: 0.85 }]}>
            <Text style={[styles.hourText, on && styles.hourTextOn]}>{formatHour(h)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NotifToggle({
  Icon,
  label,
  description,
  value,
  onChange,
  hapticsEnabled,
}: {
  Icon: React.ComponentType<{ color: string; size: number }>;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hapticsEnabled: boolean;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}><Icon color={Colors.accentDeep} size={18} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { triggerHaptic("select", hapticsEnabled); onChange(v); }}
        trackColor={{ true: Colors.accent, false: "#d8d4cc" }}
        thumbColor="#fff"
      />
    </View>
  );
}

function SetupRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.setupRow}>
      <Text style={styles.setupLabel}>{label}</Text>
      <Text style={styles.setupValue}>{value}</Text>
    </View>
  );
}
function Sep() { return <View style={styles.sep} />; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: Platform.OS === "ios" ? 120 : 110 },
  header: { color: Colors.text, fontSize: 32, fontWeight: "900", letterSpacing: -0.5, marginBottom: 18 },
  userCard: { marginBottom: 20 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarWrap: { shadowColor: "#8b7355", shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#faf9f6", fontSize: 24, fontWeight: "900" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  userName: { color: Colors.text, fontSize: 22, fontWeight: "900" },
  userSub: { color: Colors.textDim, fontSize: 13, marginTop: 2 },
  nameInput: { color: Colors.text, fontSize: 22, fontWeight: "900", borderBottomWidth: 1, borderBottomColor: Colors.accent, paddingVertical: 2 },
  sectionTitle: { color: Colors.textDim, fontWeight: "800", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 },
  bizCard: { marginBottom: 20, borderColor: Colors.borderStrong },
  bizTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bizIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.borderStrong },
  bizName: { color: Colors.text, fontSize: 18, fontWeight: "900", letterSpacing: -0.3 },
  bizTag: { color: Colors.accentDeep, fontSize: 12, fontWeight: "700", marginTop: 2 },
  bizDesc: { color: Colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 12 },
  rematchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.borderStrong },
  rematchText: { color: Colors.accentDeep, fontWeight: "800", fontSize: 13 },
  planCard: { marginBottom: 20, overflow: "hidden" },
  planRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.borderStrong },
  planBadgeText: { color: Colors.accentDeep, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  planTitle: { color: Colors.text, fontSize: 16, fontWeight: "800" },
  planSub: { color: Colors.textDim, fontSize: 12, marginTop: 2 },
  plansList: { borderTopWidth: 1, borderTopColor: Colors.border, paddingVertical: 6 },
  planOption: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  planOptionOn: { backgroundColor: Colors.accentDim },
  planOptionName: { color: Colors.text, fontWeight: "800", fontSize: 15 },
  planOptionMeta: { color: Colors.textDim, fontSize: 12, marginTop: 2 },
  planOptionPrice: { color: Colors.text, fontWeight: "800" },
  setupRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 14 },
  setupLabel: { color: Colors.textDim, fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  setupValue: { color: Colors.text, fontSize: 14, fontWeight: "700", maxWidth: "60%", textAlign: "right" },
  sep: { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  settingIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.accentDim, alignItems: "center", justifyContent: "center" },
  settingLabel: { color: Colors.text, fontWeight: "700", fontSize: 15 },
  settingDesc: { color: Colors.textDim, fontSize: 11, marginTop: 2 },
  hourSection: { paddingBottom: 12 },
  hoursRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 14, marginTop: 4 },
  hourPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border },
  hourPillOn: { backgroundColor: Colors.accentDeep, borderColor: Colors.accentDeep },
  hourText: { color: Colors.textDim, fontWeight: "800", fontSize: 11 },
  hourTextOn: { color: "#faf9f6" },
  dangerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 999, backgroundColor: "rgba(196,69,69,0.06)", borderWidth: 1, borderColor: "rgba(196,69,69,0.25)" },
  dangerText: { color: Colors.danger, fontWeight: "800" },
  footer: { color: Colors.textMuted, textAlign: "center", fontSize: 11, marginTop: 18 },
});
