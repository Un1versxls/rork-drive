import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types";

export async function submitSurveyResponse(profile: UserProfile, email: string, userId: string | null): Promise<void> {
  if (!supabase) {
    console.log("[survey] supabase not configured, skipping");
    return;
  }
  try {
    const { error } = await supabase.from("survey_responses").insert({
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
    });
    if (error) {
      console.log("[survey] insert error", error.message);
    } else {
      console.log("[survey] response saved for", email);
    }
  } catch (e) {
    console.log("[survey] submit error", e);
  }
}
