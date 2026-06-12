import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { EmojiRating } from "@/components/EmojiRating";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import type { ExperienceLevel } from "@/types";

/**
 * Experience level — reworked.
 *
 * Previous implementation used a ScrollView of OptionCards that was
 * causing crashes on Continue across multiple builds. Replaced with the
 * same EmojiRating pattern as the Confidence screen, which is known to
 * be stable. Same four levels, same data shape, much simpler view tree.
 */

const ORDER: ExperienceLevel[] = ["beginner", "intermediate", "advanced", "expert"];

const AI_COPY: Record<ExperienceLevel, { headline: string; sub: string }> = {
  beginner: { headline: "Beginner", sub: "I use ChatGPT sometimes but haven't built anything with AI yet." },
  intermediate: { headline: "Intermediate", sub: "I've tried Zapier, Make, or built a custom GPT before." },
  advanced: { headline: "Advanced", sub: "I've shipped an AI workflow or automation that actually works." },
  expert: { headline: "Expert", sub: "I build AI products or run an AI agency for clients." },
};

const INPERSON_COPY: Record<ExperienceLevel, { headline: string; sub: string }> = {
  beginner: { headline: "Beginner", sub: "I walk dogs or do odd chores for neighbors sometimes." },
  intermediate: { headline: "Intermediate", sub: "A few side gigs for cash — detailing, hauling, yard work." },
  advanced: { headline: "Advanced", sub: "Have a couple of regular clients (cleaning, landscaping, etc.)." },
  expert: { headline: "Expert", sub: "Run a local service business with crew or repeat customers." },
};

const OPTIONS = [
  { value: 1, emoji: "🌱", label: "New" },
  { value: 2, emoji: "🚀", label: "Some" },
  { value: 3, emoji: "🔥", label: "Solid" },
  { value: 4, emoji: "👑", label: "Pro" },
] as const;

export default function ExperienceScreen() {
  const router = useRouter();
  const { state, setProfileField } = useApp();

  const initialIdx = state.profile.experience ? ORDER.indexOf(state.profile.experience) + 1 : null;
  const [value, setValue] = useState<number | null>(initialIdx && initialIdx > 0 ? initialIdx : null);

  const cardFade = useRef(new Animated.Value(value ? 1 : 0)).current;
  const navLockRef = useRef<boolean>(false);

  useEffect(() => {
    Animated.timing(cardFade, {
      toValue: value ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [value, cardFade]);

  const choice: ExperienceLevel | null = value ? ORDER[value - 1] ?? null : null;
  const copyMap = state.profile.pathChoice === "in_person" ? INPERSON_COPY : AI_COPY;
  const copy = choice ? copyMap[choice] : null;

  return (
    <OnboardingShell
      step={3}
      total={11}
      title="Your experience level?"
      subtitle="Be honest — it helps us match difficulty."
      footer={
        <GradientButton
          title="Continue"
          disabled={!choice}
          onPress={() => {
            if (!choice) return;
            if (navLockRef.current) return;
            navLockRef.current = true;
            const picked = choice;
            // Navigate first, save state after — same bullet-proof pattern
            // used by the confidence screen.
            requestAnimationFrame(() => {
              try {
                router.push("/onboarding/intro-4");
              } catch (e) {
                console.log("[experience] nav failed", e);
                navLockRef.current = false;
                return;
              }
              setTimeout(() => {
                try { setProfileField("experience", picked); } catch (e) { console.log("[experience] save failed", e); }
              }, 60);
            });
          }}
          testID="cta-experience-continue"
        />
      }
    >
      <View style={styles.body}>
        <View style={styles.centered}>
          <EmojiRating options={[...OPTIONS]} value={value} onChange={setValue} testID="emoji-experience" />
        </View>

        <Animated.View style={[styles.card, { opacity: cardFade }]}>
          {copy ? (
            <>
              <Text style={styles.cardHeadline}>{copy.headline}</Text>
              <Text style={styles.cardSub}>{copy.sub}</Text>
            </>
          ) : (
            <Text style={styles.placeholder}>Pick a level to see what we'll tune for you.</Text>
          )}
        </Animated.View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingTop: 12, gap: 28, justifyContent: "center" },
  centered: { paddingVertical: 8 },
  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
    minHeight: 84,
    justifyContent: "center",
  },
  cardHeadline: { color: Colors.text, fontSize: 17, fontWeight: "900", letterSpacing: -0.2 },
  cardSub: { color: Colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 4 },
  placeholder: { color: Colors.textMuted, fontSize: 13, fontWeight: "700", textAlign: "center" },
});
