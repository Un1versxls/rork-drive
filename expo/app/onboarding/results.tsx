import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Star, TrendingUp, Users, Zap } from "lucide-react-native";

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

        <FadeIn delay={650}>
          <View style={styles.statsGrid}>
            <StatBlock Icon={TrendingUp} value="$1,120" label="Avg extra / month by day 60" />
            <StatBlock Icon={Zap} value="87%" label="Hit a 7-day streak in week 1" />
            <StatBlock Icon={Users} value="42,000+" label="People building with DRIVE" />
          </View>
        </FadeIn>

        <FadeIn delay={1100}>
          <Review
            name="Jordan, 19"
            text="I was broke before this. In 3 weeks I hit my first $500 month selling my content. The daily task thing is unreal."
          />
        </FadeIn>
        <FadeIn delay={1450}>
          <Review
            name="Maya, 22"
            text="Stopped scrolling TikTok for hours, actually did the work DRIVE told me to. Made $1.4k in a month."
          />
        </FadeIn>
        <FadeIn delay={1800}>
          <Review
            name="Alex, 24"
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

function Review({ name, text }: { name: string; text: string }) {
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
      <Text style={styles.reviewName}>— {name}</Text>
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
  reviewStars: { flexDirection: "row", gap: 3, marginBottom: 8 },
  reviewText: { color: Colors.text, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  reviewName: { color: Colors.textDim, fontSize: 12, fontWeight: "700", marginTop: 8 },
});
