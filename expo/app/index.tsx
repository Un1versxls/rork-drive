import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { useApp } from "@/providers/AppProvider";
import { useAuth } from "@/providers/AuthProvider";
import { SplashLoader } from "@/components/SplashLoader";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function Index() {
  const { hydrated, state } = useApp();
  const { booting, session } = useAuth();
  const [minShown, setMinShown] = useState<boolean>(false);

  useEffect(() => {
    const t = setTimeout(() => setMinShown(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!hydrated || !minShown || booting) {
    return <SplashLoader />;
  }

  const lastSignedInAtRaw = session?.user?.last_sign_in_at ?? null;
  const lastSignedInMs = lastSignedInAtRaw ? new Date(lastSignedInAtRaw).getTime() : 0;
  const signedInRecently = !!session && lastSignedInMs > 0 && Date.now() - lastSignedInMs < THIRTY_DAYS_MS;

  // If the user has a valid Supabase session from the past 30 days, keep them on the dashboard.
  if (signedInRecently && state.onboarded) {
    return <Redirect href="/(tabs)/tasks" />;
  }

  if (!state.onboarded) {
    const step = state.profile.onboardingStep;
    // If the user closed the app on the unclosable trial pages, send them back
    // to the plan summary (their last "safe" page with the Start my plan button).
    if (step === "/onboarding/try-free" || step === "/onboarding/paywall") {
      return <Redirect href="/onboarding/plan-summary" />;
    }
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
