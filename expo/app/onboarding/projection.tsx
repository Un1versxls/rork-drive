import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, Compass, Flag, Sparkles, Target, TrendingUp, X } from "lucide-react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import type { PrimaryGoal, TimeCommitment } from "@/types";

interface Milestone {
  day: number;
  label: string;
  /** 0-1 progress along the curve at this milestone day */
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
        { day: Math.round(7 * m), label: "First public win", progress: 0.14 },
        { day: Math.round(34 * m), label: "Skill clicks", progress: 0.34 },
        { day: Math.round(120 * m), label: "Portfolio piece", progress: 0.56 },
        { day: Math.round(210 * m), label: "First paid use", progress: 0.76 },
        { day: Math.round(300 * m), label: "Teaching others", progress: 0.93 },
      ],
      finalLabel: "Mastery loop",
    };
  }

  if (isTrading) {
    return {
      milestones: [
        { day: Math.round(9 * m), label: "Paper trading", progress: 0.14 },
        { day: Math.round(35 * m), label: "First green week", progress: 0.34 },
        { day: Math.round(110 * m), label: "Live strategy", progress: 0.55 },
        { day: Math.round(200 * m), label: "Consistent month", progress: 0.76 },
        { day: Math.round(300 * m), label: "Scaling capital", progress: 0.93 },
      ],
      finalLabel: "Compounding",
    };
  }

  return {
    milestones: [
      { day: Math.round(7 * m), label: "Foundation set", progress: 0.12 },
      { day: Math.round(26 * m), label: "First client", progress: 0.32 },
      { day: Math.round(90 * m), label: "First $500 month", progress: 0.54 },
      { day: Math.round(189 * m), label: "First repeat customer", progress: 0.74 },
      { day: Math.round(300 * m), label: "$2k month", progress: 0.93 },
    ],
    finalLabel: "Profitable",
  };
}

function nextRouteForGoal(goal: PrimaryGoal | null): string {
  if (goal === "earn_income") return "/onboarding/industry";
  return "/onboarding/obstacle";
}

function dateAfterDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleString(undefined, { month: "short", day: "numeric" });
}

export default function ProjectionScreen() {
  const router = useRouter();
  const { state } = useApp();
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

  const finalDay = milestones[milestones.length - 1]?.day ?? 180;
  const finalDate = dateAfterDays(finalDay + 30);

  return (
    <OnboardingShell
      step={6}
      total={11}
      title={"Your roadmap to month one"}
      subtitle="No more mindless tasks — every day moves the needle."
      canGoBack
      footer={
        <GradientButton
          title="This is the plan"
          onPress={() => router.push(nextRouteForGoal(goal))}
          testID="projection-continue"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <GoalCard label={goalLabel} time={time} />

        <ProjectionChart
          milestones={milestones}
          finalLabel={finalLabel}
          finalDate={finalDate}
        />

        <ComparisonCard />
      </ScrollView>
    </OnboardingShell>
  );
}

function GoalCard({ label, time }: { label: string; time: TimeCommitment | null }) {
  const timeLabel = time === "2h" ? "2 hr / day" : time === "1h" ? "1 hr / day" : time === "30m" ? "30 min / day" : time === "15m" ? "15 min / day" : "your pace";
  return (
    <FadeIn delay={80}>
      <View style={styles.goalCard}>
        <View style={styles.goalIconWrap}>
          <Target size={18} color={Colors.accentDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.goalEyebrow}>YOUR NORTH STAR</Text>
          <Text style={styles.goalLabel}>{label}</Text>
          <View style={styles.goalMetaRow}>
            <View style={styles.metaPill}>
              <Compass size={11} color={Colors.accentDeep} />
              <Text style={styles.metaPillText}>{timeLabel}</Text>
            </View>
            <View style={styles.metaPill}>
              <Sparkles size={11} color={Colors.accentDeep} />
              <Text style={styles.metaPillText}>Tracked daily</Text>
            </View>
          </View>
        </View>
      </View>
    </FadeIn>
  );
}

function ProjectionChart({ milestones, finalLabel, finalDate }: { milestones: Milestone[]; finalLabel: string; finalDate: string }) {
  const draw = useRef(new Animated.Value(0)).current;
  const dotAnims = useMemo(() => milestones.map(() => new Animated.Value(0)), [milestones]);

  useEffect(() => {
    draw.setValue(0);
    Animated.timing(draw, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const seq = dotAnims.map((v, i) =>
      Animated.sequence([
        Animated.delay(420 + i * 230),
        Animated.spring(v, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }),
      ]),
    );
    Animated.parallel(seq).start();
  }, [draw, dotAnims]);

  const W = 320;
  const H = 150;
  const padX = 14;
  const padTop = 14;
  const padBottom = 22;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  // Smooth S-curve from bottom-left rising up
  const path = `M ${padX},${padTop + innerH * 0.86}
    C ${padX + innerW * 0.22},${padTop + innerH * 0.82}
      ${padX + innerW * 0.35},${padTop + innerH * 0.7}
      ${padX + innerW * 0.5},${padTop + innerH * 0.48}
    S ${padX + innerW * 0.82},${padTop + innerH * 0.1}
      ${padX + innerW},${padTop + innerH * 0.04}`;

  const pathLen = 520; // rough visual length for dash animation
  const dashOffset = draw.interpolate({ inputRange: [0, 1], outputRange: [pathLen, 0] });

  // Compute milestone positions on the curve. Use the progress field to
  // pick an x ratio (0..1) and read y from a smooth easing function that
  // mirrors the bezier.
  function yForX(x: number): number {
    // approximated cubic ease — matches the curve shape above closely.
    const t = x;
    const eased = 1 - Math.pow(1 - t, 2.2);
    return padTop + innerH * (0.86 - eased * 0.82);
  }

  return (
    <FadeIn delay={220}>
      <View style={styles.chartCard}>
        <View style={styles.chartHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.chartEyebrow}>ESTIMATED PROGRESS</Text>
            <Text style={styles.chartTitle}>At your pace, here&apos;s where you land</Text>
          </View>
          <View style={styles.trendBadge}>
            <TrendingUp size={12} color={Colors.accentDeep} />
            <Text style={styles.trendBadgeText}>+momentum</Text>
          </View>
        </View>

        <View style={styles.svgWrap}>
          <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <Defs>
              <SvgLinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#cfcfcf" />
                <Stop offset="0.4" stopColor={Colors.accent} />
                <Stop offset="1" stopColor={Colors.accentGold} />
              </SvgLinearGradient>
              <SvgLinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="rgba(212,175,55,0.22)" />
                <Stop offset="1" stopColor="rgba(212,175,55,0)" />
              </SvgLinearGradient>
            </Defs>

            {/* dashed baseline */}
            <Path
              d={`M ${padX},${padTop + innerH * 0.86} L ${padX + innerW},${padTop + innerH * 0.86}`}
              stroke="#eeeeee"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
            <Path
              d={`M ${padX},${padTop + innerH * 0.4} L ${padX + innerW},${padTop + innerH * 0.4}`}
              stroke="#f3f3f3"
              strokeWidth={1}
              strokeDasharray="3 4"
            />

            {/* filled area under curve */}
            <AnimatedPath
              d={`${path} L ${padX + innerW},${padTop + innerH * 0.86} L ${padX},${padTop + innerH * 0.86} Z`}
              fill="url(#fillGrad)"
              opacity={draw}
            />

            {/* animated line */}
            <AnimatedPath
              d={path}
              stroke="url(#lineGrad)"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={pathLen}
              strokeDashoffset={dashOffset}
            />
          </Svg>

          {/* Milestone dots + callouts overlaid in absolute coords */}
          {milestones.map((m, i) => {
            const cx = padX + innerW * m.progress;
            const cy = yForX(m.progress);
            const scale = dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
            const opacity = dotAnims[i];
            const above = i % 2 === 0;
            return (
              <React.Fragment key={i}>
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      left: cx - 7,
                      top: cy - 7,
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
                      left: cx - 56,
                      top: above ? cy - 48 : cy + 12,
                      opacity,
                      transform: [{ scale }],
                    },
                  ]}
                >
                  <View style={styles.callout}>
                    <Text style={styles.calloutDay}>Day {m.day}</Text>
                    <Text style={styles.calloutLabel} numberOfLines={1}>{m.label}</Text>
                  </View>
                </Animated.View>
              </React.Fragment>
            );
          })}
        </View>

        <View style={styles.axisRow}>
          <Text style={styles.axisLabel}>Today</Text>
          <View style={styles.finalChip}>
            <Flag size={11} color={Colors.text} />
            <Text style={styles.finalChipText}>{finalLabel} · {finalDate}</Text>
          </View>
        </View>
      </View>
    </FadeIn>
  );
}

function ComparisonCard() {
  return (
    <FadeIn delay={420}>
      <View style={styles.compareCard}>
        <Text style={styles.compareEyebrow}>WHY DRIVE</Text>

        <View style={styles.compareBlock}>
          <Text style={styles.compareHead}>Without DRIVE</Text>
          <Row Icon={X} color="#d4574a" text="Random YouTube rabbit holes" />
          <Row Icon={X} color="#d4574a" text="Unclear how to actually start" />
          <Row Icon={X} color="#d4574a" text="Quit after the first hard week" />
        </View>

        <View style={[styles.compareBlock, styles.compareBlockGood]}>
          <Text style={[styles.compareHead, { color: Colors.text }]}>With DRIVE</Text>
          <Row Icon={Check} color="#16a34a" text="3 tailored tasks every day" />
          <Row Icon={Check} color="#16a34a" text="Clear roadmap to a real business" />
          <Row Icon={Check} color="#16a34a" text="AI coach unblocks you in seconds" />
        </View>
      </View>
    </FadeIn>
  );
}

function Row({ Icon, color, text }: { Icon: typeof Check; color: string; text: string }) {
  return (
    <View style={styles.compareRow}>
      <Icon size={16} color={color} strokeWidth={3} />
      <Text style={styles.compareText}>{text}</Text>
    </View>
  );
}

function FadeIn({ delay, children }: { delay: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 460, delay, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [opacity, translate, delay]);
  return <Animated.View style={{ opacity, transform: [{ translateY: translate }] }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24, gap: 14 },

  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#fdfbf6",
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  goalIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.accentDim,
    alignItems: "center", justifyContent: "center",
  },
  goalEyebrow: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  goalLabel: { color: Colors.text, fontSize: 17, fontWeight: "900", letterSpacing: -0.3, marginTop: 3 },
  goalMetaRow: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.borderStrong },
  metaPillText: { color: Colors.accentDeep, fontWeight: "800", fontSize: 10, letterSpacing: 0.4 },

  chartCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#eeeeee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  chartHead: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  chartEyebrow: { color: Colors.textDim, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  chartTitle: { color: Colors.text, fontSize: 16, fontWeight: "900", letterSpacing: -0.3, marginTop: 4 },
  trendBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.borderStrong },
  trendBadgeText: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },

  svgWrap: { width: "100%", aspectRatio: 320 / 150, position: "relative", marginTop: 4 },
  dot: {
    position: "absolute",
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.text,
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: Colors.accentGold,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  calloutWrap: { position: "absolute", width: 112, alignItems: "center" },
  callout: {
    paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: Colors.text,
    alignItems: "center",
  },
  calloutDay: { color: Colors.accentGold, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  calloutLabel: { color: "#ffffff", fontSize: 11, fontWeight: "800", marginTop: 1 },

  axisRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  axisLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  finalChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#fff8e1", borderWidth: 1, borderColor: "#fcd34d" },
  finalChipText: { color: Colors.text, fontSize: 11, fontWeight: "900", letterSpacing: 0.2 },

  compareCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  compareEyebrow: { color: Colors.textDim, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, marginBottom: 12 },
  compareBlock: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
    gap: 8,
  },
  compareBlockGood: {
    marginTop: 10,
    backgroundColor: "#f3fbf3",
    borderColor: "#cfead0",
  },
  compareHead: { color: Colors.textDim, fontSize: 13, fontWeight: "900", marginBottom: 4 },
  compareRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  compareText: { color: Colors.text, fontSize: 14, fontWeight: "600", flex: 1 },
});
