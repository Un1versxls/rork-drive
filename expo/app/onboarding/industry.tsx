import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionCard } from "@/components/OptionCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import { Colors } from "@/constants/colors";
import type { Industry } from "@/types";

const OPTIONS: { id: Industry; label: string; description: string; emoji: string }[] = [
  { id: "tech", label: "Tech & software", description: "Apps, SaaS, automation", emoji: "💻" },
  { id: "creative", label: "Creative & design", description: "Design, photo, video, art", emoji: "🎨" },
  { id: "services", label: "Local services", description: "Done-for-you, in your city", emoji: "🛠️" },
  { id: "ecommerce", label: "E-commerce", description: "Physical or digital products", emoji: "🛍️" },
  { id: "content", label: "Content & creator", description: "Audience, brand deals, ads", emoji: "🎥" },
  { id: "education", label: "Coaching & education", description: "Teach, tutor, consult", emoji: "🎓" },
  { id: "health", label: "Health & wellness", description: "Fitness, nutrition, mindset", emoji: "🧘" },
  { id: "food", label: "Food & hospitality", description: "Food, drinks, experiences", emoji: "🍳" },
  { id: "open", label: "Surprise me", description: "Open to any direction", emoji: "✨" },
];

export default function IndustryScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [selected, setSelected] = useState<Industry | null>(state.profile.industry);
  const [detail, setDetail] = useState<string>(state.profile.industryDetail ?? "");

  return (
    <OnboardingShell
      step={5}
      total={10}
      title="Which industry pulls you in?"
      subtitle="Pick what excites you — it narrows your match."
      footer={
        <GradientButton
          title="Continue"
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAnswers({ industry: selected, industryDetail: detail.trim() });
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
        <View style={styles.extraWrap}>
          <Text style={styles.extraLabel}>Niche or interests? <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            value={detail}
            onChangeText={setDetail}
            placeholder="e.g. AI tools for small restaurants"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            multiline
            maxLength={140}
            testID="input-industry-detail"
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
