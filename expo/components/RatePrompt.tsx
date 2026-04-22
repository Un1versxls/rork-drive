import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View, Linking } from "react-native";
import { Star } from "lucide-react-native";

import { Colors } from "@/constants/colors";
import { useApp } from "@/providers/AppProvider";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const APP_STORE_URL = "https://apps.apple.com/app/id0000000000";

export function RatePrompt() {
  const { state, markRated, markRatePromptSeen, hasActiveSubscription } = useApp();
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!hasActiveSubscription) return;
    if (state.profile.hasRated) return;
    const last = state.profile.lastRatePromptAt;
    const now = Date.now();
    if (!last) {
      const t = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(t);
    }
    const since = now - new Date(last).getTime();
    if (since > THIRTY_DAYS) {
      const t = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(t);
    }
  }, [hasActiveSubscription, state.profile.hasRated, state.profile.lastRatePromptAt]);

  const onRate = () => {
    setVisible(false);
    markRated();
    Linking.openURL(APP_STORE_URL).catch(() => {});
  };

  const onLater = () => {
    setVisible(false);
    markRatePromptSeen();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.stars}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={24} color={Colors.accentGold} fill={Colors.accentGold} />
            ))}
          </View>
          <Text style={styles.title}>Enjoying DRIVE?</Text>
          <Text style={styles.sub}>A quick rating helps other hustlers find us.</Text>
          <Pressable onPress={onRate} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Rate the app</Text>
          </Pressable>
          <Pressable onPress={onLater} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 28 },
  sheet: { backgroundColor: "#ffffff", borderRadius: 22, padding: 24, alignItems: "center" },
  stars: { flexDirection: "row", gap: 4, marginBottom: 12 },
  title: { color: Colors.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  sub: { color: Colors.textDim, fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 18 },
  primary: { backgroundColor: Colors.text, alignSelf: "stretch", paddingVertical: 14, borderRadius: 999, alignItems: "center" },
  primaryText: { color: "#ffffff", fontWeight: "800", fontSize: 15 },
  secondary: { alignSelf: "stretch", paddingVertical: 12, alignItems: "center", marginTop: 8 },
  secondaryText: { color: Colors.textDim, fontWeight: "700", fontSize: 14 },
  pressed: { opacity: 0.85 },
});
