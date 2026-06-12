import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { DollarSign, Flag, Sparkles } from "lucide-react-native";

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
  /** Number of days the user has had their DRIVE account. When provided, shows a gold "DAY N" badge anchored to the chart so the eyebrow text above never gets faded. */
  daysOnAccount?: number;
  /** Index of the milestone to auto-expand once the entrance animation finishes (Cal AI style). Usually the next uncompleted milestone. Null disables. */
  autoSelectIndex?: number | null;
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
  daysOnAccount,
  autoSelectIndex = null,
}: Props) {
  const [wrapW, setWrapW] = useState<number>(W);
  const wrapH = wrapW * (H / W);
  const [finalOpen, setFinalOpen] = useState<boolean>(false);

  const draw = useRef(new Animated.Value(0)).current;
  // Whole-chart entrance: slide in from the left + fade (Cal AI feel).
  const enterX = useRef(new Animated.Value(-34)).current;
  const enterFade = useRef(new Animated.Value(0)).current;
  const dotAnims = useMemo(() => milestones.map(() => new Animated.Value(0)), [milestones]);
  const selectAnims = useMemo(() => milestones.map(() => new Animated.Value(0)), [milestones]);
  const finalAnim = useRef(new Animated.Value(0)).current;
  const todayPulse = useRef(new Animated.Value(0)).current;
  // Tracks whether the user has interacted, so the one-time auto-expand never
  // fights a manual tap.
  const userTouchedRef = useRef<boolean>(false);

  // Timing constants for the staged Cal AI entrance.
  const DRAW_MS = 1150;
  const DRAW_DELAY = 160;
  const DOTS_START = DRAW_DELAY + DRAW_MS - 120; // dots begin right as the line finishes
  const DOT_STAGGER = 150;

  useEffect(() => {
    draw.setValue(0);
    enterX.setValue(-34);
    enterFade.setValue(0);
    dotAnims.forEach((v) => v.setValue(0));
    finalAnim.setValue(0);
    userTouchedRef.current = false;

    // 1) Chart panel slides in from the side and fades up.
    Animated.parallel([
      Animated.timing(enterX, { toValue: 0, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(enterFade, { toValue: 1, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    // 2) The golden line draws left -> right.
    Animated.sequence([
      Animated.delay(DRAW_DELAY),
      Animated.timing(draw, {
        toValue: 1,
        duration: DRAW_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    // 3) Dots pop in one-by-one ONLY after the line is fully drawn.
    Animated.parallel(
      dotAnims.map((v, i) =>
        Animated.sequence([
          Animated.delay(DOTS_START + i * DOT_STAGGER),
          Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
        ]),
      ),
    ).start();

    // 4) Final goal marker after the dots.
    Animated.sequence([
      Animated.delay(DOTS_START + dotAnims.length * DOT_STAGGER + 80),
      Animated.spring(finalAnim, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
    ]).start();

    // 5) One-time auto-expand of the next uncompleted milestone, once the
    //    dots have settled — mimics Cal AI showing the active step expanded.
    let autoHandle: ReturnType<typeof setTimeout> | null = null;
    if (autoSelectIndex !== null && autoSelectIndex >= 0 && autoSelectIndex < milestones.length) {
      const delay = DOTS_START + dotAnims.length * DOT_STAGGER + 260;
      autoHandle = setTimeout(() => {
        if (!userTouchedRef.current) onSelect(autoSelectIndex);
      }, delay);
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(todayPulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(todayPulse, { toValue: 0, duration: 700, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.delay(900),
      ]),
    ).start();

    return () => { if (autoHandle) clearTimeout(autoHandle); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw, dotAnims, finalAnim, todayPulse, enterX, enterFade, autoSelectIndex]);

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
    <Pressable onPress={() => { userTouchedRef.current = true; onSelect(null); }} style={large ? styles.outerLarge : undefined}>
      <Animated.View style={[styles.svgWrap, large && styles.svgWrapLarge, { opacity: enterFade, transform: [{ translateX: enterX }] }]} onLayout={onLayout}>
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
          // 4-cycle vertical stagger so adjacent compact pills never sit at
          // the same Y and visually overlap when milestones are close.
          const stagger = i % 4;
          const compactExtraY = stagger === 0 ? -18 : stagger === 1 ? 0 : stagger === 2 ? 0 : -18;
          const sa = selectAnims[i];
          const ringScale = sa.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.9] });
          const ringOpacity = sa.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] });
          const dotEntryScale = dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
          // Compact day-pill fades out as the big callout grows in.
          const compactOpacity = Animated.multiply(
            dotAnims[i],
            sa.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          );
          // Big callout fades in from selection.
          const bigOpacity = sa;
          const bigScale = sa.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
          const bigTX = sa.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
          const bigTY = sa.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });

          return (
            <React.Fragment key={i}>
              {/* Placeholder ring shows where the milestone lives while the big callout drifts inward. */}
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
                  userTouchedRef.current = true;
                  onSelect(isSelected ? null : i);
                }}
                hitSlop={28}
                style={[styles.dotHit, { left: `${cx * 100}%`, top: `${cy * 100}%` }]}
              >
                <Animated.View
                  style={[
                    styles.dot,
                    { opacity: dotAnims[i], transform: [{ scale: dotEntryScale }] },
                  ]}
                />
              </Pressable>

              {/* Compact day chip — visible when this milestone is NOT selected. */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.compactWrap,
                  {
                    left: `${cx * 100}%`,
                    top: `${cy * 100}%`,
                    marginLeft: -20,
                    marginTop: (above ? -34 : 14) + (above ? compactExtraY : -compactExtraY),
                    opacity: compactOpacity,
                  },
                ]}
              >
                <View style={styles.compactPill}>
                  <Text style={styles.compactPillText}>D{m.day}</Text>
                </View>
              </Animated.View>

              {/* Big callout — only visible when selected. Translates toward chart center. */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.calloutWrap,
                  {
                    left: `${cx * 100}%`,
                    top: `${cy * 100}%`,
                    marginLeft: -78,
                    marginTop: above ? -70 : 18,
                    opacity: bigOpacity,
                    transform: [
                      { translateX: bigTX },
                      { translateY: bigTY },
                      { scale: bigScale },
                    ],
                    zIndex: isSelected ? 10 : 1,
                  },
                ]}
              >
                <View style={styles.callout}>
                  <Text style={styles.calloutDay}>DAY {m.day}</Text>
                  <Text style={styles.calloutLabel} numberOfLines={2}>
                    {m.label}
                  </Text>
                  <Text style={styles.calloutEstimate}>~ estimate</Text>
                </View>
              </Animated.View>
            </React.Fragment>
          );
        })}

        {/* Final goal — compact tappable money icon. Tapping toggles a callout
            with the full label + day so the top-right corner stays light and
            doesn't crowd the journey badge / chart. */}
        <Animated.View
          style={[
            styles.finalFlagAnchor,
            {
              opacity: finalAnim,
              transform: [{ scale: finalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
            },
          ]}
        >
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              setFinalOpen((v) => !v);
            }}
            hitSlop={12}
            style={styles.finalCoin}
          >
            <DollarSign size={14} color={Colors.accentDeep} strokeWidth={3} />
          </Pressable>
          {finalOpen ? (
            <View style={styles.finalPopover} pointerEvents="box-none">
              <Flag size={11} color={Colors.accentDeep} />
              <Text style={styles.finalFlagText} numberOfLines={1}>{finalLabel}</Text>
              <Text style={styles.finalFlagDay}>· Day {finalDay}</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Bottom-only fade — kept subtle so the curve dissolves into the
            page below, but we no longer fade the TOP because it was eating
            the eyebrow / next-milestone text on the Progress tab. */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0.92)", "#ffffff"]}
          locations={[0, 0.3, 0.65, 1]}
          style={[styles.fadeBottom, large && styles.fadeBottomLarge]}
        />



        {/* "You are here" tag — only on the larger Progress-tab variant. Anchors the user's current spot on the curve. */}
        {large ? (
          <View pointerEvents="none" style={[styles.youHere, { left: `${todayCx * 100}%`, top: `${todayCy * 100}%` }]}>
            <Text style={styles.youHereText}>YOU</Text>
          </View>
        ) : null}
      </Animated.View>

      {/* "DAY N of your journey" — moved BELOW the chart so it never
          overlaps the first milestone pill or the top-right goal icon.
          Sits between the chart and the timeline axis. */}
      {typeof daysOnAccount === "number" && daysOnAccount >= 1 ? (
        <View style={styles.journeyBadgeBottom}>
          <Sparkles size={11} color={Colors.accentDeep} />
          <Text style={styles.journeyDay}>DAY {daysOnAccount}</Text>
          <Text style={styles.journeySub}>of your journey</Text>
        </View>
      ) : null}

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
  outerLarge: { marginTop: -28, marginBottom: 12 },
  fadeBottom: { position: "absolute", left: 0, right: 0, bottom: 0, height: 54 },
  // Larger Progress-tab roadmap — slightly extended bottom fade only.
  fadeBottomLarge: { height: 84, bottom: -20 },

  journeyBadgeBottom: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fffaeb",
    borderWidth: 1,
    borderColor: "#f1e2a4",
    marginTop: 4,
    shadowColor: "#d4af37",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  journeyDay: { color: Colors.accentDeep, fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },
  journeySub: { color: Colors.textDim, fontSize: 10, fontWeight: "700" },

  // "YOU" pill is centered ON the curve, sitting directly over the today
  // dot (not floating above it). marginTop is half the pill height so it
  // visually sits on the line.
  youHere: {
    position: "absolute",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#fffaeb",
    borderWidth: 1.5,
    borderColor: Colors.accentGold,
    marginLeft: -16,
    marginTop: -10,
    shadowColor: "#d4af37",
    shadowOpacity: 0.35,
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

  compactWrap: { position: "absolute", width: 40, alignItems: "center" },
  compactPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#fffaeb",
    borderWidth: 1,
    borderColor: "#f1e2a4",
    shadowColor: "#d4af37",
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  compactPillText: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },

  calloutWrap: { position: "absolute", width: 156, alignItems: "center" },
  callout: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fffdf2",
    borderWidth: 1,
    borderColor: Colors.accentGold,
    alignItems: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  calloutDay: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  calloutLabel: { color: Colors.text, fontSize: 13, fontWeight: "900", marginTop: 2, textAlign: "center" },
  calloutEstimate: { color: Colors.textDim, fontSize: 10, fontWeight: "700", marginTop: 4, letterSpacing: 0.4, fontStyle: "italic" },

  finalFlagAnchor: {
    position: "absolute",
    right: 8,
    top: 14,
    alignItems: "flex-end",
    zIndex: 20,
  },
  finalCoin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffaeb",
    borderWidth: 1.5,
    borderColor: Colors.accentGold,
    shadowColor: "#d4af37",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  finalPopover: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#fffdf2",
    borderWidth: 1,
    borderColor: Colors.accentGold,
    shadowColor: "#d4af37",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    maxWidth: 200,
  },
  finalFlagText: { color: Colors.accentDeep, fontSize: 11, fontWeight: "900", letterSpacing: 0.2 },
  finalFlagDay: { color: Colors.textDim, fontSize: 10, fontWeight: "700" },

  axisRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 6, paddingTop: 6, marginTop: 6, marginBottom: 4 },
  axisDotToday: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.textDim },
  axisDotEnd: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accentGold },
  axisSpacer: { flex: 1, height: 1, backgroundColor: "#f1e2a4", opacity: 0.6 },
  axisLabel: { color: Colors.textDim, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
});
