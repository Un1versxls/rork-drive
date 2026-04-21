import React from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost";
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

  return (
    <Pressable
      testID={testID}
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={["#1a1a1a", "#2a2a2a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.grad}
      >
        <View style={styles.row}>
          {loading ? (
            <ActivityIndicator color="#f5f4f0" />
          ) : (
            <>
              {icon}
              <Text style={styles.text}>{title}</Text>
            </>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  grad: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  text: { color: "#faf9f6", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.35 },
  ghost: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBg,
  },
  ghostText: { color: Colors.text, fontWeight: "700", fontSize: 15 },
});
