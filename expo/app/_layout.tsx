import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProvider } from "@/providers/AppProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { Colors } from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerShown: false,
        contentStyle: { backgroundColor: "#ffffff" },
        animation: "fade",
      }}
    >
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="admin" options={{ headerShown: true, title: "Admin" }} />
      <Stack.Screen name="redeem" options={{ presentation: "modal", headerShown: true, title: "Redeem code" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <AuthProvider>
            <AppProvider>
              <View style={styles.root}>
                <StatusBar style="dark" />
                <RootLayoutNav />
              </View>
            </AppProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
});
