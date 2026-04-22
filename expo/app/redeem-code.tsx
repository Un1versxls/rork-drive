import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { useApp } from "@/providers/AppProvider";

export default function RedeemCodeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const goBack = () => {
    try {
      if (navigation.canGoBack()) {
        router.back();
      } else {
        router.replace("/onboarding/paywall");
      }
    } catch (e) {
      console.log("[redeem-code] back error", e);
      router.replace("/onboarding/paywall");
    }
  };
  const { redeemCode, redeemPending } = useAuth();
  const { grantPremiumViaCode } = useApp();
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const onRedeem = async () => {
    setError(null);
    try {
      await redeemCode(code);
      grantPremiumViaCode();
      Alert.alert("Success", "Your code has been applied.");
      router.replace("/onboarding/match");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid code";
      setError(msg);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <Pressable onPress={goBack} hitSlop={16} style={styles.closeBtn} testID="redeem-close-btn">
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>PRIVATE ACCESS</Text>
        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.sub}>Admin, creator, or free-subscription codes only.</Text>

        <TextInput
          value={code}
          onChangeText={(s) => setCode(s.toUpperCase())}
          placeholder=""
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
          testID="admin-code-input"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={{ height: 20 }} />
        <GradientButton title="Apply code" onPress={onRedeem} loading={redeemPending} disabled={!code} />
        <Pressable onPress={goBack} style={styles.cancel} testID="redeem-cancel-btn">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  closeBtn: { alignSelf: "flex-end", width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: 10 },
  closeText: { color: Colors.textDim, fontSize: 22, fontWeight: "400" },
  content: { paddingHorizontal: 24, paddingTop: 12 },
  eyebrow: { color: Colors.accentGold, letterSpacing: 3, fontWeight: "900", fontSize: 11 },
  title: { color: Colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.6, marginTop: 8 },
  sub: { color: Colors.textDim, fontSize: 14, marginTop: 8, marginBottom: 26 },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#eeeeee",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 2,
    color: Colors.text,
    textAlign: "center",
  },
  error: { color: Colors.danger, fontSize: 13, fontWeight: "600", marginTop: 12, textAlign: "center" },
  cancel: { alignSelf: "center", paddingVertical: 14, marginTop: 8 },
  cancelText: { color: Colors.textDim, fontSize: 13, fontWeight: "700" },
});
