import type { Badge } from "@/types";

export const BADGES: Badge[] = [
  // Tasks
  { id: "first_task", title: "First Move", description: "Complete your first task", icon: "Sparkles", threshold: 1, metric: "completed", category: "tasks" },
  { id: "ten_tasks", title: "Getting Serious", description: "Complete 10 tasks", icon: "Zap", threshold: 10, metric: "completed", category: "tasks" },
  { id: "twentyfive_tasks", title: "Quarter Hundred", description: "Complete 25 tasks", icon: "Target", threshold: 25, metric: "completed", category: "tasks" },
  { id: "fifty_tasks", title: "Half Century", description: "Complete 50 tasks", icon: "Medal", threshold: 50, metric: "completed", category: "tasks" },
  { id: "century", title: "Century Club", description: "Complete 100 tasks", icon: "Trophy", threshold: 100, metric: "completed", category: "tasks" },
  { id: "two_fifty_tasks", title: "Machine", description: "Complete 250 tasks", icon: "Cpu", threshold: 250, metric: "completed", category: "tasks" },
  { id: "five_hundred_tasks", title: "Relentless", description: "Complete 500 tasks", icon: "Rocket", threshold: 500, metric: "completed", category: "tasks" },
  { id: "thousand_tasks", title: "1K Legend", description: "Complete 1,000 tasks", icon: "Crown", threshold: 1000, metric: "completed", category: "tasks" },

  // Streaks
  { id: "streak_3", title: "Warming Up", description: "3 day streak", icon: "Flame", threshold: 3, metric: "streak", category: "streak" },
  { id: "streak_7", title: "On Fire", description: "7 day streak", icon: "Flame", threshold: 7, metric: "streak", category: "streak" },
  { id: "streak_14", title: "Two Week Warrior", description: "14 day streak", icon: "Flame", threshold: 14, metric: "streak", category: "streak" },
  { id: "streak_21", title: "Habit Formed", description: "21 day streak", icon: "Flame", threshold: 21, metric: "streak", category: "streak" },
  { id: "streak_30", title: "Unstoppable", description: "30 day streak", icon: "Flame", threshold: 30, metric: "streak", category: "streak" },
  { id: "streak_45", title: "Molten Core", description: "45 day streak", icon: "Flame", threshold: 45, metric: "streak", category: "streak" },
  { id: "streak_60", title: "Iron Will", description: "60 day streak", icon: "Shield", threshold: 60, metric: "streak", category: "streak" },

  // Points
  { id: "points_500", title: "Point Hunter", description: "Earn 500 points", icon: "Star", threshold: 500, metric: "points", category: "points" },
  { id: "points_1000", title: "Four Digits", description: "Earn 1,000 points", icon: "Star", threshold: 1000, metric: "points", category: "points" },
  { id: "points_2000", title: "Elite Driver", description: "Earn 2,000 points", icon: "Crown", threshold: 2000, metric: "points", category: "points" },
  { id: "points_5000", title: "High Roller", description: "Earn 5,000 points", icon: "Gem", threshold: 5000, metric: "points", category: "points" },
  { id: "points_10000", title: "Five Figures", description: "Earn 10,000 points", icon: "Diamond", threshold: 10000, metric: "points", category: "points" },
  { id: "points_25000", title: "Apex", description: "Earn 25,000 points", icon: "Award", threshold: 25000, metric: "points", category: "points" },
  { id: "points_50000", title: "Mythic", description: "Earn 50,000 points", icon: "Trophy", threshold: 50000, metric: "points", category: "points" },
  { id: "points_100000", title: "Six-Figure Mind", description: "Earn 100,000 points", icon: "Crown", threshold: 100000, metric: "points", category: "points" },

  // Explorer / behavior
  { id: "full_day", title: "Clean Sweep", description: "Finish every task in a single day", icon: "CheckCircle2", threshold: 1, metric: "full_day", category: "explorer" },
  { id: "early_bird", title: "Early Bird", description: "Complete a task before noon", icon: "Sunrise", threshold: 1, metric: "early_bird", category: "explorer" },
  { id: "explorer_3", title: "Explorer", description: "Try 3 different businesses", icon: "Compass", threshold: 3, metric: "businesses_tried", category: "explorer" },
  { id: "active_7_days", title: "Regular", description: "Use the app on 7 different days", icon: "CalendarCheck", threshold: 7, metric: "days_active", category: "explorer" },
  { id: "active_30_days", title: "Devoted", description: "Use the app on 30 different days", icon: "CalendarHeart", threshold: 30, metric: "days_active", category: "explorer" },

  // Premium / codes
  { id: "code_redeemed", title: "Insider", description: "Redeem an access code", icon: "Ticket", threshold: 1, metric: "code_redeemed", category: "premium" },
  { id: "premium_member", title: "Premium Driver", description: "Reach Premium status", icon: "Crown", threshold: 1, metric: "premium", category: "premium" },
];
