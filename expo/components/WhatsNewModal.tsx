import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Award,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Crown,
  Flame,
  Gem,
  Sparkles,
  Star,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react-native";

import { Colors } from "@/constants/colors";
import type { ShowcasePage, ShowcaseUpdate } from "@/constants/showcase-updates";
import { triggerHaptic } from "@/lib/haptics";

const DEFAULT_HOLD_MS = 5000;

interface Props {
  visible: boolean;
  update: ShowcaseUpdate | null;
  hapticsEnabled: boolean;
  onDismiss: (finalRoute: ShowcaseUpdate["finalRoute"]) => void;
}

/**
 * Paged "What's New" overlay. Each page enforces a 5-second hold
 * visualized inside the CTA button's progress fill. The first page
 * always carries a visual animation (variant). The CTA on the final
 * page dismisses and can route to a follow-up screen (e.g. /badges).
 */
export function WhatsNewModal({ visible, update, hapticsEnabled, onDismiss }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(28)).current;
  const fill = useRef(new Animated.Value(0)).current;
  const ready = useRef(new Animated.Value(0)).current;
  const pageSlide = useRef(new Animated.Value(0)).current;
  const [armed, setArmed] = useState<boolean>(false);
  const [pageIndex, setPageIndex] = useState<number>(0);

  const pages = update?.pages ?? [];
  const page: ShowcasePage | null = pages[pageIndex] ?? null;
  const isLast = page !== null && pageIndex >= pages.length - 1;
  const holdMs = page?.holdMs ?? DEFAULT_HOLD_MS;

  useEffect(() => {
    if (!visible) {
      fade.setValue(0);
      lift.setValue(28);
      fill.setValue(0);
      ready.setValue(0);
      pageSlide.setValue(0);
      setArmed(false);
      setPageIndex(0);
      return;
    }
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(lift, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }),
    ]).start();
    if (hapticsEnabled && Platform.OS !== "web") triggerHaptic("light", true);
  }, [visible, fade, lift, fill, ready, pageSlide, hapticsEnabled]);

  // Per-page 5-second hold timer + entrance.
  useEffect(() => {
    if (!visible || !page) return;
    fill.setValue(0);
    ready.setValue(0);
    setArmed(false);
    pageSlide.setValue(20);
    Animated.timing(pageSlide, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();

    Animated.timing(fill, {
      toValue: 1,
      duration: holdMs,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    const t = setTimeout(() => {
      setArmed(true);
      Animated.spring(ready, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
      if (hapticsEnabled && Platform.OS !== "web") triggerHaptic("success", true);
    }, holdMs);
    return () => clearTimeout(t);
  }, [visible, pageIndex, page, holdMs, fill, ready, pageSlide, hapticsEnabled]);

  if (!visible || !update || !page) return null;

  const fillWidth = fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const readyScale = ready.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });

  const advance = () => {
    if (!armed) return;
    triggerHaptic("light", hapticsEnabled);
    if (isLast) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(lift, { toValue: 16, duration: 200, useNativeDriver: true }),
      ]).start(() => onDismiss(update.finalRoute ?? null));
      return;
    }
    setPageIndex((i) => i + 1);
  };

  const totalPages = pages.length;

  return (
    <Animated.View pointerEvents="auto" style={[styles.backdrop, { opacity: fade }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => { /* tap outside is a no-op */ }} />
      <Animated.View style={[styles.card, { transform: [{ translateY: lift }] }]}>
        <Animated.View style={{ width: "100%", alignItems: "center", transform: [{ translateY: pageSlide }] }}>
          <View style={styles.eyebrowPill}>
            <Sparkles size={11} color={Colors.accentGold} />
            <Text style={styles.eyebrowText}>{page.eyebrow}</Text>
          </View>
          <Text style={styles.headline}>{page.headline}</Text>
          <Text style={styles.body}>{page.body}</Text>

          {page.variant === "ai-coach" ? <PhoneCoachShowcase /> : null}
          {page.variant === "badge-promo" ? <BadgePromoShowcase /> : null}
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: readyScale }], width: "100%", alignItems: "stretch" }}>
          <Pressable
            onPress={advance}
            disabled={!armed}
            style={styles.cta}
            testID="whats-new-dismiss"
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ctaFill,
                { width: fillWidth, backgroundColor: armed ? Colors.text : "#2a2a2a" },
              ]}
            />
            <View style={styles.ctaBorder} pointerEvents="none" />
            <View style={styles.ctaContent} pointerEvents="none">
              <Text style={[styles.ctaText, { color: armed ? "#ffffff" : "#cfcfcf" }]}>
                {armed ? page.cta : "Hold on…"}
              </Text>
              {armed && !isLast ? (
                <ChevronRight color="#ffffff" size={16} strokeWidth={3} />
              ) : null}
            </View>
          </Pressable>
        </Animated.View>

        {totalPages > 1 ? (
          <View style={styles.dots} pointerEvents="none">
            {pages.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === pageIndex ? styles.dotActive : null]}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.closeRow} pointerEvents={armed ? "auto" : "none"}>
          <Pressable
            onPress={advance}
            hitSlop={12}
            style={({ pressed }) => [styles.close, { opacity: armed ? (pressed ? 0.5 : 1) : 0.3 }]}
            testID="whats-new-close"
          >
            <X size={14} color={Colors.textDim} />
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const STEP = { IDLE: 0, TAP_TASK: 1, DETAIL: 2, ASK: 3, CHAT: 4 } as const;

/**
 * Mini phone-mockup loop showcasing the Ask the Coach flow. Mirrors the
 * real in-app journey: tasks list → tap a task → detail panel with
 * numbered steps → tap "Ask the Coach" → chat appears with messages.
 */
function PhoneCoachShowcase() {
  const entry = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const tap = useRef(new Animated.Value(0)).current;
  const detailPanel = useRef(new Animated.Value(0)).current;
  const coachTap = useRef(new Animated.Value(0)).current;
  const chatFade = useRef(new Animated.Value(0)).current;
  const userBubble = useRef(new Animated.Value(0)).current;
  const coachBubble = useRef(new Animated.Value(0)).current;
  const stepChecks = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const orb = useRef(new Animated.Value(0)).current;
  const stepValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(orb, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true }),
    ).start();

    const reset = () => {
      entry.setValue(0);
      bounce.setValue(0);
      tap.setValue(0);
      detailPanel.setValue(0);
      coachTap.setValue(0);
      chatFade.setValue(0);
      userBubble.setValue(0);
      coachBubble.setValue(0);
      stepChecks.forEach((v) => v.setValue(0));
      stepValue.setValue(STEP.IDLE);
    };

    const runLoop = async () => {
      while (!cancelled) {
        reset();
        await new Promise<void>((resolve) => {
          Animated.sequence([
            Animated.delay(120),
            Animated.timing(entry, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(bounce, { toValue: 1, duration: 140, useNativeDriver: true }),
              Animated.timing(bounce, { toValue: 0.3, duration: 180, useNativeDriver: true }),
              Animated.timing(bounce, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
          ]).start(() => resolve());
        });
        if (cancelled) return;

        await new Promise<void>((r) => setTimeout(r, 520));
        if (cancelled) return;

        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.TAP_TASK, duration: 240, useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(tap, { toValue: 1, duration: 360, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(tap, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
        ]).start();

        await new Promise<void>((r) => setTimeout(r, 740));
        if (cancelled) return;

        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.DETAIL, duration: 280, useNativeDriver: false }),
          Animated.spring(detailPanel, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
        ]).start();

        await new Promise<void>((r) => setTimeout(r, 700));
        if (cancelled) return;
        Animated.timing(stepChecks[0], { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
        await new Promise<void>((r) => setTimeout(r, 340));
        if (cancelled) return;
        Animated.timing(stepChecks[1], { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
        await new Promise<void>((r) => setTimeout(r, 600));
        if (cancelled) return;

        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.ASK, duration: 200, useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(coachTap, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(coachTap, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
        ]).start();

        await new Promise<void>((r) => setTimeout(r, 600));
        if (cancelled) return;

        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.CHAT, duration: 260, useNativeDriver: false }),
          Animated.timing(chatFade, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();

        await new Promise<void>((r) => setTimeout(r, 360));
        if (cancelled) return;
        Animated.spring(userBubble, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }).start();
        await new Promise<void>((r) => setTimeout(r, 620));
        if (cancelled) return;
        Animated.spring(coachBubble, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }).start();

        await new Promise<void>((r) => setTimeout(r, 1900));
        if (cancelled) return;

        Animated.parallel([
          Animated.timing(detailPanel, { toValue: 0, duration: 360, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(chatFade, { toValue: 0, duration: 260, useNativeDriver: true }),
          Animated.timing(stepValue, { toValue: STEP.IDLE, duration: 260, useNativeDriver: false }),
        ]).start();

        await new Promise<void>((r) => setTimeout(r, 420));
        if (cancelled) return;

        await new Promise<void>((resolve) => {
          Animated.timing(entry, { toValue: 2, duration: 480, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => resolve());
        });
        if (cancelled) return;
      }
    };
    runLoop();

    return () => { cancelled = true; };
  }, [entry, bounce, tap, detailPanel, coachTap, chatFade, userBubble, coachBubble, stepChecks, sparkle, glow, orb, stepValue]);

  const enterY = entry.interpolate({ inputRange: [0, 1, 2], outputRange: [-240, 0, 240] });
  const enterRotate = entry.interpolate({ inputRange: [0, 1, 2], outputRange: ["-22deg", "-3deg", "14deg"] });
  const enterScale = entry.interpolate({ inputRange: [0, 1, 2], outputRange: [0.82, 1, 0.95] });
  const bounceY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const tapScale = tap.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.2] });
  const tapOpacity = tap.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.7, 0] });

  const coachTapScale = coachTap.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.8] });
  const coachTapOpacity = coachTap.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.8, 0] });

  const detailTranslate = detailPanel.interpolate({ inputRange: [0, 1], outputRange: [180, 0] });

  const taskBg = stepValue.interpolate({ inputRange: [0, 1, 2, 3, 4], outputRange: ["#ffffff", "#fff8e1", "#fff8e1", "#fff8e1", "#fff8e1"] });
  const taskBorder = stepValue.interpolate({ inputRange: [0, 1, 2, 3, 4], outputRange: ["#eeeeee", Colors.accentGold, Colors.accentGold, Colors.accentGold, Colors.accentGold] });

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.12] });

  const orbAngle = orb.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.showcase}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.showcaseGlow,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      <Animated.View pointerEvents="none" style={[styles.orbitWrap, { transform: [{ rotate: orbAngle }] }]}>
        <View style={[styles.orbDot, styles.orbDotTL]} />
        <View style={[styles.orbDot, styles.orbDotTR]} />
        <View style={[styles.orbDot, styles.orbDotBR]} />
        <View style={[styles.orbDot, styles.orbDotBL]} />
      </Animated.View>

      <Animated.View
        style={[
          styles.phone,
          {
            transform: [
              { translateY: Animated.add(enterY, bounceY) },
              { rotate: enterRotate },
              { scale: enterScale },
            ],
          },
        ]}
      >
        <View style={styles.phoneFrameInner}>
          <View style={styles.dynamicIsland} />
          <View style={styles.phoneScreen}>
            <View style={styles.phoneStatus}>
              <Text style={styles.phoneTime}>9:41</Text>
              <View style={styles.phoneDots}>
                <View style={styles.dotSm} />
                <View style={styles.dotSm} />
                <View style={styles.dotSm} />
              </View>
            </View>

            <Text style={styles.phoneHeader}>Today</Text>
            <Text style={styles.phoneSub}>3 tasks · tap one to dive in</Text>

            <Animated.View style={[styles.taskCardActive, { backgroundColor: taskBg, borderColor: taskBorder }]}>
              <View style={styles.taskHead}>
                <View style={styles.taskRadio} />
                <Text style={styles.taskTitle} numberOfLines={1}>Pitch 5 local shops</Text>
              </View>
              <View style={styles.tapWrap} pointerEvents="none">
                <Animated.View
                  style={[styles.tapRing, { transform: [{ scale: tapScale }], opacity: tapOpacity }]}
                />
              </View>
            </Animated.View>

            <View style={styles.taskCardDim}>
              <View style={styles.taskRadioDim} />
              <Text style={styles.taskTitleDim}>Build a 1-page site</Text>
            </View>
            <View style={styles.taskCardDim}>
              <View style={styles.taskRadioDim} />
              <Text style={styles.taskTitleDim}>Write 3 offer bullets</Text>
            </View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.detailPanel,
                { transform: [{ translateY: detailTranslate }], opacity: detailPanel },
              ]}
            >
              <View style={styles.detailHandle} />
              <Text style={styles.detailTitle} numberOfLines={1}>Pitch 5 local shops</Text>
              <Text style={styles.detailMeta}>3 steps · 25 min</Text>

              <View style={styles.stepsWrap}>
                {[
                  { label: "List 5 shops near you", anim: stepChecks[0] },
                  { label: "Draft a 2-line DM", anim: stepChecks[1] },
                  { label: "Send & log replies", anim: stepChecks[2] },
                ].map((s, i) => {
                  const checkScale = s.anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
                  const bg = s.anim.interpolate({ inputRange: [0, 1], outputRange: ["#ffffff", Colors.accentGold] });
                  const border = s.anim.interpolate({ inputRange: [0, 1], outputRange: ["#dddddd", Colors.accentGold] });
                  return (
                    <View key={i} style={styles.stepRow}>
                      <Animated.View style={[styles.stepCheck, { backgroundColor: bg, borderColor: border }]}>
                        <Animated.Text style={[styles.stepNum, { opacity: s.anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
                          {i + 1}
                        </Animated.Text>
                        <Animated.Text style={[styles.stepCheckMark, { opacity: checkScale, transform: [{ scale: checkScale }] }]}>
                          ✓
                        </Animated.Text>
                      </Animated.View>
                      <Text style={styles.stepLabel}>{s.label}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.coachBtn}>
                <View style={styles.coachIcon}>
                  <BrainCircuit size={9} color={Colors.accentDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coachTitle}>Ask the Coach</Text>
                  <Text style={styles.coachSub}>Answers questions about this task</Text>
                </View>
                <ChevronDown size={9} color={Colors.textDim} />
                <View style={styles.coachTapWrap} pointerEvents="none">
                  <Animated.View
                    style={[styles.coachTapRing, { transform: [{ scale: coachTapScale }], opacity: coachTapOpacity }]}
                  />
                </View>
              </View>

              <Animated.View
                pointerEvents="none"
                style={[styles.chatOverlay, { opacity: chatFade }]}
              >
                <View style={styles.chatHead}>
                  <View style={styles.coachIconDark}>
                    <BrainCircuit size={9} color={Colors.accentGold} />
                  </View>
                  <Text style={styles.chatTitle}>Ask the Coach</Text>
                  <View style={styles.chatLiveDot} />
                </View>
                <Animated.View
                  style={[
                    styles.userBubble,
                    {
                      opacity: userBubble,
                      transform: [{ translateY: userBubble.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
                    },
                  ]}
                >
                  <Text style={styles.userBubbleText}>What does &ldquo;pitch&rdquo; mean here?</Text>
                </Animated.View>
                <Animated.View
                  style={[
                    styles.coachBubble,
                    {
                      opacity: coachBubble,
                      transform: [{ translateY: coachBubble.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
                    },
                  ]}
                >
                  <Text style={styles.coachAnswer}>
                    A pitch is a short, friendly intro — what you offer and why it helps them. What part feels stuck?
                  </Text>
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * Limited-time badge promo animation. Big trophy in center with a ring
 * of badge icons orbiting and pulsing in, plus a "FREE MONTH" tag and
 * confetti sparkles. Communicates the offer without text repetition.
 */
function BadgePromoShowcase() {
  const trophyPulse = useRef(new Animated.Value(0)).current;
  const trophyEntry = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const sparkleA = useRef(new Animated.Value(0)).current;
  const sparkleB = useRef(new Animated.Value(0)).current;
  const tagWiggle = useRef(new Animated.Value(0)).current;
  const beam = useRef(new Animated.Value(0)).current;
  const badgeAnims = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    Animated.spring(trophyEntry, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyPulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(trophyPulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(orbit, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleA, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(sparkleA, { toValue: 0.2, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(sparkleB, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(sparkleB, { toValue: 0.2, duration: 900, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(tagWiggle, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(tagWiggle, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(beam, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(400),
      ]),
    ).start();

    // Stagger badge unlocks in sequence then keep them on.
    badgeAnims.forEach((a, i) => {
      Animated.sequence([
        Animated.delay(280 + i * 180),
        Animated.spring(a, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
      ]).start();
    });
  }, [trophyEntry, trophyPulse, orbit, sparkleA, sparkleB, tagWiggle, beam, badgeAnims]);

  // Badge ring layout — 6 slots around the trophy.
  const RADIUS = 92;
  const badges = useMemo(
    () => [
      { Icon: Flame, color: "#ef4444" },
      { Icon: Star, color: "#f59e0b" },
      { Icon: Zap, color: "#d4af37" },
      { Icon: Target, color: "#10b981" },
      { Icon: Gem, color: "#6366f1" },
      { Icon: Crown, color: "#a855f7" },
    ],
    [],
  );

  const orbitRotate = orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const orbitCounter = orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-360deg"] });

  const trophyScale = Animated.add(
    trophyEntry.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
    trophyPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
  );
  const trophyGlowOpacity = trophyPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  const trophyGlowScale = trophyPulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  const tagRotate = tagWiggle.interpolate({ inputRange: [0, 1], outputRange: ["-6deg", "6deg"] });
  const tagBounce = tagWiggle.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  const beamTranslate = beam.interpolate({ inputRange: [0, 1], outputRange: [-260, 260] });

  return (
    <View style={styles.promoWrap}>
      {/* Diagonal sweep beam */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.promoBeam,
          { transform: [{ translateX: beamTranslate }, { rotate: "20deg" }] },
        ]}
      />

      {/* Glow under trophy */}
      <Animated.View
        pointerEvents="none"
        style={[styles.promoGlow, { opacity: trophyGlowOpacity, transform: [{ scale: trophyGlowScale }] }]}
      />

      {/* Sparkles */}
      <Animated.View pointerEvents="none" style={[styles.spark, styles.sparkTL, { opacity: sparkleA }]}>
        <Sparkles size={14} color="#d4af37" />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.spark, styles.sparkTR, { opacity: sparkleB }]}>
        <Sparkles size={10} color="#fde68a" />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.spark, styles.sparkBL, { opacity: sparkleB }]}>
        <Sparkles size={12} color="#fde68a" />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.spark, styles.sparkBR, { opacity: sparkleA }]}>
        <Sparkles size={9} color="#d4af37" />
      </Animated.View>

      {/* Orbiting badge ring */}
      <Animated.View pointerEvents="none" style={[styles.orbitRing, { transform: [{ rotate: orbitRotate }] }]}>
        {badges.map(({ Icon, color }, i) => {
          const angle = (i / badges.length) * Math.PI * 2;
          const x = Math.cos(angle) * RADIUS;
          const y = Math.sin(angle) * RADIUS;
          const anim = badgeAnims[i];
          const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
          const opacity = anim;
          return (
            <Animated.View
              key={i}
              style={[
                styles.badgeChip,
                {
                  transform: [{ translateX: x }, { translateY: y }, { scale }],
                  opacity,
                },
              ]}
            >
              {/* Counter-rotate so icons stay upright. */}
              <Animated.View style={{ transform: [{ rotate: orbitCounter }] }}>
                <Icon color="#ffffff" size={16} strokeWidth={2.4} />
              </Animated.View>
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Trophy hero */}
      <Animated.View style={[styles.trophyCircle, { transform: [{ scale: trophyScale }] }]}>
        <Trophy color="#ffffff" size={42} strokeWidth={2.2} />
      </Animated.View>

      {/* FREE MONTH tag */}
      <Animated.View
        style={[
          styles.freeTag,
          { transform: [{ rotate: tagRotate }, { translateY: tagBounce }] },
        ]}
      >
        <Award color="#ffffff" size={11} strokeWidth={3} />
        <Text style={styles.freeTagText}>1 MONTH FREE</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    zIndex: 1000,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },

  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)",
    marginBottom: 12,
  },
  eyebrowText: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  headline: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  body: {
    color: Colors.textDim,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 18,
    paddingHorizontal: 6,
  },

  // Coach showcase
  showcase: {
    width: "100%",
    height: 300,
    borderRadius: 22,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
    marginBottom: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  showcaseGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.22)",
  },
  orbitWrap: {
    position: "absolute",
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  orbDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.accentGold,
    shadowColor: "#d4af37",
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  orbDotTL: { top: 22, left: 60 },
  orbDotTR: { top: 42, right: 34 },
  orbDotBR: { bottom: 32, right: 52 },
  orbDotBL: { bottom: 54, left: 32 },

  phone: {
    width: 144,
    height: 282,
    borderRadius: 30,
    padding: 3,
    backgroundColor: "#1c1c1e",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
    borderWidth: 1,
    borderColor: "#2a2a2c",
  },
  phoneFrameInner: {
    flex: 1,
    borderRadius: 27,
    padding: 3,
    backgroundColor: "#050505",
  },
  dynamicIsland: {
    position: "absolute",
    top: 6,
    alignSelf: "center",
    width: 54,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#000000",
    zIndex: 5,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 7,
    paddingTop: 26,
    overflow: "hidden",
  },
  phoneStatus: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  phoneTime: { color: Colors.text, fontSize: 7, fontWeight: "900" },
  phoneDots: { flexDirection: "row", gap: 2 },
  dotSm: { width: 2.5, height: 2.5, borderRadius: 2, backgroundColor: Colors.text },

  phoneHeader: { color: Colors.text, fontSize: 13, fontWeight: "900", letterSpacing: -0.3 },
  phoneSub: { color: Colors.textDim, fontSize: 7, fontWeight: "600", marginTop: 1 },

  taskCardActive: {
    marginTop: 7,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  taskHead: { flexDirection: "row", alignItems: "center", gap: 5 },
  taskRadio: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.2, borderColor: Colors.accentGold },
  taskRadioDim: { width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: "#dddddd" },
  taskTitle: { color: Colors.text, fontSize: 8, fontWeight: "800", flex: 1 },
  taskTitleDim: { color: Colors.textDim, fontSize: 8, fontWeight: "700", flex: 1 },
  tapWrap: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tapRing: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.accentGold,
    backgroundColor: "rgba(212,175,55,0.25)",
  },
  taskCardDim: {
    marginTop: 4,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eeeeee",
    backgroundColor: "#fafafa",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  detailPanel: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 4,
    top: 36,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eeeeee",
    padding: 8,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    overflow: "hidden",
  },
  detailHandle: {
    position: "absolute",
    top: 4,
    alignSelf: "center",
    width: 22,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "#e5e5e5",
  },
  detailTitle: { color: Colors.text, fontSize: 9, fontWeight: "900", letterSpacing: -0.2 },
  detailMeta: { color: Colors.textMuted, fontSize: 6.5, fontWeight: "700", marginTop: 1, marginBottom: 6 },

  stepsWrap: { gap: 5, marginBottom: 7 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 6,
    backgroundColor: "#fafafa",
  },
  stepCheck: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  stepNum: { position: "absolute", color: Colors.textDim, fontSize: 7, fontWeight: "900" },
  stepCheckMark: { position: "absolute", color: "#ffffff", fontSize: 8, fontWeight: "900", lineHeight: 9 },
  stepLabel: { color: Colors.text, fontSize: 7, fontWeight: "600", flex: 1 },

  coachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(212,175,55,0.10)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    position: "relative",
    overflow: "visible",
  },
  coachIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(212,175,55,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  coachTitle: { color: Colors.text, fontSize: 7.5, fontWeight: "900" },
  coachSub: { color: Colors.textDim, fontSize: 6, fontWeight: "600", marginTop: 0.5 },
  coachTapWrap: {
    position: "absolute",
    right: 4,
    top: 4,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  coachTapRing: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.accentGold,
    backgroundColor: "rgba(212,175,55,0.25)",
  },

  chatOverlay: {
    position: "absolute",
    left: 6,
    right: 6,
    top: 26,
    bottom: 6,
    backgroundColor: "#0a0a0a",
    borderRadius: 10,
    padding: 7,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
  },
  chatHead: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  coachIconDark: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(212,175,55,0.18)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatTitle: { color: "#ffffff", fontSize: 7.5, fontWeight: "900" },
  chatLiveDot: { width: 4, height: 4, borderRadius: 999, backgroundColor: "#22c55e", marginLeft: 2 },

  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#1f1f24",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderBottomRightRadius: 2,
    marginBottom: 4,
    maxWidth: "85%",
  },
  userBubbleText: { color: "#ffffff", fontSize: 7, fontWeight: "600" },
  coachBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212,175,55,0.14)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
    borderBottomLeftRadius: 2,
    maxWidth: "92%",
  },
  coachAnswer: { color: "#e0e0e0", fontSize: 7, lineHeight: 9, fontWeight: "500" },

  // Badge promo showcase
  promoWrap: {
    width: "100%",
    height: 260,
    borderRadius: 22,
    backgroundColor: "#0b0b10",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    marginBottom: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  promoBeam: {
    position: "absolute",
    width: 80,
    height: 600,
    backgroundColor: "rgba(212,175,55,0.10)",
  },
  promoGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.45)",
  },
  spark: { position: "absolute" },
  sparkTL: { top: 20, left: 26 },
  sparkTR: { top: 30, right: 28 },
  sparkBL: { bottom: 26, left: 30 },
  sparkBR: { bottom: 22, right: 26 },

  orbitRing: {
    position: "absolute",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeChip: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(212,175,55,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  trophyCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Colors.accentGold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  freeTag: {
    position: "absolute",
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  freeTagText: { color: "#ffffff", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },

  // CTA with progress fill
  cta: {
    height: 52,
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f1f3",
    width: "100%",
  },
  ctaFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  ctaBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 2,
  },
  ctaText: {
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  dots: { flexDirection: "row", gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#e5e5e5" },
  dotActive: { backgroundColor: Colors.text, width: 18 },

  closeRow: { position: "absolute", top: 12, right: 12 },
  close: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f4f4f4",
    alignItems: "center",
    justifyContent: "center",
  },
});
