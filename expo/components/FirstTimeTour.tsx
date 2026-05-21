import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Award, CheckCircle2, ChevronRight, Crown, Flame, Sparkles, RefreshCw } from "lucide-react-native";

import { Colors } from "@/constants/colors";
import { triggerHaptic } from "@/lib/haptics";

interface Step {
  Icon: React.ComponentType<{ color: string; size: number }>;
  title: string;
  body: string;
  accent: string;
}

const STEPS: Step[] = [
  { Icon: CheckCircle2, title: "Your daily tasks", body: "Every morning you'll get a fresh set of small wins. Tap a task to open its step-by-step plan.", accent: "#16a34a" },
  { Icon: Flame, title: "Build your streak", body: "Complete a task every day to grow your streak. Streaks unlock real rewards — and momentum.", accent: "#f97316" },
  { Icon: Award, title: "Earn badges", body: "Hit streak milestones to unlock badges. Equip one to style your name on the dashboard.", accent: "#d4af37" },
  { Icon: RefreshCw, title: "Switch businesses anytime", body: "Don't love your pick? Swap it from the profile tab — up to 5 swaps per month.", accent: "#0ea5e9" },
  { Icon: Crown, title: "Pro unlocks custom businesses", body: "Upgrade to Pro to build your own custom business or unlock high-income ideas.", accent: Colors.accentGold },
];

interface Props {
  visible: boolean;
  onComplete: () => void;
  hapticsEnabled: boolean;
}

export function FirstTimeTour({ visible, onComplete, hapticsEnabled }: Props) {
  const [idx, setIdx] = useState<number>(0);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(20)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setIdx(0);
    setDismissed(false);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    fade.setValue(0);
    rise.setValue(20);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    triggerHaptic("tap", hapticsEnabled);
  }, [idx, visible, fade, rise, hapticsEnabled]);

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulse]);

  if (!visible || dismissed) return null;

  const step = STEPS[idx];
  const Icon = step.Icon;
  const isLast = idx === STEPS.length - 1;
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  const next = () => {
    if (isLast) {
      // Dismiss the modal synchronously so the underlying screen is
      // immediately interactive, then persist the seen flag. Without
      // this the Modal's fade-out can swallow taps for ~300ms.
      setDismissed(true);
      triggerHaptic("select", hapticsEnabled);
      // Defer onComplete one tick so state has time to commit before
      // the parent re-renders.
      setTimeout(() => onComplete(), 0);
      return;
    }
    triggerHaptic("select", hapticsEnabled);
    setIdx((i) => Math.min(i + 1, STEPS.length - 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <View style={styles.iconWrap}>
            <Animated.View
              style={[
                styles.iconGlow,
                { backgroundColor: step.accent, opacity: glow, transform: [{ scale: glowScale }] },
              ]}
              pointerEvents="none"
            />
            <View style={[styles.iconCircle, { backgroundColor: step.accent }]}>
              <Icon color="#ffffff" size={32} />
            </View>
          </View>

          <View style={styles.eyebrowPill}>
            <Sparkles size={11} color={Colors.accentGold} />
            <Text style={styles.eyebrow}>WELCOME · {idx + 1} OF {STEPS.length}</Text>
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === idx && styles.dotOn, i < idx && styles.dotDone]} />
            ))}
          </View>

          <Pressable onPress={next} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]} testID="tour-next">
            <Text style={styles.ctaText}>{isLast ? "Let's go" : "Next"}</Text>
            <ChevronRight color="#ffffff" size={18} strokeWidth={2.6} />
          </Pressable>

          <Text style={styles.lock}>You can&apos;t skip this — only 5 quick steps.</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", padding: 22 },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 26,
    paddingTop: 32,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 24,
  },
  iconWrap: { width: 84, height: 84, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  iconGlow: { position: "absolute", width: 84, height: 84, borderRadius: 999, opacity: 0.4 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
  },
  eyebrowPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.35)",
  },
  eyebrow: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: Colors.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.5, textAlign: "center", marginTop: 4 },
  body: { color: Colors.textDim, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 4, paddingHorizontal: 4 },
  dots: { flexDirection: "row", gap: 6, marginTop: 18 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: "#eeeeee" },
  dotOn: { width: 22, backgroundColor: Colors.text },
  dotDone: { backgroundColor: Colors.accentGold },
  cta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.text,
    paddingHorizontal: 22, paddingVertical: 14, borderRadius: 999,
    marginTop: 18, alignSelf: "stretch",
  },
  ctaText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  lock: { color: Colors.textMuted, fontSize: 11, marginTop: 8, textAlign: "center" },
});
