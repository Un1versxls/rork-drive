import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from "react-native-svg";

import { Colors } from "@/constants/colors";

interface Props {
  size?: number;
  strokeWidth?: number;
  progress: number;
  label?: string;
  sub?: string;
}

export function ProgressRing({ size = 120, strokeWidth = 10, progress, label, sub }: Props) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const dash = c * clamped;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGrad id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#d4af37" />
            <Stop offset="1" stopColor="#c9a87c" />
          </SvgGrad>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash}, ${c}`}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {label ? <Text style={styles.label}>{label}</Text> : null}
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  center: { position: "absolute", alignItems: "center", justifyContent: "center" },
  label: { color: Colors.text, fontSize: 26, fontWeight: "900" },
  sub: { color: Colors.textDim, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 2 },
});
