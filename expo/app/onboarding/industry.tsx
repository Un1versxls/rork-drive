import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { Industry } from "@/types";

const OPTIONS: { id: Industry; label: string; description: string; emoji: string }[] = [
  { id: "tech", label: "Tech & software", description: "Apps, SaaS, automation", emoji: "💻" },
  { id: "creative", label: "Creative & design", description: "Design, photo, video", emoji: "🎨" },
  { id: "services", label: "Local services", description: "Done-for-you, in your city", emoji: "🛠" },
  { id: "ecommerce", label: "E-commerce", description: "Physical or digital products", emoji: "🛍" },
  { id: "content", label: "Content & creator", description: "Audience, brand deals", emoji: "🎥" },
  { id: "education", label: "Coaching & education", description: "Teach, tutor, consult", emoji: "🎓" },
  { id: "health", label: "Health & wellness", description: "Fitness, nutrition, mindset", emoji: "🧘" },
  { id: "food", label: "Food & hospitality", description: "Food, drinks, experiences", emoji: "🍳" },
  { id: "open", label: "Surprise me", description: "Open to anything", emoji: "✨" },
];

export default function IndustryScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<Industry | null>(state.profile.industry);

  return (
    <OnboardingShell
      step={5}
      total={11}
      title="Which industry pulls you in?"
      subtitle="Pick what excites you."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ industry: selected });
            router.push("/onboarding/budget");
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
