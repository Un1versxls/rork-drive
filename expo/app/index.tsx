import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { useApp } from "@/providers/AppProvider";
import { SplashLoader } from "@/components/SplashLoader";

export default function Index() {
  const { hydrated, state } = useApp();
  const [minShown, setMinShown] = useState<boolean>(false);

  useEffect(() => {
    const t = setTimeout(() => setMinShown(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    console.log("[Index] hydrated", hydrated, "onboarded", state.onboarded);
  }, [hydrated, state.onboarded]);

  if (!hydrated || !minShown) {
    return <SplashLoader streak={state.streak} showStreak={state.onboarded && state.streak > 0} />;
  }

  if (!state.onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/tasks" />;
}
