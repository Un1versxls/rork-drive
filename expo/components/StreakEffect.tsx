import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Flame } from "lucide-react-native";

import { getStreakTier, type StreakTierMeta } from "@/constants/streak-tiers";

interface Props {
  streak: number;
  size?: number;
  compact?: boolean;
  showNumber?: boolean;
  loop?: boolean;
  triggerKey?: number;
}

export function StreakEffect({
  streak,
  size = 200,
  compact = false,
  showNumber = true,
  loop = true,
  triggerKey,
}: Props) {
  const tier = getStreakTier(streak);
  const pulse = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const flicker = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  const particles = useMemo(
    () =>
      Array.from({ length: tier.particleCount }).map((_, i) => ({
        id: i,
        angle: (i / Math.max(1, tier.particleCount)) * Math.PI * 2 + Math.random() * 0.5,
        delay: Math.random() * 1400,
        distance: 0.6 + Math.random() * 0.55,
        scale: 0.5 + Math.random() * 0.7,
      })),
    [tier.particleCount]
  );

  const miniFlames = useMemo(
    () =>
      Array.from({ length: tier.miniFlames }).map((_, i) => ({
        id: i,
        angle: (i / Math.max(1, tier.miniFlames)) * Math.PI * 2,
        delay: (i / Math.max(1, tier.miniFlames)) * 600,
        size: 0.18 + Math.random() * 0.08,
      })),
    [tier.miniFlames]
  );

  useEffect(() => {
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const r = tier.rotationSpeed > 0
      ? Animated.loop(Animated.timing(rotate, { toValue: 1, duration: tier.rotationSpeed, easing: Easing.linear, useNativeDriver: true }))
      : null;
    const f = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.7, duration: 180, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.85, duration: 160, useNativeDriver: true }),
      ])
    );
    p.start();
    r?.start();
    f.start();
    return () => {
      p.stop();
      r?.stop();
      f.stop();
    };
  }, [pulse, rotate, flicker, tier.rotationSpeed]);

  useEffect(() => {
    if (triggerKey === undefined) return;
    burst.setValue(0);
    Animated.sequence([
      Animated.timing(burst, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(burst, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [triggerKey, burst]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const glowOpacity = Animated.multiply(
    pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] }),
    flicker
  );
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const burstScale = burst.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const burstOpacity = burst.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.9, 0] });

  const ringSize = size;
  const digits = Math.max(1, streak.toString().length);
  const baseFactor = compact ? 0.5 : 0.42;
  const shrink = digits >= 3 ? 0.6 : digits === 2 ? 0.78 : 1;
  const numberSize = Math.round(size * baseFactor * shrink);
  const flameSize = Math.round(size * (compact ? 0.92 : 0.86));

  return (
    <View style={[styles.root, { width: size, height: size }]} pointerEvents="none">
      {/* Outer radial glow */}
      <Animated.View
        style={[
          styles.absCenter,
          {
            width: ringSize * 1.8,
            height: ringSize * 1.8,
            opacity: glowOpacity,
            transform: [{ scale }],
          },
        ]}
      >
        <LinearGradient
          colors={[tier.glow, "rgba(201,168,124,0)"]}
          style={styles.glowFill}
        />
      </Animated.View>

      {/* Rotating rays (bigger tiers) */}
      {tier.rings > 1 ? (
        <Animated.View
          style={[
            styles.absCenter,
            {
              width: ringSize * 1.4,
              height: ringSize * 1.4,
              transform: [{ rotate: spin }],
              opacity: 0.55,
            },
          ]}
        >
          {Array.from({ length: Math.max(6, tier.rings * 4) }).map((_, i) => {
            const deg = (i / Math.max(6, tier.rings * 4)) * 360;
            return (
              <View
                key={i}
                style={[
                  styles.ray,
                  {
                    transform: [{ rotate: `${deg}deg` }, { translateY: -ringSize * 0.55 }],
                    backgroundColor: tier.secondary,
                    opacity: i % 2 === 0 ? 0.6 : 0.25,
                  },
                ]}
              />
            );
          })}
        </Animated.View>
      ) : null}

      {/* Pulsing ring */}
      {tier.rings > 0 ? (
        <Animated.View
          style={[
            styles.absCenter,
            {
              width: ringSize * 0.95,
              height: ringSize * 0.95,
              borderRadius: 9999,
              borderWidth: 2,
              borderColor: tier.primary,
              opacity: 0.55,
              transform: [{ scale }],
            },
          ]}
        />
      ) : null}

      {/* Particles */}
      {particles.map((p) => (
        <Particle
          key={p.id}
          meta={tier}
          angle={p.angle}
          delay={p.delay}
          distance={p.distance * (ringSize * 0.5)}
          scale={p.scale}
        />
      ))}

      {/* Flame silhouette core */}
      <Animated.View
        style={[
          styles.core,
          {
            width: flameSize,
            height: flameSize,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.flameShadow}>
          <Flame
            size={flameSize}
            color={tier.primary}
            fill={tier.primary}
            strokeWidth={0}
          />
        </View>
        <View style={[styles.flameInner, { width: flameSize * 0.7, height: flameSize * 0.7 }]}>
          <Flame
            size={flameSize * 0.7}
            color={tier.secondary}
            fill={tier.secondary}
            strokeWidth={0}
          />
        </View>
        {showNumber ? (
          <View style={[styles.numberWrap, { width: flameSize, height: flameSize }]} pointerEvents="none">
            <Text
              style={[
                styles.number,
                {
                  fontSize: numberSize,
                  marginTop: compact ? flameSize * 0.12 : flameSize * 0.14,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {streak}
            </Text>
            {!compact ? (
              <Text style={styles.numberLabel}>DAY STREAK</Text>
            ) : null}
          </View>
        ) : null}
      </Animated.View>

      {/* Orbiting mini flames */}
      {miniFlames.map((mf) => (
        <MiniFlame
          key={mf.id}
          meta={tier}
          baseAngle={mf.angle}
          delay={mf.delay}
          orbitRadius={ringSize * 0.52}
          flameSize={Math.round(size * mf.size)}
        />
      ))}

      {/* Nuclear aura */}
      {tier.nuclear ? (
        <Animated.View
          style={[
            styles.absCenter,
            {
              width: ringSize * 1.6,
              height: ringSize * 1.6,
              borderRadius: 9999,
              opacity: glowOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(216,255,58,0)", "rgba(216,255,58,0.35)", "rgba(139,255,77,0.55)", "rgba(216,255,58,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glowFill}
          />
        </Animated.View>
      ) : null}

      {tier.nuclear ? (
        <Animated.View
          style={[
            styles.absCenter,
            {
              width: ringSize * 1.15,
              height: ringSize * 1.15,
              borderRadius: 9999,
              borderWidth: 2,
              borderColor: tier.secondary,
              borderStyle: "dashed",
              opacity: 0.55,
              transform: [{ rotate: spin }],
            },
          ]}
        />
      ) : null}

      {/* Tap burst */}
      {triggerKey !== undefined ? (
        <Animated.View
          style={[
            styles.absCenter,
            {
              width: ringSize * 1.3,
              height: ringSize * 1.3,
              borderRadius: 9999,
              borderWidth: 3,
              borderColor: tier.primary,
              opacity: burstOpacity,
              transform: [{ scale: burstScale }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

function MiniFlame({
  meta,
  baseAngle,
  delay,
  orbitRadius,
  flameSize,
}: {
  meta: StreakTierMeta;
  baseAngle: number;
  delay: number;
  orbitRadius: number;
  flameSize: number;
}) {
  const orbit = useRef(new Animated.Value(0)).current;
  const flick = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const o = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: Math.max(1800, meta.rotationSpeed),
        easing: Easing.linear,
        useNativeDriver: true,
        delay,
      })
    );
    const f = Animated.loop(
      Animated.sequence([
        Animated.timing(flick, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(flick, { toValue: 0.65, duration: 200, useNativeDriver: true }),
        Animated.timing(flick, { toValue: 1, duration: 140, useNativeDriver: true }),
      ])
    );
    o.start();
    f.start();
    return () => {
      o.stop();
      f.stop();
    };
  }, [orbit, flick, meta.rotationSpeed, delay]);

  const rotate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: [`${(baseAngle * 180) / Math.PI}deg`, `${(baseAngle * 180) / Math.PI + 360}deg`],
  });
  const opacity = flick.interpolate({ inputRange: [0.65, 1], outputRange: [0.55, 1] });
  const scale = flick.interpolate({ inputRange: [0.65, 1], outputRange: [0.85, 1.1] });

  return (
    <Animated.View
      style={[
        styles.absCenter,
        {
          width: orbitRadius * 2,
          height: orbitRadius * 2,
          transform: [{ rotate }],
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: orbitRadius - flameSize / 2,
          opacity,
          transform: [{ scale }],
        }}
      >
        <Flame size={flameSize} color={meta.secondary} fill={meta.primary} strokeWidth={0} />
      </Animated.View>
    </Animated.View>
  );
}

function Particle({
  meta,
  angle,
  delay,
  distance,
  scale,
}: {
  meta: StreakTierMeta;
  angle: number;
  delay: number;
  distance: number;
  scale: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const tx = Math.cos(angle) * distance;
  const ty = Math.sin(angle) * distance - 30;

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, tx] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, ty] });
  const opacity = anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] });
  const s = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4 * scale, 1.1 * scale] });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: meta.secondary,
          opacity,
          transform: [{ translateX }, { translateY }, { scale: s }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center" },
  absCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  glowFill: { flex: 1, borderRadius: 9999 },
  ray: { position: "absolute", width: 3, height: 22, borderRadius: 2 },
  core: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f26b1a",
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
  },
  flameShadow: { position: "absolute", alignItems: "center", justifyContent: "center" },
  flameInner: { position: "absolute", alignItems: "center", justifyContent: "center", opacity: 0.85 },
  numberWrap: { position: "absolute", alignItems: "center", justifyContent: "center" },
  number: { color: "#faf9f6", fontWeight: "900", letterSpacing: -1, textShadowColor: "rgba(139,64,0,0.55)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  numberLabel: { color: "rgba(250,249,246,0.8)", fontWeight: "800", fontSize: 10, letterSpacing: 2, marginTop: 2 },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    top: "50%",
    left: "50%",
    marginLeft: -3,
    marginTop: -3,
  },
});
