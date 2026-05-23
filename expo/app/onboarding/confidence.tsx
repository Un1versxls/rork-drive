import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { EmojiRating } from "@/components/EmojiRating";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";

const OPTIONS = [
  { value: 1, emoji: "😅", label: "Nervous" },
  { value: 2, emoji: "🤔", label: "Curious" },
  { value: 3, emoji: "🙂", label: "Steady" },
  { value: 4, emoji: "😎", label: "Confident" },
  { value: 5, emoji: "🔥", label: "All-in" },
] as const;

const COPY: Record<number, { headline: string; sub: string }> = {
  1: { headline: "First steps, no pressure", sub: "We'll keep tasks tiny so momentum builds before doubt does." },
  2: { headline: "Exploring with intent", sub: "You'll get a guided path so each day teaches you something new." },
  3: { headline: "Locked in", sub: "Balanced tasks — enough to stretch you without overwhelming." },
  4: { headline: "Pushing the pace", sub: "Tougher challenges and bigger weekly bets unlock for you." },
  5: { headline: "Founder mode", sub: "Expect aggressive milestones — we'll match your energy." },
};

export default function ConfidenceScreen() {
  const router = useRouter();
  const { state, setProfileField } = useApp();
  const [value, setValue] = useState<number | null>(state.profile.confidence ?? null);

  const cardFade = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(cardFade, {
      toValue: value ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [value, cardFade]);

  const copy = value ? COPY[value] : null;

  return (
    <OnboardingShell
      step={4}
      total={11}
      title="How confident are you?"
      subtitle="Tap the vibe that matches today — we'll calibrate the daily tasks to you."
      footer={
        <GradientButton
          title="Continue"
          disabled={!value}
          onPress={() => {
            if (!value) return;
            setProfileField("confidence", value);
            router.push("/onboarding/time");
          }}
          testID="cta-confidence-continue"
        />
      }
    >
      <View style={styles.body}>
        <EmojiRating options={[...OPTIONS]} value={value} onChange={setValue} testID="emoji-confidence" />

        <Animated.View style={[styles.card, { opacity: cardFade }]}>
          {copy ? (
            <>
              <Text style={styles.cardHeadline}>{copy.headline}</Text>
              <Text style={styles.cardSub}>{copy.sub}</Text>
            </>
          ) : (
            <Text style={styles.placeholder}>Pick a face to see what we'll build for you.</Text>
          )}
        </Animated.View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingTop: 12, gap: 28 },
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
