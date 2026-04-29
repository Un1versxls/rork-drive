import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
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
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<Source | null>(state.profile.source);

  return (
    <OnboardingShell
      step={10}
      total={12}
      title="Where did you hear about us?"
      subtitle="Just curious — pick one."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ source: selected });
            router.push("/onboarding/paywall");
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
