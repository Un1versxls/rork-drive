import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Coins, DollarSign, CreditCard, Landmark, type LucideIcon } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { Budget } from "@/types";

const OPTIONS: { id: Budget; label: string; description: string; Icon: LucideIcon }[] = [
  { id: "under_100", label: "Under $100", description: "Lean start", Icon: Coins },
  { id: "100_500", label: "$100 – $500", description: "Basic tools", Icon: DollarSign },
  { id: "500_2000", label: "$500 – $2,000", description: "Quality gear", Icon: CreditCard },
  { id: "2000_plus", label: "$2,000+", description: "Ready to move fast", Icon: Landmark },
];

export default function BudgetScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<Budget | null>(state.profile.budget);

  return (
    <OnboardingShell
      step={6}
      total={11}
      title="Your starting budget?"
      subtitle="We'll match ideas you can actually afford."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ budget: selected });
            router.push("/onboarding/obstacle");
          }}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.id}
            label={o.label}
            description={o.description}
            Icon={o.Icon}
            selected={selected === o.id}
            onPress={() => setSelected(o.id)}
          />
        ))}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({ list: { paddingBottom: 12 } });
