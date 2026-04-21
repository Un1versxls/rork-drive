import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Award, Bolt, ChevronDown, Cpu, Crown, Diamond, Flame, Gem, Lock, Medal, Moon, Rainbow, Rocket, Shield, Snowflake, Sparkle, Sparkles, Star, Sun, Target, Trophy, Zap } from "lucide-react-native";

import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { NameBadge } from "@/components/NameBadge";
import { StreakEffect } from "@/components/StreakEffect";
import { Colors } from "@/constants/colors";
import { ACHIEVEMENTS } from "@/constants/achievements";
import { BADGES } from "@/constants/badges";
import { getStreakTier } from "@/constants/streak-tiers";
import { triggerHaptic } from "@/lib/haptics";
import { useApp } from "@/providers/AppProvider";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ICON_MAP: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  Sparkles, Zap, Medal, Trophy, Flame, Star, Crown, Award, Gem, Target, Cpu, Rocket, Shield, Diamond, Snowflake, Bolt, Sun, Rainbow, Moon, Sparkle,
};

type PanelKey = "milestones" | "effects" | null;

export default function ProgressScreen() {
  const { state, weeklyActivity, totalCompleted, totalSkipped, level, levelProgress, equipEffect } = useApp();
  const maxWeek = Math.max(1, ...weeklyActivity.map((w) => w.completed));
  const skipRate = totalCompleted + totalSkipped === 0 ? 0 : Math.round((totalSkipped / (totalCompleted + totalSkipped)) * 100);
  const tier = getStreakTier(state.streak);
  const [openPanel, setOpenPanel] = useState<PanelKey>(null);

  const togglePanel = (key: Exclude<PanelKey, null>) => {
    if (Platform.OS !== "web") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    triggerHaptic("tap", state.profile.hapticsEnabled);
    setOpenPanel((p) => (p === key ? null : key));
  };

  const unlockedAchCount = state.unlockedAchievements.length;
  const unlockedBadgeCount = state.unlockedBadges.length;

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Progress</Text>
          <Text style={styles.sub}>Keep showing up. It compounds.</Text>

          <GlassCard glow style={styles.pointsCard} padding={22}>
            <LinearGradient
              colors={["rgba(212,175,55,0.14)", "rgba(201,168,124,0.04)"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.pointsLabel}>TOTAL POINTS</Text>
            <Text style={styles.pointsValue}>{state.points.toLocaleString()}</Text>
            <View style={styles.levelRow}>
              <Text style={styles.levelText}>Level {level}</Text>
              <View style={styles.levelBar}>
                <View style={[styles.levelFill, { width: `${Math.round(levelProgress * 100)}%` }]}>
                  <LinearGradient
                    colors={["#c9a87c", "#e8d5b7"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              </View>
              <Text style={styles.levelNext}>Lv {level + 1}</Text>
            </View>
          </GlassCard>

          <View style={styles.grid}>
            <StreakCard streak={state.streak} tierLabel={tier.label} />
            <StatCard label="Best streak" value={state.bestStreak.toString()} />
            <StatCard label="Completed" value={totalCompleted.toString()} />
            <StatCard label="Skip rate" value={`${skipRate}%`} />
          </View>

          <Text style={styles.sectionTitle}>Your streak energy</Text>
          <GlassCard padding={24} style={styles.streakCard}>
            <View style={{ alignItems: "center" }}>
              <StreakEffect streak={state.streak} size={180} />
              <Text style={styles.streakTierLabel}>{tier.label.toUpperCase()}</Text>
              <Text style={styles.streakTierDesc}>{tier.description}</Text>
            </View>
          </GlassCard>

          <Text style={styles.sectionTitle}>Last 7 days</Text>
          <GlassCard padding={18} style={{ marginBottom: 24 }}>
            <View style={styles.chart}>
              {weeklyActivity.map((d, i) => {
                const h = (d.completed / maxWeek) * 90;
                const isToday = i === weeklyActivity.length - 1;
                return (
                  <View key={d.key} style={styles.barCol}>
                    <View style={styles.barWrap}>
                      <View style={[styles.bar, { height: Math.max(4, h) }]}>
                        <LinearGradient
                          colors={isToday ? ["#d4af37", "#c9a87c"] : ["rgba(201,168,124,0.6)", "rgba(201,168,124,0.2)"]}
                          style={StyleSheet.absoluteFill}
                        />
                      </View>
                    </View>
                    <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{d.label}</Text>
                    <Text style={styles.barValue}>{d.completed}</Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>

          <Text style={styles.sectionTitle}>Rewards</Text>

          <PanelButton
            title="Title Effects"
            subtitle={`${unlockedAchCount} / ${ACHIEVEMENTS.length} unlocked`}
            description="Style your name across the app"
            Icon={Sparkles}
            open={openPanel === "effects"}
            onPress={() => togglePanel("effects")}
            testID="panel-effects"
          />
          {openPanel === "effects" ? (
            <View style={styles.panelBody}>
              <GlassCard padding={16} style={styles.equippedCard}>
                <Text style={styles.equippedLabel}>EQUIPPED</Text>
                <View style={styles.equippedNameRow}>
                  <NameBadge
                    name={state.profile.name || "Driver"}
                    effect={state.profile.equippedEffect}
                    size={22}
                  />
                </View>
                <Pressable
                  onPress={() => { triggerHaptic("tap", state.profile.hapticsEnabled); equipEffect("none"); }}
                  style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.removeText}>Use default</Text>
                </Pressable>
              </GlassCard>

              <View style={styles.achGrid}>
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = state.unlockedAchievements.includes(a.id);
                  const equipped = state.profile.equippedEffect === a.effect && unlocked;
                  const Icon = ICON_MAP[a.icon] ?? Award;
                  const progress = getProgressFor(a.metric, a.threshold, state, totalCompleted);
                  return (
                    <Pressable
                      key={a.id}
                      onPress={() => {
                        if (!unlocked) {
                          triggerHaptic("warning", state.profile.hapticsEnabled);
                          return;
                        }
                        equipEffect(a.effect);
                      }}
                      style={({ pressed }) => [styles.achCard, unlocked && styles.achCardOn, equipped && styles.achCardEquipped, pressed && { opacity: 0.9 }]}
                      testID={`achievement-${a.id}`}
                    >
                      <View style={[styles.achIcon, unlocked && styles.achIconOn]}>
                        {unlocked ? <Icon color="#faf9f6" size={22} /> : <Lock color={Colors.textMuted} size={18} />}
                      </View>
                      <Text style={[styles.achTitle, !unlocked && styles.achTitleOff]}>{a.title}</Text>
                      <Text style={styles.achDesc}>{a.description}</Text>

                      {unlocked ? (
                        <View style={styles.effectPreview}>
                          <NameBadge name={state.profile.name || "You"} effect={a.effect} size={14} />
                        </View>
                      ) : (
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                        </View>
                      )}

                      <View style={[styles.effectBadge, equipped && styles.effectBadgeOn]}>
                        <Text style={[styles.effectBadgeText, equipped && styles.effectBadgeTextOn]}>
                          {equipped ? "EQUIPPED" : unlocked ? "TAP TO EQUIP" : "LOCKED"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <PanelButton
            title="Milestones"
            subtitle={`${unlockedBadgeCount} / ${BADGES.length} earned`}
            description="Tasks, streaks & points up to 100k"
            Icon={Trophy}
            open={openPanel === "milestones"}
            onPress={() => togglePanel("milestones")}
            testID="panel-milestones"
          />
          {openPanel === "milestones" ? (
            <View style={styles.panelBody}>
              <MilestoneGroup
                title="Tasks Completed"
                items={BADGES.filter((b) => b.metric === "completed")}
                unlocked={state.unlockedBadges}
                current={totalCompleted}
              />
              <MilestoneGroup
                title="Streak Days"
                items={BADGES.filter((b) => b.metric === "streak")}
                unlocked={state.unlockedBadges}
                current={state.streak}
              />
              <MilestoneGroup
                title="Points Earned"
                items={BADGES.filter((b) => b.metric === "points")}
                unlocked={state.unlockedBadges}
                current={state.points}
              />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getProgressFor(
  metric: "completed" | "streak" | "points" | "plan",
  threshold: number,
  state: ReturnType<typeof useApp>["state"],
  totalCompleted: number
): number {
  if (metric === "plan") {
    const premium = state.profile.plan === "elite" || state.profile.plan === "unlimited";
    return premium ? 1 : 0;
  }
  const value =
    metric === "completed" ? totalCompleted :
    metric === "streak" ? state.streak :
    state.points;
  return Math.min(1, value / threshold);
}

function PanelButton({
  title, subtitle, description, Icon, open, onPress, testID,
}: {
  title: string;
  subtitle: string;
  description: string;
  Icon: React.ComponentType<{ color: string; size: number }>;
  open: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(rot, { toValue: open ? 1 : 0, duration: 220, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
  }, [open, rot]);
  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.9 }]} testID={testID}>
      <GlassCard glow={open} padding={18} style={styles.panelBtn}>
        <View style={styles.panelIcon}>
          <LinearGradient
            colors={["#d4af37", "#c9a87c"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Icon color="#faf9f6" size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.panelTitle}>{title}</Text>
          <Text style={styles.panelSubtitle}>{subtitle}</Text>
          <Text style={styles.panelDesc}>{description}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown color={Colors.textDim} size={22} />
        </Animated.View>
      </GlassCard>
    </Pressable>
  );
}

function MilestoneGroup({
  title, items, unlocked, current,
}: {
  title: string;
  items: typeof BADGES;
  unlocked: string[];
  current: number;
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.badgesGrid}>
        {items.map((b) => {
          const Icon = ICON_MAP[b.icon] ?? Award;
          const isUnlocked = unlocked.includes(b.id);
          const progress = Math.min(1, current / b.threshold);
          return (
            <GlassCard key={b.id} padding={14} style={[styles.badge, isUnlocked && styles.badgeOn]}>
              <View style={[styles.badgeIcon, isUnlocked && styles.badgeIconOn]}>
                {isUnlocked ? (
                  <Icon color="#faf9f6" size={22} />
                ) : (
                  <Lock color={Colors.textMuted} size={18} />
                )}
              </View>
              <Text style={[styles.badgeTitle, !isUnlocked && styles.badgeTitleOff]}>{b.title}</Text>
              <Text style={styles.badgeDesc}>{b.description}</Text>
              {!isUnlocked ? (
                <>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.min(current, b.threshold).toLocaleString()} / {b.threshold.toLocaleString()}
                  </Text>
                </>
              ) : (
                <View style={styles.unlockedPill}>
                  <Text style={styles.unlockedPillText}>EARNED</Text>
                </View>
              )}
            </GlassCard>
          );
        })}
      </View>
    </View>
  );
}

function StreakCard({ streak, tierLabel }: { streak: number; tierLabel: string }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <GlassCard padding={16} style={styles.statCard}>
      <View style={styles.statTopRow}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Flame color={Colors.accent} size={22} />
        </Animated.View>
        <Text style={styles.statLabel}>{tierLabel}</Text>
      </View>
      <Text style={styles.statValue}>{streak}<Text style={styles.statUnit}> d</Text></Text>
    </GlassCard>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard padding={16} style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: Platform.OS === "ios" ? 120 : 110 },
  header: { color: Colors.text, fontSize: 32, fontWeight: "900", letterSpacing: -0.5 },
  sub: { color: Colors.textDim, fontSize: 14, marginTop: 4, marginBottom: 18 },
  pointsCard: { marginBottom: 16, overflow: "hidden" },
  pointsLabel: { color: Colors.accent, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  pointsValue: { color: Colors.text, fontSize: 56, fontWeight: "900", letterSpacing: -2, marginTop: 2 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  levelText: { color: Colors.text, fontWeight: "800", fontSize: 12 },
  levelBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.06)", overflow: "hidden" },
  levelFill: { height: "100%", overflow: "hidden" },
  levelNext: { color: Colors.textDim, fontSize: 11, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statCard: { width: "48%", minHeight: 92 },
  statTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statLabel: { color: Colors.textDim, fontSize: 12, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  statValue: { color: Colors.text, fontSize: 26, fontWeight: "900", marginTop: 6 },
  statUnit: { color: Colors.textDim, fontSize: 14, fontWeight: "700" },
  sectionTitle: { color: Colors.textDim, fontWeight: "800", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 },
  streakCard: { marginBottom: 20 },
  streakTierLabel: { color: Colors.accentDeep, fontSize: 14, fontWeight: "900", letterSpacing: 6, marginTop: 14 },
  streakTierDesc: { color: Colors.textDim, fontSize: 13, marginTop: 4, fontWeight: "600" },
  chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 130 },
  barCol: { alignItems: "center", flex: 1 },
  barWrap: { height: 90, justifyContent: "flex-end", marginBottom: 6 },
  bar: { width: 18, borderRadius: 6, overflow: "hidden" },
  barLabel: { color: Colors.textDim, fontSize: 11, fontWeight: "700" },
  barLabelToday: { color: Colors.accentDeep },
  barValue: { color: Colors.textMuted, fontSize: 10, fontWeight: "700", marginTop: 2 },

  panelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
  },
  panelIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  panelTitle: { color: Colors.text, fontSize: 17, fontWeight: "900", letterSpacing: -0.2 },
  panelSubtitle: { color: Colors.accentDeep, fontSize: 11, fontWeight: "800", letterSpacing: 0.6, marginTop: 2 },
  panelDesc: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },

  panelBody: { marginBottom: 14, marginTop: 4 },

  equippedCard: { marginBottom: 12, borderColor: Colors.borderStrong },
  equippedLabel: { color: Colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  equippedNameRow: { marginTop: 8 },
  removeBtn: { marginTop: 10, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border },
  removeText: { color: Colors.textDim, fontSize: 11, fontWeight: "800" },
  achGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  achCard: { width: "48%", padding: 14, borderRadius: 18, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, opacity: 0.6 },
  achCardOn: { opacity: 1, borderColor: Colors.borderStrong },
  achCardEquipped: { borderColor: Colors.accent, shadowColor: Colors.accent, shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  achIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.05)", marginBottom: 10 },
  achIconOn: { backgroundColor: Colors.accent },
  achTitle: { color: Colors.text, fontWeight: "800", fontSize: 14 },
  achTitleOff: { color: Colors.textDim },
  achDesc: { color: Colors.textMuted, fontSize: 11, marginTop: 2, lineHeight: 15 },
  effectPreview: { marginTop: 10, padding: 8, borderRadius: 10, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  effectBadge: { marginTop: 10, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border },
  effectBadgeOn: { backgroundColor: Colors.accentDeep, borderColor: Colors.accentDeep },
  effectBadgeText: { color: Colors.textDim, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  effectBadgeTextOn: { color: "#faf9f6" },

  groupTitle: { color: Colors.textDim, fontWeight: "800", fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 },
  badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: { width: "48%", opacity: 0.55 },
  badgeOn: { opacity: 1, borderColor: Colors.borderStrong },
  badgeIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    marginBottom: 10,
  },
  badgeIconOn: { backgroundColor: Colors.accent },
  badgeTitle: { color: Colors.text, fontWeight: "800", fontSize: 14 },
  badgeTitleOff: { color: Colors.textDim },
  badgeDesc: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },

  progressBar: { marginTop: 10, height: 5, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.06)", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.accent, borderRadius: 3 },
  progressText: { color: Colors.textMuted, fontSize: 10, fontWeight: "700", marginTop: 6, letterSpacing: 0.4 },

  unlockedPill: { marginTop: 10, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: Colors.accentDeep },
  unlockedPillText: { color: "#faf9f6", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
});
