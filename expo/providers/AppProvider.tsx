import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState as RNAppState, type AppStateStatus } from "react-native";

import { BADGES } from "@/constants/badges";

const IMPORTANT_BADGE_IDS: ReadonlySet<string> = new Set(
  BADGES.filter((b) => b.important === true).map((b) => b.id),
);
/** Should this freshly-unlocked badge surface a top-of-screen toast? */
function isImportantBadgeId(id: string): boolean {
  return IMPORTANT_BADGE_IDS.has(id);
}
import { ACHIEVEMENTS } from "@/constants/achievements";
import { getPlan, PLANS } from "@/constants/plans";
import { generateDailyTasks } from "@/constants/task-pool";
import { triggerHaptic } from "@/lib/haptics";
import { upsertAppUser, buildSyncFromAppState, fetchAppUser, type AppUserRow } from "@/lib/appUserTracking";
import { supabase } from "@/lib/supabase";
import { userCodeFor } from "@/lib/userCode";
import { currentShowcase } from "@/constants/showcase-updates";
import type {
  AppState,
  BillingCycle,
  BusinessIdea,
  Budget,
  DeclineReason,
  ExperienceLevel,
  Industry,
  NameEffect,
  NotificationPrefs,
  Obstacle,
  PlanId,
  PrimaryGoal,
  Priority,
  SkillTopic,
  Source,
  Subscription,
  TaskSeed,
  TimeCommitment,
  UserProfile,
} from "@/types";

const STORAGE_KEY = "drive.state.v4";
const NIGHTLY_SYNC_KEY = "drive.sync.lastNightlyDate";
const NIGHTLY_SYNC_HOUR = 17; // 5pm local time

function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
}

const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  dailyReminders: true,
  dailyReminderHour: 9,
  streakProtection: true,
  achievementUnlocks: true,
  businessMilestones: true,
  motivating: true,
};

const DEFAULT_SUBSCRIPTION: Subscription = {
  active: false,
  plan: "base",
  cycle: "yearly",
  trial: false,
  startedAt: null,
  expiresAt: null,
  trialEndsAt: null,
  source: "none",
};

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  appleUserId: null,
  goal: null,
  skillTopic: null,
  goalDetail: "",
  industryDetail: "",
  obstacleDetail: "",
  experience: null,
  time: null,
  priority: null,
  industry: null,
  budget: null,
  obstacle: null,
  source: null,
  declineReason: null,
  subscription: DEFAULT_SUBSCRIPTION,
  business: null,
  businessTaskPool: [],
  hapticsEnabled: true,
  notificationsEnabled: false,
  notificationPrefs: DEFAULT_NOTIF_PREFS,
  notificationPromptSeen: false,
  equippedEffect: "none",
  unlockedEffects: ["none"],
  lastRatePromptAt: null,
  hasRated: false,
  onboardingStep: null,
  customBuildMonth: null,
  customBuildCount: 0,
  businessSwitchMonth: null,
  businessSwitchCount: 0,
  businessSwitchBonus: 0,
  premiumSwitchBonusGranted: false,
  dayTradingMode: null,
  dayTradingMarket: null,
  dayTradingCapital: null,
  pastBusinesses: [],
  pathChoice: null,
  firstTourSeen: false,
  pendingProPick: null,
  pendingProPickPool: [],
  pendingFreeAlt: null,
  pendingFreeAltPool: [],
  motivationHintSeen: false,
  taskHintSeen: false,
  subtaskHintSeen: false,
  age: null,
  confidence: null,
  earlyBirdAchieved: false,
  fullDayAchieved: false,
  redeemedCodeOnce: false,
  userCode: null,
  lastShowcaseSeen: null,
  accountStartedAt: null,
};

const DEFAULT_STATE: AppState = {
  onboarded: false,
  profile: DEFAULT_PROFILE,
  tasks: [],
  points: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  history: {},
  unlockedBadges: [],
  unlockedAchievements: [],
  sessionsByDate: {},
};

async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      sessionsByDate: parsed.sessionsByDate ?? {},
      profile: {
        ...DEFAULT_PROFILE,
        ...parsed.profile,
        notificationPrefs: { ...DEFAULT_NOTIF_PREFS, ...(parsed.profile?.notificationPrefs ?? {}) },
        subscription: { ...DEFAULT_SUBSCRIPTION, ...(parsed.profile?.subscription ?? {}) },
        unlockedEffects: parsed.profile?.unlockedEffects ?? ["none"],
        pastBusinesses: parsed.profile?.pastBusinesses ?? [],
        businessSwitchBonus: parsed.profile?.businessSwitchBonus ?? 0,
        premiumSwitchBonusGranted: parsed.profile?.premiumSwitchBonusGranted ?? false,
        pathChoice: parsed.profile?.pathChoice ?? null,
        firstTourSeen: parsed.profile?.firstTourSeen ?? false,
        pendingProPick: parsed.profile?.pendingProPick ?? null,
        pendingProPickPool: parsed.profile?.pendingProPickPool ?? [],
        pendingFreeAlt: parsed.profile?.pendingFreeAlt ?? null,
        pendingFreeAltPool: parsed.profile?.pendingFreeAltPool ?? [],
        motivationHintSeen: parsed.profile?.motivationHintSeen ?? false,
        taskHintSeen: parsed.profile?.taskHintSeen ?? false,
        subtaskHintSeen: parsed.profile?.subtaskHintSeen ?? false,
        age: parsed.profile?.age ?? null,
        earlyBirdAchieved: parsed.profile?.earlyBirdAchieved ?? false,
        fullDayAchieved: parsed.profile?.fullDayAchieved ?? false,
        redeemedCodeOnce: parsed.profile?.redeemedCodeOnce ?? false,
        userCode: parsed.profile?.userCode ?? null,
        lastShowcaseSeen: parsed.profile?.lastShowcaseSeen ?? null,
        accountStartedAt: parsed.profile?.accountStartedAt ?? null,
      },
    };
  } catch (e) {
    console.log("[AppProvider] loadState error", e);
    return DEFAULT_STATE;
  }
}

async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.log("[AppProvider] saveState error", e);
  }
}

function evaluateBadges(state: AppState): { ids: string[]; newlyUnlocked: string[] } {
  const completed = Object.values(state.history).reduce((s, d) => s + d.completed, 0) +
    state.tasks.filter((t) => t.status === "completed").length;
  const businessesTried = (state.profile.pastBusinesses?.length ?? 0) + (state.profile.business ? 1 : 0);
  // Distinct days the user has touched the app (any history entry counts).
  const todayKeyStr = (() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  })();
  const historyDays = new Set(Object.keys(state.history));
  if (state.tasks.some((t) => t.dateKey === todayKeyStr && t.status !== "pending")) {
    historyDays.add(todayKeyStr);
  }
  const daysActive = historyDays.size;
  const isPremium = state.profile.subscription.plan === "premium" && state.profile.subscription.active;
  const unlocked = new Set(state.unlockedBadges);
  const newlyUnlocked: string[] = [];
  for (const b of BADGES) {
    if (unlocked.has(b.id)) continue;
    let value = 0;
    switch (b.metric) {
      case "completed": value = completed; break;
      case "streak": value = state.streak; break;
      case "points": value = state.points; break;
      case "businesses_tried": value = businessesTried; break;
      case "days_active": value = daysActive; break;
      case "early_bird": value = state.profile.earlyBirdAchieved ? 1 : 0; break;
      case "full_day":
      case "full_first_day": value = state.profile.fullDayAchieved ? 1 : 0; break;
      case "code_redeemed": value = state.profile.redeemedCodeOnce ? 1 : 0; break;
      case "premium": value = isPremium ? 1 : 0; break;
      default: value = 0;
    }
    if (value >= b.threshold) {
      unlocked.add(b.id);
      newlyUnlocked.push(b.id);
    }
  }
  return { ids: Array.from(unlocked), newlyUnlocked };
}

function evaluateAchievements(state: AppState): { ids: string[]; effects: NameEffect[]; newlyUnlocked: string[] } {
  const completed = Object.values(state.history).reduce((s, d) => s + d.completed, 0) +
    state.tasks.filter((t) => t.status === "completed").length;
  const unlocked = new Set(state.unlockedAchievements);
  const effects = new Set<NameEffect>(state.profile.unlockedEffects);
  const newlyUnlocked: string[] = [];
  const premiumPlan = state.profile.subscription.plan === "premium" && state.profile.subscription.active;
  for (const a of ACHIEVEMENTS) {
    if (unlocked.has(a.id)) continue;
    const value =
      a.metric === "completed" ? completed :
      a.metric === "streak" ? state.streak :
      a.metric === "points" ? state.points :
      a.metric === "plan" ? (premiumPlan ? 1 : 0) :
      0;
    if (value >= a.threshold) {
      unlocked.add(a.id);
      effects.add(a.effect);
      newlyUnlocked.push(a.id);
    }
  }
  return { ids: Array.from(unlocked), effects: Array.from(effects), newlyUnlocked };
}

export const [AppProvider, useApp] = createContextHook(() => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const stateRef = useRef<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [pendingAchievements, setPendingAchievements] = useState<string[]>([]);
  const [pendingBadges, setPendingBadges] = useState<string[]>([]);
  const qc = useQueryClient();

  const stateQuery = useQuery({
    queryKey: ["drive-state"],
    queryFn: loadState,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (stateQuery.data && !hydrated) {
      stateRef.current = stateQuery.data;
      setState(stateQuery.data);
      setHydrated(true);
    }
  }, [stateQuery.data, hydrated]);

  // Stamp the user's "account started" timestamp the first time we
  // hydrate an onboarded session that doesn't already have one. Powers
  // the "Day N" badge on the roadmap. If the user is signed into
  // Supabase, prefer their auth `created_at` (more accurate than local
  // backfill). Otherwise fall back to today.
  useEffect(() => {
    if (!hydrated) return;
    const prev = stateRef.current;
    if (!prev.onboarded) return;

    let cancelled = false;
    const stamp = async () => {
      let startedAt = prev.profile.accountStartedAt;
      // Always try to upgrade to the Supabase created_at when it's earlier
      // than what we have locally — that's the true sign-up date.
      try {
        if (supabase) {
          const { data } = await supabase.auth.getUser();
          const remote = data.user?.created_at ?? null;
          if (remote) {
            const remoteMs = new Date(remote).getTime();
            const localMs = startedAt ? new Date(startedAt).getTime() : Number.POSITIVE_INFINITY;
            if (!Number.isNaN(remoteMs) && remoteMs < localMs) {
              startedAt = remote;
            }
          }
        }
      } catch {}
      if (!startedAt) startedAt = new Date().toISOString();
      if (cancelled) return;
      const current = stateRef.current;
      if (current.profile.accountStartedAt === startedAt) return;
      const next: AppState = {
        ...current,
        profile: { ...current.profile, accountStartedAt: startedAt },
      };
      stateRef.current = next;
      setState(next);
      saveMutation.mutate(next);
    };
    void stamp();
    return () => { cancelled = true; };
  // saveMutation intentionally omitted so we only run when hydrated flips.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Track app sessions per day. Increments on cold start (when hydrated
  // flips) and on every transition to the active foreground state.
  // Persisted to AsyncStorage + cloud blob so we can report sessions/day
  // and avg tasks/day analytics.
  const lastSessionDateRef = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    const bump = (reason: string) => {
      const key = todayKey();
      const prev = stateRef.current;
      // Debounce: don't bump twice for the same date in the same active session.
      if (lastSessionDateRef.current === key && reason !== "foreground") return;
      lastSessionDateRef.current = key;
      const current = prev.sessionsByDate ?? {};
      const nextCount = (current[key] ?? 0) + 1;
      const next: AppState = {
        ...prev,
        sessionsByDate: { ...current, [key]: nextCount },
      };
      stateRef.current = next;
      setState(next);
      saveMutation.mutate(next);
      // Best-effort cloud sync of the session bump so analytics stay current.
      if (next.onboarded) syncToSupabase(next);
    };
    bump("cold-start");
    let lastForegroundAt = Date.now();
    const sub = RNAppState.addEventListener("change", (status: AppStateStatus) => {
      if (status === "active") {
        // Only count a new session if the app was backgrounded for >2 min
        // (avoid counting brief sheet/permission-prompt blurs as sessions).
        const now = Date.now();
        if (now - lastForegroundAt > 2 * 60 * 1000) bump("foreground");
        lastForegroundAt = now;
      } else if (status === "background") {
        lastForegroundAt = Date.now();
      }
    });
    return () => { sub.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Nightly forced sync — every active user pushes their full state up
  // to Supabase once a day at ~5pm local time. We also catch up on the
  // next app open if the window was missed. Tracked via AsyncStorage so
  // we don't double-fire across the same day.
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const tryNightlySync = async () => {
      try {
        const current = stateRef.current;
        if (!current.onboarded) return;
        const now = new Date();
        if (now.getHours() < NIGHTLY_SYNC_HOUR) return;
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const todayStr = `${now.getFullYear()}-${m}-${day}`;
        const last = await AsyncStorage.getItem(NIGHTLY_SYNC_KEY);
        if (last === todayStr) return;
        if (cancelled) return;
        console.log("[AppProvider] running nightly 5pm sync");
        await AsyncStorage.setItem(NIGHTLY_SYNC_KEY, todayStr);
        if (!supabase) return;
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id ?? null;
        const email = data.user?.email ?? current.profile.email ?? null;
        if (!uid && !email && !current.profile.appleUserId) return;
        const payload = buildSyncFromAppState(uid, email, current, { touchLastSeen: true });
        await upsertAppUser(payload);
      } catch (e) {
        console.log("[AppProvider] nightly sync error", e);
      }
    };
    void tryNightlySync();
    const id = setInterval(tryNightlySync, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [hydrated]);

  const saveMutation = useMutation({
    mutationFn: saveState,
  });

  // Tracks the latest in-flight sync so callers (sign-out, app background)
  // can await it and guarantee the cloud blob is current before tearing
  // the session down. Without this the fire-and-forget upserts could be
  // cancelled mid-flight when the user signed out right after completing
  // a task — so re-signing in showed an older blob without those checks.
  const pendingSyncRef = useRef<Promise<void> | null>(null);

  const syncToSupabase = useCallback((next: AppState, opts?: { force?: boolean }) => {
    if (!supabase) return;
    // Defer almost ALL syncing until onboarding is complete. During
    // onboarding we don't yet have a stable account (email/id), and
    // every keystroke / step was triggering getUser + upsert which
    // stacked up requests and caused races. Once `onboarded` flips
    // true we sync the full blob from then on. Callers that explicitly
    // need to push mid-onboarding (e.g. the moment we *finish* it) can
    // pass { force: true }.
    if (!opts?.force && !next.onboarded) return;
    const sb = supabase;
    const p = (async () => {
      try {
        const { data } = await sb.auth.getUser();
        const uid = data.user?.id ?? null;
        const email = data.user?.email ?? next.profile.email ?? null;
        if (!uid && !email && !next.profile.appleUserId) return;
        await upsertAppUser(buildSyncFromAppState(uid, email, next, { touchLastSeen: true }));
      } catch (e) {
        console.log("[AppProvider] sync error", e);
      }
    })();
    pendingSyncRef.current = p;
  }, []);

  /**
   * Force-push the very latest local state to Supabase and wait for the
   * upsert to land. Called before sign-out so the cloud blob always
   * reflects the user's most recent task completions / streak changes.
   */
  const flushSync = useCallback(async (): Promise<void> => {
    if (!supabase) return;
    // First, drain any in-flight sync started by a previous commit().
    if (pendingSyncRef.current) {
      try { await pendingSyncRef.current; } catch {}
    }
    const current = stateRef.current;
    if (!current.onboarded) return;
    const sb = supabase;
    const p = (async () => {
      try {
        const { data } = await sb.auth.getUser();
        const uid = data.user?.id ?? null;
        const email = data.user?.email ?? current.profile.email ?? null;
        if (!uid && !email && !current.profile.appleUserId) return;
        await upsertAppUser(buildSyncFromAppState(uid, email, current, { touchLastSeen: true }));
      } catch (e) {
        console.log("[AppProvider] flushSync error", e);
      }
    })();
    pendingSyncRef.current = p;
    await p;
  }, []);

  const commit = useCallback((next: AppState) => {
    // Update ref synchronously so consecutive setter calls in the same
    // tick compose against the latest state instead of clobbering each
    // other. Without this, calling setAnswers + setProfileField +
    // setBusiness back-to-back would only keep the final mutation
    // (the rest, including `goal`, would silently be lost — which
    // resulted in 0 generated tasks).
    stateRef.current = next;
    setState(next);
    saveMutation.mutate(next);
    qc.setQueryData(["drive-state"], next);
    // Continuously mirror the full state to Supabase so signing in on
    // a different device restores everything (tasks, streak, switches, etc.)
    syncToSupabase(next);
  }, [saveMutation, qc, syncToSupabase]);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.onboarded) return;
    if (!state.profile.goal) return;
    const key = todayKey();
    const hasToday = state.tasks.some((t) => t.dateKey === key);
    if (hasToday) return;

    let next = { ...state };

    if (state.lastActiveDate) {
      const gap = daysBetween(state.lastActiveDate, key);
      if (gap > 1) {
        next.streak = 0;
      }
    }

    const old = state.tasks.filter((t) => t.dateKey !== key);
    const history = { ...state.history };
    const byDate: Record<string, { completed: number; skipped: number }> = {};
    for (const t of old) {
      if (!byDate[t.dateKey]) byDate[t.dateKey] = { completed: 0, skipped: 0 };
      if (t.status === "completed") byDate[t.dateKey].completed++;
      else if (t.status === "skipped") byDate[t.dateKey].skipped++;
    }
    for (const k of Object.keys(byDate)) {
      history[k] = {
        completed: (history[k]?.completed ?? 0) + byDate[k].completed,
        skipped: (history[k]?.skipped ?? 0) + byDate[k].skipped,
      };
    }

    const plan = getPlan(state.profile.subscription.plan);
    const newTasks = generateDailyTasks(state.profile.goal, plan.taskLimit, key, state.profile.businessTaskPool);
    next = { ...next, tasks: newTasks, history };
    commit(next);
  }, [hydrated, state, commit]);

  const setProfileField = useCallback(<K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    const prev = stateRef.current;
    const next: AppState = { ...prev, profile: { ...prev.profile, [key]: value } };
    commit(next);
  }, [commit]);

  const setNotificationPrefs = useCallback((prefs: Partial<NotificationPrefs>) => {
    const prev = stateRef.current;
    const next: AppState = {
      ...prev,
      profile: {
        ...prev.profile,
        notificationPrefs: { ...prev.profile.notificationPrefs, ...prefs },
      },
    };
    commit(next);
  }, [commit]);

  const equipEffect = useCallback((effect: NameEffect) => {
    const prev = stateRef.current;
    if (!prev.profile.unlockedEffects.includes(effect)) return;
    const next: AppState = {
      ...prev,
      profile: { ...prev.profile, equippedEffect: effect },
    };
    commit(next);
    triggerHaptic("celebrate", prev.profile.hapticsEnabled);
  }, [commit]);

  const setAnswers = useCallback((a: {
    goal?: PrimaryGoal;
    experience?: ExperienceLevel;
    time?: TimeCommitment;
    priority?: Priority;
    industry?: Industry;
    budget?: Budget;
    obstacle?: Obstacle;
    source?: Source;
    skillTopic?: SkillTopic;
    name?: string;
    goalDetail?: string;
    industryDetail?: string;
    obstacleDetail?: string;
  }) => {
    const prev = stateRef.current;
    let next: AppState = {
      ...prev,
      profile: {
        ...prev.profile,
        ...a,
      },
    };
    if (prev.onboarded && a.goal && a.goal !== prev.profile.goal) {
      const plan = getPlan(next.profile.subscription.plan);
      const key = todayKey();
      const tasks = generateDailyTasks(a.goal, plan.taskLimit, key, next.profile.businessTaskPool);
      next = { ...next, tasks, lastActiveDate: key };
    }
    // commit() already calls syncToSupabase internally — don't double-fire,
    // back-to-back getUser/upsert calls were stacking up during onboarding.
    commit(next);
  }, [commit]);

  const setOnboardingStep = useCallback((path: string) => {
    const prev = stateRef.current;
    if (prev.profile.onboardingStep === path) return;
    const next: AppState = { ...prev, profile: { ...prev.profile, onboardingStep: path } };
    commit(next);
  }, [commit]);

  const startSubscription = useCallback((plan: PlanId, cycle: BillingCycle, opts?: { source?: Subscription["source"] }) => {
    const now = new Date();
    const source = opts?.source ?? "trial";
    const isTrial = source === "trial";
    const trialEnds = new Date(now);
    trialEnds.setDate(trialEnds.getDate() + 3);
    const expires = new Date(now);
    if (cycle === "yearly") expires.setFullYear(expires.getFullYear() + 1);
    else expires.setMonth(expires.getMonth() + 1);
    const sub: Subscription = {
      active: true,
      plan,
      cycle,
      trial: isTrial,
      startedAt: now.toISOString(),
      expiresAt: source === "code" || source === "admin" ? null : expires.toISOString(),
      trialEndsAt: isTrial ? trialEnds.toISOString() : null,
      source,
    };
    const prev = stateRef.current;
    // If buying Premium with 0 remaining switches this month, grant +2 bonus (one-time).
    const monthKey = todayKey().slice(0, 7);
    const sameMonth = prev.profile.businessSwitchMonth === monthKey;
    const usedThisMonth = sameMonth ? prev.profile.businessSwitchCount : 0;
    const currentBonus = prev.profile.businessSwitchBonus ?? 0;
    const currentLimit = BUSINESS_SWITCH_BASE_LIMIT + Math.max(0, currentBonus);
    const remaining = Math.max(0, currentLimit - usedThisMonth);
    const shouldGrant = plan === "premium" && remaining === 0 && !(prev.profile.premiumSwitchBonusGranted ?? false);
    const nextBonus = shouldGrant ? currentBonus + 2 : currentBonus;
    const nextGranted = shouldGrant ? true : (prev.profile.premiumSwitchBonusGranted ?? false);
    if (shouldGrant) {
      console.log("[AppProvider] premium purchased with 0 switches left -> +2 bonus");
    }
    let next: AppState = { ...prev, profile: { ...prev.profile, subscription: sub, businessSwitchBonus: nextBonus, premiumSwitchBonusGranted: nextGranted } };
    const ach = evaluateAchievements(next);
    next = {
      ...next,
      unlockedAchievements: ach.ids,
      profile: { ...next.profile, unlockedEffects: ach.effects },
    };
    commit(next);
    syncToSupabase(next);
    const badge = evaluateBadges(next);
    next = { ...next, unlockedBadges: badge.ids };
    commit(next);
    syncToSupabase(next);
    if (ach.newlyUnlocked.length > 0) {
      setPendingAchievements((p) => [...p, ...ach.newlyUnlocked]);
    }
    if (badge.newlyUnlocked.length > 0) {
      setPendingBadges((p) => [...p, ...badge.newlyUnlocked.filter(isImportantBadgeId)]);
    }
  }, [commit, syncToSupabase]);

  const grantPremiumViaCode = useCallback(() => {
    const sub: Subscription = {
      active: true,
      plan: "premium",
      cycle: "yearly",
      trial: false,
      startedAt: new Date().toISOString(),
      expiresAt: null,
      trialEndsAt: null,
      source: "code",
    };
    const prev = stateRef.current;
    const monthKey = todayKey().slice(0, 7);
    const sameMonth = prev.profile.businessSwitchMonth === monthKey;
    const usedThisMonth = sameMonth ? prev.profile.businessSwitchCount : 0;
    const currentBonus = prev.profile.businessSwitchBonus ?? 0;
    const currentLimit = BUSINESS_SWITCH_BASE_LIMIT + Math.max(0, currentBonus);
    const remaining = Math.max(0, currentLimit - usedThisMonth);
    const shouldGrant = remaining === 0 && !(prev.profile.premiumSwitchBonusGranted ?? false);
    const nextBonus = shouldGrant ? currentBonus + 2 : currentBonus;
    const nextGranted = shouldGrant ? true : (prev.profile.premiumSwitchBonusGranted ?? false);
    let next: AppState = { ...prev, profile: { ...prev.profile, subscription: sub, businessSwitchBonus: nextBonus, premiumSwitchBonusGranted: nextGranted, redeemedCodeOnce: true } };
    const ach = evaluateAchievements(next);
    const badge = evaluateBadges(next);
    next = {
      ...next,
      unlockedAchievements: ach.ids,
      unlockedBadges: badge.ids,
      profile: { ...next.profile, unlockedEffects: ach.effects },
    };
    commit(next);
    syncToSupabase(next);
    if (ach.newlyUnlocked.length > 0) setPendingAchievements((p) => [...p, ...ach.newlyUnlocked]);
    if (badge.newlyUnlocked.length > 0) setPendingBadges((p) => [...p, ...badge.newlyUnlocked.filter(isImportantBadgeId)]);
  }, [commit, syncToSupabase]);

  const cancelSubscription = useCallback(() => {
    const prev = stateRef.current;
    const sub: Subscription = { ...prev.profile.subscription, active: false, trial: false };
    const next: AppState = { ...prev, profile: { ...prev.profile, subscription: sub } };
    commit(next);
    syncToSupabase(next);
  }, [commit, syncToSupabase]);

  const setDeclineReason = useCallback((reason: DeclineReason | null) => {
    const prev = stateRef.current;
    commit({ ...prev, profile: { ...prev.profile, declineReason: reason } });
  }, [commit]);

  const markRated = useCallback(() => {
    const prev = stateRef.current;
    commit({
      ...prev,
      profile: { ...prev.profile, hasRated: true, lastRatePromptAt: new Date().toISOString() },
    });
  }, [commit]);

  const markRatePromptSeen = useCallback(() => {
    const prev = stateRef.current;
    commit({
      ...prev,
      profile: { ...prev.profile, lastRatePromptAt: new Date().toISOString() },
    });
  }, [commit]);

  const BUSINESS_SWITCH_BASE_LIMIT = 3;

  const setBusiness = useCallback((business: BusinessIdea, taskPool: TaskSeed[]): { ok: boolean; reason?: string } => {
    const current = stateRef.current;
    const plan = getPlan(current.profile.subscription.plan);
    const key = todayKey();
    const goal = current.profile.goal;
    const isCustom = business.id.startsWith("custom-");
    const monthKey = key.slice(0, 7);
    const sameMonth = current.profile.customBuildMonth === monthKey;
    const nextCount = isCustom ? (sameMonth ? current.profile.customBuildCount + 1 : 1) : current.profile.customBuildCount;
    const nextMonth = isCustom ? monthKey : current.profile.customBuildMonth;

    const prevBiz = current.profile.business;
    const isSwitch = !!prevBiz && prevBiz.id !== business.id;
    const sameSwitchMonth = current.profile.businessSwitchMonth === monthKey;
    const switchesThisMonth = sameSwitchMonth ? current.profile.businessSwitchCount : 0;
    const bonusAvailable = Math.max(0, current.profile.businessSwitchBonus ?? 0);
    const effectiveLimit = BUSINESS_SWITCH_BASE_LIMIT + bonusAvailable;
    if (isSwitch && switchesThisMonth >= effectiveLimit) {
      console.log("[AppProvider] business switch blocked: monthly limit reached");
      return { ok: false, reason: "limit" };
    }
    const nextSwitchCount = isSwitch ? switchesThisMonth + 1 : switchesThisMonth;
    const nextSwitchMonth = isSwitch ? monthKey : current.profile.businessSwitchMonth;

    const pastBusinesses = (() => {
      if (!prevBiz || prevBiz.id === business.id) return current.profile.pastBusinesses;
      const filtered = current.profile.pastBusinesses.filter((b) => b.id !== prevBiz.id);
      return [prevBiz, ...filtered].slice(0, 20);
    })();

    const profile = {
      ...current.profile,
      business,
      businessTaskPool: taskPool,
      customBuildMonth: nextMonth,
      customBuildCount: nextCount,
      businessSwitchMonth: nextSwitchMonth,
      businessSwitchCount: nextSwitchCount,
      pastBusinesses,
    };
    let next: AppState = { ...current, profile };
    if (goal) {
      const tasks = generateDailyTasks(goal, plan.taskLimit, key, taskPool);
      next = { ...next, tasks, lastActiveDate: key };
    }
    commit(next);
    syncToSupabase(next);
    return { ok: true };
  }, [commit, syncToSupabase]);

  const completeOnboarding = useCallback(() => {
    const prev = stateRef.current;
    if (!prev.profile.goal) return;
    const plan = getPlan(prev.profile.subscription.plan);
    const key = todayKey();
    const tasks = generateDailyTasks(prev.profile.goal, plan.taskLimit, key, prev.profile.businessTaskPool);
    const next: AppState = {
      ...prev,
      onboarded: true,
      tasks,
      lastActiveDate: key,
      profile: { ...prev.profile, onboardingStep: null },
    };
    commit(next);
    // Force the first full sync now that we have a complete profile.
    syncToSupabase(next, { force: true });
  }, [commit, syncToSupabase]);

  const completeTask = useCallback((id: string) => {
    const prev = stateRef.current;
    const task = prev.tasks.find((t) => t.id === id);
    if (!task || task.status !== "pending") return;
    const plan = getPlan(prev.profile.subscription.plan);
    const pts = task.basePoints * plan.multiplier;
    const tasks = prev.tasks.map((t) => (t.id === id ? { ...t, status: "completed" as const } : t));
    const key = todayKey();
    let streak = prev.streak;
    let bestStreak = prev.bestStreak;
    const todayCompletedBefore = prev.tasks.filter((t) => t.status === "completed" && t.dateKey === key).length;
    if (todayCompletedBefore === 0) {
      if (prev.lastActiveDate && daysBetween(prev.lastActiveDate, key) === 1) {
        streak = prev.streak + 1;
      } else if (prev.lastActiveDate === key) {
        streak = Math.max(1, prev.streak);
      } else {
        streak = 1;
      }
      bestStreak = Math.max(prev.bestStreak, streak);
    }
    let next: AppState = {
      ...prev,
      tasks,
      points: prev.points + pts,
      streak,
      bestStreak,
      lastActiveDate: key,
    };
    // Track behavior flags before evaluating badges.
    const hour = new Date().getHours();
    const todayKeyNow = todayKey();
    const completedTodayNow = next.tasks.filter((t) => t.status === "completed" && t.dateKey === todayKeyNow).length;
    const totalTodayNow = next.tasks.filter((t) => t.dateKey === todayKeyNow).length;
    const profilePatch: Partial<UserProfile> = {};
    if (!next.profile.earlyBirdAchieved && hour < 12) profilePatch.earlyBirdAchieved = true;
    if (!next.profile.fullDayAchieved && totalTodayNow > 0 && completedTodayNow === totalTodayNow) profilePatch.fullDayAchieved = true;
    if (Object.keys(profilePatch).length > 0) {
      next = { ...next, profile: { ...next.profile, ...profilePatch } };
    }
    const badge = evaluateBadges(next);
    next = { ...next, unlockedBadges: badge.ids };
    const ach = evaluateAchievements(next);
    next = {
      ...next,
      unlockedAchievements: ach.ids,
      profile: { ...next.profile, unlockedEffects: ach.effects },
    };
    commit(next);
    triggerHaptic("doubleTap", prev.profile.hapticsEnabled);
    if (ach.newlyUnlocked.length > 0) {
      setPendingAchievements((p) => [...p, ...ach.newlyUnlocked]);
      setTimeout(() => {
        triggerHaptic("celebrate", prev.profile.hapticsEnabled);
      }, 350);
    }
    if (badge.newlyUnlocked.length > 0) {
      setPendingBadges((p) => [...p, ...badge.newlyUnlocked.filter(isImportantBadgeId)]);
    }
  }, [commit]);

  const skipTask = useCallback((id: string) => {
    const prev = stateRef.current;
    const tasks = prev.tasks.map((t) => (t.id === id ? { ...t, status: "skipped" as const } : t));
    const next: AppState = { ...prev, tasks };
    commit(next);
    triggerHaptic("warning", prev.profile.hapticsEnabled);
  }, [commit]);

  const undoTask = useCallback((id: string) => {
    const prev = stateRef.current;
    const target = prev.tasks.find((t) => t.id === id);
    if (!target) return;
    const plan = getPlan(prev.profile.subscription.plan);
    const wasCompleted = target.status === "completed";
    const tasks = prev.tasks.map((t) => (t.id === id ? { ...t, status: "pending" as const } : t));
    const next: AppState = {
      ...prev,
      tasks,
      points: wasCompleted ? Math.max(0, prev.points - target.basePoints * plan.multiplier) : prev.points,
    };
    commit(next);
    triggerHaptic("tap", prev.profile.hapticsEnabled);
  }, [commit]);

  const ensureTodayTasks = (s: AppState): AppState => {
    if (!s.profile.goal) return s;
    const key = todayKey();
    const hasToday = s.tasks.some((t) => t.dateKey === key);
    if (hasToday) return s;
    const plan = getPlan(s.profile.subscription.plan);
    const old = s.tasks.filter((t) => t.dateKey !== key);
    const history = { ...s.history };
    for (const t of old) {
      if (!history[t.dateKey]) history[t.dateKey] = { completed: 0, skipped: 0 };
      if (t.status === "completed") history[t.dateKey].completed++;
      else if (t.status === "skipped") history[t.dateKey].skipped++;
    }
    const newTasks = generateDailyTasks(s.profile.goal, plan.taskLimit, key, s.profile.businessTaskPool);
    let streak = s.streak;
    if (s.lastActiveDate) {
      const gap = daysBetween(s.lastActiveDate, key);
      if (gap > 1) streak = 0;
    }
    return { ...s, tasks: newTasks, history, streak };
  };

  const hydrateFromAppUserImpl = (row: AppUserRow, current: AppState): { next: AppState; routeReady: boolean } => {
    // If we have a full state blob, restore it verbatim — same exact
    // experience across devices.
    if (row.state_blob && typeof row.state_blob === "object") {
      const blob = row.state_blob as Partial<AppState>;
      let merged: AppState = {
        ...DEFAULT_STATE,
        ...blob,
        profile: {
          ...DEFAULT_PROFILE,
          ...(blob.profile ?? {}),
          notificationPrefs: { ...DEFAULT_NOTIF_PREFS, ...(blob.profile?.notificationPrefs ?? {}) },
          subscription: { ...DEFAULT_SUBSCRIPTION, ...(blob.profile?.subscription ?? {}) },
          unlockedEffects: blob.profile?.unlockedEffects ?? ["none"],
          pastBusinesses: blob.profile?.pastBusinesses ?? [],
          businessSwitchBonus: blob.profile?.businessSwitchBonus ?? 0,
          premiumSwitchBonusGranted: blob.profile?.premiumSwitchBonusGranted ?? false,
          pathChoice: blob.profile?.pathChoice ?? null,
          firstTourSeen: blob.profile?.firstTourSeen ?? false,
          pendingProPick: blob.profile?.pendingProPick ?? null,
          pendingProPickPool: blob.profile?.pendingProPickPool ?? [],
          pendingFreeAlt: blob.profile?.pendingFreeAlt ?? null,
          pendingFreeAltPool: blob.profile?.pendingFreeAltPool ?? [],
          motivationHintSeen: blob.profile?.motivationHintSeen ?? false,
          taskHintSeen: blob.profile?.taskHintSeen ?? false,
          subtaskHintSeen: blob.profile?.subtaskHintSeen ?? false,
          age: blob.profile?.age ?? null,
          earlyBirdAchieved: blob.profile?.earlyBirdAchieved ?? false,
          fullDayAchieved: blob.profile?.fullDayAchieved ?? false,
          redeemedCodeOnce: blob.profile?.redeemedCodeOnce ?? false,
          userCode: blob.profile?.userCode ?? null,
          lastShowcaseSeen: blob.profile?.lastShowcaseSeen ?? null,
          accountStartedAt: blob.profile?.accountStartedAt ?? null,
        },
        tasks: Array.isArray(blob.tasks) ? blob.tasks : [],
        history: blob.history ?? {},
        unlockedBadges: Array.isArray(blob.unlockedBadges) ? blob.unlockedBadges : [],
        unlockedAchievements: Array.isArray(blob.unlockedAchievements) ? blob.unlockedAchievements : [],
        sessionsByDate: blob.sessionsByDate ?? {},
      };
      // Keep email/name in sync with what the row has if blob is missing them.
      if (!merged.profile.email && row.email) merged.profile.email = row.email;
      if (!merged.profile.name && row.name) merged.profile.name = row.name;
      // Server-side bonus column is source of truth (admin can edit it directly).
      if (typeof row.business_switch_bonus === "number") {
        merged = { ...merged, profile: { ...merged.profile, businessSwitchBonus: Math.max(merged.profile.businessSwitchBonus ?? 0, row.business_switch_bonus) } };
      }
      if (typeof row.premium_switch_bonus_granted === "boolean") {
        merged = { ...merged, profile: { ...merged.profile, premiumSwitchBonusGranted: row.premium_switch_bonus_granted || (merged.profile.premiumSwitchBonusGranted ?? false) } };
      }
      // Cloud-authoritative business switch counter: if the row has
      // higher usage for the current month than what's in the blob,
      // adopt the cloud value so reinstalls can't recover swaps.
      if (typeof row.business_switch_count === "number" && row.business_switch_month) {
        const monthKey = (() => { const d = new Date(); const m = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0"); return `${d.getFullYear()}-${m}-${day}`.slice(0, 7); })();
        const cloudMonth = row.business_switch_month;
        const cloudCount = row.business_switch_count;
        if (cloudMonth === monthKey) {
          const localSameMonth = merged.profile.businessSwitchMonth === monthKey ? merged.profile.businessSwitchCount : 0;
          if (cloudCount > localSameMonth) {
            merged = { ...merged, profile: { ...merged.profile, businessSwitchMonth: cloudMonth, businessSwitchCount: cloudCount } };
          }
        }
      }
      if (row.user_code && !merged.profile.userCode) {
        merged = { ...merged, profile: { ...merged.profile, userCode: row.user_code } };
      }
      if (row.last_showcase_seen && !merged.profile.lastShowcaseSeen) {
        merged = { ...merged, profile: { ...merged.profile, lastShowcaseSeen: row.last_showcase_seen } };
      }
      // Ensure today's tasks exist immediately so the dashboard never shows
      // "0 tasks" right after sign-in. If the cloud blob has stale or empty
      // tasks, regenerate for today's date inline.
      merged = ensureTodayTasks(merged);
      return { next: merged, routeReady: merged.onboarded && !!merged.profile.goal };
    }

    const profile: UserProfile = {
      ...current.profile,
      name: row.name ?? current.profile.name,
      email: row.email ?? current.profile.email,
      goal: (row.goal as PrimaryGoal | null) ?? current.profile.goal,
      skillTopic: (row.skill_topic as SkillTopic | null) ?? current.profile.skillTopic,
      experience: (row.experience as ExperienceLevel | null) ?? current.profile.experience,
      time: (row.time_commitment as TimeCommitment | null) ?? current.profile.time,
      priority: (row.priority as Priority | null) ?? current.profile.priority,
      industry: (row.industry as Industry | null) ?? current.profile.industry,
      budget: (row.budget as Budget | null) ?? current.profile.budget,
      obstacle: (row.obstacle as Obstacle | null) ?? current.profile.obstacle,
      source: (row.source as Source | null) ?? current.profile.source,
      declineReason: (row.decline_reason as DeclineReason | null) ?? current.profile.declineReason,
      business: row.business_id && row.business_name ? {
        id: row.business_id,
        name: row.business_name,
        tagline: row.business_tagline ?? "",
        description: current.profile.business?.description ?? "",
        whyFit: current.profile.business?.whyFit ?? "",
        startupCost: current.profile.business?.startupCost ?? "",
        timeToIncome: current.profile.business?.timeToIncome ?? "",
        firstMilestones: current.profile.business?.firstMilestones ?? [],
      } as BusinessIdea : current.profile.business,
      subscription: {
        active: row.subscription_active ?? current.profile.subscription.active,
        plan: (row.subscription_plan as PlanId | null) ?? current.profile.subscription.plan,
        cycle: (row.subscription_cycle as BillingCycle | null) ?? current.profile.subscription.cycle,
        trial: row.subscription_trial ?? current.profile.subscription.trial,
        startedAt: row.subscription_started_at ?? current.profile.subscription.startedAt,
        expiresAt: row.subscription_expires_at ?? current.profile.subscription.expiresAt ?? null,
        trialEndsAt: row.trial_ends_at ?? current.profile.subscription.trialEndsAt ?? null,
        source: (row.subscription_source as Subscription["source"] | null) ?? current.profile.subscription.source,
      },
      dayTradingMode: (row.day_trading_mode as UserProfile["dayTradingMode"]) ?? current.profile.dayTradingMode,
      dayTradingMarket: (row.day_trading_market as UserProfile["dayTradingMarket"]) ?? current.profile.dayTradingMarket,
      dayTradingCapital: (row.day_trading_capital as UserProfile["dayTradingCapital"]) ?? current.profile.dayTradingCapital,
      businessSwitchBonus: typeof row.business_switch_bonus === "number"
        ? Math.max(current.profile.businessSwitchBonus ?? 0, row.business_switch_bonus)
        : current.profile.businessSwitchBonus ?? 0,
      premiumSwitchBonusGranted: row.premium_switch_bonus_granted ?? current.profile.premiumSwitchBonusGranted ?? false,
      businessSwitchMonth: (() => {
        const monthKey = todayKey().slice(0, 7);
        if (row.business_switch_month === monthKey && typeof row.business_switch_count === "number") {
          return monthKey;
        }
        return current.profile.businessSwitchMonth;
      })(),
      businessSwitchCount: (() => {
        const monthKey = todayKey().slice(0, 7);
        if (row.business_switch_month === monthKey && typeof row.business_switch_count === "number") {
          const localSameMonth = current.profile.businessSwitchMonth === monthKey ? current.profile.businessSwitchCount : 0;
          return Math.max(localSameMonth, row.business_switch_count);
        }
        return current.profile.businessSwitchCount;
      })(),
      userCode: row.user_code ?? current.profile.userCode ?? null,
      lastShowcaseSeen: row.last_showcase_seen ?? current.profile.lastShowcaseSeen ?? null,
    };
    const onboarded = row.onboarded === true || current.onboarded;
    let next: AppState = {
      ...current,
      onboarded,
      points: row.points ?? current.points,
      streak: row.streak ?? current.streak,
      bestStreak: row.best_streak ?? current.bestStreak,
      lastActiveDate: row.last_active_date ?? current.lastActiveDate,
      profile,
    };
    next = ensureTodayTasks(next);
    return { next, routeReady: onboarded && !!profile.goal };
  };

  const hydrateFromAppUser = useCallback((row: AppUserRow): boolean => {
    const { next, routeReady } = hydrateFromAppUserImpl(row, stateRef.current);
    commit(next);
    return routeReady;
  }, [commit]);

  /**
   * Lightweight cloud refresh: adopts admin-editable counters from the
   * server row (streak / best streak / points / business switch bonus /
   * premium grant) when they differ from local. Never overwrites local
   * task progress.
   */
  const refreshFromCloud = useCallback(async (): Promise<void> => {
    if (!supabase) return;
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      const email = data.user?.email ?? stateRef.current.profile.email ?? null;
      if (!uid && !email) return;
      const row = await fetchAppUser({ userId: uid, email });
      if (!row) return;
      const current = stateRef.current;
      let changed = false;
      let next: AppState = current;
      const nextProfile = { ...current.profile };
      if (typeof row.streak === "number" && row.streak !== current.streak) {
        next = { ...next, streak: row.streak }; changed = true;
      }
      if (typeof row.best_streak === "number" && row.best_streak !== current.bestStreak) {
        next = { ...next, bestStreak: row.best_streak }; changed = true;
      }
      if (typeof row.points === "number" && row.points !== current.points) {
        next = { ...next, points: row.points }; changed = true;
      }
      if (typeof row.business_switch_bonus === "number" && row.business_switch_bonus !== (current.profile.businessSwitchBonus ?? 0)) {
        nextProfile.businessSwitchBonus = row.business_switch_bonus; changed = true;
      }
      if (changed) {
        commit({ ...next, profile: nextProfile });
      }
    } catch (e) {
      console.log("[AppProvider] refreshFromCloud error", e);
    }
  }, [commit]);

  const resetOnboarding = useCallback(() => {
    const next: AppState = { ...DEFAULT_STATE };
    commit(next);
  }, [commit]);

  // When the signed-in Supabase user changes (sign-out, or signing in
  // with a different account from the profile page), refresh the local
  // app state to match the new account. Without this the previous user's
  // businesses / badges / streak stayed on screen because hydration only
  // ran via index.tsx on cold start.
  const lastAuthUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!hydrated) return;
    if (!supabase) return;
    let cancelled = false;

    const handleUser = async (userId: string | null, email: string | null) => {
      const prev = lastAuthUserIdRef.current;
      // First run after hydrate: just record who's signed in, no reset.
      if (prev === undefined) {
        lastAuthUserIdRef.current = userId;
        return;
      }
      if (prev === userId) return;
      lastAuthUserIdRef.current = userId;

      if (!userId) {
        // Signed out — wipe local state so the next sign-in starts clean.
        console.log("[AppProvider] auth change: signed out, resetting local state");
        if (!cancelled) commit({ ...DEFAULT_STATE });
        return;
      }

      // Signed in as a different user — hydrate from cloud, or fall back
      // to a clean slate if there's no row yet.
      try {
        console.log("[AppProvider] auth change: switching to user", userId);
        const row = await fetchAppUser({ userId, email });
        if (cancelled) return;
        if (row) {
          const { next } = hydrateFromAppUserImpl(row, DEFAULT_STATE);
          commit(next);
        } else {
          commit({ ...DEFAULT_STATE });
        }
      } catch (e) {
        console.log("[AppProvider] auth switch hydrate error", e);
        if (!cancelled) commit({ ...DEFAULT_STATE });
      }
    };

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      void handleUser(data.user?.id ?? null, data.user?.email ?? null);
    }).catch(() => {});

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") return;
      void handleUser(s?.user?.id ?? null, s?.user?.email ?? null);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, commit]);

  const dismissPendingAchievement = useCallback((id: string) => {
    setPendingAchievements((prev) => prev.filter((x) => x !== id));
  }, []);

  const dismissPendingBadge = useCallback((id: string) => {
    setPendingBadges((prev) => prev.filter((x) => x !== id));
  }, []);

  // Backfill userCode locally once we know any identifier for the user.
  useEffect(() => {
    if (!hydrated) return;
    const p = stateRef.current.profile;
    if (p.userCode) return;
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const uid = data.user?.id ?? null;
      const email = data.user?.email ?? p.email ?? null;
      const code = userCodeFor({ userId: uid, appleUserId: p.appleUserId, email });
      if (!code) return;
      const prev = stateRef.current;
      if (prev.profile.userCode) return;
      commit({ ...prev, profile: { ...prev.profile, userCode: code } });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [hydrated, commit]);

  const dismissCurrentShowcase = useCallback(() => {
    const showcase = currentShowcase();
    if (!showcase) return;
    const prev = stateRef.current;
    if (prev.profile.lastShowcaseSeen === showcase.id) return;
    commit({ ...prev, profile: { ...prev.profile, lastShowcaseSeen: showcase.id } });
  }, [commit]);

  const today = useMemo(() => {
    const key = todayKey();
    const list = state.tasks.filter((t) => t.dateKey === key);
    const completed = list.filter((t) => t.status === "completed").length;
    const skipped = list.filter((t) => t.status === "skipped").length;
    return { key, list, completed, skipped, total: list.length };
  }, [state.tasks]);

  const weeklyActivity = useMemo(() => {
    const out: { key: string; completed: number; label: string }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${d.getFullYear()}-${m}-${day}`;
      const label = ["S", "M", "T", "W", "T", "F", "S"][d.getDay()];
      const fromHistory = state.history[key]?.completed ?? 0;
      const fromToday = state.tasks.filter((t) => t.dateKey === key && t.status === "completed").length;
      out.push({ key, completed: fromHistory + fromToday, label });
    }
    return out;
  }, [state.history, state.tasks]);

  const totalCompleted = useMemo(() => {
    return Object.values(state.history).reduce((s, d) => s + d.completed, 0) +
      state.tasks.filter((t) => t.status === "completed").length;
  }, [state.history, state.tasks]);

  const totalSkipped = useMemo(() => {
    return Object.values(state.history).reduce((s, d) => s + d.skipped, 0) +
      state.tasks.filter((t) => t.status === "skipped").length;
  }, [state.history, state.tasks]);

  const level = useMemo(() => Math.floor(state.points / 250) + 1, [state.points]);
  const levelProgress = useMemo(() => (state.points % 250) / 250, [state.points]);

  const currentPlan = useMemo(() => getPlan(state.profile.subscription.plan), [state.profile.subscription.plan]);
  const isPremium = state.profile.subscription.plan === "premium" && state.profile.subscription.active;
  const hasActiveSubscription = state.profile.subscription.active;

  const CUSTOM_BUILD_MONTHLY_LIMIT = 2;
  const customBuildsThisMonth = useMemo(() => {
    const monthKey = todayKey().slice(0, 7);
    return state.profile.customBuildMonth === monthKey ? state.profile.customBuildCount : 0;
  }, [state.profile.customBuildMonth, state.profile.customBuildCount]);
  const customBuildsRemaining = Math.max(0, CUSTOM_BUILD_MONTHLY_LIMIT - customBuildsThisMonth);
  const customBuildLimit = CUSTOM_BUILD_MONTHLY_LIMIT;

  const businessSwitchesThisMonth = useMemo(() => {
    const monthKey = todayKey().slice(0, 7);
    return state.profile.businessSwitchMonth === monthKey ? state.profile.businessSwitchCount : 0;
  }, [state.profile.businessSwitchMonth, state.profile.businessSwitchCount]);
  const businessSwitchBonus = state.profile.businessSwitchBonus ?? 0;
  const businessSwitchLimit = BUSINESS_SWITCH_BASE_LIMIT + Math.max(0, businessSwitchBonus);
  const businessSwitchesRemaining = Math.max(0, businessSwitchLimit - businessSwitchesThisMonth);

  return useMemo(() => ({
    hydrated,
    state,
    today,
    weeklyActivity,
    totalCompleted,
    totalSkipped,
    level,
    levelProgress,
    plans: PLANS,
    currentPlan,
    isPremium,
    hasActiveSubscription,
    customBuildsThisMonth,
    customBuildsRemaining,
    customBuildLimit,
    businessSwitchesThisMonth,
    businessSwitchesRemaining,
    businessSwitchLimit,
    pendingAchievements,
    pendingBadges,
    setAnswers,
    setOnboardingStep,
    startSubscription,
    grantPremiumViaCode,
    cancelSubscription,
    setDeclineReason,
    markRated,
    markRatePromptSeen,
    setBusiness,
    setProfileField,
    setNotificationPrefs,
    equipEffect,
    completeOnboarding,
    completeTask,
    skipTask,
    undoTask,
    resetOnboarding,
    flushSync,
    refreshFromCloud,
    hydrateFromAppUser,
    dismissPendingAchievement,
    dismissPendingBadge,
    dismissCurrentShowcase,
  }), [hydrated, state, today, weeklyActivity, totalCompleted, totalSkipped, level, levelProgress, currentPlan, isPremium, hasActiveSubscription, customBuildsThisMonth, customBuildsRemaining, customBuildLimit, businessSwitchesThisMonth, businessSwitchesRemaining, businessSwitchLimit, pendingAchievements, pendingBadges, setAnswers, setOnboardingStep, startSubscription, grantPremiumViaCode, cancelSubscription, setDeclineReason, markRated, markRatePromptSeen, setBusiness, setProfileField, setNotificationPrefs, equipEffect, completeOnboarding, completeTask, skipTask, undoTask, resetOnboarding, flushSync, refreshFromCloud, hydrateFromAppUser, dismissPendingAchievement, dismissPendingBadge, dismissCurrentShowcase]);
});
