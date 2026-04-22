import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

const LOGO_URI = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ildjxbdtuicbf06zk7zn0.jpeg";

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
        <View style={styles.iconWrap}>
          <Image
            source={{ uri: LOGO_URI }}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>DRIVE</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 132,
    height: 132,
    borderRadius: 30,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  icon: { width: 104, height: 104 },
  title: { color: Colors.text, fontSize: 34, fontWeight: "900", letterSpacing: 6, marginTop: 24 },
  label: { color: Colors.textMuted, fontSize: 12, marginTop: 12, fontWeight: "600", letterSpacing: 1 },
});
