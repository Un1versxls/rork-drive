import type { PrimaryGoal, Task, TaskCategory, TaskSeed } from "@/types";

const EARN: TaskSeed[] = [
  { title: "Pitch one new client", description: "Send a personalized outreach message to a potential client.", category: "hustle", difficulty: 2 },
  { title: "Post a value piece", description: "Share a tip or insight publicly to grow your audience.", category: "growth", difficulty: 1 },
  { title: "Review your offers", description: "Audit pricing, copy or positioning for 15 minutes.", category: "hustle", difficulty: 2 },
  { title: "Follow up with 3 leads", description: "Send a short, warm follow-up to recent conversations.", category: "hustle", difficulty: 1 },
  { title: "Ship one small improvement", description: "Make a visible change to your product or service.", category: "focus", difficulty: 3 },
];

const SKILLS: TaskSeed[] = [
  { title: "Deep work block", description: "25 minutes, one tab, no phone.", category: "focus", difficulty: 2 },
  { title: "Learn something new", description: "Watch a lesson or read a chapter — then write one takeaway.", category: "skill", difficulty: 1 },
  { title: "Practice deliberately", description: "Work on the one thing you're weakest at.", category: "skill", difficulty: 3 },
  { title: "Teach it back", description: "Explain today's lesson out loud or in writing.", category: "skill", difficulty: 2 },
  { title: "Review yesterday's notes", description: "Spaced repetition beats cramming.", category: "mindset", difficulty: 1 },
];

const BUSINESS: TaskSeed[] = [
  { title: "Talk to one customer", description: "Ask what they love and what's missing.", category: "growth", difficulty: 2 },
  { title: "Review your numbers", description: "Check revenue, churn, or pipeline for 10 minutes.", category: "hustle", difficulty: 2 },
  { title: "Cut one distraction", description: "Remove a meeting, tool, or task that isn't moving things.", category: "focus", difficulty: 1 },
  { title: "Draft one campaign idea", description: "Sketch a promo, launch, or partnership.", category: "growth", difficulty: 2 },
  { title: "Recognize a teammate", description: "A 30 second message can change someone's week.", category: "mindset", difficulty: 1 },
];

const PRODUCTIVE: TaskSeed[] = [
  { title: "Plan your top 3", description: "Write down the three things that would make today a win.", category: "focus", difficulty: 1 },
  { title: "Move your body", description: "Walk, stretch or train for at least 10 minutes.", category: "health", difficulty: 1 },
  { title: "Inbox zero sprint", description: "15 minutes clearing inbox or notifications.", category: "focus", difficulty: 2 },
  { title: "Mindful reset", description: "Five slow breaths or a short meditation.", category: "mindset", difficulty: 1 },
  { title: "Evening review", description: "Reflect: what worked, what to change tomorrow.", category: "mindset", difficulty: 2 },
];

const POOL: Record<PrimaryGoal, TaskSeed[]> = {
  earn_income: EARN,
  build_skills: SKILLS,
  grow_business: BUSINESS,
  stay_productive: PRODUCTIVE,
};

export function generateDailyTasks(
  goal: PrimaryGoal,
  limit: number,
  dateKey: string,
  businessTaskPool?: TaskSeed[]
): Task[] {
  const primary = POOL[goal];
  const business = businessTaskPool ?? [];
  const all = [...business, ...primary, ...PRODUCTIVE];
  const picked: TaskSeed[] = [];
  const used = new Set<string>();
  let i = 0;
  while (picked.length < Math.min(limit, all.length) && i < all.length * 3) {
    const seed = all[(i + seedOffset(dateKey)) % all.length];
    if (!used.has(seed.title)) {
      used.add(seed.title);
      picked.push(seed);
    }
    i++;
  }
  return picked.map((seed, idx) => ({
    id: `${dateKey}-${idx}`,
    title: seed.title,
    description: seed.description,
    category: seed.category,
    difficulty: seed.difficulty,
    basePoints: seed.difficulty * 15,
    status: "pending" as const,
    dateKey,
  }));
}

function seedOffset(dateKey: string): number {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) {
    h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return h % 7;
}

export const CATEGORY_META: Record<
  TaskCategory,
  { label: string; color: string }
> = {
  focus: { label: "Focus", color: "#8b7355" },
  skill: { label: "Skill", color: "#c9a87c" },
  health: { label: "Health", color: "#6b8e4e" },
  growth: { label: "Growth", color: "#d4af37" },
  mindset: { label: "Mindset", color: "#a68a5b" },
  hustle: { label: "Hustle", color: "#b8956a" },
};
