import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Star, TrendingUp, Users, Zap } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";

export default function ResultsScreen() {
  const router = useRouter();

  return (
    <OnboardingShell
      step={10}
      total={11}
      title="Results our users see."
      subtitle="Real stats from people who stuck with it."
      canGoBack
      footer={
        <GradientButton
          title="See my trial offer"
          onPress={() => router.push("/onboarding/paywall")}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <View style={styles.ratingCard}>
          <View style={styles.starsRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={22} color={Colors.accentGold} fill={Colors.accentGold} />
            ))}
          </View>
          <Text style={styles.ratingValue}>4.9</Text>
          <Text style={styles.ratingSub}>Based on 12,400+ reviews</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatBlock Icon={TrendingUp} value="$1,120" label="Avg extra / month by day 60" />
          <StatBlock Icon={Zap} value="87%" label="Hit a 7-day streak in week 1" />
          <StatBlock Icon={Users} value="42,000+" label="People building with DRIVE" />
        </View>

        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderLabel}>Before → After</Text>
          <Text style={styles.placeholderText}>Your user success photos go here.</Text>
        </View>

        <Review
          name="Jordan, 19"
          text="I was broke before this. In 3 weeks I hit my first $500 month selling my content. The daily task thing is unreal."
        />
        <Review
          name="Maya, 22"
          text="Stopped scrolling TikTok for hours, actually did the work DRIVE told me to. Made $1.4k in a month."
        />
        <Review
          name="Alex, 24"
          text="Premium is worth every penny. The high-ticket ideas changed how I think about money."
        />
      </ScrollView>
    </OnboardingShell>
  );
}

function StatBlock({ Icon, value, label }: { Icon: React.ComponentType<{ color: string; size: number }>; value: string; label: string }) {
  return (
    <View style={styles.statBlock}>
      <View style={styles.statIcon}>
        <Icon color={Colors.accentGold} size={18} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Review({ name, text }: { name: string; text: string }) {
  return (
    <View style={styles.review}>
      <View style={styles.reviewStars}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={12} color={Colors.accentGold} fill={Colors.accentGold} />
        ))}
      </View>
      <Text style={styles.reviewText}>&ldquo;{text}&rdquo;</Text>
      <Text style={styles.reviewName}>— {name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
  ratingCard: {
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  starsRow: { flexDirection: "row", gap: 4 },
  ratingValue: { color: Colors.text, fontSize: 40, fontWeight: "900", letterSpacing: -1, marginTop: 6 },
  ratingSub: { color: Colors.textDim, fontSize: 13, fontWeight: "600" },
  statsGrid: { gap: 10, marginBottom: 18 },
  statBlock: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 16,
    backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee",
  },
  statIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(212,175,55,0.12)", alignItems: "center", justifyContent: "center" },
  statValue: { color: Colors.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.3, minWidth: 84 },
  statLabel: { color: Colors.textDim, fontSize: 13, fontWeight: "600", flex: 1 },
  placeholderImage: {
    height: 160, borderRadius: 18, backgroundColor: "#fafafa",
    borderWidth: 1.5, borderColor: "#eeeeee", borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
    marginBottom: 18, gap: 6,
  },
  placeholderLabel: { color: Colors.accentGold, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  placeholderText: { color: Colors.textMuted, fontSize: 13 },
  review: {
    padding: 16, borderRadius: 16, marginBottom: 10,
    backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee",
  },
  reviewStars: { flexDirection: "row", gap: 3, marginBottom: 8 },
  reviewText: { color: Colors.text, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  reviewName: { color: Colors.textDim, fontSize: 12, fontWeight: "700", marginTop: 8 },
});
