import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Flag } from "lucide-react-native";

import { Colors } from "@/constants/colors";

export interface RoadmapMilestone {
  day: number;
  label: string;
  /** 0–1 position along the curve */
  progress: number;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

const W = 320;
const H = 220;
const PAD_X = 22;
const PAD_TOP = 28;
const PAD_BOTTOM = 30;
const INNER_W = W - PAD_X * 2;
const INNER_H = H - PAD_TOP - PAD_BOTTOM;

const PATH = `M ${PAD_X},${PAD_TOP + INNER_H * 0.88}
    C ${PAD_X + INNER_W * 0.22},${PAD_TOP + INNER_H * 0.82}
      ${PAD_X + INNER_W * 0.35},${PAD_TOP + INNER_H * 0.7}
      ${PAD_X + INNER_W * 0.5},${PAD_TOP + INNER_H * 0.48}
    S ${PAD_X + INNER_W * 0.82},${PAD_TOP + INNER_H * 0.1}
      ${PAD_X + INNER_W},${PAD_TOP + INNER_H * 0.04}`;
const PATH_LEN = 620;

function yForX(x: number): number {
  const eased = 1 - Math.pow(1 - x, 2.2);
  return PAD_TOP + INNER_H * (0.88 - eased * 0.84);
}

interface Props {
  milestones: RoadmapMilestone[];
  finalLabel: string;
  finalDay: number;
  /** 0–1, where the "today" pulse should sit along the curve. Defaults to 0 (start). */
  youProgress?: number;
  selected: number | null;
  onSelect: (i: number | null) => void;
  /** Larger variant used on the Progress tab — taller chart, deeper fades. */
  large?: boolean;
}

/**
 * Shared roadmap chart used in both the onboarding paywall flow and the
 * Progress tab. Renders a golden S-curve with milestone dots; tapping a
 * milestone grows its callout (slowly, ease-out) and translates it toward
 * the middle of the chart while a placeholder ring stays at the dot's
 * home position so the user always sees where the milestone belongs.
 */
export function RoadmapChart({
  milestones,
  finalLabel,
  finalDay,
  youProgress = 0,
  selected,
  onSelect,
  large = false,
}: Props) {
  const [wrapW, setWrapW] = useState<number>(W);
  const wrapH = wrapW * (H / W);

  const draw = useRef(new Animated.Value(0)).current;
  const dotAnims = useMemo(() => milestones.map(() => new Animated.Value(0)), [milestones]);
  const selectAnims = useMemo(() => milestones.map(() => new Animated.Value(0)), [milestones]);
  const finalAnim = useRef(new Animated.Value(0)).current;
  const todayPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    draw.setValue(0);
    Animated.timing(draw, {
      toValue: 1,
      duration: 1600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.parallel(
      dotAnims.map((v, i) =>
        Animated.sequence([
          Animated.delay(500 + i * 240),
          Animated.spring(v, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }),
        ]),
      ),
    ).start();

    Animated.sequence([
      Animated.delay(500 + dotAnims.length * 240 + 100),
      Animated.spring(finalAnim, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(todayPulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(todayPulse, { toValue: 0, duration: 700, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.delay(900),
      ]),
    ).start();
  }, [draw, dotAnims, finalAnim, todayPulse]);

  // Snappy, responsive spring when selection changes — short duration so taps
  // feel instant, spring on grow for a touch of life.
  useEffect(() => {
    selectAnims.forEach((v, i) => {
      if (selected === i) {
        Animated.spring(v, {
          toValue: 1,
          friction: 6,
          tension: 160,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(v, {
          toValue: 0,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      }
    });
  }, [selected, selectAnims]);

  const todayCx = (PAD_X + INNER_W * youProgress) / W;
  const todayCy = yForX(youProgress) / H;
  const pulseScale = todayPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const pulseOpacity = todayPulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  const dashOffset = draw.interpolate({ inputRange: [0, 1], outputRange: [PATH_LEN, 0] });

  const onLayout = (e: LayoutChangeEvent) => setWrapW(e.nativeEvent.layout.width);

  return (
    <Pressable onPress={() => onSelect(null)} style={large ? styles.outerLarge : undefined}>
      <View style={[styles.svgWrap, large && styles.svgWrapLarge]} onLayout={onLayout}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <Defs>
            <SvgLinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#e8d9a3" />
              <Stop offset="0.5" stopColor={Colors.accentGold} />
              <Stop offset="1" stopColor="#b8860b" />
            </SvgLinearGradient>
          </Defs>

          <Path
            d={`M ${PAD_X},${PAD_TOP + INNER_H * 0.88} L ${PAD_X + INNER_W},${PAD_TOP + INNER_H * 0.88}`}
            stroke="#f1e2a4"
            strokeWidth={1}
            strokeDasharray="4 6"
            opacity={0.5}
          />

          <AnimatedPath
            d={PATH}
            stroke="url(#lineGrad)"
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={PATH_LEN}
            strokeDashoffset={dashOffset}
          />
        </Svg>

        {/* Today pulse */}
        <View
          pointerEvents="none"
          style={[styles.todayWrap, { left: `${todayCx * 100}%`, top: `${todayCy * 100}%` }]}
        >
          <Animated.View style={[styles.todayPulse, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
          <View style={styles.todayDot} />
        </View>

        {milestones.map((m, i) => {
          const cx = (PAD_X + INNER_W * m.progress) / W;
          const cy = yForX(m.progress) / H;
          const dotPxX = wrapW * cx;
          const dotPxY = wrapH * cy;
          const dx = (wrapW / 2 - dotPxX) * 0.32;
          const dy = (wrapH / 2 - dotPxY) * 0.28;
          const isSelected = selected === i;
          const above = i % 2 === 0;
          const sa = selectAnims[i];
          const calloutScale = sa.interpolate({ inputRange: [0, 1], outputRange: [1, 1.32] });
          const calloutTX = sa.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
          const calloutTY = sa.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
          const ringScale = sa.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.9] });
          const ringOpacity = sa.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] });
          const dotEntryScale = dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });

          return (
            <React.Fragment key={i}>
              {/* Placeholder ring at the dot's home position — shows clearly where the milestone lives while the callout drifts. */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.placeholderRing,
                  {
                    left: `${cx * 100}%`,
                    top: `${cy * 100}%`,
                    opacity: ringOpacity,
                    transform: [{ scale: ringScale }],
                  },
                ]}
              />

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onSelect(isSelected ? null : i);
                }}
                hitSlop={22}
                style={[styles.dotHit, { left: `${cx * 100}%`, top: `${cy * 100}%` }]}
              >
                <Animated.View
                  style={[
                    styles.dot,
                    { opacity: dotAnims[i], transform: [{ scale: dotEntryScale }] },
                  ]}
                />
              </Pressable>

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.calloutWrap,
                  {
                    left: `${cx * 100}%`,
                    top: `${cy * 100}%`,
                    marginLeft: -70,
                    marginTop: above ? -54 : 14,
                    opacity: dotAnims[i],
                    transform: [
                      { translateX: calloutTX },
                      { translateY: calloutTY },
                      { scale: calloutScale },
                    ],
                    zIndex: isSelected ? 10 : 1,
                  },
                ]}
              >
                <View style={styles.callout}>
                  <Animated.View
                    style={[StyleSheet.absoluteFill, styles.calloutGlow, { opacity: sa }]}
                  />
                  <Text style={styles.calloutDay}>DAY {m.day}</Text>
                  <Text style={styles.calloutLabel} numberOfLines={2}>
                    {m.label}
                  </Text>
                  <Animated.Text style={[styles.calloutEstimate, { opacity: sa }]}>
                    ~ estimate
                  </Animated.Text>
                </View>
              </Animated.View>
            </React.Fragment>
          );
        })}

        {/* Final flag */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.finalFlag,
            {
              opacity: finalAnim,
              transform: [{ scale: finalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
            },
          ]}
        >
          <Flag size={13} color={Colors.accentDeep} />
          <Text style={styles.finalFlagText}>{finalLabel}</Text>
          <Text style={styles.finalFlagDay}>· Day {finalDay}</Text>
        </Animated.View>

        {/* Top + bottom fade overlays — multi-stop gradients give a deeper, atmospheric blend into the page. */}
        <LinearGradient
          pointerEvents="none"
          colors={["#ffffff", "rgba(255,255,255,0.92)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
          locations={[0, 0.35, 0.7, 1]}
          style={[styles.fadeTop, large && styles.fadeTopLarge]}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0.92)", "#ffffff"]}
          locations={[0, 0.3, 0.65, 1]}
          style={[styles.fadeBottom, large && styles.fadeBottomLarge]}
        />

        {/* "You are here" tag — only on the larger Progress-tab variant. Anchors the user's current spot on the curve. */}
        {large ? (
          <View pointerEvents="none" style={[styles.youHere, { left: `${todayCx * 100}%`, top: `${todayCy * 100}%` }]}>
            <Text style={styles.youHereText}>YOU ARE HERE</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.axisRow}>
        <View style={styles.axisDotToday} />
        <Text style={styles.axisLabel}>Today</Text>
        <View style={styles.axisSpacer} />
        <Text style={[styles.axisLabel, { color: Colors.accentDeep }]}>~12 months</Text>
        <View style={styles.axisDotEnd} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // The large variant lets the fades bleed past the chart bounds into the
  // page atmosphere above and below, so we don't clip on that variant.
  svgWrap: { width: "100%", aspectRatio: 320 / 220, position: "relative", overflow: "hidden" },
  svgWrapLarge: { aspectRatio: 320 / 280, overflow: "visible" },
  outerLarge: { marginTop: -36, marginBottom: -18 },
  fadeTop: { position: "absolute", left: 0, right: 0, top: 0, height: 48 },
  fadeBottom: { position: "absolute", left: 0, right: 0, bottom: 0, height: 54 },
  // Much more prominent fades on the larger Progress-tab roadmap — they
  // extend up past the chart frame (so the curve dissolves into the bar
  // chart above) and a little past the bottom of the card.
  fadeTopLarge: { height: 150, top: -52 },
  fadeBottomLarge: { height: 130, bottom: -36 },

  youHere: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#fffaeb",
    borderWidth: 1,
    borderColor: "#f1e2a4",
    marginLeft: -44,
    marginTop: -28,
    shadowColor: "#d4af37",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  youHereText: { color: Colors.accentDeep, fontSize: 9, fontWeight: "900", letterSpacing: 1 },

  todayWrap: {
    position: "absolute",
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
    alignItems: "center",
    justifyContent: "center",
  },
  todayPulse: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accentGold,
  },
  todayDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.accentGold,
    borderWidth: 2.5,
    borderColor: "#ffffff",
  },

  placeholderRing: {
    position: "absolute",
    width: 24,
    height: 24,
    marginLeft: -12,
    marginTop: -12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.accentGold,
    backgroundColor: "rgba(212,175,55,0.12)",
  },

  dotHit: {
    position: "absolute",
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accentGold,
    borderWidth: 3.5,
    borderColor: "#ffffff",
    shadowColor: Colors.accentGold,
    shadowOpacity: 0.85,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  calloutWrap: { position: "absolute", width: 140, alignItems: "center" },
  callout: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1e2a4",
    alignItems: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },
  calloutGlow: {
    backgroundColor: "#fffdf2",
    borderRadius: 12,
  },
  calloutDay: { color: Colors.accentDeep, fontSize: 9, fontWeight: "900", letterSpacing: 1.0 },
  calloutLabel: { color: Colors.text, fontSize: 11.5, fontWeight: "800", marginTop: 1, textAlign: "center" },
  calloutEstimate: { color: Colors.textDim, fontSize: 9.5, fontWeight: "700", marginTop: 3, letterSpacing: 0.4, fontStyle: "italic" },

  finalFlag: {
    position: "absolute",
    right: 8,
    top: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fffaeb",
    borderWidth: 1,
    borderColor: "#f1e2a4",
  },
  finalFlagText: { color: Colors.accentDeep, fontSize: 11, fontWeight: "900", letterSpacing: 0.2 },
  finalFlagDay: { color: Colors.textDim, fontSize: 10, fontWeight: "700" },

  axisRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 6, paddingTop: 0, marginTop: -2 },
  axisDotToday: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.textDim },
  axisDotEnd: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accentGold },
  axisSpacer: { flex: 1, height: 1, backgroundColor: "#f1e2a4", opacity: 0.6 },
  axisLabel: { color: Colors.textDim, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
});
