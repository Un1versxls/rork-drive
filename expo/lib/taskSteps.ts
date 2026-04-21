import type { Task } from "@/types";

export interface TaskStep {
  id: string;
  label: string;
}

export function generateSteps(task: Task): TaskStep[] {
  const base: TaskStep[] = [
    { id: `${task.id}-s1`, label: "Clear your space and close other tabs" },
    { id: `${task.id}-s2`, label: `Set a timer for ${task.difficulty * 10} minutes` },
    { id: `${task.id}-s3`, label: "Do the smallest version of this task first" },
    { id: `${task.id}-s4`, label: "Finish one complete pass before editing" },
    { id: `${task.id}-s5`, label: "Write one sentence about what you learned" },
  ];

  const cat = task.category;
  if (cat === "hustle") {
    base[2] = { id: `${task.id}-s3`, label: "Identify one specific person or target" };
    base[3] = { id: `${task.id}-s4`, label: "Send/deliver it — imperfect beats unsent" };
  } else if (cat === "growth") {
    base[2] = { id: `${task.id}-s3`, label: "Draft with one hook and one clear CTA" };
    base[3] = { id: `${task.id}-s4`, label: "Ship it publicly, even rough" };
  } else if (cat === "skill") {
    base[2] = { id: `${task.id}-s3`, label: "Attempt before you look up the answer" };
    base[3] = { id: `${task.id}-s4`, label: "Teach it back in 2 sentences" };
  } else if (cat === "health") {
    base[2] = { id: `${task.id}-s3`, label: "Start at 50% intensity, build from there" };
    base[3] = { id: `${task.id}-s4`, label: "Stop one rep/minute earlier than you want" };
  } else if (cat === "mindset") {
    base[2] = { id: `${task.id}-s3`, label: "Slow down — quality over quantity" };
    base[3] = { id: `${task.id}-s4`, label: "Notice what came up without judging it" };
  }

  return base;
}
