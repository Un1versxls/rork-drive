import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { WheelPicker } from "@/components/WheelPicker";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import type { Budget } from "@/types";

// Discrete dollar steps — finer near the low end, coarser higher up.
const STEPS: number[] = [
  0, 25, 50, 75, 100, 150, 200, 300, 400, 500,
  750, 1000, 1250, 1500, 1750, 2000,
  2500, 3000, 4000, 5000, 7500, 10000,
];

function amountToBudget(v: number): Budget {
  if (v < 100) return "under_100";
  if (v < 500) return "100_500";
  if (v < 2000) return "500_2000";
  return "2000_plus";
}

function budgetToAmount(b: Budget | null): number {
  switch (b) {
    case "under_100":
      return 75;
    case "100_500":
      return 300;
    case "500_2000":
      return 1000;
    case "2000_plus":
      return 2500;
    default:
      return 300;
  }
}

function formatDollars(v: number): string {
  if (v >= 10000) return "$10,000+";
  if (v >= 1000) return `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(/\.0$/, "")}k`;
  return `$${v}`;
}

function tierLabel(v: number): { headline: string; sub: string } {
  if (v < 100) return { headline: "Lean start", sub: "We'll match no-cost ideas you can launch this week." };
  if (v < 500) return { headline: "Basic tools", sub: "Enough for software, domains, and a few ads." };
  if (v < 2000) return { headline: "Quality gear", sub: "Real runway for tools, inventory, or paid traffic." };
  if (v < 5000) return { headline: "Ready to move fast", sub: "You can hire help and ship paid campaigns." };
  return { headline: "Founder mode", sub: "Plenty of capital — premium ideas unlocked." };
}

export default function BudgetScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const initial = useMemo(() => budgetToAmount(state.profile.budget), [state.profile.budget]);
  const [amount, setAmount] = useState<number>(initial);
  const tier = tierLabel(amount);

  return (
    <OnboardingShell
      step={9}
      total={11}
      title="What can you invest to start?"
      subtitle="Scroll the dial — bigger numbers up, smaller numbers down. We'll only show ideas you can afford."
      footer={
        <GradientButton
          title="Continue"
          onPress={() => {
            setAnswers({ budget: amountToBudget(amount) });
            router.push("/onboarding/name");
          }}
          testID="cta-budget-continue"
        />
      }
    >
      <View style={styles.body}>
        <View style={styles.hero}>
          <Text style={styles.heroAmount}>{formatDollars(amount)}</Text>
          <Text style={styles.heroUnit}>starting budget</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeadline}>{tier.headline}</Text>
          <Text style={styles.cardSub}>{tier.sub}</Text>
        </View>

        <WheelPicker
          values={STEPS}
          value={amount}
          onChange={setAmount}
          format={formatDollars}
          itemHeight={52}
          visibleCount={4}
          testID="wheel-budget"
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingTop: 4 },
  hero: { alignItems: "center", marginTop: 4, marginBottom: 14 },
  heroAmount: { color: Colors.text, fontSize: 56, fontWeight: "900", letterSpacing: -2, lineHeight: 62 },
  heroUnit: { color: Colors.textDim, fontSize: 13, fontWeight: "700", letterSpacing: 0.4, marginTop: 2 },
  card: {
    marginBottom: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  cardHeadline: { color: Colors.text, fontSize: 17, fontWeight: "900", letterSpacing: -0.2 },
  cardSub: { color: Colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 4 },
});
