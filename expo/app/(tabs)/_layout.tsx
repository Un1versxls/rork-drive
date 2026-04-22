import { Tabs } from "expo-router";
import { BarChart3, CheckCircle2, Sparkles, UserRound } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { triggerHaptic } from "@/lib/haptics";
import { useApp } from "@/providers/AppProvider";

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
  const onTabPress = () => triggerHaptic("select", state.profile.hapticsEnabled);

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

const styles = StyleSheet.create({
  tabItem: { alignItems: "center", justifyContent: "center", width: 60, height: 44 },
});
