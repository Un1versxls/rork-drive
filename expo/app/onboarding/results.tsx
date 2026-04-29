import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, Flame, Sparkles, Star, TrendingUp, Users, Zap } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import type { PrimaryGoal } from "@/types";

function nextRouteForGoal(goal: PrimaryGoal | null): string {
  if (goal === "earn_income") return "/onboarding/industry";
  return "/onboarding/obstacle";
}

export default function ResultsScreen() {
  const router = useRouter();
  const { state } = useApp();
  const goal = state.profile.goal;

  return (
    <OnboardingShell
      step={5}
      total={11}
      title={"You're in great company."}
      subtitle="Real stats from people who stuck with it."
      canGoBack
      footer={
        <GradientButton
          title="Keep going"
          onPress={() => router.push(nextRouteForGoal(goal))}
          testID="results-continue"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <RatingCard />

        <FadeIn delay={500}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewRow}
          >
            <TasksPreview />
            <StreakPreview />
            <AiPreview />
          </ScrollView>
        </FadeIn>

        <FadeIn delay={850}>
          <View style={styles.statsGrid}>
            <StatBlock Icon={TrendingUp} value="$1,120" label="Avg extra / month by day 60" />
            <StatBlock Icon={Zap} value="87%" label="Hit a 7-day streak in week 1" />
            <StatBlock Icon={Users} value="42,000+" label="People building with DRIVE" />
          </View>
        </FadeIn>

        <FadeIn delay={1200}>
          <Review
            name="Jordan, 19"
            avatarColor="#fde68a"
            initial="J"
            text="I was broke before this. In 3 weeks I hit my first $500 month selling my content. The daily task thing is unreal."
          />
        </FadeIn>
        <FadeIn delay={1500}>
          <Review
            name="Maya, 22"
            avatarColor="#fecaca"
            initial="M"
            text="Stopped scrolling TikTok for hours, actually did the work DRIVE told me to. Made $1.4k in a month."
          />
        </FadeIn>
        <FadeIn delay={1800}>
          <Review
            name="Alex, 24"
            avatarColor="#bbf7d0"
            initial="A"
            text="Premium is worth every penny. The high-ticket ideas changed how I think about money."
          />
        </FadeIn>
      </ScrollView>
    </OnboardingShell>
  );
}

function RatingCard() {
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardLift = useRef(new Animated.Value(14)).current;
  const starAnims = useMemo(
    () => [0, 1, 2, 3, 4].map(() => new Animated.Value(0)),
    [],
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(cardLift, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const seq = starAnims.map((v, i) =>
      Animated.sequence([
        Animated.delay(280 + i * 140),
        Animated.spring(v, {
          toValue: 1,
          friction: 4,
          tension: 110,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel(seq).start();
  }, [cardFade, cardLift, starAnims]);

  return (
    <Animated.View style={[styles.ratingCard, { opacity: cardFade, transform: [{ translateY: cardLift }] }]}>
      <View style={styles.starsRow}>
        {starAnims.map((v, i) => {
          const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
          const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
          const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ["-25deg", "0deg"] });
          return (
            <Animated.View key={i} style={{ opacity, transform: [{ scale }, { rotate }] }}>
              <Star size={24} color={Colors.accentGold} fill={Colors.accentGold} />
            </Animated.View>
          );
        })}
      </View>
      <Text style={styles.ratingValue}>4.9</Text>
      <Text style={styles.ratingSub}>Based on 12,400+ reviews</Text>
    </Animated.View>
  );
}

function FadeIn({ delay, children }: { delay: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 480,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translate, delay]);

  return <Animated.View style={{ opacity, transform: [{ translateY: translate }] }}>{children}</Animated.View>;
}

function MiniPhone({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <View style={styles.miniPhoneWrap}>
      <View style={styles.miniPhone}>
        <View style={styles.miniIsland} />
        <View style={styles.miniScreen}>{children}</View>
      </View>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function TasksPreview() {
  return (
    <MiniPhone label="Daily tasks">
      <Text style={styles.miniHead}>Today</Text>
      <Text style={styles.miniSub}>3 tasks · keep your streak</Text>
      <View style={[styles.miniTask, { backgroundColor: "#f0fdf4", borderColor: "#86efac" }]}>
        <View style={[styles.miniRadio, { backgroundColor: "#16a34a", borderColor: "#16a34a" }]}>
          <Check size={8} color="#ffffff" strokeWidth={4} />
        </View>
        <Text style={[styles.miniTaskText, { textDecorationLine: "line-through", color: Colors.textDim }]} numberOfLines={1}>Pitch 5 shops</Text>
      </View>
      <View style={[styles.miniTask, { backgroundColor: "#fff8e1", borderColor: "#fcd34d" }]}>
        <View style={[styles.miniRadio, { borderColor: Colors.accentGold }]} />
        <Text style={styles.miniTaskText} numberOfLines={1}>Build 1-page site</Text>
      </View>
      <View style={styles.miniTask}>
        <View style={styles.miniRadio} />
        <Text style={styles.miniTaskText} numberOfLines={1}>Write 3 hooks</Text>
      </View>
    </MiniPhone>
  );
}

function StreakPreview() {
  return (
    <MiniPhone label="Streaks & wins">
      <View style={styles.streakHero}>
        <Flame size={28} color="#f97316" fill="#fb923c" />
        <Text style={styles.streakBig}>14</Text>
        <Text style={styles.streakLabel}>day streak</Text>
      </View>
      <View style={styles.weekRow}>
        {[1, 1, 1, 1, 1, 1, 0].map((v, i) => (
          <View key={i} style={[styles.weekDot, v ? styles.weekDotOn : null]} />
        ))}
      </View>
      <View style={styles.pointsCard}>
        <Text style={styles.pointsBig}>+1,420</Text>
        <Text style={styles.pointsLbl}>points this week</Text>
      </View>
    </MiniPhone>
  );
}

function AiPreview() {
  return (
    <MiniPhone label="DRIVE AI">
      <View style={styles.aiHead}>
        <View style={styles.aiAvatar}>
          <Sparkles size={9} color="#ffffff" />
        </View>
        <Text style={styles.aiTitle}>DRIVE AI</Text>
      </View>
      <View style={styles.bubbleUser}>
        <Text style={styles.bubbleUserText}>How do I land my first client?</Text>
      </View>
      <View style={styles.bubbleAi}>
        <Text style={styles.bubbleAiText}>Pick 5 local shops with weak Instagram. Send a 3-line DM with one fix idea…</Text>
      </View>
      <View style={styles.aiTyping}>
        <View style={styles.tDot} />
        <View style={[styles.tDot, { opacity: 0.7 }]} />
        <View style={[styles.tDot, { opacity: 1 }]} />
      </View>
    </MiniPhone>
  );
}

function StatBlock({ Icon, value, label }: { Icon: React.ComponentType<{ color: string; size: number }>; value: string; label: string }) {
  return (
    <View style={styles.statBlock}>
      <View style={styles.statIcon}>
        <Icon color={Colors.accentGold} size={18} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Review({ name, text, avatarColor, initial }: { name: string; text: string; avatarColor: string; initial: string }) {
  const starAnims = useMemo(
    () => [0, 1, 2, 3, 4].map(() => new Animated.Value(0)),
    [],
  );

  useEffect(() => {
    const seq = starAnims.map((v, i) =>
      Animated.sequence([
        Animated.delay(180 + i * 70),
        Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      ]),
    );
    Animated.parallel(seq).start();
  }, [starAnims]);

  return (
    <View style={styles.review}>
      <View style={styles.reviewHead}>
        <View style={[styles.reviewAvatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.reviewInitial}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewName}>{name}</Text>
          <View style={styles.verifiedRow}>
            <View style={styles.verifiedDot} />
            <Text style={styles.verifiedText}>Verified user</Text>
          </View>
        </View>
      </View>
      <View style={styles.reviewStars}>
        {starAnims.map((v, i) => {
          const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
          const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
          return (
            <Animated.View key={i} style={{ opacity, transform: [{ scale }] }}>
              <Star size={13} color={Colors.accentGold} fill={Colors.accentGold} />
            </Animated.View>
          );
        })}
      </View>
      <Text style={styles.reviewText}>&ldquo;{text}&rdquo;</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
  ratingCard: {
    alignItems: "center",
    paddingVertical: 22,
    marginBottom: 18,
    borderRadius: 20,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  starsRow: { flexDirection: "row", gap: 5 },
  ratingValue: { color: Colors.text, fontSize: 44, fontWeight: "900", letterSpacing: -1, marginTop: 8 },
  ratingSub: { color: Colors.textDim, fontSize: 13, fontWeight: "600" },
  statsGrid: { gap: 10, marginBottom: 18 },
  statBlock: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 16,
    backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee",
  },
  statIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(212,175,55,0.12)", alignItems: "center", justifyContent: "center" },
  statValue: { color: Colors.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.3, minWidth: 84 },
  statLabel: { color: Colors.textDim, fontSize: 13, fontWeight: "600", flex: 1 },
  review: {
    padding: 16, borderRadius: 16, marginBottom: 10,
    backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee",
  },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  reviewInitial: { color: Colors.text, fontSize: 15, fontWeight: "900" },
  reviewName: { color: Colors.text, fontSize: 13, fontWeight: "800" },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  verifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16a34a" },
  verifiedText: { color: Colors.textDim, fontSize: 11, fontWeight: "700" },
  reviewStars: { flexDirection: "row", gap: 3, marginBottom: 8 },
  reviewText: { color: Colors.text, fontSize: 14, lineHeight: 20, fontWeight: "500" },

  previewRow: { gap: 12, paddingBottom: 18, paddingHorizontal: 2 },
  miniPhoneWrap: { alignItems: "center", gap: 8 },
  miniPhone: {
    width: 130,
    height: 220,
    borderRadius: 26,
    backgroundColor: "#0a0a0a",
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  miniIsland: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    width: 44,
    height: 14,
    borderRadius: 9,
    backgroundColor: "#000",
    zIndex: 5,
  },
  miniScreen: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    paddingHorizontal: 9,
    paddingTop: 28,
    paddingBottom: 8,
    overflow: "hidden",
  },
  miniLabel: { color: Colors.textDim, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },

  miniHead: { color: Colors.text, fontSize: 13, fontWeight: "900", letterSpacing: -0.2 },
  miniSub: { color: Colors.textDim, fontSize: 8, fontWeight: "600", marginTop: 1 },
  miniTask: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 7, paddingHorizontal: 7,
    borderRadius: 9, marginTop: 6,
    borderWidth: 1, borderColor: "#eeeeee", backgroundColor: "#fafafa",
  },
  miniRadio: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.2, borderColor: "#dddddd", alignItems: "center", justifyContent: "center" },
  miniTaskText: { color: Colors.text, fontSize: 9, fontWeight: "700", flex: 1 },

  streakHero: { alignItems: "center", marginTop: 8 },
  streakBig: { color: Colors.text, fontSize: 32, fontWeight: "900", letterSpacing: -1, marginTop: 4 },
  streakLabel: { color: Colors.textDim, fontSize: 9, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  weekRow: { flexDirection: "row", gap: 4, justifyContent: "center", marginTop: 10 },
  weekDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#eeeeee" },
  weekDotOn: { backgroundColor: "#f97316" },
  pointsCard: {
    marginTop: 10, padding: 8, borderRadius: 10,
    backgroundColor: Colors.text, alignItems: "center",
  },
  pointsBig: { color: "#ffffff", fontSize: 14, fontWeight: "900", letterSpacing: -0.3 },
  pointsLbl: { color: "#bbbbbb", fontSize: 8, fontWeight: "700", marginTop: 1 },

  aiHead: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  aiAvatar: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.accentGold, alignItems: "center", justifyContent: "center" },
  aiTitle: { color: Colors.text, fontSize: 9, fontWeight: "900" },
  bubbleUser: {
    alignSelf: "flex-end", backgroundColor: Colors.text,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10,
    borderBottomRightRadius: 3, maxWidth: "85%", marginTop: 4,
  },
  bubbleUserText: { color: "#ffffff", fontSize: 9, fontWeight: "600" },
  bubbleAi: {
    alignSelf: "flex-start", backgroundColor: "#fafafa",
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10,
    borderBottomLeftRadius: 3, maxWidth: "90%", marginTop: 6,
    borderWidth: 1, borderColor: "#eeeeee",
  },
  bubbleAiText: { color: Colors.text, fontSize: 9, lineHeight: 12, fontWeight: "500" },
  aiTyping: { flexDirection: "row", gap: 3, marginTop: 6, marginLeft: 2 },
  tDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accentGold, opacity: 0.5 },
});
