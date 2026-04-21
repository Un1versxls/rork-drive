import React from "react";
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { Colors } from "@/constants/colors";

interface Props extends ViewProps {
  glow?: boolean;
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

export function GlassCard({ children, glow, padding = 20, style, ...rest }: Props) {
  return (
    <View style={[styles.card, glow && styles.glow, { padding }, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  glow: {
    borderColor: Colors.borderStrong,
    shadowColor: Colors.accent,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
});
