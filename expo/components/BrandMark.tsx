import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  size?: number;
  animated?: boolean;
  testID?: string;
}

export function BrandMark({ size = 120, animated = true, testID }: Props) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [animated, spin, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.1] });

  const ringSize = size;
  const coreSize = Math.round(size * 0.72);
  const letterSize = Math.round(size * 0.42);
  const glowSize = Math.round(size * 1.9);

  return (
    <View style={[styles.wrap, { width: glowSize, height: glowSize }]} testID={testID}>
      <Animated.View
        style={[
          styles.glow,
          { width: glowSize, height: glowSize, opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      >
        <LinearGradient
          colors={["rgba(212,175,55,0.38)", "rgba(201,168,124,0.12)", "rgba(201,168,124,0)"]}
          style={styles.glowFill}
        />
      </Animated.View>

      <Animated.View style={[styles.ring, { width: ringSize, height: ringSize, borderRadius: ringSize / 2, transform: [{ rotate }] }]}>
        <LinearGradient
          colors={["#f4e4bc", "#d4af37", "#8b7355", "#d4af37", "#f4e4bc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View
        style={[
          styles.ringMask,
          {
            width: ringSize - 8,
            height: ringSize - 8,
            borderRadius: (ringSize - 8) / 2,
          },
        ]}
      />

      <View
        style={[
          styles.core,
          {
            width: coreSize,
            height: coreSize,
            borderRadius: coreSize / 2,
          },
        ]}
      >
        <LinearGradient
          colors={["#1f1a12", "#2a2118", "#14100a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.innerHighlight, { borderRadius: coreSize / 2 }]}>
          <LinearGradient
            colors={["rgba(244,228,188,0.22)", "rgba(244,228,188,0)"]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <MaskedLetter letter="D" size={letterSize} />
      </View>
    </View>
  );
}

function MaskedLetter({ letter, size }: { letter: string; size: number }) {
  if (Platform.OS === "web") {
    return (
      <Text
        style={{
          fontSize: size,
          fontWeight: "900",
          letterSpacing: -2,
          ...({
            backgroundImage: "linear-gradient(135deg, #f7e7be 0%, #d4af37 45%, #8b7355 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
          } as object),
        }}
      >
        {letter}
      </Text>
    );
  }
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text
        style={{
          fontSize: size,
          fontWeight: "900",
          letterSpacing: -2,
          color: "#f4e4bc",
          textShadowColor: "rgba(212,175,55,0.6)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 8,
        }}
      >
        {letter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute", borderRadius: 999 },
  glowFill: { flex: 1, borderRadius: 999 },
  ring: {
    position: "absolute",
    overflow: "hidden",
    shadowColor: "#d4af37",
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },
  ringMask: {
    position: "absolute",
    backgroundColor: "#faf9f6",
  },
  core: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.55)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
  },
});
