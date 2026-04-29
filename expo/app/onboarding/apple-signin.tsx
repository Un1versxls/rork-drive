import React, { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Mail } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";

import { OnboardingShell } from "@/components/OnboardingShell";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import { submitSurveyResponse } from "@/lib/surveyTracking";
import { upsertAppUser } from "@/lib/appUserTracking";
import { useAuth } from "@/providers/AuthProvider";
import { supabase, supabaseReady } from "@/lib/supabase";

export default function AppleSignInScreen() {
  const router = useRouter();
  const { state, setProfileField } = useApp();
  const { user } = useAuth();
  const [busy, setBusy] = useState<boolean>(false);

  const proceed = (email: string | null, appleUserId: string | null, name: string | null) => {
    if (email) setProfileField("email", email.toLowerCase());
    if (appleUserId) setProfileField("appleUserId", appleUserId);
    const finalEmail = email ?? state.profile.email ?? "";
    const finalName = name ?? state.profile.name ?? null;
    submitSurveyResponse(state.profile, finalEmail, user?.id ?? null).catch((e) =>
      console.log("[apple] survey", e),
    );
    upsertAppUser({
      appleUserId: appleUserId ?? state.profile.appleUserId ?? null,
      email: finalEmail || null,
      name: finalName,
      subscription: {
        plan: state.profile.subscription.plan,
        cycle: state.profile.subscription.cycle,
        active: state.profile.subscription.active,
        trial: state.profile.subscription.trial,
        source: state.profile.subscription.source,
        startedAt: state.profile.subscription.startedAt,
      },
    }).catch((e) => console.log("[apple] app_users", e));
    router.replace("/onboarding/source");
  };

  const onApple = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (Platform.OS !== "ios") {
        proceed(null, null, null);
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
      const givenName = credential.fullName?.givenName ?? null;
      const familyName = credential.fullName?.familyName ?? null;
      const fullName = [givenName, familyName].filter(Boolean).join(" ").trim() || givenName;
      if (givenName && !state.profile.name) {
        setProfileField("name", givenName);
      }

      if (supabaseReady && supabase && credential.identityToken) {
        try {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: "apple",
            token: credential.identityToken,
          });
          if (error) {
            console.log("[apple] supabase signInWithIdToken error", error.message);
          } else if (data.user) {
            console.log("[apple] supabase session created", data.user.id);
            const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
            if (fullName) patch.name = fullName;
            if (credential.email) patch.email = credential.email.toLowerCase();
            try {
              const { error: updErr } = await supabase
                .from("user_accounts")
                .update(patch)
                .eq("id", data.user.id);
              if (updErr) console.log("[apple] user_accounts update error", updErr.message);
            } catch (e) {
              console.log("[apple] user_accounts update exception", e);
            }
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown";
          console.log("[apple] supabase auth exception", msg);
        }
      } else if (!credential.identityToken) {
        console.log("[apple] no identityToken — skipping supabase auth");
      }

      proceed(credential.email ?? null, credential.user ?? null, fullName ?? state.profile.name ?? null);
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

  const onSkip = () => proceed(null, null, null);

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

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={() => router.push("/onboarding/email")}
            style={({ pressed }) => [styles.emailBtn, pressed && { opacity: 0.85 }]}
            testID="apple-email-btn"
          >
            <Mail color={Colors.text} size={18} />
            <Text style={styles.emailText}>Sign up with email</Text>
          </Pressable>

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
          Use Apple to keep your email private, or sign up with your email — we never share your info.
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
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#eeeeee" },
  dividerText: { color: Colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  emailBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e6e6e6",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  emailText: { color: Colors.text, fontSize: 16, fontWeight: "800" },
  skipBtn: { alignSelf: "center", paddingVertical: 8, paddingHorizontal: 12 },
  skipText: { color: Colors.textMuted, fontSize: 12, fontWeight: "600", textDecorationLine: "underline" },
});
