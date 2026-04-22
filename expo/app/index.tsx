import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { useApp } from "@/providers/AppProvider";
import { SplashLoader } from "@/components/SplashLoader";

export default function Index() {
  const { hydrated, state } = useApp();
  const [minShown, setMinShown] = useState<boolean>(false);

  useEffect(() => {
    const t = setTimeout(() => setMinShown(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!hydrated || !minShown) {
    return <SplashLoader />;
  }

  if (!state.onboarded) {
    const step = state.profile.onboardingStep;
    if (step && step !== "/") {
      return <Redirect href={step as never} />;
    }
    return <Redirect href="/onboarding" />;
  }
  if (!state.profile.subscription.active) {
    return <Redirect href="/onboarding/paywall" />;
  }
  return <Redirect href="/(tabs)/tasks" />;
}
