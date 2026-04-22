import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";

const LOGO_URI = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ildjxbdtuicbf06zk7zn0.jpeg";

export default function Welcome() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <Animated.View style={[styles.content, { opacity: fade }]}>
          <View style={styles.iconWrap}>
            <Image
              source={{ uri: LOGO_URI }}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>DRIVE</Text>
          <Text style={styles.subtitle}>
            The app that turns your goals into daily tasks — and actually keeps you moving.
          </Text>
        </Animated.View>

        <View style={styles.cta}>
          <GradientButton title="Get started" onPress={() => router.push("/onboarding/goal")} testID="cta-start" />
          <Text style={styles.smallLegal}>Takes under two minutes</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  safe: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  iconWrap: {
    width: 132,
    height: 132,
    borderRadius: 30,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  icon: { width: 104, height: 104 },
  title: { color: Colors.text, fontSize: 44, fontWeight: "900", letterSpacing: 6, marginTop: 20 },
  subtitle: { color: Colors.textDim, fontSize: 17, textAlign: "center", lineHeight: 24, maxWidth: 320 },
  cta: { gap: 12, paddingBottom: 12 },
  smallLegal: { color: Colors.textMuted, textAlign: "center", fontSize: 12 },
});
