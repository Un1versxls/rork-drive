import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BADGES } from "@/constants/badges";
import { ACHIEVEMENTS } from "@/constants/achievements";
import { getPlan, PLANS } from "@/constants/plans";
import { generateDailyTasks } from "@/constants/task-pool";
import { triggerHaptic } from "@/lib/haptics";
import { upsertAppUser, buildSyncFromAppState, type AppUserRow } from "@/lib/appUserTracking";
import { supabase } from "@/lib/supabase";
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
};

async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      profile: {
        ...DEFAULT_PROFILE,
        ...parsed.profile,
        notificationPrefs: { ...DEFAULT_NOTIF_PREFS, ...(parsed.profile?.notificationPrefs ?? {}) },
        subscription: { ...DEFAULT_SUBSCRIPTION, ...(parsed.profile?.subscription ?? {}) },
        unlockedEffects: parsed.profile?.unlockedEffects ?? ["none"],
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

function evaluateBadges(state: AppState): string[] {
  const completed = Object.values(state.history).reduce((s, d) => s + d.completed, 0) +
    state.tasks.filter((t) => t.status === "completed").length;
  const unlocked = new Set(state.unlockedBadges);
  for (const b of BADGES) {
    if (unlocked.has(b.id)) continue;
    const value =
      b.metric === "completed" ? completed :
      b.metric === "streak" ? state.streak :
      state.points;
    if (value >= b.threshold) unlocked.add(b.id);
  }
  return Array.from(unlocked);
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
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [pendingAchievements, setPendingAchievements] = useState<string[]>([]);
  const qc = useQueryClient();

  const stateQuery = useQuery({
    queryKey: ["drive-state"],
    queryFn: loadState,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (stateQuery.data && !hydrated) {
      setState(stateQuery.data);
      setHydrated(true);
    }
  }, [stateQuery.data, hydrated]);

  const saveMutation = useMutation({
    mutationFn: saveState,
  });

  const commit = useCallback((next: AppState) => {
    setState(next);
    saveMutation.mutate(next);
    qc.setQueryData(["drive-state"], next);
  }, [saveMutation, qc]);

  const syncToSupabase = useCallback((next: AppState) => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      const email = data.user?.email ?? next.profile.email ?? null;
      if (!uid && !email && !next.profile.appleUserId) return;
      upsertAppUser(buildSyncFromAppState(uid, email, next, { touchLastSeen: true }))
        .catch((e) => console.log("[AppProvider] sync error", e));
    }).catch((e) => console.log("[AppProvider] getUser error", e));
  }, []);

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
    const next: AppState = { ...state, profile: { ...state.profile, [key]: value } };
    commit(next);
  }, [state, commit]);

  const setNotificationPrefs = useCallback((prefs: Partial<NotificationPrefs>) => {
    const next: AppState = {
      ...state,
      profile: {
        ...state.profile,
        notificationPrefs: { ...state.profile.notificationPrefs, ...prefs },
      },
    };
    commit(next);
  }, [state, commit]);

  const equipEffect = useCallback((effect: NameEffect) => {
    if (!state.profile.unlockedEffects.includes(effect)) return;
    const next: AppState = {
      ...state,
      profile: { ...state.profile, equippedEffect: effect },
    };
    commit(next);
    triggerHaptic("celebrate", state.profile.hapticsEnabled);
  }, [state, commit]);

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
    let next: AppState = {
      ...state,
      profile: {
        ...state.profile,
        ...a,
      },
    };
    if (state.onboarded && a.goal && a.goal !== state.profile.goal) {
      const plan = getPlan(next.profile.subscription.plan);
      const key = todayKey();
      const tasks = generateDailyTasks(a.goal, plan.taskLimit, key, next.profile.businessTaskPool);
      next = { ...next, tasks, lastActiveDate: key };
    }
    commit(next);
    syncToSupabase(next);
  }, [state, commit, syncToSupabase]);

  const setOnboardingStep = useCallback((path: string) => {
    if (state.profile.onboardingStep === path) return;
    const next: AppState = { ...state, profile: { ...state.profile, onboardingStep: path } };
    commit(next);
  }, [state, commit]);

  const startSubscription = useCallback((plan: PlanId, cycle: BillingCycle, opts?: { source?: Subscription["source"] }) => {
    const sub: Subscription = {
      active: true,
      plan,
      cycle,
      trial: true,
      startedAt: new Date().toISOString(),
      source: opts?.source ?? "trial",
    };
    let next: AppState = { ...state, profile: { ...state.profile, subscription: sub } };
    const ach = evaluateAchievements(next);
    next = {
      ...next,
      unlockedAchievements: ach.ids,
      profile: { ...next.profile, unlockedEffects: ach.effects },
    };
    commit(next);
    syncToSupabase(next);
    if (ach.newlyUnlocked.length > 0) {
      setPendingAchievements((prev) => [...prev, ...ach.newlyUnlocked]);
    }
  }, [state, commit, syncToSupabase]);

  const grantPremiumViaCode = useCallback(() => {
    const sub: Subscription = {
      active: true,
      plan: "premium",
      cycle: "yearly",
      trial: false,
      startedAt: new Date().toISOString(),
      source: "code",
    };
    const next: AppState = { ...state, profile: { ...state.profile, subscription: sub } };
    commit(next);
    syncToSupabase(next);
  }, [state, commit, syncToSupabase]);

  const cancelSubscription = useCallback(() => {
    const sub: Subscription = { ...state.profile.subscription, active: false, trial: false };
    const next: AppState = { ...state, profile: { ...state.profile, subscription: sub } };
    commit(next);
    syncToSupabase(next);
  }, [state, commit, syncToSupabase]);

  const setDeclineReason = useCallback((reason: DeclineReason | null) => {
    commit({ ...state, profile: { ...state.profile, declineReason: reason } });
  }, [state, commit]);

  const markRated = useCallback(() => {
    commit({
      ...state,
      profile: { ...state.profile, hasRated: true, lastRatePromptAt: new Date().toISOString() },
    });
  }, [state, commit]);

  const markRatePromptSeen = useCallback(() => {
    commit({
      ...state,
      profile: { ...state.profile, lastRatePromptAt: new Date().toISOString() },
    });
  }, [state, commit]);

  const BUSINESS_SWITCH_MONTHLY_LIMIT = 5;

  const setBusiness = useCallback((business: BusinessIdea, taskPool: TaskSeed[]): { ok: boolean; reason?: string } => {
    const plan = getPlan(state.profile.subscription.plan);
    const key = todayKey();
    const goal = state.profile.goal;
    const isCustom = business.id.startsWith("custom-");
    const monthKey = key.slice(0, 7);
    const sameMonth = state.profile.customBuildMonth === monthKey;
    const nextCount = isCustom ? (sameMonth ? state.profile.customBuildCount + 1 : 1) : state.profile.customBuildCount;
    const nextMonth = isCustom ? monthKey : state.profile.customBuildMonth;

    const prev = state.profile.business;
    const isSwitch = !!prev && prev.id !== business.id;
    const sameSwitchMonth = state.profile.businessSwitchMonth === monthKey;
    const switchesThisMonth = sameSwitchMonth ? state.profile.businessSwitchCount : 0;
    if (isSwitch && switchesThisMonth >= BUSINESS_SWITCH_MONTHLY_LIMIT) {
      console.log("[AppProvider] business switch blocked: monthly limit reached");
      return { ok: false, reason: "limit" };
    }
    const nextSwitchCount = isSwitch ? switchesThisMonth + 1 : switchesThisMonth;
    const nextSwitchMonth = isSwitch ? monthKey : state.profile.businessSwitchMonth;

    const profile = {
      ...state.profile,
      business,
      businessTaskPool: taskPool,
      customBuildMonth: nextMonth,
      customBuildCount: nextCount,
      businessSwitchMonth: nextSwitchMonth,
      businessSwitchCount: nextSwitchCount,
    };
    let next: AppState = { ...state, profile };
    if (goal) {
      const tasks = generateDailyTasks(goal, plan.taskLimit, key, taskPool);
      next = { ...next, tasks, lastActiveDate: key };
    }
    commit(next);
    syncToSupabase(next);
    return { ok: true };
  }, [state, commit, syncToSupabase]);

  const completeOnboarding = useCallback(() => {
    if (!state.profile.goal) return;
    const plan = getPlan(state.profile.subscription.plan);
    const key = todayKey();
    const tasks = generateDailyTasks(state.profile.goal, plan.taskLimit, key, state.profile.businessTaskPool);
    const next: AppState = {
      ...state,
      onboarded: true,
      tasks,
      lastActiveDate: key,
      profile: { ...state.profile, onboardingStep: null },
    };
    commit(next);
    syncToSupabase(next);
  }, [state, commit, syncToSupabase]);

  const completeTask = useCallback((id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task || task.status !== "pending") return;
    const plan = getPlan(state.profile.subscription.plan);
    const pts = task.basePoints * plan.multiplier;
    const tasks = state.tasks.map((t) => (t.id === id ? { ...t, status: "completed" as const } : t));
    const key = todayKey();
    let streak = state.streak;
    let bestStreak = state.bestStreak;
    const todayCompletedBefore = state.tasks.filter((t) => t.status === "completed" && t.dateKey === key).length;
    if (todayCompletedBefore === 0) {
      if (state.lastActiveDate && daysBetween(state.lastActiveDate, key) === 1) {
        streak = state.streak + 1;
      } else if (state.lastActiveDate === key) {
        streak = Math.max(1, state.streak);
      } else {
        streak = 1;
      }
      bestStreak = Math.max(state.bestStreak, streak);
    }
    let next: AppState = {
      ...state,
      tasks,
      points: state.points + pts,
      streak,
      bestStreak,
      lastActiveDate: key,
    };
    next = { ...next, unlockedBadges: evaluateBadges(next) };
    const ach = evaluateAchievements(next);
    next = {
      ...next,
      unlockedAchievements: ach.ids,
      profile: { ...next.profile, unlockedEffects: ach.effects },
    };
    commit(next);
    triggerHaptic("doubleTap", state.profile.hapticsEnabled);
    if (ach.newlyUnlocked.length > 0) {
      setPendingAchievements((prev) => [...prev, ...ach.newlyUnlocked]);
      setTimeout(() => {
        triggerHaptic("celebrate", state.profile.hapticsEnabled);
      }, 350);
    }
  }, [state, commit]);

  const skipTask = useCallback((id: string) => {
    const tasks = state.tasks.map((t) => (t.id === id ? { ...t, status: "skipped" as const } : t));
    const next: AppState = { ...state, tasks };
    commit(next);
    triggerHaptic("warning", state.profile.hapticsEnabled);
  }, [state, commit]);

  const undoTask = useCallback((id: string) => {
    const target = state.tasks.find((t) => t.id === id);
    if (!target) return;
    const plan = getPlan(state.profile.subscription.plan);
    const wasCompleted = target.status === "completed";
    const tasks = state.tasks.map((t) => (t.id === id ? { ...t, status: "pending" as const } : t));
    const next: AppState = {
      ...state,
      tasks,
      points: wasCompleted ? Math.max(0, state.points - target.basePoints * plan.multiplier) : state.points,
    };
    commit(next);
    triggerHaptic("tap", state.profile.hapticsEnabled);
  }, [state, commit]);

  const hydrateFromAppUser = useCallback((row: AppUserRow): boolean => {
    const profile: UserProfile = {
      ...state.profile,
      name: row.name ?? state.profile.name,
      email: row.email ?? state.profile.email,
      goal: (row.goal as PrimaryGoal | null) ?? state.profile.goal,
      skillTopic: (row.skill_topic as SkillTopic | null) ?? state.profile.skillTopic,
      experience: (row.experience as ExperienceLevel | null) ?? state.profile.experience,
      time: (row.time_commitment as TimeCommitment | null) ?? state.profile.time,
      priority: (row.priority as Priority | null) ?? state.profile.priority,
      industry: (row.industry as Industry | null) ?? state.profile.industry,
      budget: (row.budget as Budget | null) ?? state.profile.budget,
      obstacle: (row.obstacle as Obstacle | null) ?? state.profile.obstacle,
      source: (row.source as Source | null) ?? state.profile.source,
      declineReason: (row.decline_reason as DeclineReason | null) ?? state.profile.declineReason,
      business: row.business_id && row.business_name ? {
        id: row.business_id,
        name: row.business_name,
        tagline: row.business_tagline ?? "",
        description: state.profile.business?.description ?? "",
        whyFit: state.profile.business?.whyFit ?? "",
        startupCost: state.profile.business?.startupCost ?? "",
        timeToIncome: state.profile.business?.timeToIncome ?? "",
        firstMilestones: state.profile.business?.firstMilestones ?? [],
      } as BusinessIdea : state.profile.business,
      subscription: {
        active: row.subscription_active ?? state.profile.subscription.active,
        plan: (row.subscription_plan as PlanId | null) ?? state.profile.subscription.plan,
        cycle: (row.subscription_cycle as BillingCycle | null) ?? state.profile.subscription.cycle,
        trial: row.subscription_trial ?? state.profile.subscription.trial,
        startedAt: row.subscription_started_at ?? state.profile.subscription.startedAt,
        source: (row.subscription_source as Subscription["source"] | null) ?? state.profile.subscription.source,
      },
    };
    const onboarded = row.onboarded === true || state.onboarded;
    const next: AppState = {
      ...state,
      onboarded,
      points: row.points ?? state.points,
      streak: row.streak ?? state.streak,
      bestStreak: row.best_streak ?? state.bestStreak,
      lastActiveDate: row.last_active_date ?? state.lastActiveDate,
      profile,
    };
    commit(next);
    return onboarded && !!profile.goal;
  }, [state, commit]);

  const resetOnboarding = useCallback(() => {
    const next: AppState = { ...DEFAULT_STATE };
    commit(next);
  }, [commit]);

  const dismissPendingAchievement = useCallback((id: string) => {
    setPendingAchievements((prev) => prev.filter((x) => x !== id));
  }, []);

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
  const businessSwitchesRemaining = Math.max(0, BUSINESS_SWITCH_MONTHLY_LIMIT - businessSwitchesThisMonth);
  const businessSwitchLimit = BUSINESS_SWITCH_MONTHLY_LIMIT;

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
    hydrateFromAppUser,
    dismissPendingAchievement,
  }), [hydrated, state, today, weeklyActivity, totalCompleted, totalSkipped, level, levelProgress, currentPlan, isPremium, hasActiveSubscription, customBuildsThisMonth, customBuildsRemaining, customBuildLimit, businessSwitchesThisMonth, businessSwitchesRemaining, businessSwitchLimit, pendingAchievements, setAnswers, setOnboardingStep, startSubscription, grantPremiumViaCode, cancelSubscription, setDeclineReason, markRated, markRatePromptSeen, setBusiness, setProfileField, setNotificationPrefs, equipEffect, completeOnboarding, completeTask, skipTask, undoTask, resetOnboarding, hydrateFromAppUser, dismissPendingAchievement]);
});
