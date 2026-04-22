import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Sprout, Rocket, Flame, Crown, type LucideIcon } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { ExperienceLevel } from "@/types";

const OPTIONS: { id: ExperienceLevel; label: string; description: string; Icon: LucideIcon }[] = [
  { id: "beginner", label: "Beginner", description: "Just getting started", Icon: Sprout },
  { id: "intermediate", label: "Intermediate", description: "Some real reps in", Icon: Rocket },
  { id: "advanced", label: "Advanced", description: "Confident and consistent", Icon: Flame },
  { id: "expert", label: "Expert", description: "Helping others do this", Icon: Crown },
];

export default function ExperienceScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<ExperienceLevel | null>(state.profile.experience);

  return (
    <OnboardingShell
      step={2}
      total={11}
      title="Your experience level?"
      subtitle="Be honest — it helps us match difficulty."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ experience: selected });
            router.push("/onboarding/time");
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
