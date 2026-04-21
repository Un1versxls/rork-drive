import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { Budget } from "@/types";

const OPTIONS: { id: Budget; label: string; description: string; emoji: string }[] = [
  { id: "under_100", label: "Under $100", description: "Lean, bootstrapped start", emoji: "🪙" },
  { id: "100_500", label: "$100 – $500", description: "Enough for basic tools", emoji: "💵" },
  { id: "500_2000", label: "$500 – $2,000", description: "Room to invest in quality", emoji: "💳" },
  { id: "2000_plus", label: "$2,000+", description: "Ready to move fast", emoji: "🏦" },
];

export default function BudgetScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<Budget | null>(state.profile.budget);

  return (
    <OnboardingShell
      step={6}
      total={10}
      title="What's your starting budget?"
      subtitle="We'll match ideas you can actually afford to start."
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
            emoji={o.emoji}
            selected={selected === o.id}
            onPress={() => setSelected(o.id)}
          />
        ))}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({ list: { paddingBottom: 12 } });
