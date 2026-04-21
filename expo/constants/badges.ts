import type { Badge } from "@/types";

export const BADGES: Badge[] = [
  { id: "first_task", title: "First Move", description: "Complete your first task", icon: "Sparkles", threshold: 1, metric: "completed" },
  { id: "ten_tasks", title: "Getting Serious", description: "Complete 10 tasks", icon: "Zap", threshold: 10, metric: "completed" },
  { id: "twentyfive_tasks", title: "Quarter Hundred", description: "Complete 25 tasks", icon: "Target", threshold: 25, metric: "completed" },
  { id: "fifty_tasks", title: "Half Century", description: "Complete 50 tasks", icon: "Medal", threshold: 50, metric: "completed" },
  { id: "century", title: "Century Club", description: "Complete 100 tasks", icon: "Trophy", threshold: 100, metric: "completed" },
  { id: "two_fifty_tasks", title: "Machine", description: "Complete 250 tasks", icon: "Cpu", threshold: 250, metric: "completed" },
  { id: "five_hundred_tasks", title: "Relentless", description: "Complete 500 tasks", icon: "Rocket", threshold: 500, metric: "completed" },
  { id: "thousand_tasks", title: "1K Legend", description: "Complete 1,000 tasks", icon: "Crown", threshold: 1000, metric: "completed" },

  { id: "streak_3", title: "Warming Up", description: "3 day streak", icon: "Flame", threshold: 3, metric: "streak" },
  { id: "streak_7", title: "On Fire", description: "7 day streak", icon: "Flame", threshold: 7, metric: "streak" },
  { id: "streak_14", title: "Two Week Warrior", description: "14 day streak", icon: "Flame", threshold: 14, metric: "streak" },
  { id: "streak_21", title: "Habit Formed", description: "21 day streak", icon: "Flame", threshold: 21, metric: "streak" },
  { id: "streak_30", title: "Unstoppable", description: "30 day streak", icon: "Flame", threshold: 30, metric: "streak" },
  { id: "streak_45", title: "Molten Core", description: "45 day streak", icon: "Flame", threshold: 45, metric: "streak" },
  { id: "streak_60", title: "Iron Will", description: "60 day streak", icon: "Shield", threshold: 60, metric: "streak" },

  { id: "points_500", title: "Point Hunter", description: "Earn 500 points", icon: "Star", threshold: 500, metric: "points" },
  { id: "points_1000", title: "Four Digits", description: "Earn 1,000 points", icon: "Star", threshold: 1000, metric: "points" },
  { id: "points_2000", title: "Elite Driver", description: "Earn 2,000 points", icon: "Crown", threshold: 2000, metric: "points" },
  { id: "points_5000", title: "High Roller", description: "Earn 5,000 points", icon: "Gem", threshold: 5000, metric: "points" },
  { id: "points_10000", title: "Five Figures", description: "Earn 10,000 points", icon: "Diamond", threshold: 10000, metric: "points" },
  { id: "points_25000", title: "Apex", description: "Earn 25,000 points", icon: "Award", threshold: 25000, metric: "points" },
  { id: "points_50000", title: "Mythic", description: "Earn 50,000 points", icon: "Trophy", threshold: 50000, metric: "points" },
  { id: "points_100000", title: "Six-Figure Mind", description: "Earn 100,000 points", icon: "Crown", threshold: 100000, metric: "points" },
];
