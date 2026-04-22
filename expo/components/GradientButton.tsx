import React from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost" | "gold";
  style?: ViewStyle;
  testID?: string;
  icon?: React.ReactNode;
}

export function GradientButton({ title, onPress, disabled, loading, variant = "primary", style, testID, icon }: Props) {
  const handle = () => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    onPress();
  };

  if (variant === "ghost") {
    return (
      <Pressable
        testID={testID}
        onPress={handle}
        disabled={disabled || loading}
        style={({ pressed }) => [styles.ghost, pressed && styles.pressed, style]}
      >
        <Text style={styles.ghostText}>{title}</Text>
      </Pressable>
    );
  }

  const bg = variant === "gold" ? Colors.accentGold : Colors.text;
  const textColor = "#ffffff";

  return (
    <Pressable
      testID={testID}
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.wrap, { backgroundColor: bg }, pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, { color: textColor }]}>{title}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  text: { fontWeight: "800", fontSize: 16, letterSpacing: 0.2 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.35 },
  ghost: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#eeeeee",
    backgroundColor: "#ffffff",
  },
  ghostText: { color: Colors.text, fontWeight: "700", fontSize: 15 },
});
