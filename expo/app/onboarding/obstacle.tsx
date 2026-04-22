import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Clock, Banknote, ShieldAlert, Compass, Magnet, type LucideIcon } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { Obstacle } from "@/types";

const OPTIONS: { id: Obstacle; label: string; description: string; Icon: LucideIcon }[] = [
  { id: "time", label: "Not enough time", description: "Days fill up before I start", Icon: Clock },
  { id: "money", label: "Not enough money", description: "Hard to invest", Icon: Banknote },
  { id: "confidence", label: "Confidence", description: "Fear of being bad or judged", Icon: ShieldAlert },
  { id: "direction", label: "Too many ideas", description: "Can't pick one", Icon: Compass },
  { id: "accountability", label: "No accountability", description: "I start and drift off", Icon: Magnet },
];

export default function ObstacleScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<Obstacle | null>(state.profile.obstacle);

  return (
    <OnboardingShell
      step={7}
      total={11}
      title="Biggest obstacle?"
      subtitle="We'll factor this in."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ obstacle: selected });
            router.push("/onboarding/name");
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
