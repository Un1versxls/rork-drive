import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { X, Sparkles } from "lucide-react-native";

import { Colors } from "@/constants/colors";
import type { ShowcaseUpdate } from "@/constants/showcase-updates";
import { triggerHaptic } from "@/lib/haptics";

const HOLD_MS = 4000;

interface Props {
  visible: boolean;
  update: ShowcaseUpdate | null;
  hapticsEnabled: boolean;
  onDismiss: () => void;
}

/**
 * "What's New" overlay — styled like the onboarding try-free animation
 * (gold pill badge, bold headline, subtitle, phone mockup, fat CTA).
 * The phone mockup loops a mini AI showcase: tap a task → AI panel
 * slides up with a chat bubble + sparkle effects.
 *
 * The 4-second hold is visualized as a progress fill that lights the
 * inside of the "Got it" button from left to right. Once full, the
 * button becomes tappable and fires a haptic.
 *
 * Reusable template — drop a new entry into SHOWCASE_UPDATES with a
 * new id, headline, and body to ship the next update card.
 */
export function WhatsNewModal({ visible, update, hapticsEnabled, onDismiss }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(28)).current;
  const fill = useRef(new Animated.Value(0)).current;
  const ready = useRef(new Animated.Value(0)).current;
  const [armed, setArmed] = useState<boolean>(false);

  useEffect(() => {
    if (!visible) {
      fade.setValue(0);
      lift.setValue(28);
      fill.setValue(0);
      ready.setValue(0);
      setArmed(false);
      return;
    }
    setArmed(false);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(lift, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }),
    ]).start();
    if (hapticsEnabled && Platform.OS !== "web") triggerHaptic("light", true);

    Animated.timing(fill, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    const t = setTimeout(() => {
      setArmed(true);
      Animated.spring(ready, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
      if (hapticsEnabled && Platform.OS !== "web") triggerHaptic("success", true);
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [visible, fade, lift, fill, ready, hapticsEnabled]);

  if (!visible || !update) return null;

  const fillWidth = fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const readyScale = ready.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });

  const dismiss = () => {
    if (!armed) return;
    triggerHaptic("light", hapticsEnabled);
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 16, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  return (
    <Animated.View pointerEvents="auto" style={[styles.backdrop, { opacity: fade }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => { /* tap outside is a no-op */ }} />
      <Animated.View style={[styles.card, { transform: [{ translateY: lift }] }]}>
        <View style={styles.eyebrowPill}>
          <Sparkles size={11} color={Colors.accentGold} />
          <Text style={styles.eyebrowText}>WHAT&apos;S NEW</Text>
        </View>
        <Text style={styles.headline}>{update.headline}</Text>
        <Text style={styles.body}>{update.body}</Text>

        <PhoneAIShowcase />

        <Animated.View style={{ transform: [{ scale: readyScale }], width: "100%", alignItems: "stretch" }}>
          <Pressable
            onPress={dismiss}
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
            <Text style={[styles.ctaText, { color: armed ? "#ffffff" : "#cfcfcf" }]}>
              {armed ? "Got it" : "Hold on…"}
            </Text>
          </Pressable>
        </Animated.View>

        <View style={styles.closeRow} pointerEvents={armed ? "auto" : "none"}>
          <Pressable
            onPress={dismiss}
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

const STEP = { IDLE: 0, TAP: 1, AI: 2, DONE: 3 } as const;

/**
 * Mini phone-mockup loop showcasing the AI feature. Mirrors the
 * onboarding try-free animation: phone enters with a tilt, a task
 * is tapped, the AI panel slides up with a chat bubble and sparkles,
 * then it loops back. Lives entirely inside the showcase card.
 */
function PhoneAIShowcase() {
  const entry = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const tap = useRef(new Animated.Value(0)).current;
  const aiPanel = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const step = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const orb = useRef(new Animated.Value(0)).current;

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
      Animated.timing(orb, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }),
    ).start();

    const runLoop = async () => {
      while (!cancelled) {
        entry.setValue(0);
        bounce.setValue(0);
        tap.setValue(0);
        aiPanel.setValue(0);
        step.setValue(STEP.IDLE);

        await new Promise<void>((resolve) => {
          Animated.sequence([
            Animated.delay(120),
            Animated.timing(entry, { toValue: 1, duration: 540, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(bounce, { toValue: 1, duration: 140, useNativeDriver: true }),
              Animated.timing(bounce, { toValue: 0.3, duration: 180, useNativeDriver: true }),
              Animated.timing(bounce, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
          ]).start(() => resolve());
        });
        if (cancelled) return;

        await new Promise<void>((r) => setTimeout(r, 600));
        if (cancelled) return;

        // Tap pulse on task
        Animated.parallel([
          Animated.timing(step, { toValue: STEP.TAP, duration: 280, useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(tap, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(tap, { toValue: 0, duration: 320, useNativeDriver: true }),
          ]),
        ]).start();

        await new Promise<void>((r) => setTimeout(r, 900));
        if (cancelled) return;

        // AI panel slides up
        Animated.parallel([
          Animated.timing(step, { toValue: STEP.AI, duration: 280, useNativeDriver: false }),
          Animated.spring(aiPanel, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
        ]).start();

        await new Promise<void>((r) => setTimeout(r, 2400));
        if (cancelled) return;

        // Reset
        Animated.parallel([
          Animated.timing(aiPanel, { toValue: 0, duration: 360, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(step, { toValue: STEP.IDLE, duration: 280, useNativeDriver: false }),
        ]).start();

        await new Promise<void>((r) => setTimeout(r, 500));
        if (cancelled) return;

        // Phone tilts out
        await new Promise<void>((resolve) => {
          Animated.timing(entry, { toValue: 2, duration: 480, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => resolve());
        });
        if (cancelled) return;
      }
    };
    runLoop();

    return () => { cancelled = true; };
  }, [entry, bounce, tap, aiPanel, sparkle, step, glow, orb]);

  const enterY = entry.interpolate({ inputRange: [0, 1, 2], outputRange: [-220, 0, 220] });
  const enterRotate = entry.interpolate({ inputRange: [0, 1, 2], outputRange: ["-22deg", "-3deg", "14deg"] });
  const enterScale = entry.interpolate({ inputRange: [0, 1, 2], outputRange: [0.82, 1, 0.95] });
  const bounceY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const tapScale = tap.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.2] });
  const tapOpacity = tap.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.7, 0] });

  const aiTranslate = aiPanel.interpolate({ inputRange: [0, 1], outputRange: [120, 0] });

  const taskBg = step.interpolate({ inputRange: [0, 1, 2, 3], outputRange: ["#ffffff", "#fff8e1", "#fff8e1", "#fff8e1"] });
  const taskBorder = step.interpolate({ inputRange: [0, 1, 2, 3], outputRange: ["#eeeeee", Colors.accentGold, Colors.accentGold, Colors.accentGold] });

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

      {/* Orbiting sparkle ring */}
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
            <Text style={styles.phoneSub}>Tap any task for AI help</Text>

            <Animated.View style={[styles.taskCardActive, { backgroundColor: taskBg, borderColor: taskBorder }]}>
              <View style={styles.taskHead}>
                <View style={styles.taskRadio} />
                <Text style={styles.taskTitle} numberOfLines={1}>Pitch 5 local shops</Text>
                <View style={styles.aiBtn}>
                  <Sparkles size={8} color="#ffffff" />
                  <Text style={styles.aiBtnText}>AI</Text>
                </View>
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

            <Animated.View
              pointerEvents="none"
              style={[
                styles.aiPanel,
                { transform: [{ translateY: aiTranslate }], opacity: aiPanel },
              ]}
            >
              <View style={styles.aiHandle} />
              <View style={styles.aiHeadRow}>
                <View style={styles.aiAvatar}>
                  <Sparkles size={9} color="#ffffff" />
                </View>
                <Text style={styles.aiTitle}>Ask DRIVE AI</Text>
                <View style={styles.aiLiveDot} />
              </View>
              <View style={styles.userBubble}>
                <Text style={styles.userBubbleText}>How do I pitch?</Text>
              </View>
              <View style={styles.aiBubble}>
                <Text style={styles.aiAnswer}>
                  Try this DM:{`\n`}&ldquo;Hi — I&apos;d redo your bio + 1 reel free. Game?&rdquo;
                </Text>
              </View>
              <View style={styles.aiTyping}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </Animated.View>
          </View>
        </View>
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

  // Phone-mockup showcase
  showcase: {
    width: "100%",
    height: 268,
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
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.22)",
  },
  orbitWrap: {
    position: "absolute",
    width: 280,
    height: 280,
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
  orbDotTL: { top: 20, left: 60 },
  orbDotTR: { top: 40, right: 30 },
  orbDotBR: { bottom: 30, right: 50 },
  orbDotBL: { bottom: 50, left: 30 },

  phone: {
    width: 130,
    height: 248,
    borderRadius: 28,
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
    borderRadius: 25,
    padding: 3,
    backgroundColor: "#050505",
  },
  dynamicIsland: {
    position: "absolute",
    top: 6,
    alignSelf: "center",
    width: 50,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#000000",
    zIndex: 5,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    padding: 8,
    paddingTop: 26,
    overflow: "hidden",
  },
  phoneStatus: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  phoneTime: { color: Colors.text, fontSize: 7, fontWeight: "900" },
  phoneDots: { flexDirection: "row", gap: 2 },
  dotSm: { width: 2.5, height: 2.5, borderRadius: 2, backgroundColor: Colors.text },

  phoneHeader: { color: Colors.text, fontSize: 12, fontWeight: "900", letterSpacing: -0.3 },
  phoneSub: { color: Colors.textDim, fontSize: 7, fontWeight: "600", marginTop: 1 },

  taskCardActive: {
    marginTop: 8,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  taskHead: { flexDirection: "row", alignItems: "center", gap: 5 },
  taskRadio: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.2, borderColor: Colors.accentGold },
  taskRadioDim: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: "#dddddd" },
  taskTitle: { color: Colors.text, fontSize: 8, fontWeight: "800", flex: 1 },
  taskTitleDim: { color: Colors.textDim, fontSize: 8, fontWeight: "700", flex: 1 },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: Colors.accentGold,
  },
  aiBtnText: { color: "#ffffff", fontSize: 6.5, fontWeight: "900", letterSpacing: 0.4 },
  tapWrap: {
    position: "absolute",
    right: 6,
    top: 4,
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

  aiPanel: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 6,
    backgroundColor: "#0a0a0a",
    padding: 6,
    paddingTop: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
  },
  aiHandle: {
    position: "absolute",
    top: 3,
    alignSelf: "center",
    width: 20,
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  aiHeadRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 5 },
  aiAvatar: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.accentGold,
    alignItems: "center", justifyContent: "center",
  },
  aiTitle: { color: "#ffffff", fontSize: 7, fontWeight: "900" },
  aiLiveDot: { width: 4, height: 4, borderRadius: 999, backgroundColor: "#22c55e", marginLeft: 2 },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#1f1f24",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderBottomRightRadius: 2,
    marginBottom: 3,
    maxWidth: "85%",
  },
  userBubbleText: { color: "#ffffff", fontSize: 7, fontWeight: "600" },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212,175,55,0.14)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderBottomLeftRadius: 2,
    maxWidth: "92%",
  },
  aiAnswer: { color: "#e0e0e0", fontSize: 7, lineHeight: 9, fontWeight: "500" },
  aiTyping: { flexDirection: "row", gap: 3, marginTop: 5 },
  typingDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.accentGold, opacity: 0.5 },
  typingDot2: { opacity: 0.75 },
  typingDot3: { opacity: 1 },

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
  ctaText: {
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.3,
    zIndex: 2,
  },

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
