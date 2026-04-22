import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Check, Crown, Sparkles } from "lucide-react-native";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import { PLANS, priceFor, monthlyEquivalent } from "@/constants/plans";
import type { BillingCycle, PlanId } from "@/types";

export default function PaywallScreen() {
  const router = useRouter();
  const { startSubscription } = useApp();
  const params = useLocalSearchParams<{ retry?: string }>();
  const retry = params.retry === "1";

  const [planId, setPlanId] = useState<PlanId>("base");
  const [cycle, setCycle] = useState<BillingCycle>("yearly");

  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];
  const premium = PLANS.find((p) => p.id === "premium") ?? PLANS[1];

  const onStart = () => {
    if (Platform.OS === "web") {
      startSubscription(planId, cycle);
      router.replace("/onboarding/match");
      return;
    }
    Alert.alert(
      "Start free trial?",
      `You'll get 7 days free. After that, ${cycle === "yearly" ? `$${priceFor(plan, "yearly").toFixed(2)} / year` : `$${plan.monthlyPrice.toFixed(2)} / month`}. Cancel anytime in Settings.`,
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Start trial",
          onPress: () => {
            startSubscription(planId, cycle);
            router.replace("/onboarding/match");
          },
        },
      ]
    );
  };

  const onDecline = () => {
    router.push("/onboarding/decline");
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <Pressable onPress={onDecline} hitSlop={16} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>{retry ? "ONE MORE LOOK" : "LAST STEP"}</Text>
          <Text style={styles.title}>
            {retry ? "Your first week is\non us." : "We want you to\ntry it free."}
          </Text>
          <Text style={styles.subtitle}>
            7 days free. Cancel anytime. No charge until the trial ends.
          </Text>

          <View style={styles.planSwitcher}>
            <PlanToggle
              label="Base"
              sub="$50 – $1,500/mo ideas"
              selected={planId === "base"}
              onPress={() => setPlanId("base")}
            />
            <PlanToggle
              label="Premium"
              sub="$1,500 – $10k ideas"
              selected={planId === "premium"}
              onPress={() => setPlanId("premium")}
              tag="BEST"
            />
          </View>

          <View style={styles.cycles}>
            <CycleCard
              cycle="yearly"
              selected={cycle === "yearly"}
              onPress={() => setCycle("yearly")}
              headline={`$${priceFor(plan, "yearly").toFixed(2)} / year`}
              sub={`Just $${monthlyEquivalent(plan, "yearly").toFixed(2)}/mo — save $${plan.yearlyDiscount}`}
              savings="BEST VALUE"
            />
            <CycleCard
              cycle="monthly"
              selected={cycle === "monthly"}
              onPress={() => setCycle("monthly")}
              headline={`$${plan.monthlyPrice.toFixed(2)} / month`}
              sub="Auto-renews monthly"
            />
          </View>

          <View style={styles.perks}>
            {planId === "premium" ? (
              <View style={styles.premiumBanner}>
                <Crown size={14} color="#ffffff" />
                <Text style={styles.premiumBannerText}>
                  For people actually trying to make real money.
                </Text>
              </View>
            ) : null}
            {plan.perks.map((p) => (
              <View key={p} style={styles.perkRow}>
                <View style={styles.perkCheck}>
                  <Check size={12} color="#ffffff" strokeWidth={3} />
                </View>
                <Text style={styles.perkText}>{p}</Text>
              </View>
            ))}
            {planId === "base" ? (
              <Pressable onPress={() => setPlanId("premium")} style={styles.teaser}>
                <Sparkles size={14} color={Colors.accentGold} />
                <Text style={styles.teaserText}>
                  Want big-money ideas ($1.5k–$10k) + custom business builder? Tap to see Premium.
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton
            title="Start 7-day free trial"
            variant="gold"
            onPress={onStart}
            testID="cta-start-trial"
          />
          <Text style={styles.legal}>
            Then {cycle === "yearly" ? `$${priceFor(plan, "yearly").toFixed(2)}/yr` : `$${plan.monthlyPrice.toFixed(2)}/mo`} through Apple. Cancel anytime.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function PlanToggle({ label, sub, selected, onPress, tag }: { label: string; sub: string; selected: boolean; onPress: () => void; tag?: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.planToggle, selected && styles.planToggleOn]}>
      {tag ? <View style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View> : null}
      <Text style={[styles.planToggleLabel, selected && styles.planToggleLabelOn]}>{label}</Text>
      <Text style={styles.planToggleSub}>{sub}</Text>
    </Pressable>
  );
}

function CycleCard({ selected, onPress, headline, sub, savings }: { cycle: BillingCycle; selected: boolean; onPress: () => void; headline: string; sub: string; savings?: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.cycleCard, selected && styles.cycleCardOn]}>
      <View style={styles.cycleRow}>
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cycleHeadline}>{headline}</Text>
          <Text style={styles.cycleSub}>{sub}</Text>
        </View>
        {savings ? <View style={styles.savings}><Text style={styles.savingsText}>{savings}</Text></View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  safe: { flex: 1, paddingHorizontal: 22 },
  closeBtn: { alignSelf: "flex-end", width: 32, height: 32, alignItems: "center", justifyContent: "center", marginTop: 4 },
  closeText: { color: Colors.textDim, fontSize: 22, fontWeight: "400" },
  scroll: { paddingBottom: 20 },
  eyebrow: { color: Colors.accentGold, letterSpacing: 3, fontWeight: "900", fontSize: 11, marginTop: 6 },
  title: { color: Colors.text, fontSize: 34, fontWeight: "900", letterSpacing: -0.8, marginTop: 8, lineHeight: 40 },
  subtitle: { color: Colors.textDim, fontSize: 15, marginTop: 10, lineHeight: 21 },

  planSwitcher: { flexDirection: "row", gap: 10, marginTop: 24 },
  planToggle: {
    flex: 1, padding: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: "#eeeeee", backgroundColor: "#ffffff",
    position: "relative",
  },
  planToggleOn: { borderColor: Colors.text, backgroundColor: "#fafafa" },
  planToggleLabel: { color: Colors.text, fontSize: 17, fontWeight: "900" },
  planToggleLabelOn: {},
  planToggleSub: { color: Colors.textDim, fontSize: 12, marginTop: 3, fontWeight: "600" },
  tag: {
    position: "absolute", top: -8, right: 10,
    backgroundColor: Colors.accentGold,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  tagText: { color: "#ffffff", fontSize: 9, fontWeight: "900", letterSpacing: 1 },

  cycles: { gap: 10, marginTop: 16 },
  cycleCard: {
    padding: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: "#eeeeee", backgroundColor: "#ffffff",
  },
  cycleCardOn: { borderColor: Colors.text },
  cycleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "#dddddd", alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: Colors.text },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.text },
  cycleHeadline: { color: Colors.text, fontSize: 16, fontWeight: "800" },
  cycleSub: { color: Colors.textDim, fontSize: 12, fontWeight: "600", marginTop: 2 },
  savings: { backgroundColor: Colors.accentGold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  savingsText: { color: "#ffffff", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },

  perks: { marginTop: 20, gap: 10 },
  premiumBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.text, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, marginBottom: 4,
  },
  premiumBannerText: { color: "#ffffff", fontSize: 13, fontWeight: "700", flex: 1 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  perkCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.accentGold, alignItems: "center", justifyContent: "center" },
  perkText: { color: Colors.text, fontSize: 14, flex: 1, lineHeight: 19 },
  teaser: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 6, padding: 12, borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
  },
  teaserText: { color: Colors.text, fontSize: 12, fontWeight: "600", flex: 1 },

  footer: { paddingBottom: 8, paddingTop: 4, gap: 8 },
  legal: { color: Colors.textMuted, fontSize: 11, textAlign: "center" },
});
