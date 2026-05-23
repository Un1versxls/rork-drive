import React, { useMemo, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, PanResponder, Platform, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";

const MIN_AGE = 13;
const MAX_AGE = 65;

function ageLabel(age: number): { headline: string; sub: string } {
  if (age <= 15) return { headline: "Teen builder", sub: "We'll favor in-person hustles you can legally start now." };
  if (age <= 17) return { headline: "High-school hustler", sub: "Low-capital ideas and skill-building — saves you legal headaches." };
  if (age <= 24) return { headline: "Early-career", sub: "AI businesses, agencies, and side income all fair game." };
  if (age <= 34) return { headline: "Builder", sub: "Anything you want — capital-heavy ideas unlocked." };
  if (age <= 49) return { headline: "Pro operator", sub: "We'll weight ideas that compound on your experience." };
  return { headline: "Seasoned", sub: "Stable, recurring-revenue ideas surface first." };
}

export default function AgeScreen() {
  const router = useRouter();
  const { state, setProfileField } = useApp();
  const [age, setAge] = useState<number>(state.profile.age ?? 21);
  const [trackWidth, setTrackWidth] = useState<number>(0);
  const knob = useRef(new Animated.Value(0)).current;
  const ageRef = useRef<number>(age);
  ageRef.current = age;

  const ratio = useMemo(() => (age - MIN_AGE) / (MAX_AGE - MIN_AGE), [age]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    knob.setValue(ratio * w);
  };

  React.useEffect(() => {
    if (trackWidth > 0) {
      Animated.timing(knob, { toValue: ratio * trackWidth, duration: 120, useNativeDriver: false }).start();
    }
  }, [ratio, trackWidth, knob]);

  const updateFromX = (x: number) => {
    if (trackWidth <= 0) return;
    const clamped = Math.max(0, Math.min(trackWidth, x));
    const next = Math.round(MIN_AGE + (clamped / trackWidth) * (MAX_AGE - MIN_AGE));
    if (next !== ageRef.current) {
      setAge(next);
      if (Platform.OS !== "web") {
        Haptics.selectionAsync().catch(() => {});
      }
    }
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => updateFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => updateFromX(e.nativeEvent.locationX),
    })
  ).current;

  const label = ageLabel(age);

  const onContinue = () => {
    setProfileField("age", age);
    router.push("/onboarding/goal");
  };

  return (
    <OnboardingShell
      step={1}
      total={5}
      title="How old are you?"
      subtitle="We use this to recommend businesses you can legally start — saves you from picking something risky."
      footer={<GradientButton title="Continue" onPress={onContinue} testID="cta-age-continue" />}
    >
      <View style={styles.body}>
        <View style={styles.ageHero}>
          <Text style={styles.ageNum}>{age}</Text>
          <Text style={styles.ageUnit}>years old</Text>
        </View>

        <View style={styles.sliderWrap}>
          <View style={styles.trackBg} onLayout={onLayout} {...responder.panHandlers}>
            <Animated.View style={[styles.trackFill, { width: knob }]} />
            <Animated.View style={[styles.knob, { transform: [{ translateX: Animated.subtract(knob, 14) }] }]} pointerEvents="none" />
          </View>
          <View style={styles.scaleRow}>
            <Text style={styles.scaleText}>{MIN_AGE}</Text>
            <Text style={styles.scaleText}>{MAX_AGE}+</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeadline}>{label.headline}</Text>
          <Text style={styles.cardSub}>{label.sub}</Text>
        </View>

        <View style={styles.legal}>
          <ShieldCheck size={14} color={Colors.accentDeep} />
          <Text style={styles.legalText}>Private. Only used to filter business suggestions.</Text>
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingTop: 8 },
  ageHero: { alignItems: "center", marginTop: 8, marginBottom: 28 },
  ageNum: { color: Colors.text, fontSize: 84, fontWeight: "900", letterSpacing: -3, lineHeight: 92 },
  ageUnit: { color: Colors.textDim, fontSize: 14, fontWeight: "700", letterSpacing: 0.4, marginTop: 2 },
  sliderWrap: { gap: 8, paddingHorizontal: 4 },
  trackBg: {
    height: 34, justifyContent: "center",
  },
  trackFill: {
    position: "absolute",
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text,
  },
  knob: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 2.5, borderColor: Colors.text,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  scaleRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2 },
  scaleText: { color: Colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  card: {
    marginTop: 28,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#fafafa",
    borderWidth: 1, borderColor: "#eeeeee",
  },
  cardHeadline: { color: Colors.text, fontSize: 17, fontWeight: "900", letterSpacing: -0.2 },
  cardSub: { color: Colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 4 },
  legal: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, alignSelf: "center" },
  legalText: { color: Colors.textDim, fontSize: 11.5, fontWeight: "700" },
});
