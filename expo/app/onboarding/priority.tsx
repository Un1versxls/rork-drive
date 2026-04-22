import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { Priority } from "@/types";

const OPTIONS: { id: Priority; label: string; description: string; emoji: string }[] = [
  { id: "flexibility", label: "Flexibility", description: "My own schedule", emoji: "🪁" },
  { id: "earning", label: "Earning potential", description: "Income is the point", emoji: "💰" },
  { id: "learning", label: "Learning", description: "Growth over everything", emoji: "📚" },
  { id: "speed", label: "Speed to results", description: "Fast wins", emoji: "⚡" },
];

export default function PriorityScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<Priority | null>(state.profile.priority);

  return (
    <OnboardingShell
      step={4}
      total={11}
      title="What matters most?"
      subtitle="This shapes the tone of your daily work."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ priority: selected });
            router.push("/onboarding/industry");
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
