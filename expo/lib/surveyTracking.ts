import { supabase, supabaseReady } from "@/lib/supabase";
import type { UserProfile } from "@/types";

export async function submitSurveyResponse(
  profile: UserProfile,
  email: string,
  userId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseReady || !supabase) {
    console.log("[survey] supabase not ready, skipping insert");
    return { ok: false, error: "Supabase not configured" };
  }
  const payload = {
    user_id: userId,
    email: email.trim().toLowerCase(),
    name: profile.name || null,
    goal: profile.goal,
    experience: profile.experience,
    time_commitment: profile.time,
    priority: profile.priority,
    industry: profile.industry,
    budget: profile.budget,
    obstacle: profile.obstacle,
    source: profile.source,
    decline_reason: profile.declineReason,
  };
  try {
    console.log("[survey] inserting response for", payload.email);
    const { error } = await supabase.from("survey_responses").insert(payload);
    if (error) {
      console.log("[survey] insert error", error.message, error.code);
      return { ok: false, error: error.message };
    }
    console.log("[survey] response saved for", payload.email);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    console.log("[survey] submit exception", msg);
    return { ok: false, error: msg };
  }
}
