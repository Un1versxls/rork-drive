import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Colors } from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { StreakEffect } from "@/components/StreakEffect";
import { getStreakTier } from "@/constants/streak-tiers";

interface Props {
  label?: string;
  streak?: number;
  showStreak?: boolean;
}

export function SplashLoader({ label = "Preparing your momentum", streak = 0, showStreak = false }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.timing(barWidth, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
    ).start();
  }, [fade, barWidth]);

  const widthInterp = barWidth.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["10%", "95%", "10%"] });
  const tier = getStreakTier(streak);
  const showStreakHero = showStreak && streak > 0;

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      <Animated.View style={[styles.center, { opacity: fade }]}>
        {showStreakHero ? (
          <>
            <StreakEffect streak={streak} size={220} />
            <Text style={styles.tierLabel}>{tier.label.toUpperCase()}</Text>
            <Text style={styles.tierDesc}>{tier.description}</Text>
          </>
        ) : (
          <View style={styles.logoWrap}>
            <View style={styles.logo}>
              <LinearGradient
                colors={["#d4af37", "#c9a87c", "#8b7355"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoInner}
              >
                <Text style={styles.logoLetter}>D</Text>
              </LinearGradient>
            </View>
          </View>
        )}

        {!showStreakHero ? (
          <>
            <Text style={styles.title}>DRIVE</Text>
            <Text style={styles.eyebrow}>MOMENTUM, DAILY</Text>
          </>
        ) : null}

        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: widthInterp }]}>
            <LinearGradient
              colors={["#c9a87c", "#e8d5b7", "#c9a87c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  logoWrap: { width: 140, height: 140, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  logo: { width: 92, height: 92, borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", shadowColor: "#8b7355", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  logoInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoLetter: { fontSize: 48, fontWeight: "900", color: "#faf9f6", letterSpacing: -2 },
  title: { color: Colors.text, fontSize: 36, fontWeight: "900", letterSpacing: 4, marginTop: 4 },
  eyebrow: { color: Colors.accent, letterSpacing: 3, fontWeight: "800", fontSize: 11, marginTop: 4 },
  tierLabel: { color: Colors.accentDeep, letterSpacing: 6, fontWeight: "900", fontSize: 14, marginTop: 20 },
  tierDesc: { color: Colors.textDim, fontSize: 13, marginTop: 6, fontWeight: "600" },
  barTrack: { width: 180, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.06)", overflow: "hidden", marginTop: 28 },
  barFill: { height: "100%", borderRadius: 2, overflow: "hidden" },
  label: { color: Colors.textDim, fontSize: 13, marginTop: 14, fontWeight: "600" },
});
