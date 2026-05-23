import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Sprout, Rocket, Flame, Crown, type LucideIcon } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import type { ExperienceLevel } from "@/types";

type Option = { id: ExperienceLevel; label: string; description: string; Icon: LucideIcon };

const AI_OPTIONS: Option[] = [
  { id: "beginner", label: "Beginner", description: "I use ChatGPT sometimes but haven't built anything with AI", Icon: Sprout },
  { id: "intermediate", label: "Intermediate", description: "I've tried tools like Zapier, Make, or built a custom GPT", Icon: Rocket },
  { id: "advanced", label: "Advanced", description: "I've shipped an AI workflow or automation that actually works", Icon: Flame },
  { id: "expert", label: "Expert", description: "I build AI products or run an AI agency for clients", Icon: Crown },
];

const INPERSON_OPTIONS: Option[] = [
  { id: "beginner", label: "Beginner", description: "I walk dogs or do odd chores for neighbors sometimes", Icon: Sprout },
  { id: "intermediate", label: "Intermediate", description: "Done a few side gigs for cash — detailing, hauling, yard work", Icon: Rocket },
  { id: "advanced", label: "Advanced", description: "Have a couple of regular clients (cleaning, landscaping, etc.)", Icon: Flame },
  { id: "expert", label: "Expert", description: "Run a local service business with crew or repeat customers", Icon: Crown },
];

export default function ExperienceScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<ExperienceLevel | null>(state.profile.experience);
  const OPTIONS: Option[] = state.profile.pathChoice === "in_person" ? INPERSON_OPTIONS : AI_OPTIONS;

  return (
    <OnboardingShell
      step={3}
      total={11}
      title="Your experience level?"
      subtitle="Be honest — it helps us match difficulty."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            try {
              setAnswers({ experience: selected });
            } catch (e) {
              console.log("[experience] setAnswers failed", e);
            }
            // Defer the navigation one frame so commit/saveState/syncToSupabase
            // finishes scheduling before expo-router's slide transition begins.
            // Doing both in the same tick was crashing the app on this screen.
            requestAnimationFrame(() => {
              try {
                router.push("/onboarding/confidence");
              } catch (e) {
                console.log("[experience] router.push failed", e);
              }
            });
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
