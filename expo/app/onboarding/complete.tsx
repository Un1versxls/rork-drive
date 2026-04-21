import React, { useEffect, useRef } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";

import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import { getPlan } from "@/constants/plans";

const GOAL_LABEL: Record<string, string> = {
  earn_income: "Earn extra income",
  build_skills: "Build skills",
  grow_business: "Grow my business",
  stay_productive: "Stay productive",
};
const EXP_LABEL: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert" };
const TIME_LABEL: Record<string, string> = { "15m": "15 minutes / day", "30m": "30 minutes / day", "1h": "1 hour / day", "2h": "2+ hours / day" };

export default function CompleteScreen() {
  const router = useRouter();
  const { state } = useApp();
  const plan = getPlan(state.profile.plan);

  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [scale, fade, pulse]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] });

  const onGo = () => {
    router.push("/onboarding/notifications");
  };

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.iconWrap}>
            <Animated.View style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}>
              <LinearGradient colors={["rgba(212,175,55,0.55)", "rgba(201,168,124,0)"]} style={styles.glowFill} />
            </Animated.View>
            <Animated.View style={[styles.checkCircle, { transform: [{ scale }] }]}>
              <LinearGradient
                colors={["#d4af37", "#c9a87c", "#8b7355"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Check color="#faf9f6" size={44} strokeWidth={3} />
            </Animated.View>
          </View>

          <Animated.View style={{ opacity: fade, alignItems: "center" }}>
            <Text style={styles.eyebrow}>YOU&apos;RE IN</Text>
            <Text style={styles.title}>
              {state.profile.name ? `Let's go, ${state.profile.name}` : "Here's your setup"}
            </Text>
            <Text style={styles.subtitle}>
              Your business is picked. Your daily tasks are ready. Consistency compounds — start with one today.
            </Text>
          </Animated.View>

          {state.profile.business ? (
            <GlassCard style={styles.bizCard} padding={18}>
              <Text style={styles.bizLabel}>YOUR BUSINESS</Text>
              <Text style={styles.bizName}>{state.profile.business.name}</Text>
              <Text style={styles.bizTag}>{state.profile.business.tagline}</Text>
            </GlassCard>
          ) : null}

          <GlassCard style={styles.card} padding={18}>
            <Row label="Goal" value={state.profile.goal ? GOAL_LABEL[state.profile.goal] : "-"} />
            <Divider />
            <Row label="Level" value={state.profile.experience ? EXP_LABEL[state.profile.experience] : "-"} />
            <Divider />
            <Row label="Time" value={state.profile.time ? TIME_LABEL[state.profile.time] : "-"} />
            <Divider />
            <Row label="Plan" value={`${plan.name} • ${plan.multiplier}x points`} highlight />
          </GlassCard>
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton title="Continue" onPress={onGo} testID="cta-enter" />
        </View>
      </SafeAreaView>
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}
function Divider() { return <View style={styles.divider} />; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1, paddingHorizontal: 24 },
  scroll: { alignItems: "center", paddingVertical: 12, paddingBottom: 24 },
  iconWrap: { width: 140, height: 140, alignItems: "center", justifyContent: "center", marginTop: 16, marginBottom: 10 },
  glow: { position: "absolute", width: 220, height: 220, borderRadius: 999 },
  glowFill: { flex: 1, borderRadius: 999 },
  checkCircle: { width: 96, height: 96, borderRadius: 48, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  eyebrow: { color: Colors.accent, letterSpacing: 4, fontWeight: "800", fontSize: 12 },
  title: { color: Colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.5, marginTop: 6, textAlign: "center" },
  subtitle: { color: Colors.textDim, fontSize: 15, textAlign: "center", marginTop: 8, maxWidth: 340, lineHeight: 21 },
  bizCard: { marginTop: 24, width: "100%", borderColor: Colors.borderStrong },
  bizLabel: { color: Colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  bizName: { color: Colors.text, fontSize: 22, fontWeight: "900", marginTop: 4, letterSpacing: -0.3 },
  bizTag: { color: Colors.textDim, fontSize: 13, marginTop: 2 },
  card: { marginTop: 14, width: "100%" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  rowLabel: { color: Colors.textDim, fontSize: 13, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase" },
  rowValue: { color: Colors.text, fontSize: 15, fontWeight: "700" },
  rowValueHighlight: { color: Colors.accentDeep },
  divider: { height: 1, backgroundColor: Colors.border },
  footer: { paddingBottom: 8 },
});
