import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProvider } from "@/providers/AppProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { Colors } from "@/constants/colors";
import { KeyboardToolbar } from "@/components/KeyboardToolbar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RevokedScreen } from "@/components/RevokedScreen";
import { useRouter } from "expo-router";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RevokedGate({ children }: { children: React.ReactNode }) {
  const { accessRevoked, clearRevoked } = useAuth();
  const router = useRouter();
  if (!accessRevoked) return <>{children}</>;
  return (
    <RevokedScreen
      onSignInAgain={() => {
        void clearRevoked();
        router.replace("/auth");
      }}
    />
  );
}

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
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "slide_from_right", gestureEnabled: false }} />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          // Block the iOS edge swipe from popping the tab stack back to
          // onboarding/index. Horizontal navigation inside the dashboard
          // is handled by the bottom tab bar (and the in-screen swipe
          // animation in tasks.tsx).
          gestureEnabled: false,
          fullScreenGestureEnabled: false,
        }}
      />
      <Stack.Screen name="auth" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="admin" options={{ headerShown: true, title: "Admin" }} />
      <Stack.Screen name="redeem" options={{ presentation: "modal", headerShown: true, title: "Redeem code" }} />
      <Stack.Screen name="redeem-code" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.root}>
          <SafeAreaProvider>
            <AuthProvider>
              <AppProvider>
                <View style={styles.root}>
                  <StatusBar style="dark" />
                  <RevokedGate>
                    <RootLayoutNav />
                  </RevokedGate>
                  <KeyboardToolbar />
                </View>
              </AppProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
});
