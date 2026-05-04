import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Colors } from "@/constants/colors";
import { submitSurveyResponse } from "@/lib/surveyTracking";
import { upsertAppUser, buildSyncFromAppState } from "@/lib/appUserTracking";

/**
 * Single-step email + password sign-up.
 * Replaces the previous 6-digit OTP flow that depended on the
 * `send-otp` edge function (which can fail with "non-2xx status").
 */
export default function EmailScreen() {
  const router = useRouter();
  const { state, setProfileField } = useApp();
  const { signUp, ready } = useAuth();
  const [email, setEmail] = useState<string>(state.profile.email ?? "");
  const [password, setPassword] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = validEmail && password.length >= 6;

  const onCreate = async () => {
    if (!valid || busy) return;
    setError(null);
    if (!ready) {
      setError("Accounts unavailable right now. Try again in a moment.");
      return;
    }
    setBusy(true);
    const clean = email.trim().toLowerCase();
    setProfileField("email", clean);

    try {
      await signUp({ email: clean, password, name: state.profile.name?.trim() || undefined });
      // Survey ping is fire-and-forget.
      submitSurveyResponse(state.profile, clean, null).catch((e) => console.log("[signup] survey", e));
      // Push the current state to the cloud immediately so the user can
      // sign in on another device and pick up exactly where they left off.
      upsertAppUser(buildSyncFromAppState(null, clean, state, { touchLastSeen: true }))
        .catch((e) => console.log("[signup] initial sync", e));

      if (state.profile.goal === "grow_business") {
        if (state.profile.business) {
          router.replace("/onboarding/plan-summary");
        } else {
          router.replace("/onboarding/paywall");
        }
      } else {
        router.replace("/onboarding/source");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't create your account.";
      console.log("[signup] error", msg);
      // Friendly fallback for the common "User already registered" case.
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
        setError("An account with that email already exists. Tap \u201CSign in\u201D to restore it.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      step={9}
      total={12}
      title="Create your account"
      subtitle="Sync your progress to any device with one tap to sign back in."
      footer={
        <View style={styles.footerWrap}>
          <GradientButton
            title={busy ? "Creating\u2026" : "Create account"}
            disabled={!valid || busy}
            onPress={onCreate}
          />
          <Pressable onPress={() => router.replace("/onboarding/sign-in")} hitSlop={10} style={styles.altBtn}>
            <Text style={styles.altText}>Have an account? Sign in</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.wrap}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={(t) => { setEmail(t); if (error) setError(null); }}
          placeholder="you@email.com"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          style={styles.input}
          returnKeyType="next"
          testID="signup-email"
        />
        <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={(t) => { setPassword(t); if (error) setError(null); }}
          placeholder="At least 6 characters"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={Platform.OS === "web" ? "new-password" : "password-new"}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={onCreate}
          testID="signup-password"
        />
        {error ? <Text style={styles.error}>{error}</Text> : (
          <Text style={styles.hint}>We&apos;ll keep your progress safe and synced across devices.</Text>
        )}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 4 },
  label: { color: Colors.textDim, fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#eeeeee",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  hint: { color: Colors.textDim, fontSize: 13, marginTop: 14, paddingHorizontal: 4 },
  error: { color: Colors.danger, fontSize: 13, marginTop: 14, paddingHorizontal: 4, fontWeight: "600" },
  footerWrap: { gap: 8 },
  altBtn: { alignSelf: "center", paddingVertical: 8, paddingHorizontal: 12 },
  altText: { color: Colors.textMuted, fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },
});
