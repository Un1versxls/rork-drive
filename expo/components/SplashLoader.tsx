import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

interface Props {
  label?: string;
  streak?: number;
  showStreak?: boolean;
}

export function SplashLoader({ label }: Props) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.center, { opacity: fade }]}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.title}>DRIVE</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  icon: { width: 112, height: 112, borderRadius: 26 },
  title: { color: Colors.text, fontSize: 34, fontWeight: "900", letterSpacing: 6, marginTop: 24 },
  label: { color: Colors.textMuted, fontSize: 12, marginTop: 12, fontWeight: "600", letterSpacing: 1 },
});
