import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
      total={12}
      title="What should we call you?"
      subtitle="We'll greet you here every day."
      footer={
        <GradientButton
          title="Continue"
          disabled={!valid}
          onPress={() => {
            setAnswers({ name: name.trim() });
            router.push("/onboarding/sync-accounts");
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
        <Text style={styles.hint}>You can change this later.</Text>
        <Pressable
          onPress={() => router.push("/redeem-code")}
          hitSlop={10}
          style={styles.codeBtn}
          testID="name-code-btn"
        >
          <Text style={styles.codeText}>Have an access code? (skip account)</Text>
        </Pressable>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 4 },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#eeeeee",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  hint: { color: Colors.textDim, fontSize: 13, marginTop: 12, paddingHorizontal: 4 },
  codeBtn: { alignSelf: "center", marginTop: 28, paddingVertical: 6, paddingHorizontal: 10 },
  codeText: { color: Colors.textMuted, fontSize: 11, fontWeight: "600", textDecorationLine: "underline" },
});
