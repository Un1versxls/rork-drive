import React, { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronDown, Flame } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { StreakEffect } from "@/components/StreakEffect";
import { Colors } from "@/constants/colors";
import { getStreakTier } from "@/constants/streak-tiers";
import { useApp } from "@/providers/AppProvider";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MINUTES_PER_TASK = 8;

export default function ProgressScreen() {
  const { state, weeklyActivity, totalCompleted, totalSkipped, level } = useApp();
  const tier = getStreakTier(state.streak);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const weekCompleted = useMemo(() => weeklyActivity.reduce((s, d) => s + d.completed, 0), [weeklyActivity]);
  const weekMinutes = weekCompleted * MINUTES_PER_TASK;
  const maxWeek = Math.max(1, ...weeklyActivity.map((w) => w.completed));
  const skipRate = totalCompleted + totalSkipped === 0 ? 0 : Math.round((totalSkipped / (totalCompleted + totalSkipped)) * 100);
  const completionRate = 100 - skipRate;
  const percentileOfNewUsers = Math.min(95, 40 + Math.min(55, totalCompleted));

  const isLearning = state.profile.goal === "build_skills";
  const skillTopic = state.profile.skillTopic;
  const skillLabel = (() => {
    switch (skillTopic) {
      case "code": return "coding";
      case "business": return "business";
      case "marketing": return "marketing";
      case "design": return "design";
      case "content": return "writing";
      case "languages": return "your new language";
      case "speaking": return "speaking";
      case "finance": return "finance";
      default: return "your skill";
    }
  })();

  const motivationFacts = useMemo<{ emoji: string; title: string; sub: string }[]>(() => {
    const pace = Math.max(1, weekCompleted);

    if (isLearning) {
      const masteryHours = Math.max(8, weekMinutes * 4 + totalCompleted * 8);
      const focusMinutes = Math.max(45, weekMinutes * 6 + 90);
      const compoundWeeks = Math.max(6, 14 - Math.min(8, Math.floor(state.streak / 3)));
      const fluentWeeks = Math.max(8, 24 - Math.min(16, Math.floor(state.streak / 2)));
      const yearReps = Math.max(50, totalCompleted * 12 + weekCompleted * 30);
      const milestoneDays = Math.max(14, Math.round(60 - pace * 1.2));
      return [
        { emoji: "🧠", title: `On track for ${masteryHours}+ hours of deep ${skillLabel} practice this quarter`, sub: "that's how mastery is built" },
        { emoji: "📚", title: `${fluentWeeks} more weeks at this pace and ${skillLabel} starts feeling automatic`, sub: "this is the messy middle" },
        { emoji: "⚡", title: `${focusMinutes} focused minutes banked into ${skillLabel}`, sub: "reps compound quietly" },
        { emoji: "🌱", title: `${compoundWeeks} more weeks like this puts you past 99% of casual learners`, sub: "consistency > intensity" },
        { emoji: "🎯", title: `Roughly ${milestoneDays} days to your next clear ${skillLabel} milestone`, sub: "keep showing up" },
        { emoji: "🔁", title: `Project ${yearReps} reps over the next 12 months`, sub: "future you is dangerous" },
        { emoji: "🔥", title: `${state.streak || 1}-day streak → you're learning faster than people who 'binge' it`, sub: "don't break the chain" },
        { emoji: "✍️", title: `You can teach what you've learned this week to someone else`, sub: "that's the real test" },
        { emoji: "📖", title: `Spaced reps at this rate beat a weekend cram every single time`, sub: "the science is on your side" },
        { emoji: "🏆", title: `You're stacking ${skillLabel} reps most people quit before unlocking`, sub: "quietly becoming great" },
      ];
    }

    const businessDays = Math.max(30, Math.round(95 - pace * 1.4));
    const sideIncomeDays = Math.max(21, Math.round(120 - pace * 2));
    const masteryHours = Math.max(8, weekMinutes * 4 + totalCompleted * 8);
    const yearTasks = Math.max(50, totalCompleted * 12 + weekCompleted * 30);
    const focusMinutes = Math.max(45, weekMinutes * 6 + 90);
    const compoundWeeks = Math.max(6, 14 - Math.min(8, Math.floor(state.streak / 3)));
    return [
      { emoji: "🚀", title: `At this rate you'll have a fully autonomous business in about ${businessDays} days`, sub: "compounding daily wins" },
      { emoji: "💸", title: `You're roughly ${sideIncomeDays} days from your first profitable side income`, sub: "keep stacking small bets" },
      { emoji: "🧠", title: `On track for ${masteryHours}+ deep-work hours this quarter`, sub: "that's how mastery is built" },
      { emoji: "📈", title: `Project ${yearTasks} finished tasks over the next 12 months`, sub: "future you is going to thank you" },
      { emoji: "⚡", title: `${focusMinutes} minutes of focus banked toward your next big launch`, sub: "momentum is currency" },
      { emoji: "🌱", title: `${compoundWeeks} more weeks like this and your habits compound past 99% of people`, sub: "quietly becoming dangerous" },
      { emoji: "🏁", title: `You're closer to shipping than you think — ${Math.max(7, 30 - state.streak)} clean days to go`, sub: "finish lines reward consistency" },
      { emoji: "🔥", title: `${state.streak || 1}-day streak energy → top 5% of builders this month`, sub: "don't break the chain" },
      { emoji: "💼", title: `At this pace, a profitable product is roughly ${Math.max(45, 110 - pace * 2)} days out`, sub: "keep moving" },
      { emoji: "🛠️", title: `You ship more before noon than most people ship in a week`, sub: "this is your unfair advantage" },
    ];
  }, [weekCompleted, weekMinutes, totalCompleted, state.streak, isLearning, skillLabel]);

  const dayIndex = useMemo(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 0).getTime();
    return Math.floor((d.getTime() - start) / 86400000);
  }, []);

  const [factOffset, setFactOffset] = useState<number>(0);
  const [factCooldownUntil, setFactCooldownUntil] = useState<number>(0);
  const factOpacity = useRef(new Animated.Value(1)).current;
  const factTranslate = useRef(new Animated.Value(0)).current;

  const baseHeadline: { title: string; sub: string; emoji: string } = (() => {
    if (state.streak >= 2 || totalCompleted >= 5 || weekMinutes > 0) {
      const idx = (dayIndex + factOffset) % motivationFacts.length;
      return motivationFacts[idx];
    }
    return { emoji: "✨", title: "Finish your first task", sub: "your stats unlock once you start moving" };
  })();
  const headline = baseHeadline;

  const onFactPress = useCallback(() => {
    const now = Date.now();
    if (now < factCooldownUntil) return;
    setFactCooldownUntil(now + 10000);
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    Animated.parallel([
      Animated.timing(factOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(factTranslate, { toValue: -8, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setFactOffset((o) => o + 1);
      factTranslate.setValue(8);
      Animated.parallel([
        Animated.timing(factOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(factTranslate, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  }, [factCooldownUntil, factOpacity, factTranslate]);

  const toggleAdvanced = () => {
    if (Platform.OS !== "web") LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAdvanced((s) => !s);
  };

  const [burstKey, setBurstKey] = useState<number>(0);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const heroScale = useRef(new Animated.Value(1)).current;
  const COOLDOWN_MS = 5000;
  const [, force] = useState<number>(0);

  const onStreakPress = useCallback(() => {
    const now = Date.now();
    if (now < cooldownUntil) return;
    setBurstKey((k) => k + 1);
    setCooldownUntil(now + COOLDOWN_MS);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 180);
    }
    Animated.sequence([
      Animated.timing(heroScale, { toValue: 1.12, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(heroScale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
    ]).start();
    const tick = setInterval(() => {
      force((n) => n + 1);
      if (Date.now() >= now + COOLDOWN_MS) clearInterval(tick);
    }, 200);
  }, [cooldownUntil, heroScale]);

  const remaining = Math.max(0, cooldownUntil - Date.now());
  const onCooldown = remaining > 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Progress</Text>
          <Text style={styles.sub}>Small wins. Every day.</Text>

          <View style={styles.streakHero}>
            <Pressable
              onPress={onStreakPress}
              disabled={onCooldown}
              testID="streak-tap"
              style={({ pressed }) => [styles.streakPressable, pressed && !onCooldown ? { opacity: 0.92 } : null]}
            >
              <Animated.View style={{ transform: [{ scale: heroScale }] }}>
                <StreakEffect streak={state.streak} size={160} triggerKey={burstKey} />
              </Animated.View>
            </Pressable>
            <View style={styles.tierRow}>
              <Flame size={16} color={tier.primary} />
              <Text style={[styles.tierLabel, { color: tier.primary }]}>{tier.label.toUpperCase()}</Text>
            </View>
            <Text style={styles.streakNum}>{state.streak}<Text style={styles.streakUnit}> days</Text></Text>
            <Text style={styles.tapHint}>
              {onCooldown ? `cooling down · ${Math.ceil(remaining / 1000)}s` : "tap the flame"}
            </Text>
          </View>

          <View style={styles.headlines}>
            <Pressable onPress={onFactPress} testID="progress-insight">
              <Animated.View style={[styles.headCard, { opacity: factOpacity, transform: [{ translateY: factTranslate }] }]}>
                <Text style={styles.headEmoji}>{headline.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headTitle}>{headline.title}</Text>
                  <Text style={styles.headSub}>{headline.sub}</Text>
                </View>
              </Animated.View>
            </Pressable>
          </View>

          <View style={styles.week}>
            <Text style={styles.weekLabel}>LAST 7 DAYS</Text>
            <View style={styles.chart}>
              {weeklyActivity.map((d, i) => {
                const h = (d.completed / maxWeek) * 80;
                const isToday = i === weeklyActivity.length - 1;
                return (
                  <View key={d.key} style={styles.barCol}>
                    <View style={styles.barWrap}>
                      <View style={[styles.bar, { height: Math.max(4, h), backgroundColor: isToday ? Colors.accentGold : "#e5e5e5" }]} />
                    </View>
                    <Text style={[styles.barLabel, isToday && { color: Colors.text, fontWeight: "900" }]}>{d.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Pressable onPress={toggleAdvanced} style={styles.advancedBtn}>
            <Text style={styles.advancedLabel}>Advanced stats</Text>
            <ChevronDown color={Colors.textDim} size={18} style={showAdvanced ? styles.chevOpen : undefined} />
          </Pressable>

          {showAdvanced ? (
            <View style={styles.advanced}>
              <StatRow label="Total tasks completed" value={totalCompleted.toString()} />
              <StatRow label="Completion rate" value={`${completionRate}%`} />
              <StatRow label="Avg skip rate" value={`${skipRate}%`} />
              <StatRow label="Best streak" value={`${state.bestStreak} days`} />
              <StatRow label="Total points" value={state.points.toLocaleString()} />
              <StatRow label="Level" value={level.toString()} />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: Platform.OS === "ios" ? 140 : 120 },
  header: { color: Colors.text, fontSize: 32, fontWeight: "900", letterSpacing: -0.5 },
  sub: { color: Colors.textDim, fontSize: 14, marginTop: 4, marginBottom: 18 },

  streakHero: { alignItems: "center", paddingVertical: 20, marginBottom: 18 },
  streakPressable: { alignItems: "center", justifyContent: "center" },
  tapHint: { color: Colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginTop: 6, textTransform: "uppercase" },
  tierRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  tierLabel: { fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  streakNum: { color: Colors.text, fontSize: 48, fontWeight: "900", letterSpacing: -1.5, marginTop: 6 },
  streakUnit: { color: Colors.textDim, fontSize: 18, fontWeight: "700" },

  headlines: { gap: 10, marginBottom: 22 },
  headCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  headEmoji: { fontSize: 28 },
  headTitle: { color: Colors.text, fontSize: 15, fontWeight: "800" },
  headSub: { color: Colors.textDim, fontSize: 12, fontWeight: "600", marginTop: 2 },

  week: { marginBottom: 22 },
  weekLabel: { color: Colors.textDim, fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 12 },
  chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 100 },
  barCol: { alignItems: "center", flex: 1 },
  barWrap: { height: 80, justifyContent: "flex-end", marginBottom: 6 },
  bar: { width: 22, borderRadius: 6 },
  barLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: "700" },

  advancedBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#eeeeee", backgroundColor: "#ffffff" },
  advancedLabel: { color: Colors.text, fontSize: 15, fontWeight: "800" },
  chevOpen: { transform: [{ rotate: "180deg" }] },

  hypeCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, backgroundColor: "#fffbea", borderWidth: 1, borderColor: "#f3e2a1" },
  hypeEmoji: { fontSize: 18 },
  hypeText: { flex: 1, color: "#7a5a00", fontSize: 13, fontWeight: "700", lineHeight: 18 },

  advanced: { marginTop: 8, padding: 6, borderRadius: 16, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 13 },
  statLabel: { color: Colors.textDim, fontSize: 13, fontWeight: "600" },
  statValue: { color: Colors.text, fontSize: 15, fontWeight: "800" },
});
