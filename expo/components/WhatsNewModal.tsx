import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";

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
 * dismissed for the first 4 seconds, then the close button pulses
 * softly and becomes tappable. Once dismissed (once per id), the
 * caller persists the id so it never shows again.
 */
export function WhatsNewModal({ visible, update, hapticsEnabled, onDismiss }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(20)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [armed, setArmed] = useState<boolean>(false);

  useEffect(() => {
    if (!visible) {
      fade.setValue(0);
      lift.setValue(20);
      setArmed(false);
      return;
    }
    setArmed(false);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    if (hapticsEnabled && Platform.OS !== "web") triggerHaptic("light", true);
    const t = setTimeout(() => {
      setArmed(true);
      if (hapticsEnabled && Platform.OS !== "web") triggerHaptic("light", true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ).start();
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [visible, fade, lift, pulse, hapticsEnabled]);

  if (!visible || !update) return null;

  const accent = update.accent ?? "#d4af37";
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  return (
    <Animated.View pointerEvents="auto" style={[styles.backdrop, { opacity: fade }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => { /* tap outside is a no-op during hold + after */ }} />
      <Animated.View style={[styles.card, { transform: [{ translateY: lift }] }]}>
        <View style={[styles.ring, { backgroundColor: accent + "22", borderColor: accent + "55" }]}>
          <Text style={styles.emoji}>{update.emoji ?? "✨"}</Text>
        </View>

        <Text style={styles.badge}>WHAT&apos;S NEW</Text>
        <Text style={styles.headline}>{update.headline}</Text>
        <Text style={styles.body}>{update.body}</Text>

        <Animated.View style={{ opacity: armed ? pulseOpacity : 0.35, transform: [{ scale: armed ? pulseScale : 1 }] }}>
          <Pressable
            onPress={() => {
              if (!armed) return;
              triggerHaptic("light", hapticsEnabled);
              Animated.parallel([
                Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(lift, { toValue: 12, duration: 200, useNativeDriver: true }),
              ]).start(() => onDismiss());
            }}
            disabled={!armed}
            style={[styles.cta, { backgroundColor: armed ? Colors.text : "#cccccc" }]}
            testID="whats-new-dismiss"
          >
            <Text style={styles.ctaText}>{armed ? "Got it" : "Hold on…"}</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.closeRow} pointerEvents={armed ? "auto" : "none"}>
          <Pressable
            onPress={() => {
              if (!armed) return;
              triggerHaptic("tap", hapticsEnabled);
              Animated.parallel([
                Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
                Animated.timing(lift, { toValue: 12, duration: 180, useNativeDriver: true }),
              ]).start(() => onDismiss());
            }}
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
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emoji: { fontSize: 34 },
  badge: {
    color: Colors.textDim,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  headline: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 10,
  },
  body: {
    color: Colors.textDim,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  cta: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 160,
  },
  ctaText: { color: "#ffffff", fontWeight: "900", fontSize: 14, letterSpacing: 0.3 },
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
