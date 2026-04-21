import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Flame, RotateCcw, Sparkles, X } from "lucide-react-native";

import { BackgroundGlow } from "@/components/BackgroundGlow";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { GlassCard } from "@/components/GlassCard";
import { NameBadge } from "@/components/NameBadge";
import { ProgressRing } from "@/components/ProgressRing";
import { StreakEffect } from "@/components/StreakEffect";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { Colors } from "@/constants/colors";
import { getStreakTier } from "@/constants/streak-tiers";
import { CATEGORY_META } from "@/constants/task-pool";
import { triggerHaptic } from "@/lib/haptics";
import { useApp } from "@/providers/AppProvider";
import type { Task } from "@/types";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up,";
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  if (h < 22) return "Good evening,";
  return "Late night,";
}

function formatDate(): string {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function TasksScreen() {
  const { state, today, currentPlan, completeTask, skipTask, undoTask } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [streakBurst, setStreakBurst] = useState<number>(0);
  const [celebrate, setCelebrate] = useState<boolean>(false);
  const [celebrateSeenKey, setCelebrateSeenKey] = useState<string | null>(null);

  useEffect(() => {
    if (today.total > 0 && today.completed === today.total) {
      if (celebrateSeenKey !== today.key) {
        setCelebrate(true);
        setCelebrateSeenKey(today.key);
      }
    }
  }, [today.total, today.completed, today.key, celebrateSeenKey]);

  const todayPoints = useMemo(
    () => today.list.filter((t) => t.status === "completed").reduce((s, t) => s + t.basePoints * currentPlan.multiplier, 0),
    [today.list, currentPlan.multiplier]
  );

  const progress = today.total > 0 ? today.completed / today.total : 0;
  const pending = useMemo(() => today.list.filter((t) => t.status === "pending"), [today.list]);
  const done = useMemo(() => today.list.filter((t) => t.status !== "pending"), [today.list]);
  const tier = getStreakTier(state.streak);

  const openTask = (t: Task) => {
    setSelectedTask(t);
  };

  const tapStreak = () => {
    triggerHaptic("heavy", state.profile.hapticsEnabled);
    setStreakBurst((n) => n + 1);
  };

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greet}>{greeting()}</Text>
              <NameBadge
                name={state.profile.name || "Driver"}
                effect={state.profile.equippedEffect}
                size={28}
              />
              <Text style={styles.date}>{formatDate()}</Text>
            </View>
            <Pressable onPress={tapStreak} style={styles.streakTap} testID="streak-tap" hitSlop={8}>
              <View style={styles.streakEffectWrap}>
                <StreakEffect
                  streak={state.streak}
                  size={60}
                  compact
                  showNumber
                  triggerKey={streakBurst}
                />
              </View>
              <View style={styles.streakPill}>
                <Flame size={11} color={tier.primary} />
                <Text style={[styles.streakText, { color: tier.primary }]}>{tier.label}</Text>
              </View>
            </Pressable>
          </View>

          {state.profile.business ? (
            <GlassCard style={styles.bizCard} padding={14}>
              <View style={styles.bizRow}>
                <View style={styles.bizIcon}>
                  <Sparkles size={16} color={Colors.accentDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bizLabel}>YOUR BUSINESS</Text>
                  <Text style={styles.bizName}>{state.profile.business.name}</Text>
                  <Text style={styles.bizTag}>{state.profile.business.tagline}</Text>
                </View>
              </View>
            </GlassCard>
          ) : null}

          <GlassCard style={styles.heroCard} padding={18} glow>
            <View style={styles.heroRow}>
              <ProgressRing
                size={104}
                strokeWidth={10}
                progress={progress}
                label={`${today.completed}/${today.total}`}
                sub="TODAY"
              />
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>
                  {progress >= 1 ? "All done. Well driven." : progress > 0 ? "You're moving." : "Let's go."}
                </Text>
                <Text style={styles.heroSub}>
                  {currentPlan.name} plan • {currentPlan.multiplier}x points
                </Text>
                <View style={styles.miniStats}>
                  <MiniStat label="Points" value={state.points.toString()} />
                  <MiniStat label="Streak" value={state.streak.toString()} />
                  <MiniStat label="Best" value={state.bestStreak.toString()} />
                </View>
              </View>
            </View>
          </GlassCard>

          <Text style={styles.sectionTitle}>Today&apos;s tasks</Text>
          {pending.length === 0 && done.length === 0 ? (
            <GlassCard padding={24} style={styles.empty}>
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptySub}>Come back tomorrow — your next tasks will be ready.</Text>
            </GlassCard>
          ) : null}

          {pending.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              multiplier={currentPlan.multiplier}
              hapticsEnabled={state.profile.hapticsEnabled}
              onOpen={() => openTask(t)}
              onComplete={() => completeTask(t.id)}
              onSkip={() => skipTask(t.id)}
            />
          ))}

          {done.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Finished</Text>
              {done.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  multiplier={currentPlan.multiplier}
                  hapticsEnabled={state.profile.hapticsEnabled}
                  onOpen={() => openTask(t)}
                  onComplete={() => completeTask(t.id)}
                  onSkip={() => skipTask(t.id)}
                  onUndo={() => undoTask(t.id)}
                />
              ))}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <TaskDetailPanel
        task={selectedTask}
        business={state.profile.business}
        hapticsEnabled={state.profile.hapticsEnabled}
        visible={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        onComplete={() => selectedTask && completeTask(selectedTask.id)}
        onSkip={() => selectedTask && skipTask(selectedTask.id)}
      />

      <CelebrationOverlay
        visible={celebrate}
        points={todayPoints}
        streak={state.streak}
        hapticsEnabled={state.profile.hapticsEnabled}
        onClose={() => setCelebrate(false)}
      />
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

interface TaskItemProps {
  task: Task;
  multiplier: number;
  hapticsEnabled: boolean;
  onOpen: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onUndo?: () => void;
}

function TaskItem({ task, multiplier, hapticsEnabled, onOpen, onComplete, onSkip, onUndo }: TaskItemProps) {
  const meta = CATEGORY_META[task.category];
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const done = task.status !== "pending";

  useEffect(() => {
    if (done) {
      Animated.timing(opacity, { toValue: 0.55, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [done, opacity]);

  const quickComplete = () => {
    if (done) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    onComplete();
  };

  const handlePress = () => {
    triggerHaptic("tap", hapticsEnabled);
    onOpen();
  };

  const points = task.basePoints * multiplier;
  const difficulty = task.difficulty;

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <GlassCard padding={0} style={[styles.taskCard, done && styles.taskCardDone]}>
        <View style={styles.taskRow}>
          <Pressable
            onPress={quickComplete}
            disabled={done}
            style={[styles.checkBtn, task.status === "completed" && styles.checkBtnOn, task.status === "skipped" && styles.checkBtnSkip]}
            testID={`task-${task.id}-complete`}
          >
            {task.status === "completed" ? (
              <LinearGradient colors={["#d4af37", "#c9a87c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            ) : null}
            {task.status === "completed" ? (
              <Check color="#faf9f6" size={18} strokeWidth={3} />
            ) : task.status === "skipped" ? (
              <X color={Colors.textMuted} size={16} strokeWidth={3} />
            ) : null}
          </Pressable>

          <Pressable style={{ flex: 1 }} onPress={handlePress}>
            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: meta.color + "18", borderColor: meta.color + "55" }]}>
                <View style={[styles.pillDot, { backgroundColor: meta.color }]} />
                <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              <View style={styles.diffRow}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={[styles.diffDot, i <= difficulty && styles.diffDotOn]} />
                ))}
              </View>
              <View style={styles.pointsPill}>
                <Text style={styles.pointsText}>+{points}</Text>
              </View>
            </View>
            <Text style={[styles.title, task.status === "completed" && styles.titleDone]}>{task.title}</Text>
            <Text style={styles.desc}>{task.description}</Text>
          </Pressable>
        </View>

        {!done ? (
          <Pressable
            onPress={onSkip}
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
            testID={`task-${task.id}-skip`}
          >
            <X color={Colors.textDim} size={14} />
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : onUndo ? (
          <Pressable onPress={onUndo} style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}>
            <RotateCcw color={Colors.textDim} size={13} />
            <Text style={styles.skipText}>Undo</Text>
          </Pressable>
        ) : null}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: Platform.OS === "ios" ? 120 : 110 },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16, gap: 12 },
  greet: { color: Colors.textDim, fontSize: 14, fontWeight: "600" },
  date: { color: Colors.textMuted, fontSize: 12, fontWeight: "600", marginTop: 2 },
  streakTap: { alignItems: "center", gap: 4 },
  streakEffectWrap: { width: 60, height: 60, alignItems: "center", justifyContent: "center" },
  streakPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: Colors.accentDim,
    borderWidth: 1, borderColor: Colors.borderStrong,
  },
  streakText: { fontWeight: "900", fontSize: 10, letterSpacing: 0.5 },
  bizCard: { marginBottom: 14, borderColor: Colors.borderStrong },
  bizRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bizIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.borderStrong },
  bizLabel: { color: Colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  bizName: { color: Colors.text, fontSize: 16, fontWeight: "900", marginTop: 2 },
  bizTag: { color: Colors.textDim, fontSize: 12, marginTop: 1 },
  heroCard: { marginBottom: 24 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  heroText: { flex: 1 },
  heroTitle: { color: Colors.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  heroSub: { color: Colors.textDim, fontSize: 12, fontWeight: "600", marginTop: 4 },
  miniStats: { flexDirection: "row", gap: 14, marginTop: 12 },
  miniStat: {},
  miniStatValue: { color: Colors.text, fontSize: 18, fontWeight: "900" },
  miniStatLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  sectionTitle: { color: Colors.textDim, fontWeight: "800", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 },
  taskCard: { paddingVertical: 14, paddingHorizontal: 14, marginBottom: 10 },
  taskCardDone: {},
  taskRow: { flexDirection: "row", gap: 12 },
  checkBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
    marginTop: 2,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  checkBtnOn: { borderColor: Colors.accent },
  checkBtnSkip: { borderColor: Colors.border, backgroundColor: Colors.bgAlt },
  pillRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  diffRow: { flexDirection: "row", gap: 3 },
  diffDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.1)" },
  diffDotOn: { backgroundColor: Colors.accent },
  pointsPill: { marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.borderStrong },
  pointsText: { color: Colors.accentDeep, fontWeight: "900", fontSize: 11 },
  title: { color: Colors.text, fontSize: 15, fontWeight: "800", marginTop: 2 },
  titleDone: { textDecorationLine: "line-through", color: Colors.textDim },
  desc: { color: Colors.textDim, fontSize: 13, marginTop: 2, lineHeight: 18 },
  skipBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end", marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border },
  skipText: { color: Colors.textDim, fontSize: 12, fontWeight: "700" },
  empty: { alignItems: "center", marginBottom: 20 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: "800" },
  emptySub: { color: Colors.textDim, textAlign: "center", marginTop: 6, fontSize: 13 },
});
