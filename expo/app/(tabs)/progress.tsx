import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronDown, Flag, Flame, Target, TrendingUp } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";

import { StreakEffect } from "@/components/StreakEffect";
import { Colors } from "@/constants/colors";
import { getStreakTier } from "@/constants/streak-tiers";
import { useApp } from "@/providers/AppProvider";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MINUTES_PER_TASK = 8;

const AnimatedSvgPath = Animated.createAnimatedComponent(Path);

interface RoadmapMilestone {
  day: number;
  label: string;
  progress: number;
}

function paceMultiplier(time: string | null): number {
  switch (time) {
    case "2h": return 0.78;
    case "1h": return 0.9;
    case "30m": return 1.0;
    case "15m": return 1.2;
    default: return 1.0;
  }
}

function roadmapFor(goal: string | null, time: string | null): { milestones: RoadmapMilestone[]; finalLabel: string } {
  const m = paceMultiplier(time);
  if (goal === "build_skills") {
    return {
      milestones: [
        { day: Math.round(7 * m), label: "First public win", progress: 0.16 },
        { day: Math.round(34 * m), label: "Skill clicks", progress: 0.4 },
        { day: Math.round(120 * m), label: "Portfolio piece", progress: 0.68 },
        { day: Math.round(210 * m), label: "First paid use", progress: 0.92 },
      ],
      finalLabel: "Mastery",
    };
  }
  if (goal === "day_trading") {
    return {
      milestones: [
        { day: Math.round(9 * m), label: "Paper trading", progress: 0.16 },
        { day: Math.round(35 * m), label: "First green week", progress: 0.4 },
        { day: Math.round(110 * m), label: "Live strategy", progress: 0.66 },
        { day: Math.round(200 * m), label: "Consistent month", progress: 0.92 },
      ],
      finalLabel: "Compounding",
    };
  }
  return {
    milestones: [
      { day: Math.round(7 * m), label: "Foundation set", progress: 0.16 },
      { day: Math.round(26 * m), label: "First client", progress: 0.4 },
      { day: Math.round(90 * m), label: "First $500 month", progress: 0.66 },
      { day: Math.round(189 * m), label: "First repeat customer", progress: 0.92 },
    ],
    finalLabel: "Profitable",
  };
}

function formatRoadmapDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleString(undefined, { month: "short", day: "numeric" });
}

export default function ProgressScreen() {
  const { state, weeklyActivity, totalCompleted, totalSkipped, level, setProfileField } = useApp();
  const tier = getStreakTier(state.streak);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // First-visit hint: nudge the motivation card up & down so the user
  // discovers it can be tapped to swap. Only runs once, after the 5-step
  // tour has been completed.
  const hintAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!state.onboarded) return;
    if (!state.profile.firstTourSeen) return;
    if (state.profile.motivationHintSeen) return;
    const t = setTimeout(() => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      Animated.sequence([
        Animated.timing(hintAnim, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(hintAnim, { toValue: 0.6, duration: 220, useNativeDriver: true }),
        Animated.timing(hintAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(hintAnim, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        setProfileField("motivationHintSeen", true);
      });
    }, 700);
    return () => clearTimeout(t);
  }, [state.onboarded, state.profile.firstTourSeen, state.profile.motivationHintSeen, hintAnim, setProfileField]);
  const hintTranslate = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const hintShadow = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });

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
              <Animated.View
                style={[
                  styles.headCard,
                  {
                    opacity: factOpacity,
                    transform: [{ translateY: Animated.add(factTranslate, hintTranslate) }],
                    shadowOpacity: hintShadow,
                    shadowColor: "#000",
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 6 },
                  },
                ]}
              >
                <Text style={styles.headEmoji}>{headline.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headTitle}>{headline.title}</Text>
                  <Text style={styles.headSub}>{headline.sub}</Text>
                </View>
              </Animated.View>
            </Pressable>
            {!state.profile.motivationHintSeen ? (
              <Animated.Text style={[styles.hintCaption, { opacity: hintAnim }]}>tap to change ↑</Animated.Text>
            ) : null}
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

          <RoadmapCard
            goal={state.profile.goal}
            time={state.profile.time}
            businessName={state.profile.business?.name ?? null}
            totalCompleted={totalCompleted}
          />

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

function RoadmapCard({ goal, time, businessName, totalCompleted }: { goal: string | null; time: string | null; businessName: string | null; totalCompleted: number }) {
  const { milestones, finalLabel } = useMemo(() => roadmapFor(goal, time), [goal, time]);
  const finalDay = milestones[milestones.length - 1]?.day ?? 180;
  const finalDate = formatRoadmapDate(finalDay + 30);

  // Progress along the curve based on tasks completed. Caps at the final
  // milestone so the marker never overshoots.
  const completionRatio = Math.min(0.95, totalCompleted / 80);

  const draw = useRef(new Animated.Value(0)).current;
  const dotAnims = useMemo(() => milestones.map(() => new Animated.Value(0)), [milestones]);
  const youDot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    draw.setValue(0);
    Animated.timing(draw, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    Animated.parallel(
      dotAnims.map((v, i) =>
        Animated.sequence([
          Animated.delay(420 + i * 230),
          Animated.spring(v, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }),
        ]),
      ),
    ).start();
    Animated.sequence([
      Animated.delay(1300),
      Animated.spring(youDot, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [draw, dotAnims, youDot]);

  const W = 320;
  const H = 160;
  const padX = 14;
  const padTop = 14;
  const padBottom = 26;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const path = `M ${padX},${padTop + innerH * 0.86}
    C ${padX + innerW * 0.22},${padTop + innerH * 0.82}
      ${padX + innerW * 0.35},${padTop + innerH * 0.7}
      ${padX + innerW * 0.5},${padTop + innerH * 0.48}
    S ${padX + innerW * 0.82},${padTop + innerH * 0.1}
      ${padX + innerW},${padTop + innerH * 0.04}`;
  const pathLen = 540;
  const dashOffset = draw.interpolate({ inputRange: [0, 1], outputRange: [pathLen, 0] });

  const yForX = (x: number) => {
    const eased = 1 - Math.pow(1 - x, 2.2);
    return padTop + innerH * (0.86 - eased * 0.82);
  };

  return (
    <View style={styles.roadmapCard}>
      <View style={styles.roadmapHead}>
        <View style={styles.roadmapIconWrap}>
          <Target size={16} color={Colors.accentDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.roadmapEyebrow}>YOUR ROADMAP</Text>
          <Text style={styles.roadmapTitle} numberOfLines={2}>
            {businessName ? `Building ${businessName}` : "Where your daily tasks lead"}
          </Text>
        </View>
        <View style={styles.roadmapTrend}>
          <TrendingUp size={11} color={Colors.accentDeep} />
          <Text style={styles.roadmapTrendText}>on pace</Text>
        </View>
      </View>

      <View style={styles.roadmapChartWrap}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <SvgLinearGradient id="roadLine" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#d4d4d4" />
              <Stop offset="0.4" stopColor={Colors.accent} />
              <Stop offset="1" stopColor={Colors.accentGold} />
            </SvgLinearGradient>
            <SvgLinearGradient id="roadFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="rgba(212,175,55,0.22)" />
              <Stop offset="1" stopColor="rgba(212,175,55,0)" />
            </SvgLinearGradient>
          </Defs>

          <Path
            d={`M ${padX},${padTop + innerH * 0.86} L ${padX + innerW},${padTop + innerH * 0.86}`}
            stroke="#eeeeee" strokeWidth={1} strokeDasharray="3 4"
          />
          <Path
            d={`M ${padX},${padTop + innerH * 0.4} L ${padX + innerW},${padTop + innerH * 0.4}`}
            stroke="#f3f3f3" strokeWidth={1} strokeDasharray="3 4"
          />

          <AnimatedSvgPath
            d={`${path} L ${padX + innerW},${padTop + innerH * 0.86} L ${padX},${padTop + innerH * 0.86} Z`}
            fill="url(#roadFill)" opacity={draw}
          />
          <AnimatedSvgPath
            d={path}
            stroke="url(#roadLine)" strokeWidth={3} strokeLinecap="round" fill="none"
            strokeDasharray={pathLen} strokeDashoffset={dashOffset}
          />
        </Svg>

        {milestones.map((m, i) => {
          const cx = padX + innerW * m.progress;
          const cy = yForX(m.progress);
          const scale = dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
          const above = i % 2 === 0;
          return (
            <React.Fragment key={i}>
              <Animated.View
                style={[
                  styles.roadDot,
                  { left: cx - 7, top: cy - 7, opacity: dotAnims[i], transform: [{ scale }] },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.roadCalloutWrap,
                  { left: cx - 56, top: above ? cy - 50 : cy + 12, opacity: dotAnims[i], transform: [{ scale }] },
                ]}
              >
                <View style={styles.roadCallout}>
                  <Text style={styles.roadCalloutDay}>Day {m.day}</Text>
                  <Text style={styles.roadCalloutLabel} numberOfLines={1}>{m.label}</Text>
                </View>
              </Animated.View>
            </React.Fragment>
          );
        })}

        {/* "You are here" marker */}
        {(() => {
          const cx = padX + innerW * completionRatio;
          const cy = yForX(completionRatio);
          const scale = youDot.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
          return (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.youHere,
                { left: cx - 11, top: cy - 11, opacity: youDot, transform: [{ scale }] },
              ]}
            >
              <View style={styles.youHereInner} />
            </Animated.View>
          );
        })()}
      </View>

      <View style={styles.roadAxisRow}>
        <Text style={styles.roadAxisLabel}>Today</Text>
        <View style={styles.roadFinal}>
          <Flag size={11} color={Colors.text} />
          <Text style={styles.roadFinalText}>{finalLabel} · {finalDate}</Text>
        </View>
      </View>
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
  hintCaption: { color: Colors.accentDeep, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textAlign: "center", marginTop: 4 },

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

  roadmapCard: {
    marginBottom: 22,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#eeeeee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  roadmapHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  roadmapIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.accentDim, alignItems: "center", justifyContent: "center" },
  roadmapEyebrow: { color: Colors.textDim, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  roadmapTitle: { color: Colors.text, fontSize: 15, fontWeight: "900", letterSpacing: -0.2, marginTop: 2 },
  roadmapTrend: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.borderStrong },
  roadmapTrendText: { color: Colors.accentDeep, fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  roadmapChartWrap: { width: "100%", aspectRatio: 320 / 160, position: "relative", marginTop: 4 },
  roadDot: { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.text, borderWidth: 3, borderColor: "#ffffff", shadowColor: Colors.accentGold, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  roadCalloutWrap: { position: "absolute", width: 112, alignItems: "center" },
  roadCallout: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, backgroundColor: Colors.text, alignItems: "center" },
  roadCalloutDay: { color: Colors.accentGold, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  roadCalloutLabel: { color: "#ffffff", fontSize: 11, fontWeight: "800", marginTop: 1 },
  youHere: { position: "absolute", width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(212,175,55,0.25)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.accentGold },
  youHereInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accentGold },
  roadAxisRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  roadAxisLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  roadFinal: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#fff8e1", borderWidth: 1, borderColor: "#fcd34d" },
  roadFinalText: { color: Colors.text, fontSize: 11, fontWeight: "900", letterSpacing: 0.2 },

  advanced: { marginTop: 8, padding: 6, borderRadius: 16, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 13 },
  statLabel: { color: Colors.textDim, fontSize: 13, fontWeight: "600" },
  statValue: { color: Colors.text, fontSize: 15, fontWeight: "800" },
});
