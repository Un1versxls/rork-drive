import React, { useEffect, useRef } from "react";
import { Animated, Easing, InteractionManager, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";
import { useRouter, usePathname, type Href } from "expo-router";

import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";

// Module-level navigation history stack for onboarding. Tracks the actual
// forward path the user took so back navigation returns to the real previous
// screen instead of a static guess (e.g. coming into apple-signin from
// build-business vs sync-accounts would otherwise both pop to sync-accounts).
const onboardingHistory: string[] = [];

// Module-level persisted progress value so the golden bar animates smoothly
// from the previous step's fill to the new step's fill across screen mounts
// (instead of resetting to 0 on every page).
const progressValue = new Animated.Value(0);

export function resetOnboardingHistory(): void {
  onboardingHistory.length = 0;
  progressValue.setValue(0);
}

const PREV_STEP: Record<string, Href> = {
  "/onboarding/age": "/onboarding",
  "/onboarding/goal": "/onboarding/age",
  "/onboarding/build-business": "/onboarding/goal",
  "/onboarding/experience": "/onboarding/goal",
  "/onboarding/skill-topic": "/onboarding/goal",
  "/onboarding/confidence": "/onboarding/experience",
  "/onboarding/time": "/onboarding/confidence",
  "/onboarding/priority": "/onboarding/time",
  "/onboarding/results": "/onboarding/priority",
  "/onboarding/industry": "/onboarding/results",
  "/onboarding/budget": "/onboarding/industry",
  "/onboarding/obstacle": "/onboarding/results",
  "/onboarding/projection": "/onboarding/feature-preview",
  "/onboarding/paywall": "/onboarding/projection",
  "/onboarding/name": "/onboarding/obstacle",
  "/onboarding/sync-accounts": "/onboarding/name",
  "/onboarding/sign-in": "/onboarding/sync-accounts",
  "/onboarding/apple-signin": "/onboarding/sync-accounts",
  "/onboarding/email": "/onboarding/sync-accounts",
  "/onboarding/verify": "/onboarding/email",
  "/onboarding/source": "/onboarding/apple-signin",
  "/onboarding/match": "/onboarding/source",
  "/onboarding/business": "/onboarding/match",
  "/onboarding/plan-summary": "/onboarding/source",
  "/onboarding/try-free": "/onboarding/plan-summary",
  "/onboarding/paywall": "/onboarding/try-free",
  "/onboarding/decline": "/onboarding/paywall",
  "/onboarding/complete": "/onboarding/paywall",
};

interface Props {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  canGoBack?: boolean;
  prevPath?: Href;
}

export function OnboardingShell({ step, total, title, subtitle, children, footer, canGoBack = true, prevPath }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOnboardingStep } = useApp();
  const fade = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const trackWidth = useRef<number>(0);

  useEffect(() => {
    Animated.timing(progressValue, { toValue: step / total, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    // Pulse the glow on step change
    pulse.setValue(0);
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, [step, total, fade, pulse]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  useEffect(() => {
    if (!pathname) return;
    // History bookkeeping is cheap — do it immediately so back works.
    const top = onboardingHistory[onboardingHistory.length - 1];
    if (top !== pathname) {
      const idx = onboardingHistory.lastIndexOf(pathname);
      if (idx >= 0) {
        onboardingHistory.length = idx + 1;
      } else {
        onboardingHistory.push(pathname);
      }
    }
    // Defer the global state commit until AFTER the slide transition
    // completes. Calling setOnboardingStep during a mount-mid-transition
    // was triggering a setState while the native stack was still
    // animating, which on slower devices crashed the screen we were
    // navigating into. The onboardingStep field is only read on cold
    // start to resume the flow — it's safe to write it late.
    const handle = InteractionManager.runAfterInteractions(() => {
      try { setOnboardingStep(pathname); } catch (e) { console.log("[OnboardingShell] setOnboardingStep failed", e); }
    });
    return () => { handle.cancel(); };
  }, [pathname, setOnboardingStep]);

  const width = progressValue.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
        <View style={styles.topRow}>
          {canGoBack ? (
            <Pressable
              onPress={() => {
                // Defer navigation to the next frame so the Pressable's press
                // animation/state settles before the native stack starts a
                // transition. Doing both in the same frame has been observed
                // to crash on certain screens (e.g. /onboarding/time) when
                // expo-router's slide animation collides with re-entrant
                // state commits from the screen being mounted.
                // Prefer the real navigation history; fall back to the
                // static PREV_STEP map only if history is empty (e.g. deep
                // link or process restart on this screen).
                let historyTarget: string | undefined;
                if (pathname && onboardingHistory[onboardingHistory.length - 1] === pathname) {
                  onboardingHistory.pop();
                  historyTarget = onboardingHistory[onboardingHistory.length - 1];
                } else if (onboardingHistory.length > 0) {
                  historyTarget = onboardingHistory[onboardingHistory.length - 1];
                }
                const prev = prevPath ?? historyTarget ?? (pathname ? PREV_STEP[pathname] : undefined);
                const target: Href = (prev as Href) ?? ("/onboarding" as Href);
                requestAnimationFrame(() => {
                  try {
                    router.replace(target);
                  } catch (e) {
                    console.log("[OnboardingShell] back replace failed", e);
                    try {
                      if (router.canGoBack()) router.back();
                    } catch (e2) {
                      console.log("[OnboardingShell] router.back fallback failed", e2);
                    }
                  }
                });
              }}
              style={styles.backBtn}
              hitSlop={12}
              testID="btn-back"
            >
              <ChevronLeft color={Colors.text} size={22} />
            </Pressable>
          ) : <View style={styles.backBtn} />}
          <View
            style={styles.progressTrack}
            onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
          >
            <Animated.View style={[styles.progressFillWrap, { width }]}>
              <LinearGradient
                colors={["#b8862a", "#d4af37", "#f4d77a", "#d4af37", "#b8862a"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.progressGradient}
              />
              {/* Soft glow halo that pulses on step changes */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.progressGlow,
                  { opacity: glowOpacity, transform: [{ scaleY: glowScale }] },
                ]}
              />
              {/* Travelling shimmer streak */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shimmer,
                  {
                    transform: [
                      {
                        translateX: shimmer.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-60, 220],
                        }),
                      },
                      { skewX: "-20deg" },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.85)", "rgba(255,255,255,0)"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
              {/* Bright leading-edge cap */}
              <View style={styles.leadCap} pointerEvents="none" />
            </Animated.View>
          </View>
          <View style={styles.backBtn} />
        </View>

        <Animated.View style={[styles.content, { opacity: fade }]}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
        </Animated.View>

        <View style={styles.footer}>{footer}</View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  safe: { flex: 1, paddingHorizontal: 22 },
  kav: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 6, paddingBottom: 18 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "#efece4", overflow: "hidden" },
  progressFillWrap: { height: "100%", borderRadius: 3, overflow: "hidden" },
  progressGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 3 },
  progressGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 3,
    shadowColor: "#d4af37",
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  shimmer: { position: "absolute", top: 0, bottom: 0, width: 40 },
  leadCap: {
    position: "absolute",
    right: 0,
    top: -1,
    bottom: -1,
    width: 3,
    backgroundColor: "#fff4cc",
    shadowColor: "#f4d77a",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  content: { flex: 1, paddingTop: 8 },
  title: { color: Colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5, lineHeight: 34 },
  subtitle: { color: Colors.textDim, fontSize: 15, marginTop: 8, lineHeight: 21 },
  body: { marginTop: 24, flex: 1 },
  footer: { paddingBottom: 12, paddingTop: 8 },
});
