import { supabase, supabaseReady } from "@/lib/supabase";
import type { BillingCycle, PlanId, Subscription } from "@/types";

export interface AppUserUpsertInput {
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
}

export async function upsertAppUser(input: AppUserUpsertInput): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseReady || !supabase) {
    console.log("[app_users] supabase not ready, skipping upsert");
    return { ok: false, error: "Supabase not configured" };
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.appleUserId) payload.apple_user_id = input.appleUserId;
  if (input.email !== undefined) payload.email = input.email ? input.email.trim().toLowerCase() : null;
  if (input.name !== undefined) payload.name = input.name || null;
  if (input.subscription) {
    payload.subscription_plan = input.subscription.plan;
    payload.subscription_cycle = input.subscription.cycle;
    payload.subscription_active = input.subscription.active;
    payload.subscription_trial = input.subscription.trial;
    payload.subscription_source = input.subscription.source;
    payload.subscription_started_at = input.subscription.startedAt;
  }

  try {
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
      const lowered = (input.email ?? "").trim().toLowerCase();
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

    console.log("[app_users] no apple id or email — skipping");
    return { ok: false, error: "No identifier" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    console.log("[app_users] exception", msg);
    return { ok: false, error: msg };
  }
}
