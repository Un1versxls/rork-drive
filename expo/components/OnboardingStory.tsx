import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useRouter, type Href } from "expo-router";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";

interface Props {
  /** Small uppercase eyebrow shown above the title. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  prev?: Href;
  ctaTitle?: string;
  onContinue: () => void;
  children?: React.ReactNode;
}

/**
 * Lightweight informational "story" screen used for the productivity-apps
 * explainer pages. Matches the intro aesthetic (white, no progress bar) and
 * plays a quick fade + rise on the body so every page feels smooth.
 */
export function OnboardingStory({ eyebrow, title, subtitle, prev, ctaTitle = "Continue", onContinue, children }: Props) {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    fade.setValue(0);
    rise.setValue(16);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, rise]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topRow}>
          {prev ? (
            <Pressable onPress={() => router.replace(prev)} style={styles.backBtn} hitSlop={12} testID="btn-back">
              <ChevronLeft color={Colors.text} size={22} />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <View style={styles.body}>{children}</View>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton title={ctaTitle} onPress={onContinue} testID="story-continue" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  safe: { flex: 1, paddingHorizontal: 24 },
  topRow: { flexDirection: "row", alignItems: "center", paddingTop: 6, paddingBottom: 6 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  scroll: { paddingTop: 12, paddingBottom: 24, flexGrow: 1 },
  eyebrow: { color: Colors.accentDeep, fontSize: 12, fontWeight: "900", letterSpacing: 1.4, marginBottom: 10 },
  title: { color: Colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5, lineHeight: 34 },
  subtitle: { color: Colors.textDim, fontSize: 15, marginTop: 10, lineHeight: 22 },
  body: { marginTop: 26 },
  footer: { paddingBottom: 12, paddingTop: 8 },
});
