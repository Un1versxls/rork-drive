import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";

export default function CompleteScreen() {
  const router = useRouter();
  const { state, currentPlan } = useApp();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <Animated.View style={[styles.content, { opacity: fade }]}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.title}>
            {state.profile.name ? `Let's go, ${state.profile.name}.` : "You're all set."}
          </Text>
          <Text style={styles.subtitle}>
            Your business is matched and your first tasks are ready.
          </Text>

          {state.profile.business ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>YOUR BUSINESS</Text>
              <Text style={styles.cardName}>{state.profile.business.name}</Text>
              <Text style={styles.cardTag}>{state.profile.business.tagline}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardLabel}>PLAN</Text>
            <Text style={styles.cardName}>{currentPlan.name}</Text>
            <Text style={styles.cardTag}>7-day free trial active</Text>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <GradientButton
            title="Open DRIVE"
            onPress={() => router.push("/onboarding/notifications")}
            testID="cta-enter"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  safe: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18 },
  icon: { width: 90, height: 90, borderRadius: 22 },
  title: { color: Colors.text, fontSize: 32, fontWeight: "900", letterSpacing: -0.6, textAlign: "center", marginTop: 4 },
  subtitle: { color: Colors.textDim, fontSize: 15, textAlign: "center", maxWidth: 320, lineHeight: 22 },
  card: {
    alignSelf: "stretch",
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
    gap: 4,
  },
  cardLabel: { color: Colors.accentGold, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  cardName: { color: Colors.text, fontSize: 18, fontWeight: "900" },
  cardTag: { color: Colors.textDim, fontSize: 13 },
  footer: { paddingBottom: 12, gap: 8 },
});
