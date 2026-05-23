import React, { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { OnboardingShell } from "@/components/OnboardingShell";
import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { useApp } from "@/providers/AppProvider";
import { fetchAppUser, isSubscriptionActiveFromRow, hasSubscriptionHistoryFromRow, type AppUserRow } from "@/lib/appUserTracking";
import { supabase } from "@/lib/supabase";
import type { BusinessIdea } from "@/types";

export default function OnboardingSignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialPlan?: string; initialCycle?: string; requirePro?: string }>();
  const requirePro = params.requirePro === "1";
  const forwardParams = {
    initialPlan: params.initialPlan ?? "base",
    initialCycle: params.initialCycle ?? "monthly",
    ...(requirePro ? { requirePro: "1" } : {}),
  } as const;
  const { signIn, signInPending, ready } = useAuth();
  const { state, setProfileField, hydrateFromAppUser, setAnswers, setBusiness } = useApp();
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
        const conflict = detectConflict(state.profile, row);
        if (conflict) {
          showChooser({
            localLabel: conflict.localLabel,
            cloudLabel: conflict.cloudLabel,
            onKeepNew: () => applyHydrationKeepingLocal(row),
            onUseSaved: () => {
              hydrateFromAppUser(row);
              routeAfterHydrate(row);
            },
          });
          return;
        }
        hydrateFromAppUser(row);
        console.log("[sign-in] existing user — routing by subscription state");
        routeAfterHydrate(row);
        return;
      }
      console.log("[sign-in] no app_users row found — advancing onboarding");
      router.replace({ pathname: "/onboarding/source", params: forwardParams });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't sign in. Check your details.";
      console.log("[sign-in] failed", msg);
      const lower = msg.toLowerCase();
      if (
        lower.includes("network") ||
        lower.includes("failed to fetch") ||
        lower.includes("fetch failed") ||
        lower.includes("timeout") ||
        lower.includes("timed out") ||
        lower.includes("offline")
      ) {
        setError("Can\u2019t reach the server right now. Check your internet connection and try again.");
      } else if (lower.includes("rate limit") || lower.includes("too many")) {
        setError("Too many attempts. Wait a minute and try again.");
      } else {
        setError(msg);
      }
    }
  };

  const routeAfterHydrate = (row: AppUserRow) => {
    if (isSubscriptionActiveFromRow(row)) {
      router.replace("/(tabs)/tasks");
      return;
    }
    if (hasSubscriptionHistoryFromRow(row)) {
      router.replace({ pathname: "/onboarding/paywall", params: { expired: "1" } });
      return;
    }
    router.replace("/onboarding/paywall");
  };

  const applyHydrationKeepingLocal = (row: AppUserRow) => {
    // Snapshot the local picks before hydrate overwrites them.
    const localGoal = state.profile.goal;
    const localSkillTopic = state.profile.skillTopic;
    const localBusiness = state.profile.business;
    const localTaskPool = state.profile.businessTaskPool;
    const localDayMode = state.profile.dayTradingMode;
    const localDayMarket = state.profile.dayTradingMarket;
    const localDayCapital = state.profile.dayTradingCapital;

    hydrateFromAppUser(row);

    // Re-apply the freshly-picked path on top of cloud progress.
    setTimeout(() => {
      setAnswers({
        ...(localGoal ? { goal: localGoal } : {}),
        ...(localSkillTopic ? { skillTopic: localSkillTopic } : {}),
      });
      if (localBusiness) {
        setBusiness(localBusiness as BusinessIdea, localTaskPool ?? []);
      }
      if (localDayMode) setProfileField("dayTradingMode", localDayMode);
      if (localDayMarket) setProfileField("dayTradingMarket", localDayMarket);
      if (localDayCapital) setProfileField("dayTradingCapital", localDayCapital);
      routeAfterHydrate(row);
    }, 50);
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
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.altBtn}>
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

interface Conflict { localLabel: string; cloudLabel: string }

function goalLabel(goal: string | null | undefined, skillTopic: string | null | undefined, businessName: string | null | undefined, dayMode: string | null | undefined): string | null {
  if (businessName) return businessName;
  if (dayMode) return dayMode === "learn" ? "Learn day trading" : "Day trading hustle";
  if (skillTopic) return `Learn ${skillTopic}`;
  if (goal === "income") return "Earn extra income";
  if (goal === "skill") return "Learn a skill";
  if (goal === "business") return "Start a business";
  if (goal) return String(goal);
  return null;
}

function detectConflict(local: { goal: string | null; skillTopic: string | null; business: { id: string; name: string } | null; dayTradingMode: string | null }, row: AppUserRow): Conflict | null {
  const localPicked = !!(local.goal || local.skillTopic || local.business || local.dayTradingMode);
  if (!localPicked) return null;
  const cloudPicked = !!(row.goal || row.skill_topic || row.business_id || row.day_trading_mode);
  if (!cloudPicked) return null;

  const sameGoal = (local.goal ?? null) === (row.goal ?? null);
  const sameSkill = (local.skillTopic ?? null) === (row.skill_topic ?? null);
  const sameBusiness = (local.business?.id ?? null) === (row.business_id ?? null);
  const sameDay = (local.dayTradingMode ?? null) === (row.day_trading_mode ?? null);
  if (sameGoal && sameSkill && sameBusiness && sameDay) return null;

  const localLabel = goalLabel(local.goal, local.skillTopic, local.business?.name ?? null, local.dayTradingMode) ?? "your new pick";
  const cloudLabel = goalLabel(row.goal ?? null, row.skill_topic ?? null, row.business_name ?? null, row.day_trading_mode ?? null) ?? "your saved path";
  return { localLabel, cloudLabel };
}

function showChooser(opts: { localLabel: string; cloudLabel: string; onKeepNew: () => void; onUseSaved: () => void }) {
  Alert.alert(
    "Which path do you want?",
    `You just picked "${opts.localLabel}", but your account is set to "${opts.cloudLabel}".`,
    [
      { text: `Keep ${opts.localLabel}`, onPress: opts.onKeepNew },
      { text: `Use ${opts.cloudLabel}`, onPress: opts.onUseSaved, style: "default" },
    ],
    { cancelable: false },
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
