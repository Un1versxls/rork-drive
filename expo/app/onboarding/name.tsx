import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import { Colors } from "@/constants/colors";

export default function NameScreen() {
  const router = useRouter();
  const { state, setAnswers } = useApp();
  const [name, setName] = useState<string>(state.profile.name ?? "");

  const valid = name.trim().length > 0;

  return (
    <OnboardingShell
      step={8}
      total={10}
      title="What should we call you?"
      subtitle="We'll greet you here every day."
      footer={
        <GradientButton
          title="Continue"
          disabled={!valid}
          onPress={() => {
            setAnswers({ name: name.trim() });
            router.push("/onboarding/plan");
          }}
        />
      }
    >
      <View style={styles.wrap}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your first name"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          autoFocus
          returnKeyType="done"
          autoCapitalize="words"
          testID="input-name"
        />
        <Text style={styles.hint}>You can change this later in your profile.</Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 4 },
  input: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  hint: { color: Colors.textDim, fontSize: 13, marginTop: 12, paddingHorizontal: 4 },
});
