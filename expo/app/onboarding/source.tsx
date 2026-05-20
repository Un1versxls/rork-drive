import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Music2, Instagram, Users, Star, Sparkles, type LucideIcon } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { Source } from "@/types";

const OPTIONS: { id: Source; label: string; Icon: LucideIcon }[] = [
  { id: "tiktok", label: "TikTok", Icon: Music2 },
  { id: "instagram", label: "Instagram", Icon: Instagram },
  { id: "friend", label: "A friend", Icon: Users },
  { id: "creator", label: "A creator", Icon: Star },
  { id: "other", label: "Other", Icon: Sparkles },
];

export default function SourceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialPlan?: string; initialCycle?: string; requirePro?: string }>();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<Source | null>(state.profile.source);

  const forwardParams = {
    initialPlan: params.initialPlan ?? "base",
    initialCycle: params.initialCycle ?? "monthly",
    ...(params.requirePro === "1" ? { requirePro: "1" } : {}),
  } as const;

  return (
    <OnboardingShell
      step={7}
      total={7}
      title="Where did you hear about us?"
      subtitle="Last question — pick one."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ source: selected });
            router.replace({ pathname: "/onboarding/feature-preview", params: forwardParams });
          }}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.id}
            label={o.label}
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
