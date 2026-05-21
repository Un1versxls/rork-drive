import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Lock } from "lucide-react-native";

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
  const params = useLocalSearchParams<{ initialPlan?: string; initialCycle?: string; requirePro?: string }>();
  const { state, setProfileField } = useApp();
  const { signUp, ready } = useAuth();
  const businessName = state.profile.business?.name ?? null;
  const requirePro = params.requirePro === "1";
  const forwardParams = {
    initialPlan: params.initialPlan ?? "base",
    initialCycle: params.initialCycle ?? "monthly",
    ...(requirePro ? { requirePro: "1" } : {}),
  } as const;
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

      router.replace({ pathname: "/onboarding/source", params: forwardParams });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't create your account.";
      console.log("[signup] error", msg);
      const lower = msg.toLowerCase();
      // Friendly fallback for the common "User already registered" case.
      if (lower.includes("already") || lower.includes("registered")) {
        setError("An account with that email already exists. Tap \u201CSign in\u201D to restore it.");
      } else if (
        lower.includes("network") ||
        lower.includes("failed to fetch") ||
        lower.includes("fetch failed") ||
        lower.includes("timeout") ||
        lower.includes("timed out") ||
        lower.includes("offline")
      ) {
        setError("Can\u2019t reach the server right now. Check your internet connection and try again.");
      } else if (lower.includes("rate limit") || lower.includes("email rate") || lower.includes("too many")) {
        setError("Too many sign-ups from this server in the last hour. Wait a few minutes and try again \u2014 or, in Supabase \u2192 Auth \u2192 Providers \u2192 Email, turn off \u201CConfirm email\u201D so signups don\u2019t send a confirmation message.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      step={6}
      total={7}
      title={businessName ? `Claim ${businessName}` : "Save your progress"}
      subtitle={businessName ? "Create your account so we can save your business and sync across devices." : "Sync your progress across devices in one tap."}
      footer={
        <View style={styles.footerWrap}>
          <GradientButton
            title={busy ? "Creating\u2026" : businessName ? `Claim ${businessName}` : "Create account"}
            disabled={!valid || busy}
            onPress={onCreate}
          />
          <Pressable onPress={() => router.push({ pathname: "/onboarding/sign-in", params: forwardParams })} hitSlop={10} style={styles.altBtn}>
            <Text style={styles.altText}>Have an account? Sign in</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.wrap}>
        {businessName ? (
          <View style={[styles.claimCard, requirePro && styles.claimCardPro]}>
            {requirePro ? <Lock size={14} color={Colors.accentDeep} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.claimEyebrow}>{requirePro ? "PRO PICK" : "YOUR PICK"}</Text>
              <Text style={styles.claimName}>{businessName}</Text>
            </View>
          </View>
        ) : null}
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
  claimCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 14,
    backgroundColor: "#fafafa",
    borderWidth: 1.5, borderColor: "#eeeeee",
    marginBottom: 18,
  },
  claimCardPro: {
    backgroundColor: "rgba(212,175,55,0.10)",
    borderColor: "rgba(212,175,55,0.45)",
  },
  claimEyebrow: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  claimName: { color: Colors.text, fontSize: 16, fontWeight: "900", letterSpacing: -0.2, marginTop: 2 },
});
