import React, { useEffect, useRef, useState, useCallback } from "react";
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Award, CheckCircle2, ChevronRight, Crown, Flame, MessageSquare, Sparkles } from "lucide-react-native";

import { Colors } from "@/constants/colors";
import { triggerHaptic } from "@/lib/haptics";
import { useApp } from "@/providers/AppProvider";

interface Feature {
  Icon: React.ComponentType<{ color: string; size: number }>;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
  mock: "tasks" | "chat" | "streak" | "badge";
}

const FEATURES: Feature[] = [
  {
    Icon: CheckCircle2,
    eyebrow: "DAILY TASKS",
    title: "Tap a task. Get it done.",
    body: "Bite-sized daily steps built around your business.",
    accent: "#16a34a",
    mock: "tasks",
  },
  {
    Icon: MessageSquare,
    eyebrow: "ASK AI",
    title: "Stuck? Just ask.",
    body: "An AI coach is one tap away on every task.",
    accent: "#3b82f6",
    mock: "chat",
  },
  {
    Icon: Flame,
    eyebrow: "STREAKS",
    title: "Stack days. Build momentum.",
    body: "Show up daily and watch your streak grow.",
    accent: "#f97316",
    mock: "streak",
  },
  {
    Icon: Award,
    eyebrow: "BADGES",
    title: "Earn badges. Style your name.",
    body: "Unlock collectibles and equip one on your dashboard.",
    accent: Colors.accentGold,
    mock: "badge",
  },
];

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const PHONE_W = Math.min(260, SCREEN_W * 0.66);
const PHONE_H = PHONE_W * 2.05;

type EnterSide = "left" | "right" | "top" | "bottom";

function offsetFor(side: EnterSide): { x: number; y: number; rot: string } {
  switch (side) {
    case "left": return { x: -SCREEN_W, y: 0, rot: "-12deg" };
    case "right": return { x: SCREEN_W, y: 0, rot: "12deg" };
    case "top": return { x: 0, y: -SCREEN_H, rot: "-6deg" };
    case "bottom": return { x: 0, y: SCREEN_H, rot: "6deg" };
  }
}

function pickSide(prev: EnterSide): EnterSide {
  const all: EnterSide[] = ["left", "right", "top", "bottom"];
  const filtered = all.filter((s) => s !== prev);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export default function FeaturePreviewScreen() {
  const router = useRouter();
  const { state } = useApp();
  const params = useLocalSearchParams<{ initialPlan?: string; initialCycle?: string; requirePro?: string }>();

  const [idx, setIdx] = useState<number>(0);
  const [enterSide, setEnterSide] = useState<EnterSide>("right");
  const [exitSide, setExitSide] = useState<EnterSide>("left");

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const headerPulse = useRef(new Animated.Value(0)).current;

  const sideRef = useRef<EnterSide>("right");

  const runCycle = useCallback((featureIdx: number, sideIn: EnterSide) => {
    const sideOut = pickSide(sideIn);
    const inOff = offsetFor(sideIn);
    const outOff = offsetFor(sideOut);

    translateX.setValue(inOff.x);
    translateY.setValue(inOff.y);
    rotate.setValue(-1);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(2200),
      Animated.parallel([
        Animated.timing(translateX, { toValue: outOff.x, duration: 600, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: outOff.y, duration: 600, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: 600, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start(({ finished }) => {
      if (!finished) return;
      const nextIdx = (featureIdx + 1) % FEATURES.length;
      sideRef.current = sideOut;
      setExitSide(sideOut);
      setEnterSide(sideOut);
      setIdx(nextIdx);
    });
  }, [translateX, translateY, rotate]);

  useEffect(() => {
    runCycle(idx, enterSide);
  }, [idx, enterSide, runCycle]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(headerPulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(headerPulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [headerPulse]);

  const onCta = () => {
    triggerHaptic("select", state.profile.hapticsEnabled);
    router.replace({
      pathname: "/onboarding/projection",
      params: {
        initialPlan: params.initialPlan ?? "base",
        initialCycle: params.initialCycle ?? "monthly",
        ...(params.requirePro === "1" ? { requirePro: "1" } : {}),
      },
    });
  };

  const feature = FEATURES[idx];
  const rotateStr = rotate.interpolate({ inputRange: [-1, 0, 1], outputRange: [offsetFor(enterSide).rot, "0deg", offsetFor(exitSide).rot] });
  const headerScale = headerPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.headerWrap}>
          <Animated.View style={[styles.giftPill, { transform: [{ scale: headerScale }] }]}>
            <Sparkles size={12} color={Colors.accentGold} />
            <Text style={styles.giftPillText}>LIMITED TIME</Text>
          </Animated.View>
          <Text style={styles.headline}>We want you to try it{"\n"}free for 3 days!</Text>
          <Text style={styles.subhead}>Here's what's waiting for you.</Text>
        </View>

        <View style={styles.stage} pointerEvents="none">
          <View style={styles.stageGlowOuter} />
          <View style={styles.stageGlowInner} />

          <Animated.View
            style={[
              styles.phone,
              {
                transform: [{ translateX }, { translateY }, { rotate: rotateStr }],
              },
            ]}
          >
            <View style={styles.phoneNotch} />
            <View style={styles.phoneScreen}>
              <PhoneMock feature={feature} />
            </View>
          </Animated.View>

          <View style={styles.captionWrap}>
            <View style={[styles.captionPill, { borderColor: feature.accent + "55", backgroundColor: feature.accent + "14" }]}>
              <feature.Icon color={feature.accent} size={13} />
              <Text style={[styles.captionEyebrow, { color: feature.accent }]}>{feature.eyebrow}</Text>
            </View>
            <Text style={styles.captionTitle}>{feature.title}</Text>
            <Text style={styles.captionBody}>{feature.body}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={onCta}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]}
            testID="feature-preview-cta"
          >
            <Text style={styles.ctaText}>Continue</Text>
            <ChevronRight color="#ffffff" size={18} strokeWidth={2.6} />
          </Pressable>
          <Text style={styles.legal}>3-day free trial · Cancel anytime</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function PhoneMock({ feature }: { feature: Feature }) {
  switch (feature.mock) {
    case "tasks":
      return <TasksMock accent={feature.accent} />;
    case "chat":
      return <ChatMock accent={feature.accent} />;
    case "streak":
      return <StreakMock accent={feature.accent} />;
    case "badge":
      return <BadgeMock accent={feature.accent} />;
  }
}

function TasksMock({ accent }: { accent: string }) {
  const tap = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(tap, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [tap]);
  const tapScale = tap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] });
  const checkOpacity = tap.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0, 0, 1] });

  return (
    <View style={mockStyles.container}>
      <Text style={mockStyles.dayLabel}>Today</Text>
      <Text style={mockStyles.dayCount}>3 tasks</Text>
      <Animated.View style={[mockStyles.taskRow, { transform: [{ scale: tapScale }], borderColor: accent + "66" }]}>
        <Animated.View style={[mockStyles.taskCheck, { backgroundColor: accent, opacity: checkOpacity }]}>
          <CheckCircle2 color="#fff" size={14} />
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={mockStyles.taskTitle}>Post first reel</Text>
          <Text style={mockStyles.taskMeta}>5 min</Text>
        </View>
      </Animated.View>
      <View style={[mockStyles.taskRow, { opacity: 0.55 }]}>
        <View style={[mockStyles.taskCheck, { borderWidth: 1.5, borderColor: "#ddd" }]} />
        <View style={{ flex: 1 }}>
          <Text style={mockStyles.taskTitle}>Research 3 niches</Text>
          <Text style={mockStyles.taskMeta}>10 min</Text>
        </View>
      </View>
      <View style={[mockStyles.taskRow, { opacity: 0.55 }]}>
        <View style={[mockStyles.taskCheck, { borderWidth: 1.5, borderColor: "#ddd" }]} />
        <View style={{ flex: 1 }}>
          <Text style={mockStyles.taskTitle}>Draft brand name</Text>
          <Text style={mockStyles.taskMeta}>8 min</Text>
        </View>
      </View>
    </View>
  );
}

function ChatMock({ accent }: { accent: string }) {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(250),
      Animated.timing(a1, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(450),
      Animated.timing(a2, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [a1, a2]);

  return (
    <View style={mockStyles.container}>
      <Text style={mockStyles.dayLabel}>AI Coach</Text>
      <Text style={mockStyles.dayCount}>Here to help</Text>
      <Animated.View style={[mockStyles.bubbleUser, { opacity: a1, transform: [{ translateY: a1.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
        <Text style={mockStyles.bubbleUserText}>How do I get my first customer?</Text>
      </Animated.View>
      <Animated.View style={[mockStyles.bubbleBot, { backgroundColor: accent + "1a", borderColor: accent + "44", opacity: a2, transform: [{ translateY: a2.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
        <Text style={mockStyles.bubbleBotText}>Start with 5 warm leads. DM them a 1-line offer today.</Text>
      </Animated.View>
    </View>
  );
}

function StreakMock({ accent }: { accent: string }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });

  return (
    <View style={[mockStyles.container, { alignItems: "center", justifyContent: "center" }]}>
      <Animated.View style={[mockStyles.flameGlow, { backgroundColor: accent, opacity: glow, transform: [{ scale }] }]} />
      <Animated.View style={[mockStyles.flameCircle, { backgroundColor: accent, transform: [{ scale }] }]}>
        <Flame color="#fff" size={42} />
      </Animated.View>
      <Text style={mockStyles.streakNum}>12</Text>
      <Text style={mockStyles.streakLabel}>day streak</Text>
    </View>
  );
}

function BadgeMock({ accent }: { accent: string }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, [shimmer]);
  const tx = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-80, 80] });

  return (
    <View style={[mockStyles.container, { alignItems: "center", justifyContent: "center" }]}>
      <View style={[mockStyles.badgeCrest, { borderColor: accent }]}>
        <Crown color={accent} size={44} />
        <Animated.View style={[mockStyles.shimmerBar, { transform: [{ translateX: tx }, { rotate: "20deg" }] }]} />
      </View>
      <View style={[mockStyles.nameTag, { borderColor: accent + "55" }]}>
        <Text style={[mockStyles.nameTagText, { color: accent }]}>Alex</Text>
      </View>
      <Text style={mockStyles.streakLabel}>10-day badge equipped</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1, justifyContent: "space-between", paddingHorizontal: 20 },

  headerWrap: { alignItems: "center", paddingTop: 10, gap: 10 },
  giftPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.4)",
  },
  giftPillText: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  headline: { color: Colors.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.6, textAlign: "center", lineHeight: 32 },
  subhead: { color: Colors.textDim, fontSize: 13, textAlign: "center" },

  stage: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
  stageGlowOuter: {
    position: "absolute", width: PHONE_W * 1.5, height: PHONE_W * 1.5, borderRadius: 999,
    backgroundColor: Colors.accentGold, opacity: 0.07,
  },
  stageGlowInner: {
    position: "absolute", width: PHONE_W * 1.0, height: PHONE_W * 1.0, borderRadius: 999,
    backgroundColor: Colors.accent, opacity: 0.10,
  },
  phone: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 36,
    backgroundColor: "#1a1a1a",
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 18,
  },
  phoneNotch: {
    position: "absolute", top: 12, alignSelf: "center",
    width: 70, height: 22, borderRadius: 999, backgroundColor: "#0a0a0a", zIndex: 2,
  },
  phoneScreen: {
    flex: 1, borderRadius: 28, backgroundColor: "#ffffff", overflow: "hidden", paddingTop: 38,
  },
  captionWrap: { position: "absolute", bottom: 8, left: 0, right: 0, alignItems: "center", paddingHorizontal: 16, gap: 6 },
  captionPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1,
  },
  captionEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  captionTitle: { color: Colors.text, fontSize: 18, fontWeight: "900", textAlign: "center", letterSpacing: -0.4 },
  captionBody: { color: Colors.textDim, fontSize: 12, textAlign: "center", lineHeight: 16 },

  footer: { gap: 8, paddingBottom: 6 },
  cta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.text,
    paddingHorizontal: 22, paddingVertical: 16, borderRadius: 999,
  },
  ctaText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  legal: { color: Colors.textMuted, fontSize: 11, textAlign: "center" },
});

const mockStyles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 14, paddingTop: 6, gap: 8 },
  dayLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  dayCount: { color: Colors.text, fontSize: 20, fontWeight: "900", marginBottom: 6 },
  taskRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12,
    backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eee",
  },
  taskCheck: { width: 22, height: 22, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  taskTitle: { color: Colors.text, fontSize: 12, fontWeight: "700" },
  taskMeta: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },

  bubbleUser: {
    alignSelf: "flex-end", maxWidth: "85%",
    backgroundColor: "#111", borderRadius: 14, borderTopRightRadius: 4,
    paddingHorizontal: 10, paddingVertical: 8, marginTop: 6,
  },
  bubbleUserText: { color: "#fff", fontSize: 11, lineHeight: 15 },
  bubbleBot: {
    alignSelf: "flex-start", maxWidth: "90%",
    borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 8, marginTop: 6,
  },
  bubbleBotText: { color: Colors.text, fontSize: 11, lineHeight: 15 },

  flameGlow: { position: "absolute", width: 130, height: 130, borderRadius: 999 },
  flameCircle: { width: 86, height: 86, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  streakNum: { color: Colors.text, fontSize: 38, fontWeight: "900", marginTop: 14, letterSpacing: -1 },
  streakLabel: { color: Colors.textDim, fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },

  badgeCrest: {
    width: 96, height: 96, borderRadius: 999, alignItems: "center", justifyContent: "center",
    borderWidth: 3, backgroundColor: "#fffdf5", overflow: "hidden",
  },
  shimmerBar: {
    position: "absolute", width: 30, height: 160, backgroundColor: "rgba(255,255,255,0.55)",
  },
  nameTag: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5, marginTop: 14,
    backgroundColor: "#fffdf5",
  },
  nameTagText: { fontSize: 16, fontWeight: "900", letterSpacing: 0.3 },
});
