import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { useApp } from "@/providers/AppProvider";

export default function RedeemScreen() {
  const router = useRouter();
  const { user, redeemCode, redeemPending } = useAuth();
  const { grantPremiumViaCode } = useApp();
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const onRedeem = async () => {
    setError(null);
    if (!user) {
      Alert.alert("Sign in required", "Create an account or sign in to redeem a code.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign in", onPress: () => router.push("/auth") },
      ]);
      return;
    }
    try {
      await redeemCode(code);
      grantPremiumViaCode();
      Alert.alert("Success", "Premium unlocked. Enjoy DRIVE.");
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid code";
      setError(msg);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Redeem a code</Text>
        <Text style={styles.sub}>Got a creator code or promo? Drop it below.</Text>

        <TextInput
          value={code}
          onChangeText={(s) => setCode(s.toUpperCase())}
          placeholder="e.g. TIKTOK2026"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={{ height: 16 }} />
        <GradientButton title="Redeem" onPress={onRedeem} loading={redeemPending} disabled={!code} />
        <Pressable onPress={() => router.back()} style={styles.cancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 24 },
  title: { color: Colors.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.4 },
  sub: { color: Colors.textDim, fontSize: 14, marginTop: 6, marginBottom: 22 },
  input: { backgroundColor: "#ffffff", borderWidth: 1.5, borderColor: "#eeeeee", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 18, fontWeight: "700", letterSpacing: 1, color: Colors.text },
  error: { color: Colors.danger, fontSize: 13, fontWeight: "600", marginTop: 10 },
  cancel: { alignSelf: "center", paddingVertical: 14, marginTop: 6 },
  cancelText: { color: Colors.textDim, fontSize: 14, fontWeight: "700" },
});
