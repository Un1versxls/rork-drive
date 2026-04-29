import React, { useEffect, useRef } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Check, Sparkles } from "lucide-react-native";

import { GradientButton } from "@/components/GradientButton";
import { Colors } from "@/constants/colors";

const STEP = {
  IDLE: 0,
  TAP_TASK: 1,
  AI_PANEL: 2,
  COMPLETE: 3,
} as const;

export default function TryFreeScreen() {
  const router = useRouter();

  const phoneEntry = useRef(new Animated.Value(0)).current;
  const phoneExit = useRef(new Animated.Value(0)).current;
  const phoneBounce = useRef(new Animated.Value(0)).current;
  const tableShadow = useRef(new Animated.Value(0)).current;
  const entryDirection = useRef<'top' | 'left' | 'right'>('top');
  const [, forceRerender] = React.useState<number>(0);
  const stepValue = useRef(new Animated.Value(0)).current;
  const tapPulse = useRef(new Animated.Value(0)).current;
  const aiPanel = useRef(new Animated.Value(0)).current;
  const checkPop = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const streakPop = useRef(new Animated.Value(0)).current;
  const flameSplash = useRef(new Animated.Value(0)).current;
  const flameSplash2 = useRef(new Animated.Value(0)).current;
  const flameDroplets = useRef(new Animated.Value(0)).current;
  const streakCount = useRef(new Animated.Value(7)).current;
  const [streakDisplay, setStreakDisplay] = React.useState<number>(7);
  const pointsPop = useRef(new Animated.Value(0)).current;
  const splash = useRef(new Animated.Value(0)).current;
  const splash2 = useRef(new Animated.Value(0)).current;
  const goldStreak = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(sparkleOpacity, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();

    let cancelled = false;
    const streakListener = streakCount.addListener(({ value }) => {
      setStreakDisplay(Math.round(value));
    });

    const enterPhone = (first: boolean): Promise<void> => {
      const dirs: Array<'top' | 'left' | 'right'> = first
        ? ['top']
        : ['left', 'right', 'top'];
      entryDirection.current = dirs[Math.floor(Math.random() * dirs.length)];
      forceRerender((n) => n + 1);
      phoneEntry.setValue(0);
      phoneExit.setValue(0);
      phoneBounce.setValue(0);
      tableShadow.setValue(0);
      return new Promise<void>((resolve) => {
        Animated.sequence([
          Animated.delay(first ? 140 : 220),
          Animated.timing(phoneEntry, {
            toValue: 1,
            duration: 640,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(phoneBounce, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.timing(phoneBounce, { toValue: 0.35, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
              Animated.timing(phoneBounce, { toValue: 0.7, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.timing(phoneBounce, { toValue: 0, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.timing(tableShadow, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
        ]).start(() => resolve());
      });
    };

    const exitPhone = (): Promise<void> => {
      return new Promise<void>((resolve) => {
        Animated.parallel([
          Animated.timing(phoneExit, {
            toValue: 1,
            duration: 600,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(tableShadow, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start(() => resolve());
      });
    };

    const runLoop = async () => {
      let first = true;
      while (!cancelled) {
        await enterPhone(first);
        first = false;
        if (cancelled) return;
        streakCount.setValue(7);
        setStreakDisplay(7);
        await new Promise<void>((resolve) => setTimeout(resolve, 1100));
        if (cancelled) return;
        // tap task
        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.TAP_TASK, duration: 320, useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(tapPulse, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(tapPulse, { toValue: 0, duration: 360, useNativeDriver: true }),
          ]),
        ]).start();

        await new Promise<void>((resolve) => setTimeout(resolve, 1100));
        if (cancelled) return;
        // AI panel slides up
        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.AI_PANEL, duration: 320, useNativeDriver: false }),
          Animated.spring(aiPanel, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
        ]).start();

        await new Promise<void>((resolve) => setTimeout(resolve, 2100));
        if (cancelled) return;
        // complete task
        splash.setValue(0);
        splash2.setValue(0);
        goldStreak.setValue(0);
        flameSplash.setValue(0);
        flameSplash2.setValue(0);
        flameDroplets.setValue(0);
        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.COMPLETE, duration: 320, useNativeDriver: false }),
          Animated.timing(aiPanel, { toValue: 0, duration: 420, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.spring(checkPop, { toValue: 1, friction: 4, tension: 130, useNativeDriver: true }),
          Animated.timing(splash, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(100),
            Animated.timing(splash2, { toValue: 1, duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(140),
            Animated.timing(goldStreak, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
        ]).start();

        await new Promise<void>((resolve) => setTimeout(resolve, 360));
        if (cancelled) return;
        // streak goes up + points pop + flame splash effect
        Animated.parallel([
          Animated.spring(streakPop, { toValue: 1, friction: 4, tension: 150, useNativeDriver: true }),
          Animated.spring(pointsPop, { toValue: 1, friction: 4, tension: 150, useNativeDriver: true }),
          Animated.timing(streakCount, { toValue: 8, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
          Animated.timing(flameSplash, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(80),
            Animated.timing(flameSplash2, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.timing(flameDroplets, { toValue: 1, duration: 950, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();

        await new Promise<void>((resolve) => setTimeout(resolve, 1900));
        if (cancelled) return;
        // reset before exit
        Animated.parallel([
          Animated.timing(stepValue, { toValue: STEP.IDLE, duration: 350, useNativeDriver: false }),
          Animated.timing(checkPop, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(streakPop, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(pointsPop, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(splash, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(splash2, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(flameSplash, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(flameSplash2, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(flameDroplets, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(goldStreak, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start();
        await new Promise<void>((resolve) => setTimeout(resolve, 350));
        if (cancelled) return;
        // phone falls out the bottom
        await exitPhone();
        if (cancelled) return;
      }
    };
    runLoop();

    return () => {
      cancelled = true;
      streakCount.removeListener(streakListener);
    };
  }, [phoneEntry, phoneExit, phoneBounce, tableShadow, stepValue, tapPulse, aiPanel, checkPop, sparkleOpacity, streakPop, streakCount, pointsPop, flameSplash, flameSplash2, flameDroplets, splash, splash2, goldStreak, entryDirection]);

  const dir = entryDirection.current;
  const entryStartX = dir === 'left' ? -380 : dir === 'right' ? 380 : 0;
  const entryStartY = dir === 'top' ? -480 : 0;
  const entryStartRotate = dir === 'left' ? '-22deg' : dir === 'right' ? '22deg' : '-26deg';
  const enterTranslateX = phoneEntry.interpolate({ inputRange: [0, 1], outputRange: [entryStartX, 0] });
  const enterTranslateY = phoneEntry.interpolate({ inputRange: [0, 1], outputRange: [entryStartY, 0] });
  const exitTranslateY = phoneExit.interpolate({ inputRange: [0, 1], outputRange: [0, 720] });
  const exitRotate = phoneExit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "18deg"] });
  const fallTranslateX = enterTranslateX;
  const fallTranslateY = Animated.add(enterTranslateY, exitTranslateY);
  const bounceTranslateY = phoneBounce.interpolate({ inputRange: [0, 1], outputRange: [0, -24] });
  const phoneRotate = phoneEntry.interpolate({ inputRange: [0, 1], outputRange: [entryStartRotate, "-3deg"] });
  const phoneScale = phoneEntry.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.78, 0.92, 1] });
  const shadowScale = tableShadow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const shadowOpacity = tableShadow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });

  const tapScale = tapPulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.2] });
  const tapOpacity = tapPulse.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.7, 0] });

  const aiTranslate = aiPanel.interpolate({ inputRange: [0, 1], outputRange: [180, 0] });
  const aiOpacity = aiPanel;

  const taskHighlight = stepValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ["#ffffff", "#fff8e1", "#fff8e1", "#f0fdf4"],
  });
  const taskBorderColor = stepValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ["#eeeeee", Colors.accentGold, Colors.accentGold, "#16a34a"],
  });

  const checkScale = checkPop.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const splashScale = splash.interpolate({ inputRange: [0, 1], outputRange: [0.2, 3.4] });
  const splashOpacity = splash.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.85, 0] });
  const splash2Scale = splash2.interpolate({ inputRange: [0, 1], outputRange: [0.2, 4.6] });
  const splash2Opacity = splash2.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.6, 0] });
  const streakScale = streakPop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.25, 1.1] });
  const streakGlow = streakPop.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const flameSplashScale = flameSplash.interpolate({ inputRange: [0, 1], outputRange: [0.3, 4.2] });
  const flameSplashOpacity = flameSplash.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.85, 0] });
  const flameSplash2Scale = flameSplash2.interpolate({ inputRange: [0, 1], outputRange: [0.3, 5.4] });
  const flameSplash2Opacity = flameSplash2.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.6, 0] });
  const dropletOpacity = flameDroplets.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
  const droplet1X = flameDroplets.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const droplet1Y = flameDroplets.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -16, 6] });
  const droplet2X = flameDroplets.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
  const droplet2Y = flameDroplets.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -20, 4] });
  const droplet3X = flameDroplets.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const droplet3Y = flameDroplets.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -28, 0] });
  const droplet4X = flameDroplets.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  const droplet4Y = flameDroplets.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -10, 10] });
  const pointsScale = pointsPop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1.08] });
  const goldStreakTranslate = goldStreak.interpolate({ inputRange: [0, 1], outputRange: [-180, 180] });
  const goldStreakOpacity = goldStreak.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
  const plusOneTranslate = streakPop.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const plusOneOpacity = streakPop.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
        <View style={styles.headerSection}>
          <View style={styles.eyebrowPill}>
            <Animated.View style={{ opacity: sparkleOpacity }}>
              <Sparkles size={12} color={Colors.accentGold} />
            </Animated.View>
            <Text style={styles.eyebrowText}>3 DAYS — ON US</Text>
          </View>
          <Text style={styles.title}>We want you to try{`\n`}DRIVE for free.</Text>
          <Text style={styles.subtitle}>
            Here&apos;s a peek at what you&apos;ll be using every day.
          </Text>
        </View>

        <View style={styles.stage}>
          <BackdropGlow />

          <View style={styles.tableWrap} pointerEvents="none">
            <View style={styles.tableSurface} />
            <Animated.View
              style={[
                styles.tableShadow,
                { opacity: shadowOpacity, transform: [{ scaleX: shadowScale }, { scaleY: shadowScale }] },
              ]}
            />
          </View>

          <Animated.View
            style={[
              styles.phone,
              {
                transform: [
                  { translateX: fallTranslateX },
                  { translateY: Animated.add(fallTranslateY, bounceTranslateY) },
                  { rotate: phoneRotate },
                  { rotate: exitRotate },
                  { scale: phoneScale },
                ],
              },
            ]}
          >
            <View style={styles.sideBtnMute} pointerEvents="none" />
            <View style={styles.sideBtnVolUp} pointerEvents="none" />
            <View style={styles.sideBtnVolDown} pointerEvents="none" />
            <View style={styles.sideBtnPower} pointerEvents="none" />
            <View style={styles.phoneFrameInner}>
            <View style={styles.dynamicIsland}>
              <View style={styles.dynamicCam} />
            </View>
            <View style={styles.homeIndicator} pointerEvents="none" />
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
              <Text style={styles.phoneSub}>3 tasks · keep your streak</Text>

              <View style={styles.streakRow}>
                <Animated.View style={[styles.streakChip, { transform: [{ scale: streakScale }] }]}>
                  <Animated.View style={[styles.streakGlow, { opacity: streakGlow }]} pointerEvents="none" />
                  <View style={styles.flameWrap} pointerEvents="none">
                    <Animated.View style={[styles.flameSplashRing, { opacity: flameSplashOpacity, transform: [{ scale: flameSplashScale }] }]} />
                    <Animated.View style={[styles.flameSplashRing2, { opacity: flameSplash2Opacity, transform: [{ scale: flameSplash2Scale }] }]} />
                    <Animated.Text style={[styles.flameDroplet, { opacity: dropletOpacity, transform: [{ translateX: droplet1X }, { translateY: droplet1Y }] }]}>✦</Animated.Text>
                    <Animated.Text style={[styles.flameDroplet, { opacity: dropletOpacity, transform: [{ translateX: droplet2X }, { translateY: droplet2Y }] }]}>✦</Animated.Text>
                    <Animated.Text style={[styles.flameDroplet, { opacity: dropletOpacity, transform: [{ translateX: droplet3X }, { translateY: droplet3Y }] }]}>✦</Animated.Text>
                    <Animated.Text style={[styles.flameDroplet, { opacity: dropletOpacity, transform: [{ translateX: droplet4X }, { translateY: droplet4Y }] }]}>✦</Animated.Text>
                  </View>
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <Text style={styles.streakText}>{streakDisplay} day streak</Text>
                  <Animated.Text
                    style={[
                      styles.plusOne,
                      { opacity: plusOneOpacity, transform: [{ translateY: plusOneTranslate }] },
                    ]}
                  >
                    +1
                  </Animated.Text>
                </Animated.View>
                <Animated.View style={[styles.pointsChip, { transform: [{ scale: pointsScale }] }]}>
                  <Text style={styles.pointsText}>+120 pts</Text>
                </Animated.View>
              </View>

              <Animated.View
                style={[
                  styles.taskCardActive,
                  { backgroundColor: taskHighlight, borderColor: taskBorderColor },
                ]}
              >
                <View style={styles.taskHead}>
                  <View style={styles.radioWrap}>
                  <Animated.View
                    style={[
                      styles.splashRing,
                      {
                        opacity: splashOpacity,
                        transform: [{ scale: splashScale }],
                      },
                    ]}
                    pointerEvents="none"
                  />
                  <Animated.View
                    style={[
                      styles.splashRing2,
                      {
                        opacity: splash2Opacity,
                        transform: [{ scale: splash2Scale }],
                      },
                    ]}
                    pointerEvents="none"
                  />
                  <Animated.View
                    style={[
                      styles.taskRadio,
                      {
                        backgroundColor: stepValue.interpolate({
                          inputRange: [0, 2, 3],
                          outputRange: ["#ffffff", "#ffffff", "#16a34a"],
                        }),
                        borderColor: stepValue.interpolate({
                          inputRange: [0, 2, 3],
                          outputRange: ["#dddddd", Colors.accentGold, "#16a34a"],
                        }),
                      },
                    ]}
                  >
                    <Animated.View style={{ transform: [{ scale: checkScale }], opacity: checkScale }}>
                      <Check size={11} color="#ffffff" strokeWidth={4} />
                    </Animated.View>
                  </Animated.View>
                  </View>
                  <View style={styles.taskTitleWrap}>
                    <Text style={styles.taskTitle} numberOfLines={1}>Pitch 5 local shops</Text>
                    <Animated.View
                      style={[
                        styles.goldStreak,
                        { opacity: goldStreakOpacity, transform: [{ translateX: goldStreakTranslate }, { rotate: "18deg" }] },
                      ]}
                      pointerEvents="none"
                    />
                  </View>
                </View>
                <Text style={styles.taskDesc} numberOfLines={2}>
                  Send personalized DMs offering a free audit.
                </Text>

                <View style={styles.tapWrap} pointerEvents="none">
                  <Animated.View
                    style={[
                      styles.tapRing,
                      { transform: [{ scale: tapScale }], opacity: tapOpacity },
                    ]}
                  />
                </View>
              </Animated.View>

              <View style={styles.taskCardDim}>
                <View style={styles.taskHead}>
                  <View style={styles.taskRadioDim} />
                  <Text style={styles.taskTitleDim}>Build a 1-page site</Text>
                </View>
              </View>
              <View style={styles.taskCardDim}>
                <View style={styles.taskHead}>
                  <View style={styles.taskRadioDim} />
                  <Text style={styles.taskTitleDim}>Write 3 offer bullets</Text>
                </View>
              </View>

              <Animated.View
                style={[
                  styles.aiPanel,
                  { transform: [{ translateY: aiTranslate }], opacity: aiOpacity },
                ]}
                pointerEvents="none"
              >
                <View style={styles.aiHandle} />
                <View style={styles.aiHeadRow}>
                  <View style={styles.aiAvatar}>
                    <Sparkles size={10} color="#ffffff" />
                  </View>
                  <Text style={styles.aiTitle}>Ask DRIVE AI</Text>
                  <View style={styles.aiLiveDot} />
                </View>
                <View style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>How do I pitch local shops?</Text>
                </View>
                <View style={styles.aiBubble}>
                  <Text style={styles.aiAnswer}>
                    Try this DM:{`\n`}&ldquo;Hi — noticed your IG. I&apos;d redo your bio + 1 reel free. Game?&rdquo;
                  </Text>
                </View>
                <View style={styles.aiActions}>
                  <View style={styles.aiChip}><Text style={styles.aiChipText}>✨ Use draft</Text></View>
                  <View style={styles.aiChipDim}><Text style={styles.aiChipDimText}>Refine</Text></View>
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
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.noPay}>No payment due now</Text>
          <GradientButton
            title="Continue for free"
            variant="gold"
            onPress={() => router.push("/onboarding/paywall")}
            testID="cta-try-free"
          />
          <Text style={styles.legal}>Cancel anytime — we&apos;ll remind you 24h before your trial ends.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function BackdropGlow() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] });
  return (
    <Animated.View style={[styles.glow, { transform: [{ scale }], opacity }]} pointerEvents="none" />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  safe: { flex: 1, paddingHorizontal: 22 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  headerSection: { paddingTop: 18, alignItems: "center" },
  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)",
  },
  eyebrowText: { color: Colors.accentDeep, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: Colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.6, textAlign: "center", marginTop: 12, lineHeight: 36 },
  subtitle: { color: Colors.textDim, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20, maxWidth: 320 },

  stage: { height: 520, alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: 12 },
  glow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.16)",
  },
  tableWrap: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tableSurface: {
    width: "110%",
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  tableShadow: {
    position: "absolute",
    bottom: -10,
    width: 220,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#000000",
  },

  phone: {
    width: 232,
    height: 472,
    borderRadius: 52,
    padding: 4,
    backgroundColor: "#1c1c1e",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 24 },
    elevation: 26,
    borderWidth: 1.5,
    borderColor: "#2a2a2c",
  },
  phoneFrameInner: {
    flex: 1,
    borderRadius: 47,
    padding: 5,
    backgroundColor: "#050505",
    borderWidth: 1.5,
    borderColor: "#000000",
  },
  sideBtnMute: {
    position: "absolute",
    left: -2,
    top: 92,
    width: 3,
    height: 26,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: "#0f0f10",
  },
  sideBtnVolUp: {
    position: "absolute",
    left: -2,
    top: 132,
    width: 3,
    height: 42,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: "#0f0f10",
  },
  sideBtnVolDown: {
    position: "absolute",
    left: -2,
    top: 184,
    width: 3,
    height: 42,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: "#0f0f10",
  },
  sideBtnPower: {
    position: "absolute",
    right: -2,
    top: 152,
    width: 3,
    height: 64,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: "#0f0f10",
  },
  dynamicIsland: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    width: 96,
    height: 30,
    borderRadius: 18,
    backgroundColor: "#000000",
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 8,
  },
  dynamicCam: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#0a0a14",
  },
  homeIndicator: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    width: 92,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.65)",
    zIndex: 6,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 42,
    backgroundColor: "#ffffff",
    padding: 14,
    paddingTop: 50,
    paddingBottom: 18,
    overflow: "hidden",
  },
  phoneStatus: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  phoneTime: { color: Colors.text, fontSize: 11, fontWeight: "900" },
  phoneDots: { flexDirection: "row", gap: 3 },
  dotSm: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.text },

  phoneHeader: { color: Colors.text, fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  phoneSub: { color: Colors.textDim, fontSize: 10, fontWeight: "600", marginTop: 2 },

  streakRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  streakChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa",
    overflow: "visible",
  },
  streakGlow: {
    position: "absolute",
    top: -3, left: -3, right: -3, bottom: -3,
    borderRadius: 999,
    backgroundColor: "rgba(251,146,60,0.35)",
  },
  plusOne: {
    position: "absolute",
    right: 4,
    top: -2,
    color: "#ea580c",
    fontSize: 11,
    fontWeight: "900",
  },
  streakEmoji: { fontSize: 10 },
  flameWrap: {
    position: "absolute",
    left: 4,
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  flameSplashRing: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#fb923c",
    backgroundColor: "rgba(251,146,60,0.45)",
  },
  flameSplashRing2: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(234,88,12,0.55)",
  },
  flameDroplet: {
    position: "absolute",
    fontSize: 9,
    color: "#ea580c",
    fontWeight: "900",
  },
  streakText: { color: "#9a3412", fontSize: 9, fontWeight: "900" },
  pointsChip: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: Colors.text,
  },
  pointsText: { color: "#ffffff", fontSize: 9, fontWeight: "900" },

  taskCardActive: {
    marginTop: 12,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  taskHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  radioWrap: {
    width: 18, height: 18, alignItems: "center", justifyContent: "center",
  },
  splashRing: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#16a34a",
    backgroundColor: "rgba(34,197,94,0.35)",
  },
  splashRing2: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(34,197,94,0.6)",
  },
  taskRadio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  taskRadioDim: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: "#dddddd" },
  taskTitle: { color: Colors.text, fontSize: 12, fontWeight: "800" },
  taskTitleWrap: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
  },
  goldStreak: {
    position: "absolute",
    top: -10,
    bottom: -10,
    width: 28,
    backgroundColor: "rgba(255,215,120,0.85)",
    shadowColor: "#facc15",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  taskTitleDim: { color: Colors.textDim, fontSize: 12, fontWeight: "700", flex: 1 },
  taskDesc: { color: Colors.textDim, fontSize: 10, marginTop: 6, lineHeight: 14, marginLeft: 26 },
  tapWrap: {
    position: "absolute",
    right: 14,
    top: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  tapRing: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.accentGold,
    backgroundColor: "rgba(212,175,55,0.25)",
  },

  taskCardDim: {
    marginTop: 8,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eeeeee",
    backgroundColor: "#fafafa",
  },

  aiPanel: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 18,
    backgroundColor: "#0a0a0a",
    padding: 12,
    paddingTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
  },
  aiLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#22c55e",
    marginLeft: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#1f1f24",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    borderBottomRightRadius: 3,
    marginBottom: 6,
    maxWidth: "85%",
  },
  userBubbleText: { color: "#ffffff", fontSize: 10, fontWeight: "600" },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    borderBottomLeftRadius: 3,
    maxWidth: "92%",
  },
  aiActions: { flexDirection: "row", gap: 6, marginTop: 8 },
  aiChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.accentGold,
  },
  aiChipText: { color: "#1a1208", fontSize: 9, fontWeight: "900" },
  aiChipDim: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  aiChipDimText: { color: "#e5e5e5", fontSize: 9, fontWeight: "800" },
  aiHandle: {
    position: "absolute",
    top: 6,
    alignSelf: "center",
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  aiHeadRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  aiAvatar: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.accentGold,
    alignItems: "center", justifyContent: "center",
  },
  aiTitle: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  aiAnswer: { color: "#e0e0e0", fontSize: 10, lineHeight: 14, fontWeight: "500" },
  aiTyping: { flexDirection: "row", gap: 4, marginTop: 8 },
  typingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.accentGold, opacity: 0.5 },
  typingDot2: { opacity: 0.7 },
  typingDot3: { opacity: 1 },

  footer: { paddingBottom: 8, paddingTop: 6, gap: 8, alignItems: "stretch" },
  noPay: { color: Colors.text, fontSize: 13, fontWeight: "900", textAlign: "center", letterSpacing: 0.3 },
  legal: { color: Colors.textMuted, fontSize: 11, textAlign: "center", lineHeight: 15 },
});
