import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, Crown, Sparkles, TrendingUp } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import { PLANS } from "@/constants/plans";
import type { PlanId } from "@/types";
import { Colors } from "@/constants/colors";

export default function PlanScreen() {
  const router = useRouter();
  const { state, setPlan } = useApp();
  const [selected, setSelected] = useState<PlanId>(state.profile.plan ?? "pro");

  return (
    <OnboardingShell
      step={9}
      total={10}
      title="Choose your plan"
      subtitle="Start free. Upgrade anytime for more tasks and bigger boosts."
      footer={
        <GradientButton
          title={selected === "free" ? "Start Free" : `Continue with ${PLANS.find((p) => p.id === selected)?.name}`}
          onPress={() => {
            setPlan(selected);
            router.push("/onboarding/match");
          }}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {PLANS.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <Pressable
              key={plan.id}
              onPress={() => setSelected(plan.id)}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && styles.pressed,
              ]}
            >
              {plan.recommended ? (
                <View style={styles.badge}>
                  <Sparkles size={11} color="#faf9f6" />
                  <Text style={styles.badgeText}>RECOMMENDED</Text>
                </View>
              ) : null}

              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.tagline}>{plan.tagline}</Text>
                </View>
                <View style={styles.priceCol}>
                  <Text style={styles.price}>${plan.price}</Text>
                  <Text style={styles.per}>{plan.price === 0 ? "forever" : "/mo"}</Text>
                </View>
              </View>

              <View style={[styles.incomeRow, plan.premiumBusinesses && styles.incomeRowPremium]}>
                {plan.premiumBusinesses ? (
                  <Crown size={13} color={Colors.accentDeep} />
                ) : (
                  <TrendingUp size={13} color={Colors.accentDeep} />
                )}
                <Text style={styles.incomeText}>
                  {plan.premiumBusinesses ? "Premium Mode \u2022 " : ""}{plan.incomeRange}
                </Text>
              </View>

              <View style={styles.perkList}>
                {plan.perks.map((p) => (
                  <View style={styles.perkRow} key={p}>
                    <View style={styles.perkCheck}>
                      <Check color={Colors.accent} size={12} strokeWidth={3} />
                    </View>
                    <Text style={styles.perkText}>{p}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.select, isSelected && styles.selectOn]}>
                <Text style={[styles.selectText, isSelected && styles.selectTextOn]}>
                  {isSelected ? "Selected" : "Tap to select"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 12 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBg,
    padding: 18,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: "#fdfbf6",
    shadowColor: Colors.accent,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  pressed: { opacity: 0.95, transform: [{ scale: 0.995 }] },
  badge: {
    position: "absolute",
    top: 14, right: 14,
    backgroundColor: Colors.accent,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999,
    flexDirection: "row", alignItems: "center", gap: 4,
  },
  badgeText: { color: "#faf9f6", fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  planName: { color: Colors.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  tagline: { color: Colors.textDim, fontSize: 13, marginTop: 2 },
  priceCol: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  price: { color: Colors.text, fontSize: 28, fontWeight: "900" },
  per: { color: Colors.textDim, fontSize: 12, fontWeight: "700" },
  perkList: { marginTop: 14, gap: 8 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  perkCheck: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.accentDim,
  },
  perkText: { color: Colors.text, fontSize: 14 },
  incomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: "flex-start",
  },
  incomeRowPremium: { borderColor: Colors.borderStrong, backgroundColor: "rgba(212,175,55,0.14)" },
  incomeText: { color: Colors.accentDeep, fontSize: 12, fontWeight: "800" },
  select: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectOn: { backgroundColor: Colors.accentDim, borderColor: Colors.borderStrong },
  selectText: { color: Colors.textDim, fontWeight: "700", fontSize: 13 },
  selectTextOn: { color: Colors.accentDeep },
});
