import { Stack } from "expo-router";
import React from "react";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#ffffff" },
        animation: "slide_from_right",
        // Lock the swipe-back gesture across onboarding so users can
        // only progress with the explicit arrow / continue button.
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
      }}
    />
  );
}
