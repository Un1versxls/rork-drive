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
  const phoneBounce = useRef(new Animated.Value(0)).current;
  const tableShadow = useRef(new Animated.Value(0)).current;
  const stepValue = useRef(new Animated.Value(0)).current;
  const tapPulse = useRef(new Animated.Value(0)).current;
  const aiPanel = useRef(new Animated.Value(0)).current;
  const checkPop = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const streakPop = useRef(new Animated.Value(0)).current;
  const streakCount = useRef(new Animated.Value(7)).current;
  const [streakDisplay, setStreakDisplay] = React.useState<number>(7);
  const pointsPop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(140),
      Animated.timing(phoneFall, {
        toValue: 1,
        duration: 520,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(phoneBounce, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(phoneBounce, { toValue: 0.35, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(phoneBounce, { toValue: 0.7, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(phoneBounce, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(tableShadow, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(sparkleOpacity, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();

    let cancelled = false;
    const streakListener = streakCount.addListener(({ value }) => {
      setStreakDisplay(Math.round(value));
    });

    const runLoop = async () => {
      while (!cancelled) {
        streakCount.setValue(7);
        setStreakDisplay(7);
        await new Promise<void>((resolve) => setTimeout(resolve, 900));
        if (cancelled) return;
        // tap task
        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.TAP_TASK, duration: 250, useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(tapPulse, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(tapPulse, { toValue: 0, duration: 280, useNativeDriver: true }),
          ]),
        ]).start();

        await new Promise<void>((resolve) => setTimeout(resolve, 850));
        if (cancelled) return;
        // AI panel slides up
        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.AI_PANEL, duration: 250, useNativeDriver: false }),
          Animated.spring(aiPanel, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
        ]).start();

        await new Promise<void>((resolve) => setTimeout(resolve, 1600));
        if (cancelled) return;
        // complete task
        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.COMPLETE, duration: 250, useNativeDriver: false }),
          Animated.timing(aiPanel, { toValue: 0, duration: 350, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.spring(checkPop, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
        ]).start();

        await new Promise<void>((resolve) => setTimeout(resolve, 280));
        if (cancelled) return;
        // streak goes up + points pop
        Animated.parallel([
          Animated.spring(streakPop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
          Animated.spring(pointsPop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
          Animated.timing(streakCount, { toValue: 8, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        ]).start();

        await new Promise<void>((resolve) => setTimeout(resolve, 1100));
        if (cancelled) return;
        // reset
        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.IDLE, duration: 350, useNativeDriver: false }),
          Animated.timing(checkPop, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(streakPop, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(pointsPop, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      }
    };
    runLoop();

    return () => {
      cancelled = true;
      streakCount.removeListener(streakListener);
    };
  }, [phoneFall, phoneBounce, tableShadow, stepValue, tapPulse, aiPanel, checkPop, sparkleOpacity, streakPop, streakCount, pointsPop]);

  const fallTranslateY = phoneFall.interpolate({ inputRange: [0, 1], outputRange: [-460, 0] });
  const bounceTranslateY = phoneBounce.interpolate({ inputRange: [0, 1], outputRange: [0, -24] });
  const phoneRotate = phoneFall.interpolate({ inputRange: [0, 1], outputRange: ["-26deg", "-3deg"] });
  const phoneScale = phoneFall.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.78, 0.92, 1] });
  const shadowScale = tableShadow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const shadowOpacity = tableShadow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });

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
  const streakScale = streakPop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.25, 1.1] });
  const streakGlow = streakPop.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const pointsScale = pointsPop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1.08] });
  const plusOneTranslate = streakPop.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const plusOneOpacity = streakPop.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });

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

          <View style={styles.tableWrap} pointerEvents="none">
            <View style={styles.tableSurface} />
            <Animated.View
              style={[
                styles.tableShadow,
                { opacity: shadowOpacity, transform: [{ scaleX: shadowScale }, { scaleY: shadowScale }] },
              ]}
            />
          </View>

          <Animated.View
            style={[
              styles.phone,
              {
                transform: [
                  { translateY: Animated.add(fallTranslateY, bounceTranslateY) },
                  { rotate: phoneRotate },
                  { scale: phoneScale },
                ],
              },
            ]}
          >
            <View style={styles.phoneFrameInner}>
            <View style={styles.dynamicIsland} />
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
                <Animated.View style={[styles.streakChip, { transform: [{ scale: streakScale }] }]}>
                  <Animated.View style={[styles.streakGlow, { opacity: streakGlow }]} pointerEvents="none" />
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <Text style={styles.streakText}>{streakDisplay} day streak</Text>
                  <Animated.Text
                    style={[
                      styles.plusOne,
                      { opacity: plusOneOpacity, transform: [{ translateY: plusOneTranslate }] },
                    ]}
                  >
                    +1
                  </Animated.Text>
                </Animated.View>
                <Animated.View style={[styles.pointsChip, { transform: [{ scale: pointsScale }] }]}>
                  <Text style={styles.pointsText}>+120 pts</Text>
                </Animated.View>
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
  tableWrap: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tableSurface: {
    width: "110%",
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  tableShadow: {
    position: "absolute",
    bottom: -10,
    width: 220,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#000000",
  },

  phone: {
    width: 248,
    height: 396,
    borderRadius: 46,
    padding: 3,
    backgroundColor: "#1a1a1a",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 22 },
    elevation: 24,
  },
  phoneFrameInner: {
    flex: 1,
    borderRadius: 43,
    padding: 5,
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  dynamicIsland: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    width: 92,
    height: 28,
    borderRadius: 18,
    backgroundColor: "#000000",
    zIndex: 5,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.04)",
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 38,
    backgroundColor: "#ffffff",
    padding: 14,
    paddingTop: 50,
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
    overflow: "visible",
  },
  streakGlow: {
    position: "absolute",
    top: -3, left: -3, right: -3, bottom: -3,
    borderRadius: 999,
    backgroundColor: "rgba(251,146,60,0.35)",
  },
  plusOne: {
    position: "absolute",
    right: 4,
    top: -2,
    color: "#ea580c",
    fontSize: 11,
    fontWeight: "900",
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
