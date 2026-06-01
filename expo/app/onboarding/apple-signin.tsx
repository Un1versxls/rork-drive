import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Mail } from "lucide-react-native";
import { useRouter } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";
import { submitSurveyResponse } from "@/lib/surveyTracking";
import { upsertAppUser, fetchAppUser, isSubscriptionActiveFromRow, hasSubscriptionHistoryFromRow } from "@/lib/appUserTracking";
import { useAuth } from "@/providers/AuthProvider";

export default function AppleSignInScreen() {
  const router = useRouter();
  const { state, setProfileField, hydrateFromAppUser } = useApp();
  const { user } = useAuth();

  const proceed = async (email: string | null, appleUserId: string | null, name: string | null, supabaseUserId: string | null) => {
    if (email) setProfileField("email", email.toLowerCase());
    if (appleUserId) setProfileField("appleUserId", appleUserId);
    const finalEmail = email ?? state.profile.email ?? "";
    const finalName = name ?? state.profile.name ?? null;
    submitSurveyResponse(state.profile, finalEmail, user?.id ?? null).catch((e) =>
      console.log("[apple] survey", e),
    );

    // Fetch FIRST so we can detect an existing active subscription before
    // any write clobbers the cloud row's `subscription_active` flag with
    // the freshly-onboarding device's (still inactive) local state.
    const row = await fetchAppUser({ userId: supabaseUserId, email: finalEmail || null });
    if (row) {
      const ready = hydrateFromAppUser(row);
      // Identity update only — do NOT touch subscription fields here.
      upsertAppUser({
        userId: supabaseUserId,
        appleUserId: appleUserId ?? state.profile.appleUserId ?? null,
        email: finalEmail || null,
        name: finalName,
        authProvider: "apple",
      }).catch((e) => console.log("[apple] app_users identity", e));
      if (ready) {
        if (isSubscriptionActiveFromRow(row)) {
          console.log("[apple] existing user — active sub, going to dashboard");
          router.replace("/(tabs)/tasks");
          return;
        }
        if (hasSubscriptionHistoryFromRow(row)) {
          console.log("[apple] existing user — subscription expired, showing paywall");
          router.replace({ pathname: "/onboarding/paywall", params: { expired: "1" } });
          return;
        }
        router.replace("/onboarding/paywall");
        return;
      }
    } else {
      // Brand-new account — safe to write local subscription state.
      upsertAppUser({
        userId: supabaseUserId,
        appleUserId: appleUserId ?? state.profile.appleUserId ?? null,
        email: finalEmail || null,
        name: finalName,
        authProvider: "apple",
        subscription: {
          plan: state.profile.subscription.plan,
          cycle: state.profile.subscription.cycle,
          active: state.profile.subscription.active,
          trial: state.profile.subscription.trial,
          source: state.profile.subscription.source,
          startedAt: state.profile.subscription.startedAt,
        },
      }).catch((e) => console.log("[apple] app_users new", e));
    }

    if (state.profile.goal === "grow_business") {
      if (state.profile.business) {
        router.replace("/onboarding/plan-summary");
      } else {
        router.replace("/onboarding/paywall");
      }
    } else {
      router.replace("/onboarding/source");
    }
  };

  const onSkip = () => { void proceed(null, null, null, null); };

  return (
    <OnboardingShell
      step={9}
      total={12}
      title="Create your account"
      subtitle="Sign up with email to save your progress and unlock daily tasks."
      footer={
        <View style={styles.footerWrap}>
          <Pressable
            onPress={() => router.push("/onboarding/email")}
            style={({ pressed }) => [styles.emailBtnPrimary, pressed && { opacity: 0.9 }]}
            testID="apple-email-btn"
          >
            <Mail color="#ffffff" size={18} />
            <Text style={styles.emailTextPrimary}>Sign up with email</Text>
          </Pressable>

          <Pressable onPress={onSkip} hitSlop={10} style={styles.skipBtn} testID="apple-skip-btn">
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.benefit}>
          <Text style={styles.benefitTitle}>Why sign up?</Text>
          <Text style={styles.benefitText}>
            • Sync your streaks and progress across devices{"\n"}
            • Recover your account anytime{"\n"}
            • Pick up right where you left off
          </Text>
        </View>
        <Text style={styles.privacy}>
          Sign up with your email to keep your progress safe — we never share your info.
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
  emailBtnPrimary: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.text,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  emailTextPrimary: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  skipBtn: { alignSelf: "center", paddingVertical: 8, paddingHorizontal: 12 },
  skipText: { color: Colors.textMuted, fontSize: 12, fontWeight: "600", textDecorationLine: "underline" },
});
