import React, { useMemo, useState } from "react";
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronDown, Flame } from "lucide-react-native";

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

  const headline: { title: string; sub: string; emoji: string } = (() => {
    if (weekMinutes > 0) {
      return { emoji: "💪", title: `${weekMinutes} minutes of real work`, sub: "this past week" };
    }
    if (state.streak >= 2) {
      return { emoji: "🔥", title: `${state.streak} days on fire`, sub: "keep the chain going" };
    }
    if (totalCompleted >= 5) {
      return { emoji: "🏆", title: `You finished more tasks than ${percentileOfNewUsers}% of new users`, sub: "and you're just warming up" };
    }
    return { emoji: "✨", title: "Finish your first task", sub: "your stats unlock once you start moving" };
  })();

  const toggleAdvanced = () => {
    if (Platform.OS !== "web") LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAdvanced((s) => !s);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Progress</Text>
          <Text style={styles.sub}>Small wins. Every day.</Text>

          <View style={styles.streakHero}>
            <StreakEffect streak={state.streak} size={160} />
            <View style={styles.tierRow}>
              <Flame size={16} color={tier.primary} />
              <Text style={[styles.tierLabel, { color: tier.primary }]}>{tier.label.toUpperCase()}</Text>
            </View>
            <Text style={styles.streakNum}>{state.streak}<Text style={styles.streakUnit}> days</Text></Text>
          </View>

          <View style={styles.headlines}>
            <View style={styles.headCard} testID="progress-insight">
              <Text style={styles.headEmoji}>{headline.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.headTitle}>{headline.title}</Text>
                <Text style={styles.headSub}>{headline.sub}</Text>
              </View>
            </View>
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
