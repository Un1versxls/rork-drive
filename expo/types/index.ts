export type PrimaryGoal =
  | "earn_income"
  | "build_skills"
  | "grow_business"
  | "stay_productive";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type TimeCommitment = "15m" | "30m" | "1h" | "2h";

export type Priority = "flexibility" | "earning" | "learning" | "speed";

export type Industry =
  | "tech"
  | "creative"
  | "services"
  | "ecommerce"
  | "content"
  | "education"
  | "health"
  | "food"
  | "open";

export type Budget = "under_100" | "100_500" | "500_2000" | "2000_plus";

export type Obstacle =
  | "time"
  | "money"
  | "confidence"
  | "direction"
  | "accountability";

export type PlanId = "free" | "pro" | "elite" | "unlimited";

export type IncomeTier = "starter" | "growth" | "premium" | "elite";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  taskLimit: number;
  multiplier: number;
  tagline: string;
  perks: string[];
  recommended?: boolean;
  incomeTier: IncomeTier;
  incomeRange: string;
  premiumBusinesses: boolean;
}

export type TaskCategory =
  | "focus"
  | "skill"
  | "health"
  | "growth"
  | "mindset"
  | "hustle";

export interface TaskSeed {
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: 1 | 2 | 3;
}

export interface BusinessIdea {
  id: string;
  name: string;
  tagline: string;
  description: string;
  whyFit: string;
  startupCost: string;
  timeToIncome: string;
  firstMilestones: string[];
}

export type NameEffect =
  | "none"
  | "gold_shimmer"
  | "ember_glow"
  | "phoenix_aura"
  | "founders_mark"
  | "diamond_trail";

export interface NotificationPrefs {
  dailyReminders: boolean;
  dailyReminderHour: number;
  streakProtection: boolean;
  achievementUnlocks: boolean;
  businessMilestones: boolean;
  motivating: boolean;
}

export interface UserProfile {
  name: string;
  goal: PrimaryGoal | null;
  goalDetail: string;
  industryDetail: string;
  obstacleDetail: string;
  experience: ExperienceLevel | null;
  time: TimeCommitment | null;
  priority: Priority | null;
  industry: Industry | null;
  budget: Budget | null;
  obstacle: Obstacle | null;
  plan: PlanId;
  business: BusinessIdea | null;
  businessTaskPool: TaskSeed[];
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  notificationPrefs: NotificationPrefs;
  notificationPromptSeen: boolean;
  equippedEffect: NameEffect;
  unlockedEffects: NameEffect[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: 1 | 2 | 3;
  basePoints: number;
  status: "pending" | "completed" | "skipped";
  dateKey: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  threshold: number;
  metric: "completed" | "streak" | "points";
}

export interface AppState {
  onboarded: boolean;
  profile: UserProfile;
  tasks: Task[];
  points: number;
  streak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  history: Record<string, { completed: number; skipped: number }>;
  unlockedBadges: string[];
  unlockedAchievements: string[];
}
