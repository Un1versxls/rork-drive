import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Award, CheckCircle2, ChevronRight, Crown, Flame, Sparkles } from "lucide-react-native";

import { Colors } from "@/constants/colors";
import { triggerHaptic } from "@/lib/haptics";
import { useApp } from "@/providers/AppProvider";

interface Step {
  Icon: React.ComponentType<{ color: string; size: number }>;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
}

const STEPS: Step[] = [
  {
    Icon: CheckCircle2,
    eyebrow: "DAILY TASKS",
    title: "Tiny daily wins.",
    body: "Every morning you get a fresh set of bite-sized tasks built around your business.",
    accent: "#16a34a",
  },
  {
    Icon: Flame,
    eyebrow: "STREAKS",
    title: "Show up. Stack days.",
    body: "Complete one task a day to grow your streak — momentum is half the game.",
    accent: "#f97316",
  },
  {
    Icon: Award,
    eyebrow: "BADGES",
    title: "Earn collectible badges.",
    body: "Hit milestones to unlock badges and equip one to style your name on the dashboard.",
    accent: Colors.accentGold,
  },
  {
    Icon: Crown,
    eyebrow: "PRO",
    title: "Bigger ideas. Bigger income.",
    body: "Pro unlocks high-income businesses, a custom builder, and exclusive name effects.",
    accent: Colors.accentDeep,
  },
];

export default function FeaturePreviewScreen() {
  const router = useRouter();
  const { state } = useApp();
  const params = useLocalSearchParams<{ initialPlan?: string; initialCycle?: string; requirePro?: string }>();

  const [idx, setIdx] = useState<number>(0);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(20)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    rise.setValue(20);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    triggerHaptic("tap", state.profile.hapticsEnabled);
  }, [idx, fade, rise, state.profile.hapticsEnabled]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const step = STEPS[idx];
  const Icon = step.Icon;
  const isLast = idx === STEPS.length - 1;
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });

  const next = () => {
    triggerHaptic("select", state.profile.hapticsEnabled);
    if (isLast) {
      router.replace({
        pathname: "/onboarding/paywall",
        params: {
          initialPlan: params.initialPlan ?? "base",
          initialCycle: params.initialCycle ?? "monthly",
          ...(params.requirePro === "1" ? { requirePro: "1" } : {}),
        },
      });
      return;
    }
    setIdx((i) => Math.min(i + 1, STEPS.length - 1));
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.dotsTop}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === idx && styles.dotOn, i < idx && styles.dotDone]} />
          ))}
        </View>

        <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <View style={styles.iconWrap}>
            <Animated.View
              style={[styles.iconGlow, { backgroundColor: step.accent, opacity: glow, transform: [{ scale: glowScale }] }]}
              pointerEvents="none"
            />
            <View style={[styles.iconCircle, { backgroundColor: step.accent }]}>
              <Icon color="#ffffff" size={36} />
            </View>
          </View>

          <View style={styles.eyebrowPill}>
            <Sparkles size={11} color={Colors.accentGold} />
            <Text style={styles.eyebrow}>{step.eyebrow}</Text>
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>
        </Animated.View>

        <View style={styles.footer}>
          <Pressable onPress={next} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]} testID="feature-preview-next">
            <Text style={styles.ctaText}>{isLast ? "See my plan" : "Next"}</Text>
            <ChevronRight color="#ffffff" size={18} strokeWidth={2.6} />
          </Pressable>
          <Text style={styles.legal}>Quick tour — {idx + 1} of {STEPS.length}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  safe: { flex: 1, paddingHorizontal: 22, justifyContent: "space-between" },
  dotsTop: { flexDirection: "row", gap: 6, alignSelf: "center", marginTop: 8 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: "#eeeeee" },
  dotOn: { width: 26, backgroundColor: Colors.text },
  dotDone: { backgroundColor: Colors.accentGold },

  card: { alignItems: "center", paddingHorizontal: 6 },
  iconWrap: { width: 100, height: 100, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  iconGlow: { position: "absolute", width: 100, height: 100, borderRadius: 999 },
  iconCircle: {
    width: 76, height: 76, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
  },
  eyebrowPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.35)",
  },
  eyebrow: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: Colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.7, textAlign: "center", marginTop: 14 },
  body: { color: Colors.textDim, fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 10, paddingHorizontal: 8 },

  footer: { gap: 8, paddingBottom: 8 },
  cta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.text,
    paddingHorizontal: 22, paddingVertical: 16, borderRadius: 999,
  },
  ctaText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  legal: { color: Colors.textMuted, fontSize: 11, textAlign: "center" },
});
