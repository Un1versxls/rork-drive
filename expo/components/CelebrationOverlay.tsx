import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, Trophy } from "lucide-react-native";

import { Colors } from "@/constants/colors";
import { triggerHaptic } from "@/lib/haptics";

interface Props {
  visible: boolean;
  points: number;
  streak: number;
  hapticsEnabled: boolean;
  onClose: () => void;
}

const PARTICLES = 18;

interface Particle {
  left: number;
  delay: number;
  size: number;
  duration: number;
  drift: number;
  rotate: number;
}

export function CelebrationOverlay({ visible, points, streak, hapticsEnabled, onClose }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const shine = useRef(new Animated.Value(0)).current;
  const ringPulse = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef<Animated.Value[]>(
    Array.from({ length: PARTICLES }, () => new Animated.Value(0))
  ).current;

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: PARTICLES }, (_, i) => ({
        left: (i / PARTICLES) * 100 + (Math.random() * 8 - 4),
        delay: Math.random() * 600,
        size: 6 + Math.random() * 10,
        duration: 1800 + Math.random() * 1600,
        drift: (Math.random() - 0.5) * 120,
        rotate: Math.random() * 360,
      })),
    []
  );

  useEffect(() => {
    if (!visible) {
      fade.setValue(0);
      scale.setValue(0.6);
      shine.setValue(0);
      ringPulse.setValue(0);
      particleAnims.forEach((a) => a.setValue(0));
      return;
    }

    triggerHaptic("celebrate", hapticsEnabled);

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(shine, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(ringPulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    particleAnims.forEach((anim, i) => {
      const p = particles[i];
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: p.duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    });
  }, [visible, fade, scale, shine, ringPulse, particleAnims, particles, hapticsEnabled]);

  if (!visible) return null;

  const shineTranslate = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const ringScale = ringPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.8] });
  const ringOpacity = ringPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} pointerEvents="auto">
        <LinearGradient
          colors={["rgba(26,26,26,0.55)", "rgba(139,115,85,0.45)", "rgba(26,26,26,0.6)"]}
          style={StyleSheet.absoluteFill}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} testID="celebrate-backdrop" />

        <View style={styles.particleLayer} pointerEvents="none">
          {particles.map((p, i) => {
            const anim = particleAnims[i];
            const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [40, -520] });
            const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] });
            const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] });
            const rot = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.rotate * 2}deg`] });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.particle,
                  {
                    left: `${p.left}%`,
                    width: p.size,
                    height: p.size,
                    opacity,
                    transform: [{ translateY }, { translateX }, { rotate: rot }],
                  },
                ]}
              >
                <LinearGradient
                  colors={["#d4af37", "#e8d5b7", "#c9a87c"]}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.center} pointerEvents="box-none">
          <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
            <View style={styles.ringsWrap} pointerEvents="none">
              <Animated.View
                style={[
                  styles.ring,
                  { opacity: ringOpacity, transform: [{ scale: ringScale }] },
                ]}
              />
            </View>

            <View style={styles.trophyWrap}>
              <LinearGradient
                colors={["#d4af37", "#c9a87c", "#8b7355"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Trophy color="#faf9f6" size={36} strokeWidth={2.2} />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shine,
                  { transform: [{ translateX: shineTranslate }, { rotate: "20deg" }] },
                ]}
              />
            </View>

            <Text style={styles.eyebrow}>ALL TASKS COMPLETE</Text>
            <Text style={styles.title}>Well driven.</Text>
            <Text style={styles.sub}>
              You finished every task today. That&apos;s how momentum compounds.
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Sparkles size={13} color={Colors.accentDeep} />
                <Text style={styles.statText}>+{points} pts today</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statText}>🔥 {streak} day streak</Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.98 }] }]}
              testID="celebrate-close"
            >
              <LinearGradient
                colors={["#1a1a1a", "#2a2a2a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.ctaText}>Keep the streak alive</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  particleLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  particle: {
    position: "absolute",
    bottom: 0,
    borderRadius: 4,
    overflow: "hidden",
    shadowColor: "#d4af37",
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    ...Platform.select({ android: { elevation: 4 } }),
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 28,
    backgroundColor: Colors.cardBg,
    paddingTop: 56,
    paddingBottom: 22,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 24,
    overflow: "visible",
  },
  ringsWrap: {
    position: "absolute",
    top: -20,
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    width: 140,
    height: 140,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.55)",
  },
  trophyWrap: {
    position: "absolute",
    top: -36,
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#d4af37",
    shadowOpacity: 0.7,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  shine: {
    position: "absolute",
    top: -10,
    bottom: -10,
    width: 24,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  sub: {
    color: Colors.textDim,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  statText: { color: Colors.accentDeep, fontWeight: "800", fontSize: 12 },
  cta: {
    marginTop: 18,
    alignSelf: "stretch",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ctaText: { color: "#faf9f6", fontWeight: "800", fontSize: 15, letterSpacing: 0.2 },
});
