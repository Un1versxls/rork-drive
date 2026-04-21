import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";

export default function Welcome() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [fade, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <Animated.View style={[styles.content, { opacity: fade }]}>
          <View style={styles.logoWrap}>
            <Animated.View style={[styles.logoGlow, { opacity: glow, transform: [{ scale }] }]}>
              <LinearGradient
                colors={["rgba(212,175,55,0.55)", "rgba(201,168,124,0)"]}
                style={styles.logoGlowFill}
              />
            </Animated.View>
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

          <Text style={styles.eyebrow}>WELCOME TO</Text>
          <Text style={styles.title}>DRIVE</Text>
          <Text style={styles.subtitle}>
            A tailored business, personalized daily tasks, and a system that keeps you moving.
          </Text>

          <View style={styles.features}>
            <Feature text="Matched to your goals & budget" />
            <Feature text="AI-crafted business roadmap" />
            <Feature text="Daily tasks that compound" />
          </View>
        </Animated.View>

        <View style={styles.cta}>
          <GradientButton title="Get Started" onPress={() => router.push("/onboarding/goal")} testID="cta-start" />
          <Text style={styles.smallLegal}>Takes under two minutes</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.dot} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  logoWrap: { width: 120, height: 120, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoGlow: { position: "absolute", width: 220, height: 220, borderRadius: 999 },
  logoGlowFill: { flex: 1, borderRadius: 999 },
  logo: { width: 96, height: 96, borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", shadowColor: "#8b7355", shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  logoInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoLetter: { fontSize: 52, fontWeight: "900", color: "#faf9f6", letterSpacing: -2 },
  eyebrow: { color: Colors.accent, letterSpacing: 4, fontWeight: "800", fontSize: 12 },
  title: { color: Colors.text, fontSize: 56, fontWeight: "900", letterSpacing: -1 },
  subtitle: { color: Colors.textDim, fontSize: 16, textAlign: "center", lineHeight: 22, maxWidth: 320, marginTop: 4 },
  features: { marginTop: 28, gap: 10, alignSelf: "stretch", paddingHorizontal: 24 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  featureText: { color: Colors.text, fontSize: 15, fontWeight: "600" },
  cta: { gap: 10, paddingBottom: 8 },
  smallLegal: { color: Colors.textMuted, textAlign: "center", fontSize: 12 },
});
