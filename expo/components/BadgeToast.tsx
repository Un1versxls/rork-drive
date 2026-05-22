import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Award } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors } from "@/constants/colors";
import { BADGES } from "@/constants/badges";

interface Props {
  badgeId: string | null;
  hapticsEnabled: boolean;
  onHide: () => void;
}

/**
 * Small in-app banner shown when a badge is unlocked. Slides in from
 * the top, holds briefly, then dismisses itself. Tappable to dismiss
 * early.
 */
export function BadgeToast({ badgeId, hapticsEnabled, onHide }: Props) {
  const slide = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (!badgeId) return;
    if (hapticsEnabled && Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    Animated.sequence([
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 7 }),
      Animated.delay(2600),
      Animated.timing(slide, { toValue: -140, duration: 280, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onHide();
    });
  }, [badgeId, slide, onHide, hapticsEnabled]);

  if (!badgeId) return null;
  const badge = BADGES.find((b) => b.id === badgeId);
  if (!badge) return null;

  const onPress = () => {
    Animated.timing(slide, { toValue: -140, duration: 200, useNativeDriver: true }).start(() => onHide());
  };

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: slide }] }]}>
      <Pressable onPress={onPress} style={styles.card}>
        <View style={styles.iconWrap}>
          <Award color="#ffffff" size={20} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>BADGE UNLOCKED</Text>
          <Text style={styles.title}>{badge.title}</Text>
          <Text style={styles.sub} numberOfLines={1}>{badge.description}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 60, left: 16, right: 16, zIndex: 110 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 18,
    backgroundColor: Colors.text,
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(212,175,55,0.95)",
    alignItems: "center", justifyContent: "center",
  },
  label: { color: "rgba(212,175,55,1)", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#ffffff", fontWeight: "900", fontSize: 15, marginTop: 2 },
  sub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 },
});
