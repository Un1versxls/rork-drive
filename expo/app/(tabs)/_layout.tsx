import { Tabs } from "expo-router";
import { BarChart3, CheckCircle2, UserRound } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { triggerHaptic } from "@/lib/haptics";
import { useApp } from "@/providers/AppProvider";

interface IconProps {
  focused: boolean;
  Icon: React.ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  label: string;
}

function TabIcon({ focused, Icon, label }: IconProps) {
  const color = focused ? Colors.accentDeep : Colors.textMuted;
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Icon color={color} size={20} strokeWidth={focused ? 2.4 : 2} />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const { state } = useApp();
  const onTabPress = () => triggerHaptic("select", state.profile.hapticsEnabled);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.accentDeep,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: Platform.OS === "ios" ? bottomPad : bottomPad + 4,
          height: 72,
          borderRadius: 24,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: Colors.border,
          backgroundColor: Colors.cardBg,
          paddingTop: 10,
          paddingBottom: 10,
          paddingHorizontal: 8,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        },
        tabBarItemStyle: { paddingVertical: 0 },
      }}
    >
      <Tabs.Screen
        name="tasks"
        listeners={{ tabPress: onTabPress }}
        options={{
          title: "Tasks",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={CheckCircle2} label="Tasks" />,
        }}
      />
      <Tabs.Screen
        name="progress"
        listeners={{ tabPress: onTabPress }}
        options={{
          title: "Progress",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={BarChart3} label="Progress" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{ tabPress: onTabPress }}
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={UserRound} label="Profile" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: "center", justifyContent: "center", gap: 4, width: 80, paddingTop: 2 },
  iconPill: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconPillActive: {
    backgroundColor: Colors.accentDim,
  },
  tabLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
  tabLabelActive: { color: Colors.accentDeep, fontWeight: "800" },
});
