import { supabase, supabaseReady } from "@/lib/supabase";
import type { AppState, BillingCycle, BusinessIdea, PlanId, Subscription, UserProfile } from "@/types";

export interface AppUserUpsertInput {
  userId?: string | null;
  appleUserId?: string | null;
  email?: string | null;
  name?: string | null;
  authProvider?: "apple" | "email" | string | null;
  subscription?: {
    plan: PlanId;
    cycle: BillingCycle;
    active: boolean;
    trial: boolean;
    source: Subscription["source"];
    startedAt: string | null;
    expiresAt?: string | null;
    trialEndsAt?: string | null;
  } | null;
  profile?: Partial<UserProfile> | null;
  business?: BusinessIdea | null;
  pastBusinesses?: BusinessIdea[] | null;
  businessSwitchBonus?: number | null;
  premiumSwitchBonusGranted?: boolean | null;
  age?: number | null;
  equippedEffect?: string | null;
  unlockedBadges?: string[] | null;
  unlockedAchievements?: string[] | null;
  totalCompleted?: number | null;
  totalSkipped?: number | null;
  flags?: {
    motivationHintSeen?: boolean;
    taskHintSeen?: boolean;
    subtaskHintSeen?: boolean;
  } | null;
  appVersion?: string | null;
  platform?: string | null;
  stats?: {
    onboarded?: boolean;
    points?: number;
    streak?: number;
    bestStreak?: number;
    lastActiveDate?: string | null;
  } | null;
  stateBlob?: AppState | null;
  dayTrading?: {
    mode: string | null;
    market: string | null;
    capital: string | null;
  } | null;
  touchLastSeen?: boolean;
}

function buildPayload(input: AppUserUpsertInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.touchLastSeen) payload.last_seen_at = new Date().toISOString();
  // Always record when this client last pushed a state migration.
  payload.last_migrated_at = new Date().toISOString();
  if (input.userId) payload.user_id = input.userId;
  if (input.appleUserId) payload.apple_user_id = input.appleUserId;
  if (input.email !== undefined) {
    payload.email = input.email ? input.email.trim().toLowerCase() : null;
  }
  if (input.name !== undefined) payload.name = input.name || null;
  if (input.authProvider) payload.auth_provider = input.authProvider;

  if (input.subscription) {
    payload.subscription_plan = input.subscription.plan;
    payload.subscription_cycle = input.subscription.cycle;
    payload.subscription_active = input.subscription.active;
    payload.subscription_trial = input.subscription.trial;
    payload.subscription_source = input.subscription.source;
    payload.subscription_started_at = input.subscription.startedAt;
    if (input.subscription.expiresAt !== undefined) payload.subscription_expires_at = input.subscription.expiresAt;
    if (input.subscription.trialEndsAt !== undefined) payload.trial_ends_at = input.subscription.trialEndsAt;
  }

  if (input.profile) {
    const p = input.profile;
    if (p.goal !== undefined) payload.goal = p.goal;
    if (p.skillTopic !== undefined) payload.skill_topic = p.skillTopic;
    if (p.experience !== undefined) payload.experience = p.experience;
    if (p.time !== undefined) payload.time_commitment = p.time;
    if (p.priority !== undefined) payload.priority = p.priority;
    if (p.industry !== undefined) payload.industry = p.industry;
    if (p.budget !== undefined) payload.budget = p.budget;
    if (p.obstacle !== undefined) payload.obstacle = p.obstacle;
    if (p.source !== undefined) payload.source = p.source;
    if (p.declineReason !== undefined) payload.decline_reason = p.declineReason;
  }

  if (input.business !== undefined) {
    payload.business_id = input.business?.id ?? null;
    payload.business_name = input.business?.name ?? null;
    payload.business_tagline = input.business?.tagline ?? null;
  }

  if (input.pastBusinesses !== undefined) {
    payload.past_businesses = input.pastBusinesses;
  }

  if (input.businessSwitchBonus !== undefined && input.businessSwitchBonus !== null) {
    payload.business_switch_bonus = input.businessSwitchBonus;
  }
  if (input.premiumSwitchBonusGranted !== undefined && input.premiumSwitchBonusGranted !== null) {
    payload.premium_switch_bonus_granted = input.premiumSwitchBonusGranted;
  }
  if (input.age !== undefined) payload.age = input.age;
  if (input.equippedEffect !== undefined) payload.equipped_effect = input.equippedEffect;
  if (input.unlockedBadges !== undefined) payload.unlocked_badges = input.unlockedBadges;
  if (input.unlockedAchievements !== undefined) payload.unlocked_achievements = input.unlockedAchievements;
  if (input.totalCompleted !== undefined) payload.total_completed = input.totalCompleted;
  if (input.totalSkipped !== undefined) payload.total_skipped = input.totalSkipped;
  if (input.flags) {
    if (input.flags.motivationHintSeen !== undefined) payload.motivation_hint_seen = input.flags.motivationHintSeen;
    if (input.flags.taskHintSeen !== undefined) payload.task_hint_seen = input.flags.taskHintSeen;
    if (input.flags.subtaskHintSeen !== undefined) payload.subtask_hint_seen = input.flags.subtaskHintSeen;
  }
  if (input.appVersion !== undefined) payload.app_version = input.appVersion;
  if (input.platform !== undefined) payload.platform = input.platform;

  if (input.stats) {
    if (input.stats.onboarded !== undefined) payload.onboarded = input.stats.onboarded;
    if (input.stats.points !== undefined) payload.points = input.stats.points;
    if (input.stats.streak !== undefined) payload.streak = input.stats.streak;
    if (input.stats.bestStreak !== undefined) payload.best_streak = input.stats.bestStreak;
    if (input.stats.lastActiveDate !== undefined) payload.last_active_date = input.stats.lastActiveDate;
  }

  if (input.stateBlob !== undefined) {
    payload.state_blob = input.stateBlob;
  }

  if (input.dayTrading) {
    payload.day_trading_mode = input.dayTrading.mode;
    payload.day_trading_market = input.dayTrading.market;
    payload.day_trading_capital = input.dayTrading.capital;
  }

  return payload;
}

// Public helper so callers can run a single payload upsert through the
// schema-retry path if they ever need it.
export { runWithColumnRetry as _runWithColumnRetry };

export interface AppUserRow {
  id: string;
  user_id: string | null;
  apple_user_id: string | null;
  email: string | null;
  name: string | null;
  auth_provider: string | null;
  subscription_plan: PlanId | null;
  subscription_cycle: BillingCycle | null;
  subscription_active: boolean | null;
  subscription_trial: boolean | null;
  subscription_source: Subscription["source"] | null;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  trial_ends_at: string | null;
  goal: string | null;
  skill_topic: string | null;
  experience: string | null;
  time_commitment: string | null;
  priority: string | null;
  industry: string | null;
  budget: string | null;
  obstacle: string | null;
  source: string | null;
  decline_reason: string | null;
  business_id: string | null;
  business_name: string | null;
  business_tagline: string | null;
  onboarded: boolean | null;
  points: number | null;
  streak: number | null;
  best_streak: number | null;
  last_active_date: string | null;
  state_blob: AppState | null;
  day_trading_mode: string | null;
  day_trading_market: string | null;
  day_trading_capital: string | null;
  business_switch_bonus: number | null;
  premium_switch_bonus_granted: boolean | null;
}

const APP_USER_COLUMNS = "id, user_id, apple_user_id, email, name, auth_provider, subscription_plan, subscription_cycle, subscription_active, subscription_trial, subscription_source, subscription_started_at, subscription_expires_at, trial_ends_at, goal, skill_topic, experience, time_commitment, priority, industry, budget, obstacle, source, decline_reason, business_id, business_name, business_tagline, onboarded, points, streak, best_streak, last_active_date, state_blob, day_trading_mode, day_trading_market, day_trading_capital, business_switch_bonus, premium_switch_bonus_granted";

/**
 * True if the cloud row points to an active paid plan or trial right now.
 * Treats the explicit `subscription_active` flag as the source of truth, but
 * also honors `subscription_expires_at` / `trial_ends_at` when present so a
 * stale `active=true` row with an expired date is not counted as active.
 */
export function isSubscriptionActiveFromRow(row: AppUserRow): boolean {
  const now = Date.now();
  const trialEnds = row.trial_ends_at ? new Date(row.trial_ends_at).getTime() : 0;
  const subEnds = row.subscription_expires_at ? new Date(row.subscription_expires_at).getTime() : 0;
  if (trialEnds && trialEnds > now) return true;
  if (subEnds && subEnds > now) return true;
  if ((trialEnds && trialEnds <= now) || (subEnds && subEnds <= now)) {
    // Dates exist and are all in the past → expired regardless of the
    // active flag (covers cases where RC has already moved on).
    return false;
  }
  return row.subscription_active === true;
}

/** True if there's any past subscription record on this row. */
export function hasSubscriptionHistoryFromRow(row: AppUserRow): boolean {
  return Boolean(
    row.subscription_started_at ||
    row.subscription_plan ||
    row.subscription_expires_at ||
    row.trial_ends_at,
  );
}

export async function fetchAppUser(by: { userId?: string | null; email?: string | null }): Promise<AppUserRow | null> {
  if (!supabaseReady || !supabase) return null;
  try {
    if (by.userId) {
      const { data, error } = await supabase
        .from("app_users")
        .select(APP_USER_COLUMNS)
        .eq("user_id", by.userId)
        .maybeSingle();
      if (error) {
        console.log("[app_users] fetch by user_id error", error.message);
      } else if (data) {
        return data as AppUserRow;
      }
    }
    if (by.email) {
      const lowered = by.email.trim().toLowerCase();
      const { data, error } = await supabase
        .from("app_users")
        .select(APP_USER_COLUMNS)
        .eq("email", lowered)
        .maybeSingle();
      if (error) {
        console.log("[app_users] fetch by email error", error.message);
        return null;
      }
      return (data as AppUserRow) ?? null;
    }
    return null;
  } catch (e) {
    console.log("[app_users] fetch exception", e);
    return null;
  }
}

// Columns that were added in later migrations. If a given project hasn't
// applied them yet, Supabase returns PGRST204 / "column ... does not exist".
// We retry without these columns so the rest of the sync still goes through.
const OPTIONAL_COLUMNS = [
  "business_switch_bonus",
  "premium_switch_bonus_granted",
  "past_businesses",
  "state_blob",
  "last_migrated_at",
  "subscription_expires_at",
  "trial_ends_at",
  "last_nightly_sync_at",
  "age",
  "equipped_effect",
  "unlocked_badges",
  "unlocked_achievements",
  "total_completed",
  "total_skipped",
  "motivation_hint_seen",
  "task_hint_seen",
  "subtask_hint_seen",
  "app_version",
  "platform",
];

function stripMissingColumn(payload: Record<string, unknown>, errMsg: string): Record<string, unknown> | null {
  const lower = errMsg.toLowerCase();
  for (const col of OPTIONAL_COLUMNS) {
    if (lower.includes(col)) {
      if (col in payload) {
        const copy = { ...payload };
        delete copy[col];
        return copy;
      }
    }
  }
  // Generic catch: any "column \"xxx\" does not exist" or PGRST204 schema error.
  const m = errMsg.match(/column "?([a-z0-9_]+)"?/i) || errMsg.match(/'([a-z0-9_]+)' column/i);
  if (m && m[1] && m[1] in payload) {
    const copy = { ...payload };
    delete copy[m[1]];
    return copy;
  }
  return null;
}

async function runWithColumnRetry<T>(
  payload: Record<string, unknown>,
  attempt: (p: Record<string, unknown>) => Promise<{ data?: T | null; error: { message: string; code?: string } | null }>,
): Promise<{ ok: boolean; error?: string }> {
  let current = payload;
  for (let i = 0; i < 5; i++) {
    const { error } = await attempt(current);
    if (!error) return { ok: true };
    const msg = error.message ?? "";
    const looksLikeColumn =
      error.code === "PGRST204" ||
      /column .* does not exist/i.test(msg) ||
      /could not find the .* column/i.test(msg) ||
      /schema cache/i.test(msg);
    if (!looksLikeColumn) {
      console.log("[app_users] non-column error", msg, error.code);
      return { ok: false, error: msg };
    }
    const stripped = stripMissingColumn(current, msg);
    if (!stripped) {
      console.log("[app_users] column error but nothing to strip", msg);
      return { ok: false, error: msg };
    }
    console.log("[app_users] retrying without unknown column ->", Object.keys(current).filter((k) => !(k in stripped)));
    current = stripped;
  }
  return { ok: false, error: "Too many schema mismatches" };
}

export async function upsertAppUser(input: AppUserUpsertInput): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseReady || !supabase) {
    console.log("[app_users] supabase not ready, skipping upsert");
    return { ok: false, error: "Supabase not configured" };
  }

  const payload = buildPayload(input);

  try {
    if (input.userId) {
      console.log("[app_users] upsert by user_id");
      const { data: existing, error: selErr } = await supabase
        .from("app_users")
        .select("id")
        .eq("user_id", input.userId)
        .maybeSingle();
      if (selErr) console.log("[app_users] select user_id error", selErr.message);
      if (existing?.id) {
        return runWithColumnRetry(payload, async (p) => {
          const sb = supabase;
          if (!sb) return { error: { message: "Supabase missing" } };
          const { error } = await sb.from("app_users").update(p).eq("id", existing.id);
          return { error: error ? { message: error.message, code: (error as { code?: string }).code } : null };
        });
      }
      if (input.email) {
        const lowered = input.email.trim().toLowerCase();
        const { data: byEmail } = await supabase
          .from("app_users")
          .select("id")
          .eq("email", lowered)
          .maybeSingle();
        if (byEmail?.id) {
          return runWithColumnRetry(payload, async (p) => {
            const sb = supabase;
            if (!sb) return { error: { message: "Supabase missing" } };
            const { error } = await sb.from("app_users").update(p).eq("id", byEmail.id);
            return { error: error ? { message: error.message, code: (error as { code?: string }).code } : null };
          });
        }
      }
      return runWithColumnRetry(payload, async (p) => {
        const sb = supabase;
        if (!sb) return { error: { message: "Supabase missing" } };
        const { error } = await sb.from("app_users").insert(p);
        return { error: error ? { message: error.message, code: (error as { code?: string }).code } : null };
      });
    }

    if (input.appleUserId) {
      console.log("[app_users] upsert by apple_user_id");
      return runWithColumnRetry(payload, async (p) => {
        const sb = supabase;
        if (!sb) return { error: { message: "Supabase missing" } };
        const { error } = await sb.from("app_users").upsert(p, { onConflict: "apple_user_id" });
        return { error: error ? { message: error.message, code: (error as { code?: string }).code } : null };
      });
    }

    if (input.email) {
      const lowered = input.email.trim().toLowerCase();
      console.log("[app_users] update by email", lowered);
      const { data: existing, error: selErr } = await supabase
        .from("app_users")
        .select("id")
        .eq("email", lowered)
        .maybeSingle();
      if (selErr) console.log("[app_users] select error", selErr.message);
      if (existing?.id) {
        return runWithColumnRetry(payload, async (p) => {
          const sb = supabase;
          if (!sb) return { error: { message: "Supabase missing" } };
          const { error } = await sb.from("app_users").update(p).eq("id", existing.id);
          return { error: error ? { message: error.message, code: (error as { code?: string }).code } : null };
        });
      }
      return runWithColumnRetry(payload, async (p) => {
        const sb = supabase;
        if (!sb) return { error: { message: "Supabase missing" } };
        const { error } = await sb.from("app_users").insert(p);
        return { error: error ? { message: error.message, code: (error as { code?: string }).code } : null };
      });
    }

    console.log("[app_users] no user_id, apple id, or email — skipping");
    return { ok: false, error: "No identifier" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    console.log("[app_users] exception", msg);
    return { ok: false, error: msg };
  }
}

export function buildSyncFromAppState(
  authUserId: string | null,
  authEmail: string | null,
  state: AppState,
  opts?: { touchLastSeen?: boolean },
): AppUserUpsertInput {
  const p = state.profile;
  const totalCompleted = Object.values(state.history).reduce((s, d) => s + d.completed, 0) +
    state.tasks.filter((t) => t.status === "completed").length;
  const totalSkipped = Object.values(state.history).reduce((s, d) => s + d.skipped, 0) +
    state.tasks.filter((t) => t.status === "skipped").length;
  // Platform/app version are best-effort; require Platform from RN.
  // We import lazily to avoid pulling RN into non-RN contexts.
  let platformName: string | null = null;
  let appVersion: string | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require("react-native");
    platformName = Platform?.OS ?? null;
  } catch {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require("expo-constants").default;
    appVersion = Constants?.expoConfig?.version ?? Constants?.manifest?.version ?? null;
  } catch {}
  return {
    userId: authUserId,
    appleUserId: p.appleUserId,
    email: authEmail || p.email || null,
    name: p.name || null,
    subscription: {
      plan: p.subscription.plan,
      cycle: p.subscription.cycle,
      active: p.subscription.active,
      trial: p.subscription.trial,
      source: p.subscription.source,
      startedAt: p.subscription.startedAt,
      expiresAt: p.subscription.expiresAt ?? null,
      trialEndsAt: p.subscription.trialEndsAt ?? null,
    },
    profile: {
      goal: p.goal,
      skillTopic: p.skillTopic,
      experience: p.experience,
      time: p.time,
      priority: p.priority,
      industry: p.industry,
      budget: p.budget,
      obstacle: p.obstacle,
      source: p.source,
      declineReason: p.declineReason,
    },
    business: p.business,
    pastBusinesses: p.pastBusinesses ?? [],
    businessSwitchBonus: p.businessSwitchBonus ?? 0,
    premiumSwitchBonusGranted: p.premiumSwitchBonusGranted ?? false,
    age: p.age ?? null,
    equippedEffect: p.equippedEffect ?? null,
    unlockedBadges: state.unlockedBadges ?? [],
    unlockedAchievements: state.unlockedAchievements ?? [],
    totalCompleted,
    totalSkipped,
    flags: {
      motivationHintSeen: p.motivationHintSeen ?? false,
      taskHintSeen: p.taskHintSeen ?? false,
      subtaskHintSeen: p.subtaskHintSeen ?? false,
    },
    appVersion,
    platform: platformName,
    stats: {
      onboarded: state.onboarded,
      points: state.points,
      streak: state.streak,
      bestStreak: state.bestStreak,
      lastActiveDate: state.lastActiveDate,
    },
    stateBlob: state,
    dayTrading: {
      mode: p.dayTradingMode,
      market: p.dayTradingMarket,
      capital: p.dayTradingCapital,
    },
    touchLastSeen: opts?.touchLastSeen ?? false,
  };
}
