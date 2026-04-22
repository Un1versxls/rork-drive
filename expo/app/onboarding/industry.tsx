import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  Laptop,
  Palette,
  Wrench,
  ShoppingBag,
  Video,
  GraduationCap,
  HeartPulse,
  UtensilsCrossed,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { Industry } from "@/types";

const OPTIONS: { id: Industry; label: string; description: string; Icon: LucideIcon }[] = [
  { id: "tech", label: "Tech & software", description: "Apps, SaaS, automation", Icon: Laptop },
  { id: "creative", label: "Creative & design", description: "Design, photo, video", Icon: Palette },
  { id: "services", label: "Local services", description: "Done-for-you, in your city", Icon: Wrench },
  { id: "ecommerce", label: "E-commerce", description: "Physical or digital products", Icon: ShoppingBag },
  { id: "content", label: "Content & creator", description: "Audience, brand deals", Icon: Video },
  { id: "education", label: "Coaching & education", description: "Teach, tutor, consult", Icon: GraduationCap },
  { id: "health", label: "Health & wellness", description: "Fitness, nutrition, mindset", Icon: HeartPulse },
  { id: "food", label: "Food & hospitality", description: "Food, drinks, experiences", Icon: UtensilsCrossed },
  { id: "open", label: "Surprise me", description: "Open to anything", Icon: Sparkles },
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
