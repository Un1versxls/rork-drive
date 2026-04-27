import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LogIn, UserPlus } from "lucide-react-native";

import { OnboardingShell } from "@/components/OnboardingShell";
import { Colors } from "@/constants/colors";

export default function SyncAccountsScreen() {
  const router = useRouter();

  return (
    <OnboardingShell
      step={9}
      total={12}
      title="Sync your account"
      subtitle="Sign in to restore your progress, or create a new account to start fresh."
      footer={<View />}
    >
      <View style={styles.wrap}>
        <Pressable
          onPress={() => router.push("/onboarding/sign-in")}
          style={({ pressed }) => [styles.card, styles.primaryCard, pressed && styles.pressed]}
          testID="sync-signin"
        >
          <View style={styles.iconWrapDark}>
            <LogIn color="#ffffff" size={22} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.cardTitleLight}>I have an account</Text>
            <Text style={styles.cardSubLight}>Sign in to sync your progress across devices.</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push("/onboarding/apple-signin")}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          testID="sync-create"
        >
          <View style={styles.iconWrap}>
            <UserPlus color={Colors.text} size={22} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.cardTitle}>Create a new account</Text>
            <Text style={styles.cardSub}>Start fresh — takes less than a minute.</Text>
          </View>
        </Pressable>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14, paddingTop: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fafafa",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  primaryCard: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  iconWrapDark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  textCol: { flex: 1 },
  cardTitle: { color: Colors.text, fontSize: 17, fontWeight: "800", marginBottom: 4 },
  cardSub: { color: Colors.textDim, fontSize: 13, lineHeight: 18 },
  cardTitleLight: { color: "#ffffff", fontSize: 17, fontWeight: "800", marginBottom: 4 },
  cardSubLight: { color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 18 },
});
