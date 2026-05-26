import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Flag, Sparkles } from "lucide-react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";

import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import type { PrimaryGoal, TimeCommitment } from "@/types";

interface Milestone {
  day: number;
  label: string;
  /** 0-1 position along the curve */
  progress: number;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

function paceMultiplier(time: TimeCommitment | null): number {
  switch (time) {
    case "2h": return 0.78;
    case "1h": return 0.9;
    case "30m": return 1.0;
    case "15m": return 1.2;
    default: return 1.0;
  }
}

function buildMilestones(goal: PrimaryGoal | null, time: TimeCommitment | null): { milestones: Milestone[]; finalLabel: string } {
  const m = paceMultiplier(time);
  const isSkill = goal === "build_skills";
  const isTrading = goal === "day_trading";

  if (isSkill) {
    return {
      milestones: [
        { day: Math.round(7 * m), label: "First public win", progress: 0.10 },
        { day: Math.round(34 * m), label: "Skill clicks", progress: 0.34 },
        { day: Math.round(120 * m), label: "Portfolio piece", progress: 0.58 },
        { day: Math.round(210 * m), label: "First paid use", progress: 0.80 },
      ],
      finalLabel: "Teaching others",
    };
  }
  if (isTrading) {
    return {
      milestones: [
        { day: Math.round(9 * m), label: "Paper trading", progress: 0.10 },
        { day: Math.round(35 * m), label: "First green week", progress: 0.34 },
        { day: Math.round(110 * m), label: "Live strategy", progress: 0.58 },
        { day: Math.round(200 * m), label: "Consistent month", progress: 0.80 },
      ],
      finalLabel: "Scaling capital",
    };
  }
  return {
    milestones: [
      { day: Math.round(7 * m), label: "Foundation set", progress: 0.10 },
      { day: Math.round(26 * m), label: "First client", progress: 0.34 },
      { day: Math.round(90 * m), label: "First $500 month", progress: 0.58 },
      { day: Math.round(189 * m), label: "Repeat customer", progress: 0.80 },
    ],
    finalLabel: "$2k month",
  };
}

export default function ProjectionScreen() {
  const router = useRouter();
  const { state } = useApp();
  const params = useLocalSearchParams<{ initialPlan?: string; initialCycle?: string; requirePro?: string }>();
  const goal = state.profile.goal;
  const time = state.profile.time;

  const { milestones, finalLabel } = useMemo(() => buildMilestones(goal, time), [goal, time]);

  const goalLabel = useMemo(() => {
    switch (goal) {
      case "earn_income": return "Start earning side income";
      case "build_skills": return "Build a sharp new skill";
      case "grow_business": return "Grow what you already started";
      case "stay_productive": return "Stay focused & shipping";
      case "day_trading": return "Build a trading edge";
      case "ai_business": return "Launch an AI business";
      case "in_person_hustle": return "Build a real-world hustle";
      default: return "Hit your next milestone";
    }
  }, [goal]);

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, rise]);

  const onContinue = () => {
    router.replace({
      pathname: "/onboarding/paywall",
      params: {
        initialPlan: params.initialPlan ?? "base",
        initialCycle: params.initialCycle ?? "monthly",
        ...(params.requirePro === "1" ? { requirePro: "1" } : {}),
      },
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
          <View style={styles.eyebrowRow}>
            <Sparkles size={13} color={Colors.accentDeep} />
            <Text style={styles.eyebrow}>YOUR ROADMAP</Text>
          </View>
          <Text style={styles.title}>Where you{"\n"}could land.</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {goalLabel} · tracked every day, no guessing.
          </Text>
        </Animated.View>

        <ProjectionChart milestones={milestones} finalLabel={finalLabel} />

        <View style={styles.taglineBlock}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>Success takes time.</Text>
          <Text style={styles.taglineSub}>Show up daily — the rest compounds.</Text>
          <View style={styles.taglineLine} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.94 }]}
          testID="projection-continue"
        >
          <Text style={styles.ctaText}>I'm in. Show me the plan.</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProjectionChart({ milestones, finalLabel }: { milestones: Milestone[]; finalLabel: string }) {
  const draw = useRef(new Animated.Value(0)).current;
  const dotAnims = useMemo(() => milestones.map(() => new Animated.Value(0)), [milestones]);
  const finalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    draw.setValue(0);
    Animated.timing(draw, {
      toValue: 1,
      duration: 1600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const seq = dotAnims.map((v, i) =>
      Animated.sequence([
        Animated.delay(500 + i * 260),
        Animated.spring(v, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }),
      ]),
    );
    Animated.parallel(seq).start();
    Animated.sequence([
      Animated.delay(500 + dotAnims.length * 260 + 80),
      Animated.spring(finalAnim, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }),
    ]).start();
  }, [draw, dotAnims, finalAnim]);

  const W = 320;
  const H = 220;
  const padX = 22;
  const padTop = 28;
  const padBottom = 30;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  // Gentle S-curve
  const path = `M ${padX},${padTop + innerH * 0.88}
    C ${padX + innerW * 0.22},${padTop + innerH * 0.82}
      ${padX + innerW * 0.35},${padTop + innerH * 0.7}
      ${padX + innerW * 0.5},${padTop + innerH * 0.48}
    S ${padX + innerW * 0.82},${padTop + innerH * 0.1}
      ${padX + innerW},${padTop + innerH * 0.04}`;

  const pathLen = 620;
  const dashOffset = draw.interpolate({ inputRange: [0, 1], outputRange: [pathLen, 0] });

  function yForX(x: number): number {
    const eased = 1 - Math.pow(1 - x, 2.2);
    return padTop + innerH * (0.88 - eased * 0.84);
  }

  return (
    <View style={styles.chartCard}>
      <View style={styles.svgWrap}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <Defs>
            <SvgLinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#e8d9a3" />
              <Stop offset="0.5" stopColor={Colors.accentGold} />
              <Stop offset="1" stopColor="#b8860b" />
            </SvgLinearGradient>
            <SvgLinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="rgba(212,175,55,0.22)" />
              <Stop offset="1" stopColor="rgba(212,175,55,0)" />
            </SvgLinearGradient>
          </Defs>

          {/* dashed baselines */}
          <Path
            d={`M ${padX},${padTop + innerH * 0.88} L ${padX + innerW},${padTop + innerH * 0.88}`}
            stroke="#f1e9d2"
            strokeWidth={1}
            strokeDasharray="4 5"
          />
          <Path
            d={`M ${padX},${padTop + innerH * 0.46} L ${padX + innerW},${padTop + innerH * 0.46}`}
            stroke="#f6efde"
            strokeWidth={1}
            strokeDasharray="4 5"
          />

          {/* filled area */}
          <AnimatedPath
            d={`${path} L ${padX + innerW},${padTop + innerH * 0.88} L ${padX},${padTop + innerH * 0.88} Z`}
            fill="url(#fillGrad)"
            opacity={draw}
          />

          {/* animated golden line */}
          <AnimatedPath
            d={path}
            stroke="url(#lineGrad)"
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={pathLen}
            strokeDashoffset={dashOffset}
          />
        </Svg>

        {/* Milestone dots + callouts */}
        {milestones.map((m, i) => {
          const cx = (padX + innerW * m.progress) / W;
          const cy = yForX(m.progress) / H;
          const scale = dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
          const opacity = dotAnims[i];
          const above = i % 2 === 0;
          return (
            <React.Fragment key={i}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    left: `${cx * 100}%`,
                    top: `${cy * 100}%`,
                    marginLeft: -8,
                    marginTop: -8,
                    opacity,
                    transform: [{ scale }],
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.calloutWrap,
                  {
                    left: `${cx * 100}%`,
                    top: `${cy * 100}%`,
                    marginLeft: -64,
                    marginTop: above ? -54 : 14,
                    opacity,
                    transform: [{ scale }],
                  },
                ]}
              >
                <View style={styles.callout}>
                  <Text style={styles.calloutDay}>DAY {m.day}</Text>
                  <Text style={styles.calloutLabel} numberOfLines={1}>{m.label}</Text>
                </View>
              </Animated.View>
            </React.Fragment>
          );
        })}

        {/* Final flag */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.finalFlag,
            { opacity: finalAnim, transform: [{ scale: finalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] },
          ]}
        >
          <Flag size={14} color={Colors.accentDeep} />
          <Text style={styles.finalFlagText}>{finalLabel}</Text>
        </Animated.View>
      </View>

      <View style={styles.axisRow}>
        <View style={styles.axisDotToday} />
        <Text style={styles.axisLabel}>Today</Text>
        <View style={styles.axisSpacer} />
        <Text style={[styles.axisLabel, { color: Colors.accentDeep }]}>~12 months</Text>
        <View style={styles.axisDotEnd} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  scroll: { paddingTop: 70, paddingHorizontal: 24, paddingBottom: 30, gap: 26 },

  eyebrowRow: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#fffaeb",
    borderWidth: 1,
    borderColor: "#f1e2a4",
  },
  eyebrow: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.6 },
  title: { color: Colors.text, fontSize: 36, fontWeight: "900", letterSpacing: -1.0, marginTop: 14, lineHeight: 40 },
  subtitle: { color: Colors.textDim, fontSize: 15, lineHeight: 21, marginTop: 10 },

  chartCard: {
    paddingTop: 8,
    paddingBottom: 12,
    borderRadius: 26,
    backgroundColor: "#fffdf6",
    borderWidth: 1,
    borderColor: "#f1e2a4",
    shadowColor: "#d4af37",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    overflow: "hidden",
  },
  svgWrap: { width: "100%", aspectRatio: 320 / 220, position: "relative" },
  dot: {
    position: "absolute",
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.accentGold,
    borderWidth: 3.5,
    borderColor: "#ffffff",
    shadowColor: Colors.accentGold,
    shadowOpacity: 0.85,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  calloutWrap: { position: "absolute", width: 128, alignItems: "center" },
  callout: {
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1e2a4",
    alignItems: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  calloutDay: { color: Colors.accentDeep, fontSize: 9, fontWeight: "900", letterSpacing: 1.0 },
  calloutLabel: { color: Colors.text, fontSize: 11.5, fontWeight: "800", marginTop: 1 },

  finalFlag: {
    position: "absolute",
    right: 12,
    top: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fffaeb",
    borderWidth: 1,
    borderColor: "#f1e2a4",
  },
  finalFlagText: { color: Colors.accentDeep, fontSize: 11.5, fontWeight: "900", letterSpacing: 0.2 },

  axisRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingTop: 2 },
  axisDotToday: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.textDim },
  axisDotEnd: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accentGold },
  axisSpacer: { flex: 1, height: 1, backgroundColor: "#f1e2a4" },
  axisLabel: { color: Colors.textDim, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  taglineBlock: { alignItems: "center", gap: 8, marginTop: 4 },
  taglineLine: { width: 38, height: 2, borderRadius: 1, backgroundColor: Colors.accentGold, opacity: 0.7 },
  tagline: { color: Colors.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },
  taglineSub: { color: Colors.textDim, fontSize: 13, fontWeight: "600", textAlign: "center", maxWidth: 280 },

  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 28, backgroundColor: "#ffffff" },
  cta: {
    backgroundColor: Colors.text,
    paddingVertical: 17,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaText: { color: "#ffffff", fontSize: 16, fontWeight: "900", letterSpacing: -0.2 },
});
