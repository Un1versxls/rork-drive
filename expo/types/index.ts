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

export type Source = "tiktok" | "instagram" | "friend" | "creator" | "other";

export type SkillTopic =
  | "code"
  | "business"
  | "marketing"
  | "design"
  | "content"
  | "languages"
  | "speaking"
  | "finance";

export type DeclineReason = "too_expensive" | "not_worth" | "no_money" | "browsing" | "other";

export type PlanId = "base" | "premium";

export type BillingCycle = "monthly" | "yearly";

export type IncomeTier = "standard" | "premium";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  tagline: string;
  perks: string[];
  recommended?: boolean;
  incomeTier: IncomeTier;
  incomeRange: string;
  premiumBusinesses: boolean;
  taskLimit: number;
  multiplier: number;
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

export interface Subscription {
  active: boolean;
  plan: PlanId;
  cycle: BillingCycle;
  trial: boolean;
  startedAt: string | null;
  source: "trial" | "code" | "admin" | "none";
}

export interface UserProfile {
  name: string;
  email: string;
  appleUserId: string | null;
  goal: PrimaryGoal | null;
  skillTopic: SkillTopic | null;
  goalDetail: string;
  industryDetail: string;
  obstacleDetail: string;
  experience: ExperienceLevel | null;
  time: TimeCommitment | null;
  priority: Priority | null;
  industry: Industry | null;
  budget: Budget | null;
  obstacle: Obstacle | null;
  source: Source | null;
  declineReason: DeclineReason | null;
  subscription: Subscription;
  business: BusinessIdea | null;
  businessTaskPool: TaskSeed[];
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  notificationPrefs: NotificationPrefs;
  notificationPromptSeen: boolean;
  equippedEffect: NameEffect;
  unlockedEffects: NameEffect[];
  lastRatePromptAt: string | null;
  hasRated: boolean;
  onboardingStep: string | null;
  customBuildMonth: string | null;
  customBuildCount: number;
  businessSwitchMonth: string | null;
  businessSwitchCount: number;
}

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
  isDev: boolean;
  adminGrantedPremium: boolean;
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
