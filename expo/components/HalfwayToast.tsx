import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

interface Props {
  visible: boolean;
  onHide: () => void;
}

export function HalfwayToast({ visible, onHide }: Props) {
  const slide = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.sequence([
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 7 }),
      Animated.delay(2200),
      Animated.timing(slide, { toValue: -120, duration: 280, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onHide();
    });
  }, [visible, slide, onHide]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: slide }] }]} pointerEvents="none">
      <View style={styles.card}>
        <Text style={styles.emoji}>🔥</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Great job — halfway there</Text>
          <Text style={styles.sub}>Finish strong. Momentum compounds.</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 60, left: 16, right: 16, zIndex: 100 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16,
    backgroundColor: Colors.text,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  emoji: { fontSize: 26 },
  title: { color: "#ffffff", fontWeight: "900", fontSize: 15 },
  sub: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
});
