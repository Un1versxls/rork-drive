import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Award,
  CalendarCheck,
  CalendarHeart,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Compass,
  Cpu,
  Crown,
  Diamond,
  Flame,
  Gem,
  Gift,
  Lock,
  Medal,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Sunrise,
  Target,
  Ticket,
  Trophy,
  Zap,
} from "lucide-react-native";

import { NameBadge } from "@/components/NameBadge";
import { BADGES } from "@/constants/badges";
import { Colors } from "@/constants/colors";
import { ACHIEVEMENTS, type Achievement, type NameEffectId } from "@/constants/achievements";
import { triggerHaptic } from "@/lib/haptics";
import { useApp } from "@/providers/AppProvider";
import type { Badge, BadgeMetric } from "@/types";

const ICON_MAP: Record<string, React.ComponentType<{ color: string; size: number; strokeWidth?: number }>> = {
  Award, CalendarCheck, CalendarHeart, CheckCircle2, Compass, Cpu, Crown, Diamond, Flame,
  Gem, Medal, Rocket, Shield, Sparkles, Star, Sunrise, Target, Ticket, Trophy, Zap,
};

interface BadgeCtx {
  completed: number;
  streak: number;
  points: number;
  businessesTried: number;
  daysActive: number;
  earlyBird: boolean;
  fullDay: boolean;
  codeRedeemed: boolean;
  premium: boolean;
}

function valueFor(metric: BadgeMetric, ctx: BadgeCtx): number {
  switch (metric) {
    case "completed": return ctx.completed;
    case "streak": return ctx.streak;
    case "points": return ctx.points;
    case "businesses_tried": return ctx.businessesTried;
    case "days_active": return ctx.daysActive;
    case "early_bird": return ctx.earlyBird ? 1 : 0;
    case "full_day":
    case "full_first_day": return ctx.fullDay ? 1 : 0;
    case "code_redeemed": return ctx.codeRedeemed ? 1 : 0;
    case "premium": return ctx.premium ? 1 : 0;
    default: return 0;
  }
}

function badgeProgress(b: Badge, ctx: BadgeCtx): { pct: number; label: string } {
  const v = valueFor(b.metric, ctx);
  const pct = Math.min(1, v / b.threshold);
  switch (b.metric) {
    case "completed": return { pct, label: `${Math.min(v, b.threshold)} / ${b.threshold} tasks` };
    case "streak": return { pct, label: `${Math.min(v, b.threshold)} / ${b.threshold} days` };
    case "points": return { pct, label: `${Math.min(v, b.threshold).toLocaleString()} / ${b.threshold.toLocaleString()} pts` };
    case "businesses_tried": return { pct, label: `${Math.min(v, b.threshold)} / ${b.threshold} tried` };
    case "days_active": return { pct, label: `${Math.min(v, b.threshold)} / ${b.threshold} days active` };
    case "early_bird": return { pct, label: ctx.earlyBird ? "Unlocked" : "Finish a task before noon" };
    case "full_day":
    case "full_first_day": return { pct, label: ctx.fullDay ? "Unlocked" : "Finish every task in a day" };
    case "code_redeemed": return { pct, label: ctx.codeRedeemed ? "Unlocked" : "Redeem a code" };
    case "premium": return { pct, label: ctx.premium ? "Unlocked" : "Upgrade to Premium" };
    default: return { pct: 0, label: "" };
  }
}

const CATEGORY_ORDER: { key: NonNullable<Badge["category"]>; title: string; sub: string }[] = [
  { key: "tasks", title: "Tasks finished", sub: "the work that drives everything" },
  { key: "streak", title: "Daily streaks", sub: "consistency beats intensity" },
  { key: "points", title: "Points earned", sub: "every small win counts" },
  { key: "explorer", title: "Explorer", sub: "out of the box achievements" },
  { key: "premium", title: "Membership", sub: "perks for going further" },
];

function progressFor(a: Achievement, ctx: { completed: number; streak: number; points: number; isPremium: boolean }): number {
  if (a.metric === "completed") return Math.min(1, ctx.completed / a.threshold);
  if (a.metric === "streak") return Math.min(1, ctx.streak / a.threshold);
  if (a.metric === "points") return Math.min(1, ctx.points / a.threshold);
  if (a.metric === "plan") return ctx.isPremium ? 1 : 0;
  return 0;
}

function progressLabel(a: Achievement, ctx: { completed: number; streak: number; points: number; isPremium: boolean }): string {
  if (a.metric === "completed") return `${Math.min(ctx.completed, a.threshold)} / ${a.threshold} tasks`;
  if (a.metric === "streak") return `${Math.min(ctx.streak, a.threshold)} / ${a.threshold} days`;
  if (a.metric === "points") return `${Math.min(ctx.points, a.threshold).toLocaleString()} / ${a.threshold.toLocaleString()} pts`;
  if (a.metric === "plan") return ctx.isPremium ? "Unlocked" : "Upgrade to Pro";
  return "";
}

export default function BadgesScreen() {
  const router = useRouter();
  const { state, totalCompleted, isPremium, equipEffect } = useApp();

  const ctx: BadgeCtx = useMemo(() => {
    const businessesTried = (state.profile.pastBusinesses?.length ?? 0) + (state.profile.business ? 1 : 0);
    const today = (() => {
      const d = new Date();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${m}-${day}`;
    })();
    const historyDays = new Set(Object.keys(state.history));
    if (state.tasks.some((t) => t.dateKey === today && t.status !== "pending")) historyDays.add(today);
    return {
      completed: totalCompleted,
      streak: state.bestStreak,
      points: state.points,
      businessesTried,
      daysActive: historyDays.size,
      earlyBird: state.profile.earlyBirdAchieved ?? false,
      fullDay: state.profile.fullDayAchieved ?? false,
      codeRedeemed: state.profile.redeemedCodeOnce ?? false,
      premium: isPremium,
    };
  }, [
    totalCompleted, state.bestStreak, state.points, isPremium,
    state.profile.pastBusinesses, state.profile.business, state.history, state.tasks,
    state.profile.earlyBirdAchieved, state.profile.fullDayAchieved, state.profile.redeemedCodeOnce,
  ]);

  const achievementCtx = useMemo(
    () => ({ completed: totalCompleted, streak: state.bestStreak, points: state.points, isPremium }),
    [totalCompleted, state.bestStreak, state.points, isPremium]
  );

  const unlockedBadges = new Set(state.unlockedBadges);
  const totalUnlocked = unlockedBadges.size;

  // Limited-time offer: collect every non-membership badge -> free month of Premium.
  const offerBadges = useMemo(() => BADGES.filter((b) => (b.category ?? "tasks") !== "premium"), []);
  const offerEarned = offerBadges.filter((b) => unlockedBadges.has(b.id)).length;
  const offerRemaining = Math.max(0, offerBadges.length - offerEarned);
  const offerComplete = offerRemaining === 0;

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => {
      const items = BADGES.filter((b) => (b.category ?? "tasks") === cat.key);
      const sorted = [...items].sort((a, b) => {
        const au = unlockedBadges.has(a.id);
        const bu = unlockedBadges.has(b.id);
        if (au !== bu) return au ? -1 : 1;
        return a.threshold - b.threshold;
      });
      const earned = sorted.filter((b) => unlockedBadges.has(b.id)).length;
      return { ...cat, items: sorted, earned, total: sorted.length };
    }).filter((c) => c.items.length > 0);
  }, [unlockedBadges]);

  const previewName = state.profile.name || "Driver";
  const onEquip = (effect: NameEffectId) => {
    triggerHaptic("light", state.profile.hapticsEnabled);
    equipEffect(effect);
  };

  const sortedEffects = useMemo(() => {
    return [...ACHIEVEMENTS].sort((a, b) => {
      const aUn = state.profile.unlockedEffects.includes(a.effect);
      const bUn = state.profile.unlockedEffects.includes(b.effect);
      if (aUn !== bUn) return aUn ? -1 : 1;
      return a.threshold - b.threshold;
    });
  }, [state.profile.unlockedEffects]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <ChevronLeft color={Colors.text} size={22} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.header}>Badge Room</Text>
            <Text style={styles.headerSub}>{totalUnlocked} of {BADGES.length} earned</Text>
          </View>
          <View style={styles.totalPill}>
            <Trophy color={Colors.accentGold} size={12} />
            <Text style={styles.totalPillText}>{totalUnlocked}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.offerBanner}>
            <View style={styles.offerShine} pointerEvents="none" />
            <View style={styles.offerHeader}>
              <View style={styles.offerIcon}>
                <Gift color="#ffffff" size={20} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.offerEyebrowRow}>
                  <View style={styles.offerEyebrow}>
                    <Clock color="#ffffff" size={10} strokeWidth={3} />
                    <Text style={styles.offerEyebrowText}>LIMITED TIME</Text>
                  </View>
                </View>
                <Text style={styles.offerTitle}>1 Month of Premium, free</Text>
                <Text style={styles.offerSub}>
                  {offerComplete
                    ? "You did it! Tap to redeem your free month."
                    : `Collect every non-membership badge — ${offerEarned} of ${offerBadges.length} earned.`}
                </Text>
              </View>
            </View>
            <View style={styles.offerBarTrack}>
              <View style={[styles.offerBarFill, { width: `${Math.round((offerEarned / offerBadges.length) * 100)}%` }]} />
            </View>
            <View style={styles.offerFootRow}>
              <Text style={styles.offerMeta}>{offerComplete ? "Reward unlocked" : `${offerRemaining} to go`}</Text>
              <View style={styles.offerChip}>
                <Trophy color={Colors.accentDeep} size={11} />
                <Text style={styles.offerChipText}>{offerEarned}/{offerBadges.length}</Text>
              </View>
            </View>
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>EQUIPPED EFFECT</Text>
            <NameBadge name={previewName} effect={state.profile.equippedEffect} size={28} />
            <Pressable
              onPress={() => onEquip("none")}
              style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.6 }]}
              disabled={state.profile.equippedEffect === "none"}
            >
              <Text style={[styles.clearText, state.profile.equippedEffect === "none" && { opacity: 0.4 }]}>
                {state.profile.equippedEffect === "none" ? "Default style" : "Remove effect"}
              </Text>
            </Pressable>
          </View>

          {grouped.map((cat) => (
            <View key={cat.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>{cat.title}</Text>
                  <Text style={styles.sectionSub}>{cat.sub}</Text>
                </View>
                <View style={styles.sectionCount}>
                  <Text style={styles.sectionCountText}>{cat.earned}/{cat.total}</Text>
                </View>
              </View>
              <View style={styles.grid}>
                {cat.items.map((b) => {
                  const unlocked = unlockedBadges.has(b.id);
                  const { pct, label } = badgeProgress(b, ctx);
                  const Icon = ICON_MAP[b.icon] ?? Award;
                  return (
                    <View key={b.id} style={[styles.tile, unlocked ? styles.tileOn : styles.tileOff]}>
                      {unlocked ? (
                        <View style={styles.shine} pointerEvents="none" />
                      ) : null}
                      <View style={[styles.tileIcon, unlocked ? styles.tileIconOn : styles.tileIconOff]}>
                        {unlocked ? (
                          <Icon color="#ffffff" size={18} strokeWidth={2.4} />
                        ) : (
                          <Lock color={Colors.textMuted} size={16} />
                        )}
                      </View>
                      <Text style={[styles.tileTitle, !unlocked && { color: Colors.textDim }]} numberOfLines={2}>{b.title}</Text>
                      <Text style={styles.tileDesc} numberOfLines={2}>{b.description}</Text>
                      {!unlocked ? (
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
                        </View>
                      ) : (
                        <View style={styles.unlockedRow}>
                          <Check color={Colors.accentGold} size={11} strokeWidth={3} />
                          <Text style={styles.unlockedText}>Earned</Text>
                        </View>
                      )}
                      {!unlocked ? <Text style={styles.tileMeta}>{label}</Text> : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Name effects</Text>
                <Text style={styles.sectionSub}>Equip a glow on your dashboard name</Text>
              </View>
            </View>
            {sortedEffects.map((a) => {
              const unlocked = state.profile.unlockedEffects.includes(a.effect);
              const equipped = state.profile.equippedEffect === a.effect;
              const pct = progressFor(a, achievementCtx);
              return (
                <View key={a.id} style={[styles.row, unlocked && styles.rowUnlocked]}>
                  <View style={styles.rowTop}>
                    <View style={[styles.crest, unlocked ? styles.crestOn : styles.crestOff]}>
                      {unlocked ? (
                        <NameBadge name="A" effect={a.effect} size={14} />
                      ) : (
                        <Lock color={Colors.textMuted} size={16} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{a.title}</Text>
                      <Text style={styles.desc}>{a.description}</Text>
                    </View>
                    {unlocked ? (
                      <Pressable
                        onPress={() => onEquip(a.effect)}
                        disabled={equipped}
                        style={[styles.equipBtn, equipped && styles.equipBtnOn]}
                      >
                        {equipped ? <Check color="#ffffff" size={14} strokeWidth={3} /> : null}
                        <Text style={[styles.equipText, equipped && styles.equipTextOn]}>
                          {equipped ? "Equipped" : "Equip"}
                        </Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.lockedHint}>{progressLabel(a, achievementCtx)}</Text>
                    )}
                  </View>
                  {!unlocked ? (
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  header: { color: Colors.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  headerSub: { color: Colors.textDim, fontSize: 12, fontWeight: "700", marginTop: 1 },
  totalPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#fffbe6", borderWidth: 1, borderColor: "#f1e2a4" },
  totalPillText: { color: Colors.accentDeep, fontWeight: "900", fontSize: 12 },
  scroll: { paddingHorizontal: 16, paddingBottom: Platform.OS === "ios" ? 60 : 40 },

  offerBanner: {
    borderRadius: 20,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: "#1a1410",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.5)",
    overflow: "hidden",
    shadowColor: "#d4af37",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  offerShine: {
    position: "absolute",
    top: -40, left: -60,
    width: 140, height: 200,
    backgroundColor: "rgba(255,215,120,0.10)",
    transform: [{ rotate: "20deg" }],
  },
  offerHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  offerIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accentGold,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#d4af37", shadowOpacity: 0.7, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  offerEyebrowRow: { flexDirection: "row" },
  offerEyebrow: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: "#ef4444",
    marginBottom: 4,
  },
  offerEyebrowText: { color: "#ffffff", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  offerTitle: { color: "#ffffff", fontSize: 16, fontWeight: "900", letterSpacing: -0.3 },
  offerSub: { color: "#cfc6b1", fontSize: 12, marginTop: 2, lineHeight: 16 },
  offerBarTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginTop: 14, overflow: "hidden",
  },
  offerBarFill: { height: "100%", backgroundColor: Colors.accentGold, borderRadius: 3 },
  offerFootRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  offerMeta: { color: "#cfc6b1", fontSize: 11, fontWeight: "700" },
  offerChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: "#fffbe6",
  },
  offerChipText: { color: Colors.accentDeep, fontSize: 11, fontWeight: "900" },

  previewCard: {
    padding: 18, borderRadius: 20, backgroundColor: "#fafafa",
    borderWidth: 1, borderColor: "#eeeeee", alignItems: "center", gap: 10,
    marginBottom: 18, marginTop: 4,
  },
  previewLabel: { color: Colors.textDim, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  clearBtn: { paddingVertical: 4, paddingHorizontal: 10 },
  clearText: { color: Colors.textDim, fontSize: 12, fontWeight: "700" },

  section: { marginTop: 6, marginBottom: 18 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, paddingHorizontal: 4 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: "900", letterSpacing: -0.2 },
  sectionSub: { color: Colors.textMuted, fontSize: 11, fontWeight: "600", marginTop: 2 },
  sectionCount: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  sectionCountText: { color: Colors.text, fontSize: 11, fontWeight: "900" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "48%",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  tileOn: { borderColor: "#e8d9a3", backgroundColor: "#fffdf6", shadowColor: "#d4af37", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  tileOff: { borderColor: "#eeeeee", backgroundColor: "#ffffff" },
  shine: { position: "absolute", top: -30, left: -40, width: 80, height: 120, backgroundColor: "rgba(255,255,255,0.55)", transform: [{ rotate: "20deg" }] },
  tileIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  tileIconOn: { backgroundColor: Colors.accentGold },
  tileIconOff: { backgroundColor: "#f4f4f4", borderWidth: 1, borderColor: "#eeeeee" },
  tileTitle: { color: Colors.text, fontSize: 13, fontWeight: "900", letterSpacing: -0.1 },
  tileDesc: { color: Colors.textDim, fontSize: 11, marginTop: 3, lineHeight: 15 },
  unlockedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  unlockedText: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  tileMeta: { color: Colors.textMuted, fontSize: 10, fontWeight: "700", marginTop: 6 },

  row: { padding: 14, borderRadius: 14, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee", marginBottom: 10 },
  rowUnlocked: { borderColor: "#e8d9a3", backgroundColor: "#fffdf6" },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  crest: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  crestOn: { backgroundColor: "#fff7df", borderWidth: 1, borderColor: "#e8d9a3" },
  crestOff: { backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  title: { color: Colors.text, fontSize: 14, fontWeight: "900" },
  desc: { color: Colors.textDim, fontSize: 12, marginTop: 2 },
  lockedHint: { color: Colors.textMuted, fontSize: 10, fontWeight: "700", textAlign: "right", maxWidth: 90 },

  equipBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: "#ffffff", borderWidth: 1, borderColor: Colors.text },
  equipBtnOn: { backgroundColor: Colors.text, borderColor: Colors.text },
  equipText: { color: Colors.text, fontSize: 11, fontWeight: "800" },
  equipTextOn: { color: "#ffffff" },

  barTrack: { height: 4, borderRadius: 2, backgroundColor: "#f0f0f0", marginTop: 10, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: Colors.accentGold, borderRadius: 2 },
});
