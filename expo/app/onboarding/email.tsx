import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Colors } from "@/constants/colors";
import { submitSurveyResponse } from "@/lib/surveyTracking";
import { sendVerificationCode } from "@/lib/emailVerification";
import { supabaseReady } from "@/lib/supabase";

export default function EmailScreen() {
  const router = useRouter();
  const { state, setProfileField } = useApp();
  const { user } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onNext = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    const clean = email.trim().toLowerCase();
    setProfileField("email", clean);

    submitSurveyResponse(state.profile, clean, user?.id ?? null).catch((e) =>
      console.log("[email] survey", e),
    );

    if (!supabaseReady) {
      router.push({ pathname: "/onboarding/verify", params: { email: clean, skipSend: "1" } });
      setSaving(false);
      return;
    }

    const result = await sendVerificationCode(clean);
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Couldn't send the code. Try again.");
      return;
    }

    router.push({ pathname: "/onboarding/verify", params: { email: clean } });
  };

  return (
    <OnboardingShell
      step={9}
      total={12}
      title="What's your email?"
      subtitle="We'll send you a 6-digit code to verify it's really you."
      footer={
        <GradientButton
          title={saving ? "Sending code…" : "Send code"}
          disabled={!valid || saving}
          onPress={onNext}
        />
      }
    >
      <View style={styles.wrap}>
        <TextInput
          value={email}
          onChangeText={(t) => { setEmail(t); if (error) setError(null); }}
          placeholder="you@email.com"
          placeholderTextColor={Colors.textMuted}
          style={[styles.input, error ? styles.inputError : null]}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="done"
          onSubmitEditing={onNext}
          testID="input-email"
        />
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <Text style={styles.hint}>
            {supabaseReady
              ? "We'll email a 6-digit code — check your inbox (and spam)."
              : "Email service warming up — you can still continue with a code."}
          </Text>
        )}
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
  inputError: { borderColor: Colors.danger },
  hint: { color: Colors.textDim, fontSize: 13, marginTop: 12, paddingHorizontal: 4 },
  error: { color: Colors.danger, fontSize: 13, marginTop: 12, paddingHorizontal: 4, fontWeight: "600" },
});
