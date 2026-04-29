import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  Code2,
  Briefcase,
  Megaphone,
  Palette,
  PenLine,
  Languages,
  Mic,
  PiggyBank,
  type LucideIcon,
} from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { SkillTopic } from "@/types";

const OPTIONS: { id: SkillTopic; label: string; description: string; Icon: LucideIcon }[] = [
  { id: "code", label: "Code", description: "Web, mobile, scripts, AI", Icon: Code2 },
  { id: "business", label: "Business skills", description: "Sales, ops, leadership", Icon: Briefcase },
  { id: "marketing", label: "Marketing", description: "Ads, growth, social", Icon: Megaphone },
  { id: "design", label: "Design", description: "UI, brand, visual", Icon: Palette },
  { id: "content", label: "Content & writing", description: "Copy, scripts, posts", Icon: PenLine },
  { id: "languages", label: "Languages", description: "Spanish, French, Mandarin…", Icon: Languages },
  { id: "speaking", label: "Public speaking", description: "Presence, pitching, story", Icon: Mic },
  { id: "finance", label: "Personal finance", description: "Investing, money habits", Icon: PiggyBank },
];

export default function SkillTopicScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<SkillTopic | null>(state.profile.skillTopic);

  return (
    <OnboardingShell
      step={2}
      total={11}
      title="What do you want to learn?"
      subtitle="We'll build a daily crash course around it."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ skillTopic: selected });
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
