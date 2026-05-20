import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Check, ChevronLeft, Lock } from "lucide-react-native";

import { NameBadge } from "@/components/NameBadge";
import { Colors } from "@/constants/colors";
import { ACHIEVEMENTS, type Achievement, type NameEffectId } from "@/constants/achievements";
import { triggerHaptic } from "@/lib/haptics";
import { useApp } from "@/providers/AppProvider";

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

  const ctx = useMemo(
    () => ({ completed: totalCompleted, streak: state.bestStreak, points: state.points, isPremium }),
    [totalCompleted, state.bestStreak, state.points, isPremium]
  );

  const sorted = useMemo(() => {
    return [...ACHIEVEMENTS].sort((a, b) => {
      const aUn = state.profile.unlockedEffects.includes(a.effect);
      const bUn = state.profile.unlockedEffects.includes(b.effect);
      if (aUn !== bUn) return aUn ? -1 : 1;
      return a.threshold - b.threshold;
    });
  }, [state.profile.unlockedEffects]);

  const unlockedCount = state.profile.unlockedEffects.filter((e) => e !== "none").length;
  const previewName = state.profile.name || "Driver";

  const onEquip = (effect: NameEffectId) => {
    triggerHaptic("light", state.profile.hapticsEnabled);
    equipEffect(effect);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <ChevronLeft color={Colors.text} size={22} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.header}>Badges</Text>
            <Text style={styles.headerSub}>{unlockedCount} of {ACHIEVEMENTS.length} unlocked</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>EQUIPPED</Text>
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

          {sorted.map((a) => {
            const unlocked = state.profile.unlockedEffects.includes(a.effect);
            const equipped = state.profile.equippedEffect === a.effect;
            const pct = progressFor(a, ctx);
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
                    <Text style={styles.lockedHint}>{progressLabel(a, ctx)}</Text>
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
  scroll: { paddingHorizontal: 20, paddingBottom: Platform.OS === "ios" ? 60 : 40 },

  previewCard: {
    padding: 18, borderRadius: 18, backgroundColor: "#fafafa",
    borderWidth: 1, borderColor: "#eeeeee", alignItems: "center", gap: 10,
    marginBottom: 20,
  },
  previewLabel: { color: Colors.textDim, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  clearBtn: { paddingVertical: 4, paddingHorizontal: 10 },
  clearText: { color: Colors.textDim, fontSize: 12, fontWeight: "700" },

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
