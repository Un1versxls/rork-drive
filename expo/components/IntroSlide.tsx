import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Star } from "lucide-react-native";
import { useRouter, type Href } from "expo-router";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";

interface Props {
  index: number;
  total: number;
  next: Href;
  prev?: Href;
  rating?: string;
  ratingSub?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  /** Hide the progress dots row (used when slides are spread through the flow). */
  showDots?: boolean;
}

/**
 * Shared intro slide used for the first social-proof pages of onboarding.
 * Always plays a one-by-one star animation at the top so every page feels
 * cohesive while the body content differs per slide.
 */
export function IntroSlide({ index, total, next, prev, rating = "4.9", ratingSub = "Based on 12,400+ reviews", title, subtitle, children, showDots = true }: Props) {
  const router = useRouter();
  const starAnims = useMemo(
    () => [0, 1, 2, 3, 4].map(() => new Animated.Value(0)),
    [],
  );
  const bodyFade = useRef(new Animated.Value(0)).current;
  const bodyShift = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    starAnims.forEach((v) => v.setValue(0));
    bodyFade.setValue(0);
    bodyShift.setValue(14);

    const seq = starAnims.map((v, i) =>
      Animated.sequence([
        Animated.delay(90 + i * 80),
        Animated.spring(v, { toValue: 1, friction: 4, tension: 130, useNativeDriver: true }),
      ]),
    );
    Animated.parallel([
      ...seq,
      Animated.sequence([
        Animated.delay(90 + 5 * 80 + 40),
        Animated.parallel([
          Animated.timing(bodyFade, { toValue: 1, duration: 340, useNativeDriver: true }),
          Animated.timing(bodyShift, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, [starAnims, bodyFade, bodyShift, index]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topRow}>
          {prev ? (
            <Pressable
              onPress={() => router.replace(prev)}
              style={styles.backBtn}
              hitSlop={12}
              testID="btn-back"
            >
              <ChevronLeft color={Colors.text} size={22} />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          <View style={styles.dotsRow}>
            {showDots
              ? Array.from({ length: total }).map((_, i) => (
                  <View key={i} style={[styles.dot, i === index ? styles.dotOn : null]} />
                ))
              : null}
          </View>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.content}>
          <View style={styles.starsRow}>
            {starAnims.map((v, i) => {
              const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
              const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
              const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ["-25deg", "0deg"] });
              return (
                <Animated.View key={i} style={{ opacity, transform: [{ scale }, { rotate }] }}>
                  <Star size={30} color={Colors.accentGold} fill={Colors.accentGold} />
                </Animated.View>
              );
            })}
          </View>
          <Text style={styles.rating}>{rating}</Text>
          <Text style={styles.ratingSub}>{ratingSub}</Text>

          <Animated.View
            style={[styles.body, { opacity: bodyFade, transform: [{ translateY: bodyShift }] }]}
          >
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <GradientButton title="Continue" onPress={() => router.push(next)} testID={`intro-continue-${index}`} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  safe: { flex: 1, paddingHorizontal: 24 },
  topRow: { flexDirection: "row", alignItems: "center", paddingTop: 6, paddingBottom: 18 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  dotsRow: { flex: 1, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 24, height: 6, borderRadius: 3, backgroundColor: "#efece4" },
  dotOn: { backgroundColor: Colors.accentGold },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  starsRow: { flexDirection: "row", gap: 7, marginBottom: 14 },
  rating: { color: Colors.text, fontSize: 56, fontWeight: "900", letterSpacing: -1.5, marginTop: 4 },
  ratingSub: { color: Colors.textDim, fontSize: 14, fontWeight: "600", marginTop: 2 },
  body: { alignItems: "center", marginTop: 32, paddingHorizontal: 6 },
  title: { color: Colors.text, fontSize: 26, fontWeight: "800", textAlign: "center", letterSpacing: -0.4, lineHeight: 32 },
  subtitle: { color: Colors.textDim, fontSize: 15, textAlign: "center", marginTop: 10, lineHeight: 22, maxWidth: 320 },
  footer: { paddingBottom: 12, paddingTop: 8 },
});
