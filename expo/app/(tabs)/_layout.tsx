import { Tabs, useRouter } from "expo-router";
import { BarChart3, CheckCircle2, LogIn, Lock, Sparkles, UserRound } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { triggerHaptic } from "@/lib/haptics";
import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import { supabaseReady } from "@/lib/supabase";

interface IconProps {
  focused: boolean;
  Icon: React.ComponentType<{ color: string; size: number; strokeWidth?: number }>;
}

function TabIcon({ focused, Icon }: IconProps) {
  const color = focused ? Colors.text : Colors.textMuted;
  return (
    <View style={styles.tabItem}>
      <Icon color={color} size={22} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const { state } = useApp();
  const { session, booting } = useAuth();
  const onTabPress = () => triggerHaptic("select", state.profile.hapticsEnabled);

  // If Supabase is configured and the user is signed out (e.g. tapped
  // sign-out from profile), gate the entire app behind a sign-in screen.
  // Local state was already wiped by AppProvider on auth change, so no
  // tasks / streak / badges are visible.
  if (supabaseReady && !booting && !session) {
    return <SignInRequired />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: Platform.OS === "ios" ? bottomPad : bottomPad + 4,
          height: 64,
          borderRadius: 22,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "#eeeeee",
          backgroundColor: "#ffffff",
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 8,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        },
        tabBarItemStyle: { paddingVertical: 0 },
      }}
    >
      <Tabs.Screen
        name="tasks"
        listeners={{ tabPress: onTabPress }}
        options={{ title: "Tasks", tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={CheckCircle2} /> }}
      />
      <Tabs.Screen
        name="progress"
        listeners={{ tabPress: onTabPress }}
        options={{ title: "Progress", tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={BarChart3} /> }}
      />
      <Tabs.Screen
        name="custom"
        listeners={{ tabPress: onTabPress }}
        options={{ title: "Build", tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Sparkles} /> }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{ tabPress: onTabPress }}
        options={{ title: "Profile", tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={UserRound} /> }}
      />
    </Tabs>
  );
}

function SignInRequired() {
  const router = useRouter();
  const { state } = useApp();
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(20)).current;
  const lockPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(lockPulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(lockPulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [fade, lift, lockPulse]);

  const haloScale = lockPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const haloOpacity = lockPulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.45] });

  return (
    <View style={gateStyles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <Animated.View style={[gateStyles.center, { opacity: fade, transform: [{ translateY: lift }] }]}>
          <View style={gateStyles.iconWrap}>
            <Animated.View style={[gateStyles.halo, { transform: [{ scale: haloScale }], opacity: haloOpacity }]} />
            <View style={gateStyles.iconInner}>
              <Lock color={Colors.accentGold} size={28} strokeWidth={2.4} />
            </View>
          </View>
          <Text style={gateStyles.title}>Sign back in to continue</Text>
          <Text style={gateStyles.sub}>
            Your tasks, streak, and progress are tied to your account. Sign in to pick up right where you left off.
          </Text>
          <Pressable
            onPress={() => {
              triggerHaptic("light", state.profile.hapticsEnabled);
              router.push("/auth");
            }}
            style={({ pressed }) => [gateStyles.cta, pressed && { opacity: 0.85 }]}
            testID="sign-in-gate-cta"
          >
            <LogIn color="#ffffff" size={16} />
            <Text style={gateStyles.ctaText}>Sign in</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const gateStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconWrap: { width: 96, height: 96, alignItems: "center", justifyContent: "center", marginBottom: 28 },
  halo: { position: "absolute", width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.accentGold },
  iconInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#ffffff",
    borderWidth: 1.5, borderColor: "rgba(212,175,55,0.4)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#d4af37", shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
  },
  title: { color: Colors.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.4, textAlign: "center" },
  sub: { color: Colors.textDim, fontSize: 14, lineHeight: 20, marginTop: 10, textAlign: "center", fontWeight: "600" },
  cta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 28, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 999, backgroundColor: Colors.text,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  ctaText: { color: "#ffffff", fontSize: 15, fontWeight: "800", letterSpacing: 0.2 },
});

const styles = StyleSheet.create({
  tabItem: { alignItems: "center", justifyContent: "center", width: 60, height: 44 },
});
