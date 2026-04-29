import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { useApp } from "@/providers/AppProvider";
import { fetchAppUser } from "@/lib/appUserTracking";
import { supabase } from "@/lib/supabase";

export default function OnboardingSignInScreen() {
  const router = useRouter();
  const { signIn, signInPending, ready } = useAuth();
  const { setProfileField, hydrateFromAppUser } = useApp();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = validEmail && password.length >= 6;

  const onSubmit = async () => {
    if (!valid || signInPending) return;
    setError(null);
    if (!ready) {
      setError("Accounts unavailable right now. Try again later.");
      return;
    }
    try {
      const clean = email.trim().toLowerCase();
      await signIn({ email: clean, password });
      setProfileField("email", clean);
      let userId: string | null = null;
      try {
        const { data } = await supabase!.auth.getUser();
        userId = data.user?.id ?? null;
      } catch (err) {
        console.log("[sign-in] getUser failed", err);
      }
      const row = await fetchAppUser({ userId, email: clean });
      if (row) {
        hydrateFromAppUser(row);
        console.log("[sign-in] existing user — going to dashboard (skipping business generation)");
        router.replace("/(tabs)/tasks");
        return;
      }
      console.log("[sign-in] no app_users row found — advancing onboarding");
      router.replace("/onboarding/source");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't sign in. Check your details.";
      console.log("[sign-in] failed", msg);
      setError(msg);
    }
  };

  return (
    <OnboardingShell
      step={9}
      total={12}
      title="Welcome back"
      subtitle="Sign in to restore your progress."
      footer={
        <View style={styles.footerWrap}>
          <GradientButton
            title={signInPending ? "Signing in…" : "Sign in"}
            disabled={!valid || signInPending}
            onPress={onSubmit}
          />
          <Pressable onPress={() => router.replace("/onboarding/apple-signin")} hitSlop={10} style={styles.altBtn}>
            <Text style={styles.altText}>No account? Create one</Text>
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
          testID="signin-email"
        />
        <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={(t) => { setPassword(t); if (error) setError(null); }}
          placeholder="At least 6 characters"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={Platform.OS === "web" ? "current-password" : "password"}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          testID="signin-password"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
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
  error: { color: Colors.danger, fontSize: 13, marginTop: 14, fontWeight: "600" },
  footerWrap: { gap: 8 },
  altBtn: { alignSelf: "center", paddingVertical: 8, paddingHorizontal: 12 },
  altText: { color: Colors.textMuted, fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },
});
