import React, { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, Crown, Gift, LogIn, LogOut, Pencil, RefreshCw, Shield, Star, Vibrate } from "lucide-react-native";

import { Colors } from "@/constants/colors";
import { triggerHaptic } from "@/lib/haptics";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";

export default function ProfileScreen() {
  const router = useRouter();
  const { state, currentPlan, isPremium, hasActiveSubscription, setProfileField, resetOnboarding, cancelSubscription, grantPremiumViaCode, totalCompleted, level } = useApp();
  const { user, signOut } = useAuth();

  const [editing, setEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(state.profile.name);

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
          <Text style={styles.header}>Profile</Text>

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
          </View>

          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.card}>
            <View style={styles.planRow}>
              <View style={[styles.planBadge, isPremium && styles.planBadgePremium]}>
                {isPremium ? <Crown size={12} color="#ffffff" /> : null}
                <Text style={[styles.planBadgeText, isPremium && styles.planBadgeTextOn]}>
                  {currentPlan.name.toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>
                  {hasActiveSubscription
                    ? `${state.profile.subscription.cycle === "yearly" ? "Yearly" : "Monthly"} ${state.profile.subscription.trial ? "— free trial" : ""}`
                    : "No active subscription"}
                </Text>
                <Text style={styles.planSub}>{currentPlan.incomeRange}</Text>
              </View>
            </View>
            {!isPremium ? (
              <Pressable onPress={() => router.push({ pathname: "/onboarding/paywall", params: { fromUpgrade: "1" } })} style={styles.upgradeBtn}>
                <Crown color="#ffffff" size={14} />
                <Text style={styles.upgradeText}>Upgrade to Premium</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>Your business</Text>
          {state.profile.business ? (
            <View style={styles.card}>
              <Text style={styles.bizName}>{state.profile.business.name}</Text>
              <Text style={styles.bizTag}>{state.profile.business.tagline}</Text>
              <Pressable onPress={() => router.push("/onboarding/match")} style={styles.linkRow}>
                <RefreshCw color={Colors.text} size={14} />
                <Text style={styles.linkText}>Find new matches</Text>
              </Pressable>
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

          {user ? (
            <Pressable
              onPress={() => signOut()}
              style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.7 }]}
            >
              <LogOut color={Colors.textDim} size={16} />
              <Text style={styles.dangerText}>Sign out</Text>
            </Pressable>
          ) : null}

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
  header: { color: Colors.text, fontSize: 32, fontWeight: "900", letterSpacing: -0.5, marginBottom: 18 },
  userCard: { padding: 18, borderRadius: 16, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee", marginBottom: 22 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  userName: { color: Colors.text, fontSize: 22, fontWeight: "900" },
  userSub: { color: Colors.textDim, fontSize: 13, marginTop: 4 },
  userEmail: { color: Colors.textDim, fontSize: 13, fontWeight: "600", marginTop: 6 },
  userId: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  signInRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee", alignSelf: "flex-start" },
  signInText: { color: Colors.text, fontSize: 13, fontWeight: "700" },
  nameInput: { color: Colors.text, fontSize: 22, fontWeight: "900", borderBottomWidth: 1, borderBottomColor: Colors.text, paddingVertical: 2 },

  sectionTitle: { color: Colors.textDim, fontWeight: "800", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10, marginTop: 4 },
  card: { padding: 16, borderRadius: 16, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#eeeeee", marginBottom: 18 },
  planRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  planBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  planBadgePremium: { backgroundColor: Colors.accentGold, borderColor: Colors.accentGold },
  planBadgeText: { color: Colors.text, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  planBadgeTextOn: { color: "#ffffff" },
  planTitle: { color: Colors.text, fontSize: 15, fontWeight: "800" },
  planSub: { color: Colors.textDim, fontSize: 12, marginTop: 2 },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, paddingVertical: 12, borderRadius: 999, backgroundColor: Colors.accentGold },
  upgradeText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  cancelSubBtn: { alignSelf: "flex-start", marginTop: 12 },
  cancelSubText: { color: Colors.textDim, fontSize: 12, fontWeight: "700" },
  tinyCancel: { alignSelf: "center", marginTop: 12, paddingVertical: 4, paddingHorizontal: 8 },
  tinyCancelText: { color: Colors.textMuted, fontSize: 9, fontWeight: "500", opacity: 0.5, textDecorationLine: "underline" },

  bizName: { color: Colors.text, fontSize: 17, fontWeight: "900" },
  bizTag: { color: Colors.textDim, fontSize: 13, marginTop: 2 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee" },
  linkText: { color: Colors.text, fontSize: 12, fontWeight: "700" },

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
