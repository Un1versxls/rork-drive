import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, TextStyle, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Crown, Gem, Snowflake, Sparkle, Sparkles, Sun, Zap } from "lucide-react-native";

import type { NameEffectId } from "@/constants/achievements";
import { Colors } from "@/constants/colors";

interface Props {
  name: string;
  effect: NameEffectId;
  size?: number;
  style?: TextStyle;
}

export function NameBadge({ name, effect, size = 22, style }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  if (!name) return null;

  const baseText: TextStyle = { color: Colors.text, fontSize: size, fontWeight: "900", letterSpacing: -0.3, ...style };

  if (effect === "none") {
    return <Text style={baseText}>{name}</Text>;
  }

  if (effect === "gold_shimmer") {
    const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] });
    return (
      <View style={styles.wrap}>
        <Text style={baseText}>{name}</Text>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: 0.85, transform: [{ translateX }] }]} pointerEvents="none">
          <LinearGradient
            colors={["rgba(212,175,55,0)", "rgba(212,175,55,0.65)", "rgba(232,213,183,0.9)", "rgba(212,175,55,0.65)", "rgba(212,175,55,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Text style={[baseText, styles.overlay, { color: "transparent" }]}>{name}</Text>
      </View>
    );
  }

  if (effect === "ember_glow") {
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
    return (
      <View style={styles.wrap}>
        <Animated.Text
          style={[
            baseText,
            {
              color: "#e89b2b",
              opacity,
              textShadowColor: "rgba(232,155,43,0.9)",
              textShadowRadius: 14,
            } as TextStyle,
          ]}
        >
          {name}
        </Animated.Text>
      </View>
    );
  }

  if (effect === "phoenix_aura") {
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
    return (
      <View style={styles.wrap}>
        <Animated.View
          style={[
            styles.auraHalo,
            {
              opacity,
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={["rgba(255,241,184,0.7)", "rgba(255,215,107,0.1)", "rgba(212,175,55,0)"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Text style={[baseText, { color: "#8b7355", textShadowColor: "rgba(255,241,184,0.9)", textShadowRadius: 18 } as TextStyle]}>
          {name}
        </Text>
      </View>
    );
  }

  if (effect === "founders_mark") {
    return (
      <View style={[styles.wrap, { flexDirection: "row", alignItems: "center", gap: 6 }]}>
        <Crown color={Colors.accentDeep} size={Math.round(size * 0.7)} />
        <View>
          <Text style={baseText}>{name}</Text>
          <View style={styles.foundersLine} />
        </View>
      </View>
    );
  }

  if (effect === "diamond_trail") {
    const o = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] });
    return (
      <View style={[styles.wrap, { flexDirection: "row", alignItems: "center", gap: 4 }]}>
        <Text style={baseText}>{name}</Text>
        <Animated.View style={{ opacity: o }}>
          <Sparkles color="#d4af37" size={Math.round(size * 0.6)} />
        </Animated.View>
        <Animated.View style={{ opacity: o }}>
          <Gem color="#c9a87c" size={Math.round(size * 0.55)} />
        </Animated.View>
      </View>
    );
  }

  if (effect === "neon_pulse") {
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
    const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
    return (
      <View style={styles.wrap}>
        <Animated.Text
          style={[
            baseText,
            {
              color: "#2bd6ff",
              opacity,
              textShadowColor: "rgba(43,214,255,0.9)",
              textShadowRadius: 16,
              transform: [{ scale }],
            } as TextStyle,
          ]}
        >
          {name}
        </Animated.Text>
      </View>
    );
  }

  if (effect === "frost_edge") {
    const o = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] });
    return (
      <View style={[styles.wrap, { flexDirection: "row", alignItems: "center", gap: 5 }]}>
        <Animated.View style={{ opacity: o }}>
          <Snowflake color="#9ecbe8" size={Math.round(size * 0.65)} />
        </Animated.View>
        <Text style={[baseText, { color: "#5b89a8", textShadowColor: "rgba(200,230,255,0.9)", textShadowRadius: 10 } as TextStyle]}>
          {name}
        </Text>
      </View>
    );
  }

  if (effect === "royal_crown") {
    return (
      <View style={[styles.wrap, { flexDirection: "row", alignItems: "center", gap: 6 }]}>
        <Crown color="#b8860b" size={Math.round(size * 0.78)} fill="#d4af37" />
        <Text style={[baseText, { color: "#8b6b1f" } as TextStyle]}>{name}</Text>
      </View>
    );
  }

  if (effect === "solar_flare") {
    const rot = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
    return (
      <View style={[styles.wrap, { flexDirection: "row", alignItems: "center", gap: 6 }]}>
        <Animated.View style={{ transform: [{ rotate: rot }], opacity }}>
          <Sun color="#ff9a1f" size={Math.round(size * 0.75)} fill="#ffc14d" />
        </Animated.View>
        <Text style={[baseText, { color: "#b8560e", textShadowColor: "rgba(255,154,31,0.85)", textShadowRadius: 14 } as TextStyle]}>
          {name}
        </Text>
      </View>
    );
  }

  if (effect === "void_black") {
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
    return (
      <View style={styles.wrap}>
        <Animated.Text
          style={[
            baseText,
            {
              color: "#0a0a14",
              opacity,
              textShadowColor: "rgba(130,80,255,0.9)",
              textShadowRadius: 18,
            } as TextStyle,
          ]}
        >
          {name}
        </Animated.Text>
      </View>
    );
  }

  if (effect === "rainbow_wave") {
    const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-80, 80] });
    return (
      <View style={styles.wrap}>
        <Text style={baseText}>{name}</Text>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]} pointerEvents="none">
          <LinearGradient
            colors={["#ff5e7e", "#ffa94d", "#ffd93d", "#6bcB77", "#4d96ff", "#b06bff", "#ff5e7e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Text style={[baseText, styles.overlay, { color: "transparent" }]}>{name}</Text>
      </View>
    );
  }

  if (effect === "electric") {
    const o = anim.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [1, 0.6, 1, 0.7] });
    return (
      <View style={[styles.wrap, { flexDirection: "row", alignItems: "center", gap: 4 }]}>
        <Animated.View style={{ opacity: o }}>
          <Zap color="#ffd93d" size={Math.round(size * 0.7)} fill="#fff176" />
        </Animated.View>
        <Animated.Text
          style={[
            baseText,
            {
              color: "#6a4a00",
              textShadowColor: "rgba(255,217,61,0.9)",
              textShadowRadius: 12,
              opacity: o,
            } as TextStyle,
          ]}
        >
          {name}
        </Animated.Text>
      </View>
    );
  }

  if (effect === "mythic_rune") {
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
    const rot = anim.interpolate({ inputRange: [0, 1], outputRange: ["-8deg", "8deg"] });
    return (
      <View style={[styles.wrap, { flexDirection: "row", alignItems: "center", gap: 5 }]}>
        <Animated.View style={{ opacity, transform: [{ rotate: rot }] }}>
          <Sparkle color="#b06bff" size={Math.round(size * 0.6)} fill="#e0b4ff" />
        </Animated.View>
        <Text style={[baseText, { color: "#5b2ea8", textShadowColor: "rgba(176,107,255,0.85)", textShadowRadius: 14 } as TextStyle]}>
          {name}
        </Text>
        <Animated.View style={{ opacity, transform: [{ rotate: rot }] }}>
          <Sparkle color="#b06bff" size={Math.round(size * 0.6)} fill="#e0b4ff" />
        </Animated.View>
      </View>
    );
  }

  return <Text style={baseText}>{name}</Text>;
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "flex-start", overflow: "hidden" },
  overlay: { position: "absolute", top: 0, left: 0 },
  auraHalo: { position: "absolute", left: -14, right: -14, top: -8, bottom: -8, borderRadius: 200 },
  foundersLine: { height: 2, backgroundColor: "#d4af37", borderRadius: 2, marginTop: 2 },
});
