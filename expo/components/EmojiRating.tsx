import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import { Colors } from "@/constants/colors";

interface Option {
  value: number;
  emoji: string;
  label: string;
}

interface Props {
  options: Option[];
  value: number | null;
  onChange: (v: number) => void;
  testID?: string;
}

/** Warm-to-cool glow palette indexed by rating fraction (0..1). */
function glowColorFor(value: number, total: number): string {
  const ratio = total > 1 ? (value - 1) / (total - 1) : 0;
  // Cool blue (low) -> warm gold (high). Subtle either way.
  if (ratio < 0.25) return "rgba(110, 170, 255, 0.35)"; // cool blue
  if (ratio < 0.55) return "rgba(180, 200, 220, 0.32)"; // neutral
  if (ratio < 0.8) return "rgba(255, 180, 110, 0.36)"; // warm amber
  return "rgba(255, 140, 80, 0.42)"; // hot
}

/**
 * Horizontal row of tappable emojis with a soft radial glow behind
 * the selected one. Scale (native driver) and color/opacity (JS driver)
 * live on separate Animated nodes to avoid mixed-driver crashes.
 */
export function EmojiRating({ options, value, onChange, testID }: Props) {
  return (
    <View style={styles.row} testID={testID}>
      {options.map((o) => (
        <EmojiBubble
          key={o.value}
          option={o}
          totalOptions={options.length}
          selected={value === o.value}
          onPress={() => {
            onChange(o.value);
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }}
        />
      ))}
    </View>
  );
}

function EmojiBubble({ option, selected, onPress, totalOptions }: { option: Option; selected: boolean; onPress: () => void; totalOptions: number }) {
  // CRITICAL: keep transforms (native) and color/opacity (JS) on
  // separate Animated nodes — see prior crash history on this file.
  const scale = useRef(new Animated.Value(selected ? 1.15 : 1)).current;
  const bg = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const glow = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.18 : 1,
      tension: 220,
      friction: 8,
      useNativeDriver: true,
    }).start();
    Animated.timing(bg, {
      toValue: selected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    Animated.timing(glow, {
      toValue: selected ? 1 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [selected, scale, bg, glow]);

  const bgColor = bg.interpolate({ inputRange: [0, 1], outputRange: ["#ffffff", "#0a0a0a"] });
  const borderColor = bg.interpolate({ inputRange: [0, 1], outputRange: ["#ececec", "#0a0a0a"] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const glowColor = glowColorFor(option.value, totalOptions);

  return (
    <Pressable onPress={onPress} hitSlop={6} style={styles.bubbleWrap}>
      <View style={styles.glowWrap} pointerEvents="none">
        <Animated.View style={[styles.glowOuter, { backgroundColor: glowColor, opacity: glowOpacity }]} />
        <Animated.View style={[styles.glowInner, { backgroundColor: glowColor, opacity: glowOpacity }]} />
        <Animated.View style={[styles.bubbleScale, { transform: [{ scale }] }]}>
          <Animated.View style={[styles.bubble, { backgroundColor: bgColor, borderColor }]}>
            <Text style={styles.emoji}>{option.emoji}</Text>
          </Animated.View>
        </Animated.View>
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {option.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 6 },
  bubbleWrap: { alignItems: "center", flex: 1, gap: 10 },
  glowWrap: { width: 96, height: 96, alignItems: "center", justifyContent: "center" },
  glowOuter: { position: "absolute", width: 96, height: 96, borderRadius: 48 },
  glowInner: { position: "absolute", width: 72, height: 72, borderRadius: 36 },
  bubbleScale: { alignItems: "center", justifyContent: "center" },
  bubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  emoji: { fontSize: 28 },
  label: { color: Colors.textMuted, fontSize: 11, fontWeight: "700", textAlign: "center" },
  labelSelected: { color: Colors.text, fontWeight: "900" },
});
