import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { DeclineReason } from "@/types";

const OPTIONS: { id: DeclineReason; label: string; emoji: string }[] = [
  { id: "too_expensive", label: "Too expensive", emoji: "💸" },
  { id: "not_worth", label: "Not sure it's worth it", emoji: "🤔" },
  { id: "no_money", label: "Don't have the money right now", emoji: "🪙" },
  { id: "browsing", label: "Just browsing", emoji: "👀" },
  { id: "other", label: "Other", emoji: "✨" },
];

export default function DeclineScreen() {
  const router = useRouter();
  const { setDeclineReason } = useApp();
  const [selected, setSelected] = useState<DeclineReason | null>(null);

  return (
    <OnboardingShell
      step={10}
      total={11}
      title="Why aren't you interested?"
      subtitle="Quick one — helps us make it better."
      canGoBack
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setDeclineReason(selected);
            router.replace({ pathname: "/onboarding/paywall", params: { retry: "1" } });
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
