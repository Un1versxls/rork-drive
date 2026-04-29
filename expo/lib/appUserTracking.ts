import { supabase, supabaseReady } from "@/lib/supabase";
import type { AppState, BillingCycle, BusinessIdea, PlanId, Subscription, UserProfile } from "@/types";

export interface AppUserUpsertInput {
  userId?: string | null;
  appleUserId?: string | null;
  email?: string | null;
  name?: string | null;
  subscription?: {
    plan: PlanId;
    cycle: BillingCycle;
    active: boolean;
    trial: boolean;
    source: Subscription["source"];
    startedAt: string | null;
  } | null;
  profile?: Partial<UserProfile> | null;
  business?: BusinessIdea | null;
  stats?: {
    onboarded?: boolean;
    points?: number;
    streak?: number;
    bestStreak?: number;
    lastActiveDate?: string | null;
  } | null;
  touchLastSeen?: boolean;
}

function buildPayload(input: AppUserUpsertInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.touchLastSeen) payload.last_seen_at = new Date().toISOString();
  if (input.userId) payload.user_id = input.userId;
  if (input.appleUserId) payload.apple_user_id = input.appleUserId;
  if (input.email !== undefined) {
    payload.email = input.email ? input.email.trim().toLowerCase() : null;
  }
  if (input.name !== undefined) payload.name = input.name || null;

  if (input.subscription) {
    payload.subscription_plan = input.subscription.plan;
    payload.subscription_cycle = input.subscription.cycle;
    payload.subscription_active = input.subscription.active;
    payload.subscription_trial = input.subscription.trial;
    payload.subscription_source = input.subscription.source;
    payload.subscription_started_at = input.subscription.startedAt;
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

  if (input.stats) {
    if (input.stats.onboarded !== undefined) payload.onboarded = input.stats.onboarded;
    if (input.stats.points !== undefined) payload.points = input.stats.points;
    if (input.stats.streak !== undefined) payload.streak = input.stats.streak;
    if (input.stats.bestStreak !== undefined) payload.best_streak = input.stats.bestStreak;
    if (input.stats.lastActiveDate !== undefined) payload.last_active_date = input.stats.lastActiveDate;
  }

  return payload;
}

export interface AppUserRow {
  id: string;
  user_id: string | null;
  apple_user_id: string | null;
  email: string | null;
  name: string | null;
  subscription_plan: PlanId | null;
  subscription_cycle: BillingCycle | null;
  subscription_active: boolean | null;
  subscription_trial: boolean | null;
  subscription_source: Subscription["source"] | null;
  subscription_started_at: string | null;
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
}

const APP_USER_COLUMNS = "id, user_id, apple_user_id, email, name, subscription_plan, subscription_cycle, subscription_active, subscription_trial, subscription_source, subscription_started_at, goal, skill_topic, experience, time_commitment, priority, industry, budget, obstacle, source, decline_reason, business_id, business_name, business_tagline, onboarded, points, streak, best_streak, last_active_date";

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
        const { error } = await supabase.from("app_users").update(payload).eq("id", existing.id);
        if (error) {
          console.log("[app_users] update by user_id error", error.message);
          return { ok: false, error: error.message };
        }
        return { ok: true };
      }
      if (input.email) {
        const lowered = input.email.trim().toLowerCase();
        const { data: byEmail } = await supabase
          .from("app_users")
          .select("id")
          .eq("email", lowered)
          .maybeSingle();
        if (byEmail?.id) {
          const { error } = await supabase.from("app_users").update(payload).eq("id", byEmail.id);
          if (error) {
            console.log("[app_users] update merged error", error.message);
            return { ok: false, error: error.message };
          }
          return { ok: true };
        }
      }
      const { error: insErr } = await supabase.from("app_users").insert(payload);
      if (insErr) {
        console.log("[app_users] insert by user_id error", insErr.message);
        return { ok: false, error: insErr.message };
      }
      return { ok: true };
    }

    if (input.appleUserId) {
      console.log("[app_users] upsert by apple_user_id");
      const { error } = await supabase
        .from("app_users")
        .upsert(payload, { onConflict: "apple_user_id" });
      if (error) {
        console.log("[app_users] upsert error", error.message, error.code);
        return { ok: false, error: error.message };
      }
      return { ok: true };
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
        const { error: updErr } = await supabase
          .from("app_users")
          .update(payload)
          .eq("id", existing.id);
        if (updErr) {
          console.log("[app_users] update error", updErr.message);
          return { ok: false, error: updErr.message };
        }
        return { ok: true };
      }
      const { error: insErr } = await supabase.from("app_users").insert(payload);
      if (insErr) {
        console.log("[app_users] insert error", insErr.message);
        return { ok: false, error: insErr.message };
      }
      return { ok: true };
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
    stats: {
      onboarded: state.onboarded,
      points: state.points,
      streak: state.streak,
      bestStreak: state.bestStreak,
      lastActiveDate: state.lastActiveDate,
    },
    touchLastSeen: opts?.touchLastSeen ?? false,
  };
}
