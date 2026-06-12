import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Colors } from "@/constants/colors";

export interface BarDatum {
  label: string;
  /** 0–1 relative height. */
  value: number;
  caption: string;
  highlight?: boolean;
}

interface Props {
  bars: BarDatum[];
  /** Pixel height of the tallest bar. */
  maxHeight?: number;
}

/**
 * Clean vertical bar chart used in onboarding to contrast "without an app",
 * "other apps", and "with DRIVE". Bars grow up from the baseline in a quick
 * staggered sequence; the highlighted bar gets a golden gradient + glow.
 */
export function BarCompareChart({ bars, maxHeight = 180 }: Props) {
  const anims = useMemo(() => bars.map(() => new Animated.Value(0)), [bars]);

  useEffect(() => {
    anims.forEach((v) => v.setValue(0));
    Animated.stagger(
      130,
      anims.map((v) =>
        Animated.spring(v, { toValue: 1, friction: 7, tension: 70, useNativeDriver: false }),
      ),
    ).start();
  }, [anims]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, { height: maxHeight + 8 }]}>
        {bars.map((b, i) => {
          const h = anims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [6, Math.max(10, b.value * maxHeight)],
          });
          const opacity = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
          return (
            <View key={b.label} style={styles.col}>
              <Animated.Text style={[styles.value, { opacity }]}>{b.caption}</Animated.Text>
              <Animated.View style={[styles.barOuter, { height: h }]}>
                {b.highlight ? (
                  <LinearGradient
                    colors={["#f4d77a", Colors.accentGold, "#b8860b"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[StyleSheet.absoluteFill, styles.barRadius]}
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.barRadius, styles.barFlat]} />
                )}
              </Animated.View>
              <Text style={[styles.label, b.highlight && styles.labelOn]} numberOfLines={2}>
                {b.label}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.baseline} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "stretch" },
  row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", gap: 14 },
  col: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barOuter: {
    width: "78%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
    shadowColor: "#d4af37",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  barRadius: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  barFlat: { backgroundColor: "#e8e6e0" },
  value: { color: Colors.text, fontSize: 13, fontWeight: "900", marginBottom: 6 },
  label: { color: Colors.textDim, fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: 10, lineHeight: 15 },
  labelOn: { color: Colors.accentDeep, fontWeight: "900" },
  baseline: { height: 2, backgroundColor: "#efece4", borderRadius: 1, marginTop: -1 },
});
