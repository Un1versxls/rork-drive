import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";

import { useApp } from "@/providers/AppProvider";
import { useAuth, LAST_ACTIVE_KEY } from "@/providers/AuthProvider";
import { SplashLoader } from "@/components/SplashLoader";
import { fetchAppUser } from "@/lib/appUserTracking";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Whitelist of onboarding routes the app is allowed to resume into on
// cold start. If state.profile.onboardingStep ever holds a stale or
// invalid path (e.g. a screen that was renamed or removed in a later
// build), redirecting to it would crash expo-router at launch. We fall
// back to /onboarding instead.
const VALID_ONBOARDING_STEPS = new Set<string>([
  "/onboarding",
  "/onboarding/age",
  "/onboarding/goal",
  "/onboarding/build-business",
  "/onboarding/skill-topic",
  "/onboarding/experience",
  "/onboarding/confidence",
  "/onboarding/time",
  "/onboarding/priority",
  "/onboarding/results",
  "/onboarding/industry",
  "/onboarding/budget",
  "/onboarding/obstacle",
  "/onboarding/name",
  "/onboarding/sync-accounts",
  "/onboarding/sign-in",
  "/onboarding/apple-signin",
  "/onboarding/email",
  "/onboarding/verify",
  "/onboarding/source",
  "/onboarding/match",
  "/onboarding/business",
  "/onboarding/pick-business",
  "/onboarding/day-trading",
  "/onboarding/feature-preview",
  "/onboarding/notifications",
  "/onboarding/plan-summary",
  "/onboarding/try-free",
  "/onboarding/paywall",
  "/onboarding/decline",
  "/onboarding/downgrade-confirm",
  "/onboarding/complete",
]);

export default function Index() {
  const { hydrated, state, hydrateFromAppUser } = useApp();
  const { booting, session } = useAuth();
  const [minShown, setMinShown] = useState<boolean>(false);
  const [cloudChecked, setCloudChecked] = useState<boolean>(false);
  const [lastActiveAt, setLastActiveAt] = useState<number | null>(null);
  const [activeChecked, setActiveChecked] = useState<boolean>(false);
  const fetchedFor = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
        setLastActiveAt(v ? Number(v) : null);
      } catch (e) {
        console.log("[index] last active read failed", e);
      } finally {
        setActiveChecked(true);
      }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMinShown(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // If we have a session, pull the cloud record on every app open so progress
  // migrates across devices. Prevents the "sign-in -> kicked back to sign-in"
  // loop and ensures tasks/streak/etc are always fresh from Supabase.
  useEffect(() => {
    const userId = session?.user?.id ?? null;
    if (!hydrated || !session) {
      setCloudChecked(true);
      return;
    }
    if (fetchedFor.current === userId) return;
    fetchedFor.current = userId;
    (async () => {
      try {
        const row = await fetchAppUser({ userId, email: session.user.email ?? null });
        if (row) {
          hydrateFromAppUser(row);
        }
      } catch (e) {
        console.log("[index] cloud restore error", e);
      } finally {
        setCloudChecked(true);
      }
    })();
  }, [hydrated, session, hydrateFromAppUser]);

  if (!hydrated || !minShown || booting || !cloudChecked || !activeChecked) {
    return <SplashLoader />;
  }

  // Stay signed in on the dashboard unless the user has been inactive for 30 days.
  // Activity is bumped every time the app boots while a session is alive.
  const now = Date.now();
  const activeRecently = lastActiveAt !== null && now - lastActiveAt < THIRTY_DAYS_MS;
  const lastSignedInAtRaw = session?.user?.last_sign_in_at ?? null;
  const lastSignedInMs = lastSignedInAtRaw ? new Date(lastSignedInAtRaw).getTime() : 0;
  const signedInRecently = lastSignedInMs > 0 && now - lastSignedInMs < THIRTY_DAYS_MS;

  if (!!session && state.onboarded && (activeRecently || signedInRecently || lastActiveAt === null)) {
    return <Redirect href="/(tabs)/tasks" />;
  }

  if (!state.onboarded) {
    const step = state.profile.onboardingStep;
    // If the user closed the app on the unclosable trial pages, send them back
    // to the plan summary (their last "safe" page with the Start my plan button).
    // If the user closed the app on the unclosable trial / paywall pages,
    // send them back to the create-account / sign-in screen so they always
    // re-enter through Apple/email auth before reaching the paywall again.
    if (step === "/onboarding/try-free" || step === "/onboarding/paywall") {
      return <Redirect href="/onboarding/apple-signin" />;
    }
    // Only resume into a step we recognise. A stale path from an older
    // build (or a typo'd value) would crash expo-router on cold start.
    if (step && step !== "/" && VALID_ONBOARDING_STEPS.has(step)) {
      return <Redirect href={step as never} />;
    }
    return <Redirect href="/onboarding" />;
  }
  if (!state.profile.subscription.active) {
    return <Redirect href="/onboarding/paywall" />;
  }
  return <Redirect href="/(tabs)/tasks" />;
}
