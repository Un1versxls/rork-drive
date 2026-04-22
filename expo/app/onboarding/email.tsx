import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Colors } from "@/constants/colors";
import { submitSurveyResponse } from "@/lib/surveyTracking";

export default function EmailScreen() {
  const router = useRouter();
  const { state, setProfileField } = useApp();
  const { user } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onNext = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const clean = email.trim().toLowerCase();
    setProfileField("email", clean);
    try {
      await submitSurveyResponse(state.profile, clean, user?.id ?? null);
    } catch (e) {
      console.log("[email] submit", e);
    } finally {
      setSaving(false);
      router.push("/onboarding/source");
    }
  };

  return (
    <OnboardingShell
      step={9}
      total={12}
      title="What's your email?"
      subtitle="We'll use it for trial reminders and your account."
      footer={
        <GradientButton
          title={saving ? "Saving…" : "Continue"}
          disabled={!valid || saving}
          onPress={onNext}
        />
      }
    >
      <View style={styles.wrap}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="done"
          onSubmitEditing={onNext}
          testID="input-email"
        />
        <Text style={styles.hint}>No spam. Just your free trial + streak reminders.</Text>
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
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  hint: { color: Colors.textDim, fontSize: 13, marginTop: 12, paddingHorizontal: 4 },
});
