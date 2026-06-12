import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { TrendingUp } from "lucide-react-native";

import { OnboardingStory } from "@/components/OnboardingStory";
import { BarCompareChart } from "@/components/BarCompareChart";
import { Colors } from "@/constants/colors";

/**
 * Shown to users who said they have NOT used a productivity app. Makes the
 * case with a simple 3-bar graph: going it alone vs. generic apps vs. DRIVE.
 */
export default function WhyAppsScreen() {
  const router = useRouter();

  return (
    <OnboardingStory
      eyebrow="WHY IT MATTERS"
      title={"People who track their\ngoals go further."}
      subtitle="A system beats willpower. Here's what consistency actually looks like."
      prev="/onboarding/used-apps"
      ctaTitle="Makes sense"
      onContinue={() => router.push("/onboarding/why-drive")}
    >
      <View style={styles.card}>
        <BarCompareChart
          bars={[
            { label: "On your own", value: 0.28, caption: "Low" },
            { label: "Other apps", value: 0.6, caption: "Better" },
            { label: "With DRIVE", value: 1.0, caption: "Best", highlight: true },
          ]}
        />
      </View>

      <View style={styles.statRow}>
        <View style={styles.statIcon}>
          <TrendingUp size={15} color={Colors.accentDeep} />
        </View>
        <Text style={styles.statText}>
          People who follow a daily plan are <Text style={styles.statBold}>3x more likely</Text> to actually finish what they start.
        </Text>
      </View>

      <Text style={styles.footnote}>
        Illustrative comparison based on how consistent daily structure compounds over time.
      </Text>
    </OnboardingStory>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    paddingBottom: 14,
    borderRadius: 22,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#fffaeb",
    borderWidth: 1,
    borderColor: "#f1e2a4",
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  statText: { flex: 1, color: Colors.text, fontSize: 13.5, fontWeight: "600", lineHeight: 19 },
  statBold: { fontWeight: "900", color: Colors.accentDeep },
  footnote: { color: Colors.textMuted, fontSize: 11, marginTop: 14, lineHeight: 16, textAlign: "center" },
});
