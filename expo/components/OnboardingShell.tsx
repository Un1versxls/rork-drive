import React, { useEffect, useRef } from "react";
import { Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useRouter, usePathname, type Href } from "expo-router";

import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";

const PREV_STEP: Record<string, Href> = {
  "/onboarding/goal": "/onboarding",
  "/onboarding/build-business": "/onboarding/goal",
  "/onboarding/experience": "/onboarding/goal",
  "/onboarding/skill-topic": "/onboarding/goal",
  "/onboarding/time": "/onboarding/experience",
  "/onboarding/priority": "/onboarding/time",
  "/onboarding/results": "/onboarding/priority",
  "/onboarding/industry": "/onboarding/results",
  "/onboarding/budget": "/onboarding/industry",
  "/onboarding/obstacle": "/onboarding/results",
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
  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: step / total, duration: 420, useNativeDriver: false }).start();
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [step, total, progress, fade]);

  useEffect(() => {
    if (pathname) setOnboardingStep(pathname);
  }, [pathname, setOnboardingStep]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

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
                if (router.canGoBack()) {
                  router.back();
                  return;
                }
                if (prevPath) {
                  router.replace(prevPath);
                  return;
                }
                const prev = pathname ? PREV_STEP[pathname] : undefined;
                if (prev) router.replace(prev);
                else router.replace("/onboarding" as Href);
              }}
              style={styles.backBtn}
              hitSlop={12}
              testID="btn-back"
            >
              <ChevronLeft color={Colors.text} size={22} />
            </Pressable>
          ) : <View style={styles.backBtn} />}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width }]} />
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
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#f0f0f0", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.text, borderRadius: 2 },
  content: { flex: 1, paddingTop: 8 },
  title: { color: Colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5, lineHeight: 34 },
  subtitle: { color: Colors.textDim, fontSize: 15, marginTop: 8, lineHeight: 21 },
  body: { marginTop: 24, flex: 1 },
  footer: { paddingBottom: 12, paddingTop: 8 },
});
