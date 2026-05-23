import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, GestureResponderEvent, LayoutChangeEvent, PanResponder, Platform, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Hand, ShieldCheck } from "lucide-react-native";
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
  const trackWidthRef = useRef<number>(0);
  const trackPageXRef = useRef<number>(0);
  const trackRef = useRef<View>(null);
  const knob = useRef(new Animated.Value(0)).current;
  const knobShadow = useRef(new Animated.Value(0)).current;
  const ageRef = useRef<number>(age);
  ageRef.current = age;

  const [demoActive, setDemoActive] = useState<boolean>(true);
  const demoActiveRef = useRef<boolean>(true);
  const demoAnim = useRef(new Animated.Value(0)).current;
  const demoLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const demoPulseRef = useRef<Animated.CompositeAnimation | null>(null);
  const demoPulseShadowRef = useRef<Animated.CompositeAnimation | null>(null);
  const demoListenerIdRef = useRef<string | null>(null);
  const hintFade = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;
  // Separate JS-driven pulse for shadowOpacity, which is NOT supported by
  // the native driver. Mixing it with the native-driven hintPulse on the
  // same Animated.Value triggers a "JS animation on native node" crash.
  const hintPulseJS = useRef(new Animated.Value(0)).current;

  const ratio = useMemo(() => (age - MIN_AGE) / (MAX_AGE - MIN_AGE), [age]);

  const measureTrack = () => {
    trackRef.current?.measureInWindow((x, _y, w) => {
      trackPageXRef.current = x;
      if (w > 0) trackWidthRef.current = w;
    });
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    knob.setValue(ratio * w);
    measureTrack();
  };

  React.useEffect(() => {
    if (demoActive) return;
    const w = trackWidthRef.current;
    if (w > 0) {
      // Use setValue (not timing) so it can't collide with a pan-driven knob update.
      knob.setValue(ratio * w);
    }
  }, [ratio, knob, demoActive]);

  // Auto-demo: gently slide the knob back & forth + show a gold "Slide me!" pill.
  // Demo is controlled via refs so stopDemo() can tear everything down synchronously
  // on the first touch — no listener / timing race with the pan responder.
  useEffect(() => {
    if (!demoActive) return;
    let cancelled = false;
    const startDemo = () => {
      if (cancelled || !demoActiveRef.current) return;
      const w = trackWidthRef.current;
      if (w <= 0) {
        setTimeout(startDemo, 80);
        return;
      }
      Animated.timing(hintFade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(hintPulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(hintPulse, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      );
      demoPulseRef.current = pulse;
      pulse.start();
      const pulseShadow = Animated.loop(
        Animated.sequence([
          Animated.timing(hintPulseJS, { toValue: 1, duration: 900, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(hintPulseJS, { toValue: 0, duration: 900, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
        ])
      );
      demoPulseShadowRef.current = pulseShadow;
      pulseShadow.start();
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(demoAnim, { toValue: 1, duration: 1400, useNativeDriver: false, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(demoAnim, { toValue: 0, duration: 1400, useNativeDriver: false, easing: Easing.inOut(Easing.quad) }),
        ])
      );
      demoLoopRef.current = loop;
      loop.start();
      const id = demoAnim.addListener(({ value }) => {
        if (!demoActiveRef.current) return;
        const wNow = trackWidthRef.current;
        if (wNow <= 0) return;
        const baseRatio = (ageRef.current - MIN_AGE) / (MAX_AGE - MIN_AGE);
        const lo = Math.max(0, baseRatio - 0.08);
        const hi = Math.min(1, baseRatio + 0.08);
        const r = lo + (hi - lo) * value;
        knob.setValue(r * wNow);
      });
      demoListenerIdRef.current = id;
    };
    startDemo();
    return () => {
      cancelled = true;
    };
  }, [demoActive, demoAnim, hintFade, hintPulse, knob]);

  const stopDemo = () => {
    if (!demoActiveRef.current) return;
    demoActiveRef.current = false;
    // Tear down listener + loops synchronously BEFORE any state change so
    // nothing else can race to set `knob`.
    if (demoListenerIdRef.current !== null) {
      try { demoAnim.removeListener(demoListenerIdRef.current); } catch {}
      demoListenerIdRef.current = null;
    }
    try { demoLoopRef.current?.stop(); } catch {}
    try { demoPulseRef.current?.stop(); } catch {}
    try { demoPulseShadowRef.current?.stop(); } catch {}
    demoLoopRef.current = null;
    demoPulseRef.current = null;
    demoPulseShadowRef.current = null;
    demoAnim.stopAnimation();
    Animated.timing(hintFade, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    setDemoActive(false);
  };

  const updateFromPageX = (pageX: number) => {
    const w = trackWidthRef.current;
    if (w <= 0) return;
    const local = pageX - trackPageXRef.current;
    const clamped = Math.max(0, Math.min(w, local));
    const next = Math.round(MIN_AGE + (clamped / w) * (MAX_AGE - MIN_AGE));
    // Drive the knob directly so it tracks the finger even on a single tap
    // (before the React render flushes).
    knob.setValue(clamped);
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
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        try {
          stopDemo();
          measureTrack();
          updateFromPageX(e.nativeEvent.pageX);
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }
        } catch (err) {
          console.log("[AgeSlider] grant error", err);
        }
      },
      onPanResponderMove: (e: GestureResponderEvent) => updateFromPageX(e.nativeEvent.pageX),
    })
  ).current;

  const label = ageLabel(age);

  const onContinue = () => {
    try {
      setProfileField("age", age);
    } catch (e) {
      console.log("[age] setProfileField failed", e);
    }
    // Defer navigation one frame so any pending state commits + Animated
    // tear-down (demo loop) finish before expo-router's slide transition
    // starts. Same defensive pattern as the back-button fix.
    requestAnimationFrame(() => {
      try {
        router.push("/onboarding/goal");
      } catch (e) {
        console.log("[age] router.push failed", e);
      }
    });
  };

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
          <Animated.View
            style={[
              styles.hintPill,
              {
                opacity: hintFade,
                transform: [
                  {
                    translateY: hintPulse.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }),
                  },
                ],
                // shadowOpacity is NOT supported by the native driver, so
                // use the separate JS-driven hintPulseJS here.
                shadowOpacity: hintPulseJS.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.7] }),
              },
            ]}
            pointerEvents="none"
          >
            <Hand size={12} color="#7a5a00" />
            <Text style={styles.hintText}>Slide me</Text>
          </Animated.View>
          <View
            ref={trackRef}
            style={styles.trackBg}
            onLayout={onLayout}
            collapsable={false}
            {...responder.panHandlers}
          >
            <View style={styles.trackBaseline} pointerEvents="none" />
            <Animated.View style={[styles.trackFill, { width: knob }]} pointerEvents="none" />
            {/*
             * Knob position is JS-driven (via setValue on `knob`) to match
             * the JS-driven `width: knob` above. Using `left` here keeps
             * everything on the JS driver — mixing `transform.translateX`
             * (native-supported) with `width` (JS-only) on the same
             * Animated.Value promotes it to a native node, then the JS
             * setValue calls crash with "JS animation on native node".
             */}
            <Animated.View
              style={[
                styles.knob,
                { left: Animated.subtract(knob, 14) },
                demoActive && styles.knobDemo,
                demoActive && {
                  shadowOpacity: hintPulseJS.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] }),
                },
              ]}
              pointerEvents="none"
            />
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
    height: 44, justifyContent: "center",
  },
  trackBaseline: {
    position: "absolute",
    left: 0, right: 0,
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
    top: 8,
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
  hintPill: {
    position: "absolute",
    top: -28,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#fff6d6",
    borderWidth: 1,
    borderColor: "#d4af37",
    zIndex: 5,
    shadowColor: "#d4af37",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  hintText: { color: "#7a5a00", fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },
  knobDemo: {
    borderColor: "#d4af37",
    backgroundColor: "#fffdf3",
    shadowColor: "#d4af37",
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
});
