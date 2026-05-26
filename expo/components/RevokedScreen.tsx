import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ShieldOff } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";

interface RevokedScreenProps {
  onSignInAgain: () => void;
}

/**
 * Full-screen lock shown when an admin has revoked the user's access.
 * The local flag persists across launches; only signing back in with a
 * dev-allowlisted account (or admin unbanning the device) restores access.
 */
export function RevokedScreen({ onSignInAgain }: RevokedScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <ShieldOff color={Colors.danger} size={36} strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>Your access has been revoked.</Text>
        <Text style={styles.copy}>
          An administrator has removed your access to DRIVE on this device.
          If you believe this is a mistake, contact support.
        </Text>
        <Pressable onPress={onSignInAgain} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} testID="revoked-sign-in">
          <Text style={styles.btnText}>Sign in with another account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  inner: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconWrap: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(196,69,69,0.08)",
    borderWidth: 1.5, borderColor: "rgba(196,69,69,0.35)",
    marginBottom: 26,
  },
  title: { color: Colors.text, fontSize: 22, fontWeight: "900", textAlign: "center", letterSpacing: -0.3 },
  copy: { color: Colors.textDim, fontSize: 14, lineHeight: 21, marginTop: 12, textAlign: "center", fontWeight: "600", maxWidth: 320 },
  btn: {
    marginTop: 28,
    paddingHorizontal: 22, paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: Colors.text,
  },
  btnText: { color: "#ffffff", fontSize: 14, fontWeight: "800", letterSpacing: 0.3 },
});
