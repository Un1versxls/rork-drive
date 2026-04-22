import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Timer, Hourglass, Clock, Flame, type LucideIcon } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { TimeCommitment } from "@/types";

const OPTIONS: { id: TimeCommitment; label: string; description: string; Icon: LucideIcon }[] = [
  { id: "15m", label: "15 minutes", description: "Tiny daily wins", Icon: Timer },
  { id: "30m", label: "30 minutes", description: "Solid momentum", Icon: Hourglass },
  { id: "1h", label: "1 hour", description: "Real deep work", Icon: Clock },
  { id: "2h", label: "2+ hours", description: "Serious mode", Icon: Flame },
];

export default function TimeScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<TimeCommitment | null>(state.profile.time);

  return (
    <OnboardingShell
      step={3}
      total={11}
      title="How much time daily?"
      subtitle="Small is fine — consistency wins."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ time: selected });
            router.push("/onboarding/priority");
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
