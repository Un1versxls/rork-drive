import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Banknote, HelpCircle, Coins, Eye, Sparkles, type LucideIcon } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { DeclineReason } from "@/types";

const OPTIONS: { id: DeclineReason; label: string; Icon: LucideIcon }[] = [
  { id: "too_expensive", label: "Too expensive", Icon: Banknote },
  { id: "not_worth", label: "Not sure it's worth it", Icon: HelpCircle },
  { id: "no_money", label: "Don't have the money right now", Icon: Coins },
  { id: "browsing", label: "Just browsing", Icon: Eye },
  { id: "other", label: "Other", Icon: Sparkles },
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
