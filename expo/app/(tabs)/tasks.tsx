import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Check, Flame, RotateCcw, X } from "lucide-react-native";

import { BadgeToast } from "@/components/BadgeToast";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { FirstTimeTour } from "@/components/FirstTimeTour";
import { HalfwayToast } from "@/components/HalfwayToast";
import { NameBadge } from "@/components/NameBadge";
import { RatePrompt } from "@/components/RatePrompt";
import { StreakEffect } from "@/components/StreakEffect";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { WhatsNewModal } from "@/components/WhatsNewModal";
import { currentShowcase } from "@/constants/showcase-updates";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const SHOWCASE_LAUNCH_KEY = "drive.showcase.dashboardLaunchSeen";

export default function TasksScreen() {
  const router = useRouter();
  const { state, today, currentPlan, completeTask, skipTask, undoTask, setProfileField, pendingBadges, dismissPendingBadge, dismissCurrentShowcase } = useApp();
  const [showcaseVisible, setShowcaseVisible] = useState<boolean>(false);
  const showcaseRef = useRef<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const firstTaskHint = useRef(new Animated.Value(0)).current;
  const [celebrate, setCelebrate] = useState<boolean>(false);
  const [celebrateSeenKey, setCelebrateSeenKey] = useState<string | null>(null);
  const [halfway, setHalfway] = useState<boolean>(false);
  const [halfwaySeenKey, setHalfwaySeenKey] = useState<string | null>(null);

  useEffect(() => {
    if (today.total > 0 && today.completed === today.total) {
      if (celebrateSeenKey !== today.key) {
        setCelebrate(true);
        setCelebrateSeenKey(today.key);
      }
    }
    if (today.total >= 2 && today.completed >= Math.ceil(today.total / 2) && today.completed < today.total) {
      if (halfwaySeenKey !== today.key) {
        setHalfway(true);
        setHalfwaySeenKey(today.key);
      }
    }
  }, [today.total, today.completed, today.key, celebrateSeenKey, halfwaySeenKey]);

  const todayPoints = useMemo(
    () => today.list.filter((t) => t.status === "completed").reduce((s, t) => s + t.basePoints * currentPlan.multiplier, 0),
    [today.list, currentPlan.multiplier]
  );

  const progress = today.total > 0 ? today.completed / today.total : 0;
  const pending = useMemo(() => today.list.filter((t) => t.status === "pending"), [today.list]);
  const done = useMemo(() => today.list.filter((t) => t.status !== "pending"), [today.list]);
  const tier = getStreakTier(state.streak);

  // "What's New" showcase.
  //
  // - `showOnFirstLaunch` showcases (major releases) appear on the very
  //   first dashboard open after onboarding.
  // - Otherwise we defer to the SECOND dashboard launch so the first
  //   post-onboarding session stays clean.
  // Marks current showcase as seen once dismissed; never re-shows on the
  // same id afterwards.
  useEffect(() => {
    if (!state.onboarded) return;
    if (!state.profile.firstTourSeen) return;
    if (showcaseRef.current) return;
    const showcase = currentShowcase();
    if (!showcase) return;
    if (state.profile.lastShowcaseSeen === showcase.id) return;
    showcaseRef.current = true;
    (async () => {
      try {
        if (!showcase.showOnFirstLaunch) {
          const flag = await AsyncStorage.getItem(SHOWCASE_LAUNCH_KEY);
          if (!flag) {
            await AsyncStorage.setItem(SHOWCASE_LAUNCH_KEY, "1");
            return;
          }
        }
        setTimeout(() => setShowcaseVisible(true), 700);
      } catch (e) {
        console.log("[tasks] showcase check failed", e);
      }
    })();
  }, [state.onboarded, state.profile.firstTourSeen, state.profile.lastShowcaseSeen]);

  // Coachmark: loops a soft wiggle on the first pending task card until
  // the user actually opens a task (action-completion model). Persists
  // across sessions and across new accounts — the flag only flips true
  // on real interaction.
  useEffect(() => {
    if (!state.onboarded) return;
    if (state.profile.taskHintSeen) { firstTaskHint.setValue(0); return; }
    if (pending.length === 0) return;
    const start = setTimeout(() => {
      triggerHaptic("light", state.profile.hapticsEnabled);
    }, 900);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(firstTaskHint, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(firstTaskHint, { toValue: 0.4, duration: 200, useNativeDriver: true }),
        Animated.timing(firstTaskHint, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(firstTaskHint, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.delay(2200),
      ]),
    );
    loop.start();
    return () => { clearTimeout(start); loop.stop(); };
  }, [state.onboarded, state.profile.taskHintSeen, state.profile.hapticsEnabled, pending.length, firstTaskHint]);

  return (
    <View style={styles.root}>
      <HalfwayToast visible={halfway} onHide={() => setHalfway(false)} />
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
                size={26}
                style={styles.name}
              />
            </View>
            <View style={styles.streakBlock}>
              <StreakEffect streak={state.streak} size={54} compact showNumber />
              <View style={styles.streakPill}>
                <Flame size={11} color={tier.primary} />
                <Text style={[styles.streakText, { color: tier.primary }]}>{tier.label}</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Text style={styles.heroLabel}>TODAY</Text>
              <Text style={styles.heroCount}>{today.completed} / {today.total}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={styles.heroTitle}>
              {progress >= 1 ? "All done. Well driven." : progress > 0 ? "You're moving." : "Let's go."}
            </Text>
          </View>

          {state.profile.business ? (
            <Text style={styles.bizInline} numberOfLines={1}>{state.profile.business.name}</Text>
          ) : null}

          <Text style={styles.sectionTitle}>Today&apos;s tasks</Text>
          {pending.length === 0 && done.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptySub}>Come back tomorrow — your next tasks will be ready.</Text>
            </View>
          ) : null}

          {pending.map((t, i) => (
            <TaskItem
              key={t.id}
              task={t}
              multiplier={currentPlan.multiplier}
              hapticsEnabled={state.profile.hapticsEnabled}
              hintAnim={i === 0 ? firstTaskHint : null}
              showHintCaption={i === 0 && !state.profile.taskHintSeen}
              onOpen={() => {
                if (!state.profile.taskHintSeen) setProfileField("taskHintSeen", true);
                setSelectedTask(t);
              }}
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
                  onOpen={() => setSelectedTask(t)}
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
        subtaskHintSeen={state.profile.subtaskHintSeen}
        onClose={() => setSelectedTask(null)}
        onComplete={() => selectedTask && completeTask(selectedTask.id)}
        onSkip={() => selectedTask && skipTask(selectedTask.id)}
        onSubtaskHintShown={() => setProfileField("subtaskHintSeen", true)}
      />

      <CelebrationOverlay
        visible={celebrate}
        points={todayPoints}
        streak={state.streak}
        hapticsEnabled={state.profile.hapticsEnabled}
        onClose={() => setCelebrate(false)}
      />

      <BadgeToast
        badgeId={pendingBadges[0] ?? null}
        hapticsEnabled={state.profile.hapticsEnabled}
        onHide={() => { if (pendingBadges[0]) dismissPendingBadge(pendingBadges[0]); }}
      />

      <RatePrompt />

      <FirstTimeTour
        visible={!state.profile.firstTourSeen && state.onboarded}
        hapticsEnabled={state.profile.hapticsEnabled}
        onComplete={() => setProfileField("firstTourSeen", true)}
      />

      <WhatsNewModal
        visible={showcaseVisible}
        update={currentShowcase()}
        hapticsEnabled={state.profile.hapticsEnabled}
        onDismiss={(finalRoute) => {
          setShowcaseVisible(false);
          dismissCurrentShowcase();
          if (finalRoute) {
            try { router.push(finalRoute); } catch (e) { console.log("[tasks] showcase route failed", e); }
          }
        }}
      />
    </View>
  );
}

interface TaskItemProps {
  task: Task;
  multiplier: number;
  hapticsEnabled: boolean;
  hintAnim?: Animated.Value | null;
  showHintCaption?: boolean;
  onOpen: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onUndo?: () => void;
}

function TaskItem({ task, multiplier, hapticsEnabled, hintAnim, showHintCaption, onOpen, onComplete, onSkip, onUndo }: TaskItemProps) {
  const meta = CATEGORY_META[task.category];
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const done = task.status !== "pending";

  useEffect(() => {
    Animated.timing(opacity, { toValue: done ? 0.5 : 1, duration: 240, useNativeDriver: true }).start();
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

  const hintTranslate = hintAnim ? hintAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) : 0;
  const hintShadow = hintAnim ? hintAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }) : 0;

  return (
    <Animated.View style={{ opacity, transform: [{ scale }, { translateY: hintTranslate }], shadowColor: "#000", shadowOpacity: hintShadow, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }}>
      {showHintCaption && hintAnim ? (
        <Animated.Text style={[styles.taskHintCaption, { opacity: hintAnim }]}>tap to open this task ↓</Animated.Text>
      ) : null}
      <View style={styles.taskCard}>
        <View style={styles.taskRow}>
          <Pressable
            onPress={quickComplete}
            disabled={done}
            style={[styles.checkBtn, task.status === "completed" && styles.checkBtnOn, task.status === "skipped" && styles.checkBtnSkip]}
            testID={`task-${task.id}-complete`}
          >
            {task.status === "completed" ? (
              <Check color="#ffffff" size={18} strokeWidth={3} />
            ) : task.status === "skipped" ? (
              <X color={Colors.textMuted} size={16} strokeWidth={3} />
            ) : null}
          </Pressable>

          <Pressable style={{ flex: 1 }} onPress={handlePress}>
            <View style={styles.pillRow}>
              <Text style={[styles.pill, { color: meta.color }]}>{meta.label}</Text>
              <Text style={styles.pts}>+{points} pts</Text>
            </View>
            <Text style={[styles.title, task.status === "completed" && styles.titleDone]}>{task.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>{task.description}</Text>
          </Pressable>
        </View>

        {!done ? (
          <Pressable onPress={onSkip} style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]} testID={`task-${task.id}-skip`}>
            <X color={Colors.textDim} size={13} />
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : onUndo ? (
          <Pressable onPress={onUndo} style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}>
            <RotateCcw color={Colors.textDim} size={13} />
            <Text style={styles.skipText}>Undo</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: Platform.OS === "ios" ? 120 : 110 },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 18 },
  greet: { color: Colors.textDim, fontSize: 13, fontWeight: "600" },
  name: { color: Colors.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.5, marginTop: 2 },
  bizInline: { color: Colors.textDim, fontSize: 12, fontWeight: "700", letterSpacing: 0.2, marginBottom: 14 },
  streakBlock: { alignItems: "center", gap: 4 },
  streakPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  streakText: { fontWeight: "900", fontSize: 10, letterSpacing: 0.5 },

  refreshPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#fafafa",
    borderWidth: 1, borderColor: "#eeeeee",
    marginBottom: 12,
  },
  refreshText: { color: Colors.textDim, fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },

  heroCard: { borderRadius: 20, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee", padding: 20, marginBottom: 14 },
  heroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  heroLabel: { color: Colors.textDim, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  heroCount: { color: Colors.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: "#eeeeee", marginTop: 12, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: Colors.accentGold, borderRadius: 3 },
  heroTitle: { color: Colors.text, fontSize: 16, fontWeight: "700", marginTop: 12 },

  bizCard: { padding: 16, borderRadius: 16, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee", marginBottom: 20 },
  bizLabel: { color: Colors.accentGold, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  bizName: { color: Colors.text, fontSize: 17, fontWeight: "900", marginTop: 4 },
  bizTag: { color: Colors.textDim, fontSize: 13, marginTop: 2 },

  sectionTitle: { color: Colors.textDim, fontWeight: "800", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 },

  taskCard: { paddingVertical: 16, paddingHorizontal: 16, marginBottom: 10, borderRadius: 16, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee" },
  taskRow: { flexDirection: "row", gap: 12 },
  checkBtn: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#dddddd",
    alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  checkBtnOn: { borderColor: Colors.accentGold, backgroundColor: Colors.accentGold },
  checkBtnSkip: { borderColor: "#eeeeee", backgroundColor: "#fafafa" },
  pillRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  pill: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  pts: { color: Colors.textMuted, fontSize: 11, fontWeight: "800" },
  title: { color: Colors.text, fontSize: 15, fontWeight: "800", marginTop: 2 },
  titleDone: { textDecorationLine: "line-through", color: Colors.textDim },
  desc: { color: Colors.textDim, fontSize: 13, marginTop: 4, lineHeight: 18 },
  skipBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end", marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  skipText: { color: Colors.textDim, fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", marginBottom: 20, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: "#eeeeee", backgroundColor: "#fafafa" },
  emptyTitle: { color: Colors.text, fontSize: 17, fontWeight: "800" },
  emptySub: { color: Colors.textDim, textAlign: "center", marginTop: 6, fontSize: 13 },
  taskHintCaption: { color: Colors.accentDeep, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textAlign: "center", marginBottom: 6 },
});
