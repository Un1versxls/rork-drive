import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import { Colors } from "@/constants/colors";
import type { PrimaryGoal } from "@/types";

const OPTIONS: { id: PrimaryGoal; label: string; description: string; emoji: string }[] = [
  { id: "earn_income", label: "Earn extra income", description: "Side hustles, freelance, pitching", emoji: "💸" },
  { id: "build_skills", label: "Build skills", description: "Learn, practice, level up", emoji: "🧠" },
  { id: "grow_business", label: "Grow my business", description: "Customers, revenue, product", emoji: "📈" },
  { id: "stay_productive", label: "Stay productive", description: "Focus, routines, follow through", emoji: "⚡️" },
];

export default function GoalScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<PrimaryGoal | null>(state.profile.goal);
  const [detail, setDetail] = useState<string>(state.profile.goalDetail ?? "");

  return (
    <OnboardingShell
      step={1}
      total={10}
      title="What's your primary goal?"
      subtitle="We'll tailor your entire roadmap to this."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ goal: selected, goalDetail: detail.trim() });
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
            emoji={o.emoji}
            selected={selected === o.id}
            onPress={() => setSelected(o.id)}
            testID={`opt-${o.id}`}
          />
        ))}
        <View style={styles.extraWrap}>
          <Text style={styles.extraLabel}>Anything specific? <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            value={detail}
            onChangeText={setDetail}
            placeholder="e.g. replace my 9-5 within 12 months"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            multiline
            maxLength={140}
            testID="input-goal-detail"
          />
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
  extraWrap: { marginTop: 18 },
  extraLabel: { color: Colors.text, fontSize: 14, fontWeight: "700", marginBottom: 8 },
  optional: { color: Colors.textMuted, fontWeight: "500" },
  input: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: "top",
  },
});
