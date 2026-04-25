import React, { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";

import { OnboardingShell } from "@/components/OnboardingShell";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import { submitSurveyResponse } from "@/lib/surveyTracking";
import { useAuth } from "@/providers/AuthProvider";

export default function AppleSignInScreen() {
  const router = useRouter();
  const { state, setProfileField } = useApp();
  const { user } = useAuth();
  const [busy, setBusy] = useState<boolean>(false);

  const proceed = (email: string | null) => {
    if (email) setProfileField("email", email.toLowerCase());
    submitSurveyResponse(state.profile, email ?? state.profile.email ?? "", user?.id ?? null).catch((e) =>
      console.log("[apple] survey", e),
    );
    router.replace("/onboarding/paywall");
  };

  const onApple = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (Platform.OS !== "ios") {
        proceed(null);
        return;
      }
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        Alert.alert("Apple Sign In unavailable", "This device doesn't support Apple Sign In.");
        return;
      }
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      console.log("[apple] credential", credential.user);
      if (credential.fullName?.givenName && !state.profile.name) {
        setProfileField("name", credential.fullName.givenName);
      }
      proceed(credential.email ?? null);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === "ERR_REQUEST_CANCELED") {
        console.log("[apple] cancelled");
      } else {
        console.log("[apple] error", err);
        Alert.alert("Sign in failed", err?.message ?? "Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const onSkip = () => proceed(null);

  return (
    <OnboardingShell
      step={9}
      total={12}
      title="Create your account"
      subtitle="Sign in with Apple to save your progress and unlock daily tasks."
      footer={
        <View style={styles.footerWrap}>
          {Platform.OS === "ios" ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={14}
              style={styles.appleBtn}
              onPress={onApple}
            />
          ) : (
            <Pressable onPress={onApple} style={styles.fallbackBtn} disabled={busy} testID="apple-fallback-btn">
              <Text style={styles.fallbackText}>{busy ? "Continuing…" : "Continue"}</Text>
            </Pressable>
          )}
          <Pressable onPress={onSkip} hitSlop={10} style={styles.skipBtn} testID="apple-skip-btn">
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.benefit}>
          <Text style={styles.benefitTitle}>Why sign in?</Text>
          <Text style={styles.benefitText}>
            • Sync your streaks and progress across devices{"\n"}
            • Recover your account anytime{"\n"}
            • One tap — Apple handles everything
          </Text>
        </View>
        <Text style={styles.privacy}>
          We use Apple Sign In so your email stays private. We never share your info.
        </Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 8 },
  benefit: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  benefitTitle: { color: Colors.text, fontSize: 16, fontWeight: "800", marginBottom: 8 },
  benefitText: { color: Colors.textDim, fontSize: 14, lineHeight: 22 },
  privacy: { color: Colors.textMuted, fontSize: 12, marginTop: 16, lineHeight: 17, textAlign: "center" },
  footerWrap: { gap: 10 },
  appleBtn: { width: "100%", height: 54 },
  fallbackBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: { color: "#ffffff", fontSize: 17, fontWeight: "800" },
  skipBtn: { alignSelf: "center", paddingVertical: 8, paddingHorizontal: 12 },
  skipText: { color: Colors.textMuted, fontSize: 12, fontWeight: "600", textDecorationLine: "underline" },
});
