import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { X, Sparkles } from "lucide-react-native";

import { Colors } from "@/constants/colors";
import type { ShowcaseUpdate } from "@/constants/showcase-updates";
import { triggerHaptic } from "@/lib/haptics";

const HOLD_MS = 4000;

interface Props {
  visible: boolean;
  update: ShowcaseUpdate | null;
  hapticsEnabled: boolean;
  onDismiss: () => void;
}

/**
 * Reusable "What's New" overlay. Sits above the dashboard, can't be
 * dismissed for the first 4 seconds. The wait is visualized as a
 * progress bar that slowly fills the inside of the "Got it" button
 * from left to right. Once full, the button becomes tappable.
 *
 * The visual showcase below the headline is a soft rounded square,
 * matched to the paywall's automation/AI feel: a glowing card with
 * pulsing AI nodes, flowing connection lines, and a sparkle.
 */
export function WhatsNewModal({ visible, update, hapticsEnabled, onDismiss }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(20)).current;
  const fill = useRef(new Animated.Value(0)).current;
  const ready = useRef(new Animated.Value(0)).current;
  const [armed, setArmed] = useState<boolean>(false);

  useEffect(() => {
    if (!visible) {
      fade.setValue(0);
      lift.setValue(20);
      fill.setValue(0);
      ready.setValue(0);
      setArmed(false);
      return;
    }
    setArmed(false);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    if (hapticsEnabled && Platform.OS !== "web") triggerHaptic("light", true);

    // Progress bar inside the CTA slowly fills over the hold window.
    Animated.timing(fill, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    const t = setTimeout(() => {
      setArmed(true);
      Animated.spring(ready, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
      if (hapticsEnabled && Platform.OS !== "web") triggerHaptic("success", true);
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [visible, fade, lift, fill, ready, hapticsEnabled]);

  if (!visible || !update) return null;

  const accent = update.accent ?? "#d4af37";
  const fillWidth = fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const readyScale = ready.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });

  const dismiss = () => {
    if (!armed) return;
    triggerHaptic("light", hapticsEnabled);
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 12, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  return (
    <Animated.View pointerEvents="auto" style={[styles.backdrop, { opacity: fade }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => { /* tap outside is a no-op */ }} />
      <Animated.View style={[styles.card, { transform: [{ translateY: lift }] }]}>
        <Text style={styles.badge}>WHAT&apos;S NEW</Text>
        <Text style={styles.headline}>{update.headline}</Text>
        <Text style={styles.body}>{update.body}</Text>

        <AIShowcase accent={accent} />

        <Animated.View style={{ transform: [{ scale: readyScale }], width: "100%", alignItems: "stretch" }}>
          <Pressable
            onPress={dismiss}
            disabled={!armed}
            style={styles.cta}
            testID="whats-new-dismiss"
          >
            {/* Filling progress layer */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ctaFill,
                { width: fillWidth, backgroundColor: armed ? Colors.text : "#2a2a2a" },
              ]}
            />
            <View style={styles.ctaBorder} pointerEvents="none" />
            <Text style={[styles.ctaText, { color: armed ? "#ffffff" : "#cfcfcf" }]}>
              {armed ? "Got it" : "Hold on…"}
            </Text>
          </Pressable>
        </Animated.View>

        <View style={styles.closeRow} pointerEvents={armed ? "auto" : "none"}>
          <Pressable
            onPress={dismiss}
            hitSlop={12}
            style={({ pressed }) => [styles.close, { opacity: armed ? (pressed ? 0.5 : 1) : 0.3 }]}
            testID="whats-new-close"
          >
            <X size={14} color={Colors.textDim} />
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Soft rounded square showcase visual, mirroring the paywall's "AI"
 * feature card. Pulsing AI nodes, flowing connection line, and a
 * gentle sparkle so the card feels alive instead of being a flat emoji.
 */
function AIShowcase({ accent }: { accent: string }) {
  const pulseA = useRef(new Animated.Value(0)).current;
  const pulseB = useRef(new Animated.Value(0)).current;
  const pulseC = useRef(new Animated.Value(0)).current;
  const flow = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const sparkleRot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopNode = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 900, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ])
      );

    loopNode(pulseA, 0).start();
    loopNode(pulseB, 280).start();
    loopNode(pulseC, 560).start();

    Animated.loop(
      Animated.timing(flow, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(sparkleRot, { toValue: 1, duration: 5200, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, [pulseA, pulseB, pulseC, flow, glow, sparkleRot]);

  const nodeScale = (v: Animated.Value) => v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] });
  const nodeOpacity = (v: Animated.Value) => v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  const dotTranslate = flow.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] });
  const dotOpacity = flow.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
  const dotTranslate2 = flow.interpolate({ inputRange: [0, 1], outputRange: [60, -60] });

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.05] });
  const sparkleSpin = sparkleRot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.showcase}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.showcaseGlow,
          { backgroundColor: accent + "33", opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      {/* Connection lines */}
      <View pointerEvents="none" style={[styles.line, styles.lineTop]} />
      <View pointerEvents="none" style={[styles.line, styles.lineBottom]} />

      {/* Flowing data dots on top + bottom lines */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.flowDot,
          styles.flowDotTop,
          { backgroundColor: accent, opacity: dotOpacity, transform: [{ translateX: dotTranslate }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.flowDot,
          styles.flowDotBottom,
          { backgroundColor: accent, opacity: dotOpacity, transform: [{ translateX: dotTranslate2 }] },
        ]}
      />

      {/* Left node */}
      <Animated.View
        style={[
          styles.node,
          styles.nodeLeft,
          { borderColor: accent, transform: [{ scale: nodeScale(pulseA) }], opacity: nodeOpacity(pulseA) },
        ]}
      >
        <View style={[styles.nodeCore, { backgroundColor: accent }]} />
      </Animated.View>

      {/* Right node */}
      <Animated.View
        style={[
          styles.node,
          styles.nodeRight,
          { borderColor: accent, transform: [{ scale: nodeScale(pulseC) }], opacity: nodeOpacity(pulseC) },
        ]}
      >
        <View style={[styles.nodeCore, { backgroundColor: accent }]} />
      </Animated.View>

      {/* Center "AI" hub */}
      <Animated.View
        style={[
          styles.hub,
          { borderColor: accent, transform: [{ scale: nodeScale(pulseB) }] },
        ]}
      >
        <Text style={[styles.hubText, { color: accent }]}>AI</Text>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.hubSparkle,
            { transform: [{ rotate: sparkleSpin }] },
          ]}
        >
          <Sparkles size={11} color={accent} strokeWidth={2.5} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    zIndex: 1000,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  badge: {
    color: Colors.textDim,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  headline: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    color: Colors.textDim,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 18,
    paddingHorizontal: 4,
  },

  // Showcase visual
  showcase: {
    width: "100%",
    height: 132,
    borderRadius: 20,
    backgroundColor: "#0b0b0c",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.28)",
    marginBottom: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  showcaseGlow: {
    position: "absolute",
    width: "70%",
    height: "70%",
    borderRadius: 999,
  },
  line: {
    position: "absolute",
    left: "18%",
    right: "18%",
    height: 1,
    backgroundColor: "rgba(212,175,55,0.35)",
  },
  lineTop: { top: "38%" },
  lineBottom: { bottom: "38%" },
  flowDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 999,
    shadowColor: "#d4af37",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  flowDotTop: { top: "37%", alignSelf: "center" },
  flowDotBottom: { bottom: "37%", alignSelf: "center" },
  node: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  nodeLeft: { left: "12%" },
  nodeRight: { right: "12%" },
  nodeCore: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  hub: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: "rgba(212,175,55,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  hubText: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  hubSparkle: {
    position: "absolute",
    top: -8,
    right: -8,
  },

  // CTA with progress fill
  cta: {
    height: 48,
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f1f3",
    width: "100%",
  },
  ctaFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  ctaBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  ctaText: {
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.3,
    zIndex: 2,
  },

  closeRow: { position: "absolute", top: 12, right: 12 },
  close: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f4f4f4",
    alignItems: "center",
    justifyContent: "center",
  },
});
