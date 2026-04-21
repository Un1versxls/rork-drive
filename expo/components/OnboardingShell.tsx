import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

import { BackgroundGlow } from "@/components/BackgroundGlow";
import { Colors } from "@/constants/colors";

interface Props {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  canGoBack?: boolean;
}

export function OnboardingShell({ step, total, title, subtitle, children, footer, canGoBack = true }: Props) {
  const router = useRouter();
  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: step / total, duration: 500, useNativeDriver: false }).start();
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [step, total, progress, fade]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topRow}>
          {canGoBack ? (
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} testID="btn-back">
              <ChevronLeft color={Colors.text} size={22} />
            </Pressable>
          ) : <View style={styles.backBtn} />}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFillWrap, { width }]}>
              <LinearGradient
                colors={["#c9a87c", "#e8d5b7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Text style={styles.stepText}>{step}/{total}</Text>
        </View>

        <Animated.View style={[styles.content, { opacity: fade }]}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
        </Animated.View>

        <View style={styles.footer}>{footer}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1, paddingHorizontal: 20 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 8, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.06)", overflow: "hidden" },
  progressFillWrap: { height: "100%", borderRadius: 3, overflow: "hidden" },
  stepText: { color: Colors.textDim, fontWeight: "700", fontSize: 12, width: 36, textAlign: "right" },
  content: { flex: 1, paddingTop: 16 },
  title: { color: Colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.5, lineHeight: 36 },
  subtitle: { color: Colors.textDim, fontSize: 15, marginTop: 8, lineHeight: 21 },
  body: { marginTop: 28, flex: 1 },
  footer: { paddingBottom: 8, paddingTop: 8 },
});
