import React, { useCallback, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Platform, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { Hand, ShieldCheck } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";

const MIN_AGE = 13;
const MAX_AGE = 65;
const KNOB_SIZE = 28;

function ageLabel(age: number): { headline: string; sub: string } {
  if (age <= 15) return { headline: "Teen builder", sub: "We'll favor in-person hustles you can legally start now." };
  if (age <= 17) return { headline: "High-school hustler", sub: "Low-capital ideas and skill-building — saves you legal headaches." };
  if (age <= 24) return { headline: "Early-career", sub: "AI businesses, agencies, and side income all fair game." };
  if (age <= 34) return { headline: "Builder", sub: "Anything you want — capital-heavy ideas unlocked." };
  if (age <= 49) return { headline: "Pro operator", sub: "We'll weight ideas that compound on your experience." };
  return { headline: "Seasoned", sub: "Stable, recurring-revenue ideas surface first." };
}

/**
 * Age slider — crash-proof rebuild.
 *
 * Intentionally zero Animated.Values. Knob position is derived directly
 * from React state (`age` -> `ratio` -> `left`) so there's no JS/native
 * animation-driver surface area at all. Gesture handling uses
 * react-native-gesture-handler's modern Gesture API (already used
 * elsewhere in the app via GestureHandlerRootView) instead of a
 * hand-rolled PanResponder.
 */
export default function AgeScreen() {
  const router = useRouter();
  const { state, setProfileField } = useApp();
  const [age, setAge] = useState<number>(state.profile.age ?? 21);
  const [trackWidth, setTrackWidth] = useState<number>(0);
  const ageRef = useRef<number>(age);
  ageRef.current = age;

  const ratio = useMemo(() => (age - MIN_AGE) / (MAX_AGE - MIN_AGE), [age]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setTrackWidth(w);
  }, []);

  const setFromLocalX = useCallback((localX: number) => {
    const w = trackWidth;
    if (w <= 0) return;
    const clamped = Math.max(0, Math.min(w, localX));
    const next = Math.round(MIN_AGE + (clamped / w) * (MAX_AGE - MIN_AGE));
    if (next !== ageRef.current) {
      setAge(next);
      if (Platform.OS !== "web") {
        Haptics.selectionAsync().catch(() => {});
      }
    }
  }, [trackWidth]);

  // Tap + drag, both produce local x coordinates. runOnJS isn't needed
  // because we use .runOnJS(true) at the gesture level so the callbacks
  // run on the JS thread directly.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((e) => {
          setFromLocalX(e.x);
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }
        })
        .onUpdate((e) => {
          setFromLocalX(e.x);
        }),
    [setFromLocalX]
  );

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onEnd((e, success) => {
          if (success) setFromLocalX(e.x);
        }),
    [setFromLocalX]
  );

  const gesture = useMemo(() => Gesture.Simultaneous(pan, tap), [pan, tap]);

  const label = ageLabel(age);

  const onContinue = useCallback(() => {
    try {
      setProfileField("age", age);
    } catch (e) {
      console.log("[age] setProfileField failed", e);
    }
    requestAnimationFrame(() => {
      try {
        router.push("/onboarding/goal");
      } catch (e) {
        console.log("[age] router.push failed", e);
      }
    });
  }, [age, router, setProfileField]);

  const knobLeft = trackWidth > 0 ? ratio * trackWidth - KNOB_SIZE / 2 : -KNOB_SIZE;
  const fillWidth = trackWidth > 0 ? ratio * trackWidth : 0;

  return (
    <OnboardingShell
      step={1}
      total={11}
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
          <GestureDetector gesture={gesture}>
            <View style={styles.trackHit} onLayout={onLayout} collapsable={false}>
              <View style={styles.trackBaseline} pointerEvents="none" />
              <View style={[styles.trackFill, { width: fillWidth }]} pointerEvents="none" />
              <View style={[styles.knob, { left: knobLeft }]} pointerEvents="none" />
            </View>
          </GestureDetector>
          <View style={styles.scaleRow}>
            <Text style={styles.scaleText}>{MIN_AGE}</Text>
            <Text style={styles.scaleText}>{MAX_AGE}+</Text>
          </View>
          <View style={styles.hintRow}>
            <Hand size={12} color={Colors.textMuted} />
            <Text style={styles.hintText}>Slide to set your age</Text>
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
  trackHit: {
    height: 44,
    justifyContent: "center",
  },
  trackBaseline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#eeeeee",
  },
  trackFill: {
    position: "absolute",
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text,
  },
  knob: {
    position: "absolute",
    top: (44 - KNOB_SIZE) / 2,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "#ffffff",
    borderWidth: 2.5,
    borderColor: Colors.text,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  scaleRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2 },
  scaleText: { color: Colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  hintRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 },
  hintText: { color: Colors.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  card: {
    marginTop: 28,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  cardHeadline: { color: Colors.text, fontSize: 17, fontWeight: "900", letterSpacing: -0.2 },
  cardSub: { color: Colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 4 },
  legal: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, alignSelf: "center" },
  legalText: { color: Colors.textDim, fontSize: 11.5, fontWeight: "700" },
});
