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

/**
 * Horizontal row of tappable emojis. The selected one pops & scales up;
 * the others stay calm. A subtle bounce + haptic plays on tap.
 */
export function EmojiRating({ options, value, onChange, testID }: Props) {
  return (
    <View style={styles.row} testID={testID}>
      {options.map((o) => (
        <EmojiBubble
          key={o.value}
          option={o}
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

function EmojiBubble({ option, selected, onPress }: { option: Option; selected: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(selected ? 1.15 : 1)).current;
  const bg = useRef(new Animated.Value(selected ? 1 : 0)).current;

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
  }, [selected, scale, bg]);

  const bgColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffffff", "#0a0a0a"],
  });
  const borderColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ececec", "#0a0a0a"],
  });

  return (
    <Pressable onPress={onPress} hitSlop={6} style={styles.bubbleWrap}>
      <Animated.View
        style={[
          styles.bubble,
          { transform: [{ scale }], backgroundColor: bgColor, borderColor },
        ]}
      >
        <Text style={styles.emoji}>{option.emoji}</Text>
      </Animated.View>
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {option.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 6 },
  bubbleWrap: { alignItems: "center", flex: 1, gap: 8 },
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
