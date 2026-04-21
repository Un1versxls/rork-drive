import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import { Colors } from "@/constants/colors";
import type { Obstacle } from "@/types";

const OPTIONS: { id: Obstacle; label: string; description: string; emoji: string }[] = [
  { id: "time", label: "Not enough time", description: "Days fill up before I start", emoji: "⏰" },
  { id: "money", label: "Not enough money", description: "Hard to invest in anything", emoji: "💸" },
  { id: "confidence", label: "Confidence", description: "Fear of being bad or judged", emoji: "😬" },
  { id: "direction", label: "Too many ideas", description: "Can't pick one and commit", emoji: "🧭" },
  { id: "accountability", label: "No accountability", description: "I start and drift off", emoji: "🧲" },
];

export default function ObstacleScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<Obstacle | null>(state.profile.obstacle);
  const [detail, setDetail] = useState<string>(state.profile.obstacleDetail ?? "");

  return (
    <OnboardingShell
      step={7}
      total={10}
      title="What's your biggest obstacle?"
      subtitle="We'll factor this into your daily plan."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ obstacle: selected, obstacleDetail: detail.trim() });
            router.push("/onboarding/name");
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
        <View style={styles.extraWrap}>
          <Text style={styles.extraLabel}>Want to say more? <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            value={detail}
            onChangeText={setDetail}
            placeholder="e.g. I have 2 kids and work nights"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            multiline
            maxLength={140}
            testID="input-obstacle-detail"
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
