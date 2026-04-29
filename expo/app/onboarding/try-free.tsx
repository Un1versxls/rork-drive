import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Check, Sparkles } from "lucide-react-native";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";

const STEP = {
  IDLE: 0,
  TAP_TASK: 1,
  AI_PANEL: 2,
  COMPLETE: 3,
} as const;

export default function TryFreeScreen() {
  const router = useRouter();

  const phoneFall = useRef(new Animated.Value(0)).current;
  const stepValue = useRef(new Animated.Value(0)).current;
  const tapPulse = useRef(new Animated.Value(0)).current;
  const aiPanel = useRef(new Animated.Value(0)).current;
  const checkPop = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(120),
      Animated.spring(phoneFall, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(sparkleOpacity, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();

    let cancelled = false;

    const runLoop = async () => {
      while (!cancelled) {
        await new Promise<void>((resolve) => setTimeout(resolve, 1100));
        if (cancelled) return;
        // tap task
        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.TAP_TASK, duration: 250, useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(tapPulse, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(tapPulse, { toValue: 0, duration: 280, useNativeDriver: true }),
          ]),
        ]).start();

        await new Promise<void>((resolve) => setTimeout(resolve, 950));
        if (cancelled) return;
        // AI panel slides up
        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.AI_PANEL, duration: 250, useNativeDriver: false }),
          Animated.spring(aiPanel, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
        ]).start();

        await new Promise<void>((resolve) => setTimeout(resolve, 1700));
        if (cancelled) return;
        // complete task
        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.COMPLETE, duration: 250, useNativeDriver: false }),
          Animated.timing(aiPanel, { toValue: 0, duration: 350, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.spring(checkPop, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
        ]).start();

        await new Promise<void>((resolve) => setTimeout(resolve, 1200));
        if (cancelled) return;
        // reset
        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.IDLE, duration: 350, useNativeDriver: false }),
          Animated.timing(checkPop, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      }
    };
    runLoop();

    return () => {
      cancelled = true;
    };
  }, [phoneFall, stepValue, tapPulse, aiPanel, checkPop, sparkleOpacity]);

  const phoneTranslateY = phoneFall.interpolate({ inputRange: [0, 1], outputRange: [-420, 0] });
  const phoneRotate = phoneFall.interpolate({ inputRange: [0, 1], outputRange: ["-22deg", "-4deg"] });
  const phoneScale = phoneFall.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  const tapScale = tapPulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.2] });
  const tapOpacity = tapPulse.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.7, 0] });

  const aiTranslate = aiPanel.interpolate({ inputRange: [0, 1], outputRange: [180, 0] });
  const aiOpacity = aiPanel;

  const taskHighlight = stepValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ["#ffffff", "#fff8e1", "#fff8e1", "#f0fdf4"],
  });
  const taskBorderColor = stepValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ["#eeeeee", Colors.accentGold, Colors.accentGold, "#16a34a"],
  });

  const checkScale = checkPop.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.headerSection}>
          <View style={styles.eyebrowPill}>
            <Animated.View style={{ opacity: sparkleOpacity }}>
              <Sparkles size={12} color={Colors.accentGold} />
            </Animated.View>
            <Text style={styles.eyebrowText}>3 DAYS — ON US</Text>
          </View>
          <Text style={styles.title}>We want you to try{`\n`}DRIVE for free.</Text>
          <Text style={styles.subtitle}>
            Here&apos;s a peek at what you&apos;ll be using every day.
          </Text>
        </View>

        <View style={styles.stage}>
          <BackdropGlow />

          <Animated.View
            style={[
              styles.phone,
              {
                transform: [
                  { translateY: phoneTranslateY },
                  { rotate: phoneRotate },
                  { scale: phoneScale },
                ],
              },
            ]}
          >
            <View style={styles.phoneNotch} />
            <View style={styles.phoneScreen}>
              <View style={styles.phoneStatus}>
                <Text style={styles.phoneTime}>9:41</Text>
                <View style={styles.phoneDots}>
                  <View style={styles.dotSm} />
                  <View style={styles.dotSm} />
                  <View style={styles.dotSm} />
                </View>
              </View>

              <Text style={styles.phoneHeader}>Today</Text>
              <Text style={styles.phoneSub}>3 tasks · keep your streak</Text>

              <View style={styles.streakRow}>
                <View style={styles.streakChip}>
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <Text style={styles.streakText}>7 day streak</Text>
                </View>
                <View style={styles.pointsChip}>
                  <Text style={styles.pointsText}>+120 pts</Text>
                </View>
              </View>

              <Animated.View
                style={[
                  styles.taskCardActive,
                  { backgroundColor: taskHighlight, borderColor: taskBorderColor },
                ]}
              >
                <View style={styles.taskHead}>
                  <Animated.View
                    style={[
                      styles.taskRadio,
                      {
                        backgroundColor: stepValue.interpolate({
                          inputRange: [0, 2, 3],
                          outputRange: ["#ffffff", "#ffffff", "#16a34a"],
                        }),
                        borderColor: stepValue.interpolate({
                          inputRange: [0, 2, 3],
                          outputRange: ["#dddddd", Colors.accentGold, "#16a34a"],
                        }),
                      },
                    ]}
                  >
                    <Animated.View style={{ transform: [{ scale: checkScale }], opacity: checkScale }}>
                      <Check size={11} color="#ffffff" strokeWidth={4} />
                    </Animated.View>
                  </Animated.View>
                  <Text style={styles.taskTitle} numberOfLines={1}>Pitch 5 local shops</Text>
                </View>
                <Text style={styles.taskDesc} numberOfLines={2}>
                  Send personalized DMs offering a free audit.
                </Text>

                <View style={styles.tapWrap} pointerEvents="none">
                  <Animated.View
                    style={[
                      styles.tapRing,
                      { transform: [{ scale: tapScale }], opacity: tapOpacity },
                    ]}
                  />
                </View>
              </Animated.View>

              <View style={styles.taskCardDim}>
                <View style={styles.taskHead}>
                  <View style={styles.taskRadioDim} />
                  <Text style={styles.taskTitleDim}>Build a 1-page site</Text>
                </View>
              </View>
              <View style={styles.taskCardDim}>
                <View style={styles.taskHead}>
                  <View style={styles.taskRadioDim} />
                  <Text style={styles.taskTitleDim}>Write 3 offer bullets</Text>
                </View>
              </View>

              <Animated.View
                style={[
                  styles.aiPanel,
                  { transform: [{ translateY: aiTranslate }], opacity: aiOpacity },
                ]}
                pointerEvents="none"
              >
                <View style={styles.aiHandle} />
                <View style={styles.aiHeadRow}>
                  <View style={styles.aiAvatar}>
                    <Sparkles size={10} color="#ffffff" />
                  </View>
                  <Text style={styles.aiTitle}>Ask DRIVE AI</Text>
                </View>
                <Text style={styles.aiAnswer}>
                  &ldquo;Pick 5 shops near you with weak Instagram. DM the owner — short, specific, with one tweak idea. I&apos;ll draft it…&rdquo;
                </Text>
                <View style={styles.aiTyping}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.noPay}>No payment due now</Text>
          <GradientButton
            title="Continue for free"
            variant="gold"
            onPress={() => router.push("/onboarding/paywall")}
            testID="cta-try-free"
          />
          <Text style={styles.legal}>Cancel anytime — we&apos;ll remind you 24h before your trial ends.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function BackdropGlow() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] });
  return (
    <Animated.View style={[styles.glow, { transform: [{ scale }], opacity }]} pointerEvents="none" />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  safe: { flex: 1, paddingHorizontal: 22 },
  headerSection: { paddingTop: 18, alignItems: "center" },
  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)",
  },
  eyebrowText: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: Colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.6, textAlign: "center", marginTop: 12, lineHeight: 36 },
  subtitle: { color: Colors.textDim, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20, maxWidth: 320 },

  stage: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  glow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.16)",
  },

  phone: {
    width: 240,
    height: 380,
    borderRadius: 38,
    backgroundColor: "#0a0a0a",
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 20,
  },
  phoneNotch: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    width: 70,
    height: 18,
    borderRadius: 12,
    backgroundColor: "#000000",
    zIndex: 5,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: "#ffffff",
    padding: 14,
    paddingTop: 36,
    overflow: "hidden",
  },
  phoneStatus: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  phoneTime: { color: Colors.text, fontSize: 11, fontWeight: "900" },
  phoneDots: { flexDirection: "row", gap: 3 },
  dotSm: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.text },

  phoneHeader: { color: Colors.text, fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  phoneSub: { color: Colors.textDim, fontSize: 10, fontWeight: "600", marginTop: 2 },

  streakRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  streakChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa",
  },
  streakEmoji: { fontSize: 10 },
  streakText: { color: "#9a3412", fontSize: 9, fontWeight: "900" },
  pointsChip: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: Colors.text,
  },
  pointsText: { color: "#ffffff", fontSize: 9, fontWeight: "900" },

  taskCardActive: {
    marginTop: 12,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  taskHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  taskRadio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  taskRadioDim: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: "#dddddd" },
  taskTitle: { color: Colors.text, fontSize: 12, fontWeight: "800", flex: 1 },
  taskTitleDim: { color: Colors.textDim, fontSize: 12, fontWeight: "700", flex: 1 },
  taskDesc: { color: Colors.textDim, fontSize: 10, marginTop: 6, lineHeight: 14, marginLeft: 26 },
  tapWrap: {
    position: "absolute",
    right: 14,
    top: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  tapRing: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.accentGold,
    backgroundColor: "rgba(212,175,55,0.25)",
  },

  taskCardDim: {
    marginTop: 8,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eeeeee",
    backgroundColor: "#fafafa",
  },

  aiPanel: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: "#0a0a0a",
    padding: 12,
    paddingTop: 16,
    borderRadius: 18,
  },
  aiHandle: {
    position: "absolute",
    top: 6,
    alignSelf: "center",
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  aiHeadRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  aiAvatar: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.accentGold,
    alignItems: "center", justifyContent: "center",
  },
  aiTitle: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  aiAnswer: { color: "#e0e0e0", fontSize: 10, lineHeight: 14, fontWeight: "500" },
  aiTyping: { flexDirection: "row", gap: 4, marginTop: 8 },
  typingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.accentGold, opacity: 0.5 },
  typingDot2: { opacity: 0.7 },
  typingDot3: { opacity: 1 },

  footer: { paddingBottom: 8, paddingTop: 6, gap: 8, alignItems: "stretch" },
  noPay: { color: Colors.text, fontSize: 13, fontWeight: "900", textAlign: "center", letterSpacing: 0.3 },
  legal: { color: Colors.textMuted, fontSize: 11, textAlign: "center", lineHeight: 15 },
});
