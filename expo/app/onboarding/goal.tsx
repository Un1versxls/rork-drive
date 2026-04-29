import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Banknote, Brain, TrendingUp, type LucideIcon } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import type { PrimaryGoal } from "@/types";

const OPTIONS: { id: PrimaryGoal; label: string; description: string; Icon: LucideIcon; premium?: boolean }[] = [
  { id: "earn_income", label: "Earn extra income", description: "Side hustles, freelance, pitching", Icon: Banknote },
  { id: "build_skills", label: "Learn a skill", description: "Master code, marketing, design and more", Icon: Brain },
  { id: "grow_business", label: "Run / grow my business", description: "Use DRIVE to get real work done on your existing business", Icon: TrendingUp, premium: true },
];

export default function GoalScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<PrimaryGoal | null>(state.profile.goal);

  return (
    <OnboardingShell
      step={1}
      total={11}
      title="What's your goal?"
      subtitle="We'll tailor your daily tasks to it."
      footer={
        <View style={styles.footerWrap}>
          <GradientButton
            title="Continue"
            disabled={!selected}
            onPress={() => {
              if (!selected) return;
              setAnswers({ goal: selected });
              if (selected === "grow_business") {
                router.push("/onboarding/build-business");
              } else if (selected === "build_skills") {
                router.push("/onboarding/skill-topic");
              } else {
                router.push("/onboarding/experience");
              }
            }}
            testID="cta-continue"
          />
          <Pressable
            onPress={() => router.push("/onboarding/sign-in")}
            hitSlop={10}
            style={styles.signInBtn}
            testID="goal-signin"
          >
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInLink}>Sign in</Text>
            </Text>
          </Pressable>
        </View>
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
            premium={o.premium}
            testID={`opt-${o.id}`}
          />
        ))}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 12 },
  footerWrap: { gap: 8 },
  signInBtn: { alignSelf: "center", paddingVertical: 8, paddingHorizontal: 12 },
  signInText: { color: Colors.textDim, fontSize: 13, fontWeight: "600" },
  signInLink: { color: Colors.text, fontWeight: "800", textDecorationLine: "underline" },
});
