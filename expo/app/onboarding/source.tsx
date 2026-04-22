import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { Source } from "@/types";

const OPTIONS: { id: Source; label: string; emoji: string }[] = [
  { id: "tiktok", label: "TikTok", emoji: "🎵" },
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "friend", label: "A friend", emoji: "👋" },
  { id: "creator", label: "A creator", emoji: "⭐" },
  { id: "other", label: "Other", emoji: "✨" },
];

export default function SourceScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<Source | null>(state.profile.source);

  return (
    <OnboardingShell
      step={9}
      total={11}
      title="Where did you hear about us?"
      subtitle="Just curious — pick one."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ source: selected });
            router.push("/onboarding/results");
          }}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.id}
            label={o.label}
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
