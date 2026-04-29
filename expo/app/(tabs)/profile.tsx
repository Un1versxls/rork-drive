import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronRight, Cloud, CloudOff, Crown, Gift, LogIn, LogOut, Pencil, RefreshCw, Shield, Sparkles, Star, Vibrate } from "lucide-react-native";
import { buildSyncFromAppState, upsertAppUser } from "@/lib/appUserTracking";
import { supabase } from "@/lib/supabase";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { Colors } from "@/constants/colors";
import { triggerHaptic } from "@/lib/haptics";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import { pingSupabase, supabaseReady } from "@/lib/supabase";
import { PLANS, monthlyEquivalent, yearlySavings } from "@/constants/plans";
import type { BillingCycle, PlanId } from "@/types";

export default function ProfileScreen() {
  const router = useRouter();
  const { state, currentPlan, isPremium, hasActiveSubscription, setProfileField, resetOnboarding, cancelSubscription, grantPremiumViaCode, totalCompleted, level, businessSwitchesRemaining, businessSwitchLimit } = useApp();
  const { user, signOut } = useAuth();

  const [editing, setEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(state.profile.name);
  const [planExpanded, setPlanExpanded] = useState<boolean>(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const togglePlanExpanded = () => {
    triggerHaptic("light", state.profile.hapticsEnabled);
    LayoutAnimation.configureNext({
      duration: 280,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
    Animated.timing(chevronAnim, {
      toValue: planExpanded ? 0 : 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setPlanExpanded((v) => !v);
  };

  const chevronRotate = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  const pingQuery = useQuery({
    queryKey: ["supabase-ping"],
    queryFn: pingSupabase,
    enabled: supabaseReady,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const migrateMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Supabase not configured");
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      const email = data.user?.email ?? state.profile.email ?? null;
      if (!uid && !email && !state.profile.appleUserId) {
        throw new Error("Sign in required to sync");
      }
      const res = await upsertAppUser(buildSyncFromAppState(uid, email, state, { touchLastSeen: true }));
      if (!res.ok) throw new Error(res.error ?? "Sync failed");
      return res;
    },
    onSuccess: () => {
      triggerHaptic("success", state.profile.hapticsEnabled);
      pingQuery.refetch();
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert("Synced! All your data has been migrated to the cloud.");
      } else {
        Alert.alert("Synced", "All your data has been migrated to the cloud.");
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Sync failed";
      triggerHaptic("warning", state.profile.hapticsEnabled);
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert(`Sync failed: ${msg}`);
      } else {
        Alert.alert("Sync failed", msg);
      }
    },
  });

  const onPressStatus = () => {
    triggerHaptic("light", state.profile.hapticsEnabled);
    if (!supabaseReady) {
      pingQuery.refetch();
      return;
    }
    migrateMutation.mutate();
  };

  const connected = !!pingQuery.data?.ok;
  const connStatus: "unknown" | "connected" | "offline" = !supabaseReady
    ? "offline"
    : pingQuery.isLoading
    ? "unknown"
    : connected
    ? "connected"
    : "offline";

  useEffect(() => {
    if (user?.adminGrantedPremium && !isPremium) {
      grantPremiumViaCode();
    }
  }, [user?.adminGrantedPremium, isPremium, grantPremiumViaCode]);

  const saveName = () => {
    const n = name.trim() || "Driver";
    setProfileField("name", n);
    setEditing(false);
  };

  const onReset = () => {
    const confirm = () => { resetOnboarding(); router.replace("/onboarding"); };
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Reset everything and redo onboarding?")) confirm();
      return;
    }
    Alert.alert("Reset DRIVE?", "This clears your progress and restarts onboarding.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: confirm },
    ]);
  };

  const onCancel = () => {
    const run = () => cancelSubscription();
    if (Platform.OS === "web") { if (typeof window !== "undefined" && window.confirm("Cancel subscription?")) run(); return; }
    Alert.alert("Cancel subscription?", "You'll lose access at the end of your billing period.", [
      { text: "Keep it", style: "cancel" },
      { text: "Cancel", style: "destructive", onPress: run },
    ]);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Profile</Text>
            <Pressable
              onPress={onPressStatus}
              disabled={migrateMutation.isPending}
              hitSlop={8}
              style={[
                styles.statusPill,
                connStatus === "connected" ? styles.statusPillOn : null,
                connStatus === "offline" ? styles.statusPillOff : null,
                migrateMutation.isPending ? { opacity: 0.7 } : null,
              ]}
              testID="conn-status-pill"
            >
              {migrateMutation.isPending ? (
                <RefreshCw size={11} color={Colors.textDim} />
              ) : connStatus === "connected" ? (
                <Cloud size={11} color="#0a7f3f" />
              ) : connStatus === "offline" ? (
                <CloudOff size={11} color="#a33" />
              ) : (
                <View style={styles.statusDotUnknown} />
              )}
              <Text
                style={[
                  styles.statusText,
                  connStatus === "connected" ? styles.statusTextOn : null,
                  connStatus === "offline" ? styles.statusTextOff : null,
                ]}
              >
                {migrateMutation.isPending
                  ? "Syncing…"
                  : connStatus === "connected"
                  ? "Connected"
                  : connStatus === "offline"
                  ? supabaseReady ? "Offline" : "Not set up"
                  : "Checking…"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.userCard}>
            {editing ? (
              <TextInput
                value={name}
                onChangeText={setName}
                onBlur={saveName}
                onSubmitEditing={saveName}
                placeholder="Your name"
                placeholderTextColor={Colors.textMuted}
                style={styles.nameInput}
                autoFocus
                returnKeyType="done"
              />
            ) : (
              <Pressable onPress={() => setEditing(true)} style={styles.nameRow}>
                <Text style={styles.userName}>{state.profile.name || "Driver"}</Text>
                <Pencil color={Colors.textDim} size={14} />
              </Pressable>
            )}
            <Text style={styles.userSub}>Level {level} · {totalCompleted} tasks done</Text>
            {user ? (
              <>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userId}>ID: {user.id.slice(0, 8)}…</Text>
              </>
            ) : (
              <Pressable onPress={() => router.push("/auth")} style={styles.signInRow}>
                <LogIn color={Colors.text} size={14} />
                <Text style={styles.signInText}>Sign in to sync across devices</Text>
              </Pressable>
            )}
            {user ? (
              <Pressable
                onPress={() => {
                  const run = () => signOut();
                  if (Platform.OS === "web") {
                    if (typeof window !== "undefined" && window.confirm("Sign out?")) run();
                    return;
                  }
                  Alert.alert("Sign out?", "You'll need to sign in again to sync.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Sign out", style: "destructive", onPress: run },
                  ]);
                }}
                style={styles.signOutRow}
                testID="profile-sign-out"
              >
                <LogOut color={Colors.text} size={14} />
                <Text style={styles.signInText}>Sign out</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.card}>
            <Pressable
              onPress={togglePlanExpanded}
              style={styles.planHeader}
              testID="plan-header-toggle"
            >
              <View style={[styles.planBadge, isPremium && styles.planBadgePremium]}>
                {isPremium ? <Crown size={12} color="#ffffff" /> : null}
                <Text style={[styles.planBadgeText, isPremium && styles.planBadgeTextOn]}>
                  {currentPlan.name.toUpperCase()}
                </Text>
              </View>
              <View style={styles.planHeaderText}>
                <Text style={styles.planTitle}>
                  {hasActiveSubscription
                    ? `${state.profile.subscription.cycle === "yearly" ? "Yearly" : "Monthly"}${state.profile.subscription.trial ? " — free trial" : ""}`
                    : "No active subscription"}
                </Text>
                <Text style={styles.planSub}>{currentPlan.incomeRange}</Text>
              </View>
              <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                <ChevronDown color={Colors.textDim} size={20} />
              </Animated.View>
            </Pressable>

            {planExpanded ? (
              <View style={styles.planDropdown}>
                <View style={styles.planDivider} />
                <Text style={styles.switchTitle}>Change plan</Text>
                <View style={styles.planChoices}>
                  {PLANS.map((p) => {
                    const isCurrent = state.profile.subscription.plan === p.id && hasActiveSubscription;
                    const isPremiumOpt = p.id === "premium";
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => {
                          const sameCycle: BillingCycle = state.profile.subscription.cycle === "monthly" ? "monthly" : "yearly";
                          router.push({
                            pathname: "/onboarding/paywall",
                            params: { fromUpgrade: "1", initialPlan: p.id as PlanId, initialCycle: sameCycle },
                          });
                        }}
                        style={[styles.planChoice, isCurrent && styles.planChoiceCurrent]}
                        testID={`plan-choice-${p.id}`}
                      >
                        <View style={styles.planChoiceHeader}>
                          {isPremiumOpt ? <Sparkles size={13} color={Colors.accentGold} /> : <Crown size={13} color={Colors.textDim} />}
                          <Text style={styles.planChoiceName}>{p.name}</Text>
                          {isCurrent ? (
                            <View style={styles.currentPill}>
                              <Check size={10} color="#ffffff" strokeWidth={3} />
                              <Text style={styles.currentPillText}>CURRENT</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.planChoicePrice}>${monthlyEquivalent(p, "yearly").toFixed(2)}<Text style={styles.planChoicePriceSub}>/mo</Text></Text>
                        <Text style={styles.planChoiceRange}>{p.incomeRange}</Text>
                        {yearlySavings(p) > 0 ? (
                          <Text style={styles.planChoiceSave}>Save ${yearlySavings(p).toFixed(0)} yearly</Text>
                        ) : null}
                        {!isCurrent ? (
                          <View style={styles.planChoiceCta}>
                            <Text style={styles.planChoiceCtaText}>{isPremium && p.id === "base" ? "Switch" : isPremiumOpt && !isPremium ? "Upgrade" : "Switch"}</Text>
                            <ChevronRight color={Colors.text} size={14} />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>{state.profile.goal === "build_skills" ? "Your crash course" : "Your business"}</Text>
          {state.profile.business ? (
            <View style={styles.card}>
              <Text style={styles.bizName}>{state.profile.business.name}</Text>
              <Text style={styles.bizTag}>{state.profile.business.tagline}</Text>
              {state.profile.goal !== "build_skills" ? (
                <Pressable
                  onPress={() => {
                    triggerHaptic("light", state.profile.hapticsEnabled);
                    if (businessSwitchesRemaining <= 0) {
                      const title = "Out of swaps this month";
                      const msg = `You've used all ${businessSwitchLimit} business swaps. Want to re-onboard from scratch? This will reset your answers and pick a new business.`;
                      if (Platform.OS === "web") {
                        const ok = typeof window !== "undefined" && window.confirm(`${title}\n\n${msg}`);
                        if (ok) { resetOnboarding(); router.replace("/onboarding"); }
                        return;
                      }
                      Alert.alert(title, msg, [
                        { text: "Not now", style: "cancel" },
                        { text: "Re-onboard", style: "destructive", onPress: () => { resetOnboarding(); router.replace("/onboarding"); } },
                      ]);
                      return;
                    }
                    router.push("/onboarding/match");
                  }}
                  style={styles.linkRow}
                  testID="find-new-matches"
                >
                  <RefreshCw color={Colors.text} size={14} />
                  <Text style={styles.linkText}>Find new matches</Text>
                  <View style={styles.swapBadge}>
                    <Text style={styles.swapBadgeText}>x{businessSwitchesRemaining}</Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>More</Text>
          <MenuRow Icon={Gift} label="Redeem a code" onPress={() => router.push("/redeem")} />
          <MenuRow Icon={Star} label="Rate the app" onPress={() => {
            if (Platform.OS === "web") return;
            Alert.alert("Thanks!", "Opening the App Store…");
          }} />
          {user?.isAdmin ? (
            <MenuRow Icon={Shield} label="Admin panel" onPress={() => router.push("/admin")} />
          ) : null}
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}><Vibrate color={Colors.text} size={16} /></View>
              <Text style={styles.settingLabel}>Haptics</Text>
              <Switch
                value={state.profile.hapticsEnabled}
                onValueChange={(v) => {
                  setProfileField("hapticsEnabled", v);
                  if (v) triggerHaptic("success", true);
                }}
                trackColor={{ true: Colors.text, false: "#e5e5e5" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <Pressable onPress={onReset} style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.resetText}>Reset everything</Text>
          </Pressable>

          <Text style={styles.footer}>DRIVE v1.0</Text>

          {hasActiveSubscription ? (
            <Pressable onPress={onCancel} hitSlop={10} style={styles.tinyCancel}>
              <Text style={styles.tinyCancelText}>cancel subscription</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function MenuRow({ Icon, label, onPress }: { Icon: React.ComponentType<{ color: string; size: number }>; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.75 }]}>
      <View style={styles.settingIcon}><Icon color={Colors.text} size={16} /></View>
      <Text style={styles.menuLabel}>{label}</Text>
      <ChevronRight color={Colors.textMuted} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: Platform.OS === "ios" ? 140 : 120 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  header: { color: Colors.text, fontSize: 32, fontWeight: "900", letterSpacing: -0.5 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "#f4f4f4", borderWidth: 1, borderColor: "#eeeeee" },
  statusPillOn: { backgroundColor: "#e8f7ee", borderColor: "#bfe5cc" },
  statusPillOff: { backgroundColor: "#fdecec", borderColor: "#f3c6c6" },
  statusDotUnknown: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4, color: Colors.textDim, textTransform: "uppercase" },
  statusTextOn: { color: "#0a7f3f" },
  statusTextOff: { color: "#a33" },
  userCard: { padding: 18, borderRadius: 16, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee", marginBottom: 22 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  userName: { color: Colors.text, fontSize: 22, fontWeight: "900" },
  userSub: { color: Colors.textDim, fontSize: 13, marginTop: 4 },
  userEmail: { color: Colors.textDim, fontSize: 13, fontWeight: "600", marginTop: 6 },
  userId: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  signInRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee", alignSelf: "flex-start" },
  signOutRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee", alignSelf: "flex-start" },
  signInText: { color: Colors.text, fontSize: 13, fontWeight: "700" },
  nameInput: { color: Colors.text, fontSize: 22, fontWeight: "900", borderBottomWidth: 1, borderBottomColor: Colors.text, paddingVertical: 2 },

  sectionTitle: { color: Colors.textDim, fontWeight: "800", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10, marginTop: 4 },
  card: { padding: 16, borderRadius: 16, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee", marginBottom: 18 },
  planRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  planHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  planHeaderText: { flex: 1 },
  planDropdown: { marginTop: 14 },
  planDivider: { height: 1, backgroundColor: "#f0f0f0", marginBottom: 4 },
  planBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  planBadgePremium: { backgroundColor: Colors.accentGold, borderColor: Colors.accentGold },
  planBadgeText: { color: Colors.text, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  planBadgeTextOn: { color: "#ffffff" },
  planTitle: { color: Colors.text, fontSize: 15, fontWeight: "800" },
  planSub: { color: Colors.textDim, fontSize: 12, marginTop: 2 },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, paddingVertical: 12, borderRadius: 999, backgroundColor: Colors.accentGold },
  upgradeText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  switchTitle: { color: Colors.textDim, fontWeight: "800", fontSize: 10, letterSpacing: 1.1, textTransform: "uppercase", marginTop: 14, marginBottom: 12 },
  planChoices: { flexDirection: "row", gap: 10 },
  planChoice: { flex: 1, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: "#eeeeee", backgroundColor: "#fafafa" },
  planChoiceCurrent: { borderColor: Colors.text, backgroundColor: "#ffffff" },
  planChoiceHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  planChoiceName: { color: Colors.text, fontWeight: "900", fontSize: 14, flex: 1 },
  currentPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: Colors.text, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  currentPillText: { color: "#ffffff", fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  planChoicePrice: { color: Colors.text, fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  planChoicePriceSub: { color: Colors.textDim, fontSize: 11, fontWeight: "700" },
  planChoiceRange: { color: Colors.textDim, fontSize: 11, fontWeight: "600", marginTop: 2 },
  planChoiceSave: { color: Colors.accentGold, fontSize: 10, fontWeight: "800", marginTop: 4, letterSpacing: 0.3 },
  planChoiceCta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 2, marginTop: 8 },
  planChoiceCtaText: { color: Colors.text, fontSize: 11, fontWeight: "800" },
  cancelSubBtn: { alignSelf: "flex-start", marginTop: 12 },
  cancelSubText: { color: Colors.textDim, fontSize: 12, fontWeight: "700" },
  tinyCancel: { alignSelf: "center", marginTop: 12, paddingVertical: 4, paddingHorizontal: 8 },
  tinyCancelText: { color: Colors.textMuted, fontSize: 9, fontWeight: "500", opacity: 0.5, textDecorationLine: "underline" },

  bizName: { color: Colors.text, fontSize: 17, fontWeight: "900" },
  bizTag: { color: Colors.textDim, fontSize: 13, marginTop: 2 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  linkText: { color: Colors.text, fontSize: 12, fontWeight: "700" },
  swapBadge: { marginLeft: 4, minWidth: 22, height: 18, paddingHorizontal: 6, borderRadius: 9, backgroundColor: "#d4af37", alignItems: "center", justifyContent: "center", shadowColor: "#d4af37", shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  swapBadgeText: { color: "#ffffff", fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },

  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee", marginBottom: 8 },
  menuLabel: { color: Colors.text, fontSize: 15, fontWeight: "700", flex: 1 },

  settingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#fafafa", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#eeeeee" },
  settingLabel: { color: Colors.text, fontWeight: "700", fontSize: 14, flex: 1 },

  dangerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 999, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee", marginTop: 16 },
  dangerText: { color: Colors.textDim, fontWeight: "800", fontSize: 14 },
  resetBtn: { alignSelf: "center", marginTop: 16 },
  resetText: { color: Colors.danger, fontSize: 12, fontWeight: "700" },
  footer: { color: Colors.textMuted, textAlign: "center", fontSize: 11, marginTop: 22 },
});
