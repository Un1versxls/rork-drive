import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Banknote, Brain, TrendingUp, Zap, type LucideIcon } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { PrimaryGoal } from "@/types";

const OPTIONS: { id: PrimaryGoal; label: string; description: string; Icon: LucideIcon }[] = [
  { id: "earn_income", label: "Earn extra income", description: "Side hustles, freelance, pitching", Icon: Banknote },
  { id: "build_skills", label: "Build skills", description: "Learn, practice, level up", Icon: Brain },
  { id: "grow_business", label: "Run / grow my business", description: "Use DRIVE to get real work done on your existing business", Icon: TrendingUp },
  { id: "stay_productive", label: "Stay productive", description: "Focus, routines, follow through", Icon: Zap },
];

export default function GoalScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<PrimaryGoal | null>(state.profile.goal);

  return (
    <OnboardingShell
      step={1}
      total={11}
      title="What's your goal?"
      subtitle="We'll tailor your daily tasks to it."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ goal: selected });
            router.push("/onboarding/experience");
          }}
          testID="cta-continue"
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
            testID={`opt-${o.id}`}
          />
        ))}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({ list: { paddingBottom: 12 } });
