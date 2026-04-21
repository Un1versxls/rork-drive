import { supabase, supabaseReady } from "@/lib/supabase";
import type { BusinessIdea, TaskSeed, PrimaryGoal, ExperienceLevel } from "@/types";

export interface LibraryEntry {
  id: string;
  name: string;
  category: "business" | "routine" | "skill";
  tagline: string | null;
  description: string | null;
  why_fit: string | null;
  startup_cost: string | null;
  time_to_income: string | null;
  first_milestones: string[];
  task_pool: TaskSeed[];
  matching_goals: string[];
  matching_experience: string[];
  difficulty: number;
  active: boolean;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export async function fetchActiveLibrary(): Promise<LibraryEntry[]> {
  if (!supabase || !supabaseReady) return [];
  try {
    const { data, error } = await supabase
      .from("business_library")
      .select("*")
      .eq("active", true)
      .order("times_suggested", { ascending: false })
      .limit(200);
    if (error) {
      console.log("[library] fetch error", error.message);
      return [];
    }
    return (data ?? []) as LibraryEntry[];
  } catch (e) {
    console.log("[library] fetch exception", e);
    return [];
  }
}

export async function syncIdeasToLibrary(
  ideas: BusinessIdea[],
  pools: TaskSeed[][],
  profile: { goal: PrimaryGoal | null; experience: ExperienceLevel | null }
): Promise<void> {
  if (!supabase || !supabaseReady) return;
  try {
    const rows = ideas.map((idea, i) => {
      const id = slugify(idea.name) || idea.id || `idea-${Date.now()}-${i}`;
      return {
        id,
        name: idea.name,
        category: "business" as const,
        tagline: idea.tagline,
        description: idea.description,
        why_fit: idea.whyFit,
        startup_cost: idea.startupCost,
        time_to_income: idea.timeToIncome,
        first_milestones: idea.firstMilestones,
        task_pool: pools[i] ?? [],
        matching_goals: profile.goal ? [profile.goal] : [],
        matching_experience: profile.experience ? [profile.experience] : [],
        difficulty: 2,
        active: true,
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase
      .from("business_library")
      .upsert(rows, { onConflict: "id", ignoreDuplicates: false });

    if (error) {
      console.log("[library] sync error", error.message);
    }
  } catch (e) {
    console.log("[library] sync exception", e);
  }
}

export function entryToIdea(entry: LibraryEntry): { idea: BusinessIdea; pool: TaskSeed[] } {
  return {
    idea: {
      id: entry.id,
      name: entry.name,
      tagline: entry.tagline ?? "",
      description: entry.description ?? "",
      whyFit: entry.why_fit ?? "",
      startupCost: entry.startup_cost ?? "",
      timeToIncome: entry.time_to_income ?? "",
      firstMilestones: entry.first_milestones ?? [],
    },
    pool: (entry.task_pool ?? []) as TaskSeed[],
  };
}
