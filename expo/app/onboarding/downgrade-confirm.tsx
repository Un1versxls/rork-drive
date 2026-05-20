import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Check, Sparkles } from "lucide-react-native";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";

export default function DowngradeConfirmScreen() {
  const router = useRouter();
  const { state, setBusiness, setProfileField } = useApp();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  const proPick = state.profile.pendingProPick;
  const freeAlt = state.profile.pendingFreeAlt;
  const freeAltPool = state.profile.pendingFreeAltPool ?? [];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fade, rise]);

  const onContinue = () => {
    if (freeAlt) {
      setBusiness(freeAlt, freeAltPool);
    }
    setProfileField("pendingProPick", null);
    setProfileField("pendingProPickPool", []);
    setProfileField("pendingFreeAlt", null);
    setProfileField("pendingFreeAltPool", []);
    router.replace("/onboarding/complete");
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <View style={styles.iconWrap}>
            <Check color="#ffffff" size={36} strokeWidth={3} />
          </View>
          <Text style={styles.title}>Looks like this is the business for you</Text>
          <Text style={styles.subtitle}>
            You picked Base — that&apos;s perfect for {freeAlt?.name ?? "this hustle"}, the free option from your shortlist.
          </Text>

          {freeAlt ? (
            <View style={styles.card}>
              <View style={styles.cardEyebrow}>
                <Sparkles size={11} color={Colors.accentGold} />
                <Text style={styles.cardEyebrowText}>YOUR BUSINESS</Text>
              </View>
              <Text style={styles.cardName}>{freeAlt.name}</Text>
              <Text style={styles.cardTag}>{freeAlt.tagline}</Text>
            </View>
          ) : null}

          {proPick ? (
            <Text style={styles.note}>
              Not {proPick.name}? You can unlock Pro anytime from your profile to switch.
            </Text>
          ) : null}
        </Animated.View>

        <View style={styles.footer}>
          <GradientButton title="Let's go" variant="gold" onPress={onContinue} testID="cta-downgrade-go" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  safe: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  iconWrap: {
    width: 84, height: 84, borderRadius: 999,
    backgroundColor: Colors.accentGold,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
    shadowColor: Colors.accentGold,
    shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
  },
  title: { color: Colors.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5, textAlign: "center", lineHeight: 34 },
  subtitle: { color: Colors.textDim, fontSize: 15, textAlign: "center", maxWidth: 340, lineHeight: 22 },
  card: {
    alignSelf: "stretch",
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
    gap: 4,
    marginTop: 4,
  },
  cardEyebrow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardEyebrowText: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  cardName: { color: Colors.text, fontSize: 18, fontWeight: "900" },
  cardTag: { color: Colors.textDim, fontSize: 13 },
  note: { color: Colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 10 },
  footer: { paddingBottom: 12, gap: 8 },
});
