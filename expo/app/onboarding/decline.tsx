import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Banknote, HelpCircle, Coins, Eye, Sparkles, type LucideIcon } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import { submitSurveyResponse } from "@/lib/surveyTracking";
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
  const params = useLocalSearchParams<{ fromUpgrade?: string }>();
  const fromUpgrade = params.fromUpgrade === "1";
  const { state, setDeclineReason } = useApp();
  const { user } = useAuth();
  const [selected, setSelected] = useState<DeclineReason | null>(null);

  return (
    <OnboardingShell
      step={11}
      total={12}
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
            if (state.profile.email) {
              submitSurveyResponse({ ...state.profile, declineReason: selected }, state.profile.email, user?.id ?? null).catch(() => {});
            }
            if (fromUpgrade) {
              if (router.canGoBack()) router.back();
              else router.replace("/(tabs)/tasks");
              return;
            }
            router.replace({ pathname: "/onboarding/try-free", params: { retry: "1" } });
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
