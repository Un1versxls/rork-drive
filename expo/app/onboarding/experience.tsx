import React, { useRef, useState } from "react";
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
  const { state, setProfileField } = useApp();
  const [selected, setSelected] = useState<ExperienceLevel | null>(state.profile.experience);
  const navLockRef = useRef<boolean>(false);
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
            // Re-entry lock so a double tap (or tap during slide) can't
            // fire twice.
            if (navLockRef.current) return;
            navLockRef.current = true;
            // CRITICAL: navigate FIRST, save state AFTER. Doing the state
            // commit before nav was scheduling a re-render in the same JS
            // tick the slide animation started, which crashed under load.
            // By the time the deferred save runs the slide is already
            // underway and the commit happens cleanly.
            const choice = selected;
            try {
              router.push("/onboarding/confidence");
            } catch (e) {
              console.log("[experience] router.push failed", e);
              navLockRef.current = false;
              return;
            }
            // Save state on the next tick, well after navigation has
            // started. Wrapped so an AsyncStorage / sync hiccup can't
            // bubble up and tank the screen.
            setTimeout(() => {
              try {
                setProfileField("experience", choice);
              } catch (e) {
                console.log("[experience] save failed", e);
              }
            }, 50);
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
