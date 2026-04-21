export type NameEffectId =
  | "none"
  | "gold_shimmer"
  | "ember_glow"
  | "phoenix_aura"
  | "founders_mark"
  | "diamond_trail"
  | "neon_pulse"
  | "frost_edge"
  | "royal_crown"
  | "solar_flare"
  | "void_black"
  | "rainbow_wave"
  | "electric"
  | "mythic_rune";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  metric: "completed" | "streak" | "points" | "plan";
  threshold: number;
  effect: NameEffectId;
  effectLabel: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_move",
    title: "First Move",
    description: "Complete your first task",
    icon: "Sparkles",
    metric: "completed",
    threshold: 1,
    effect: "gold_shimmer",
    effectLabel: "Gold Shimmer",
  },
  {
    id: "ember_week",
    title: "Ember Week",
    description: "Reach a 7-day streak",
    icon: "Flame",
    metric: "streak",
    threshold: 7,
    effect: "ember_glow",
    effectLabel: "Ember Glow",
  },
  {
    id: "founders_mark",
    title: "Founder's Mark",
    description: "Complete 25 total tasks",
    icon: "Crown",
    metric: "completed",
    threshold: 25,
    effect: "founders_mark",
    effectLabel: "Founder's Mark",
  },
  {
    id: "diamond_trail",
    title: "Diamond Trail",
    description: "Upgrade to Elite or Unlimited",
    icon: "Gem",
    metric: "plan",
    threshold: 1,
    effect: "diamond_trail",
    effectLabel: "Diamond Trail",
  },
  {
    id: "neon_pulse",
    title: "Neon Pulse",
    description: "Earn 1,000 points",
    icon: "Zap",
    metric: "points",
    threshold: 1000,
    effect: "neon_pulse",
    effectLabel: "Neon Pulse",
  },
  {
    id: "frost_edge",
    title: "Frost Edge",
    description: "Reach a 14-day streak",
    icon: "Snowflake",
    metric: "streak",
    threshold: 14,
    effect: "frost_edge",
    effectLabel: "Frost Edge",
  },
  {
    id: "electric",
    title: "Live Wire",
    description: "Complete 100 total tasks",
    icon: "Bolt",
    metric: "completed",
    threshold: 100,
    effect: "electric",
    effectLabel: "Live Wire",
  },
  {
    id: "royal_crown",
    title: "Royal",
    description: "Reach a 30-day streak",
    icon: "Crown",
    metric: "streak",
    threshold: 30,
    effect: "royal_crown",
    effectLabel: "Royal Crown",
  },
  {
    id: "solar_flare",
    title: "Solar Flare",
    description: "Earn 10,000 points",
    icon: "Sun",
    metric: "points",
    threshold: 10000,
    effect: "solar_flare",
    effectLabel: "Solar Flare",
  },
  {
    id: "phoenix_aura",
    title: "Phoenix",
    description: "Reach a 45-day streak",
    icon: "Star",
    metric: "streak",
    threshold: 45,
    effect: "phoenix_aura",
    effectLabel: "Phoenix Aura",
  },
  {
    id: "rainbow_wave",
    title: "Prism",
    description: "Earn 25,000 points",
    icon: "Rainbow",
    metric: "points",
    threshold: 25000,
    effect: "rainbow_wave",
    effectLabel: "Rainbow Wave",
  },
  {
    id: "void_black",
    title: "Void",
    description: "Earn 50,000 points",
    icon: "Moon",
    metric: "points",
    threshold: 50000,
    effect: "void_black",
    effectLabel: "Void Black",
  },
  {
    id: "mythic_rune",
    title: "Mythic",
    description: "Reach a 60-day streak",
    icon: "Sparkle",
    metric: "streak",
    threshold: 60,
    effect: "mythic_rune",
    effectLabel: "Mythic Rune",
  },
  {
    id: "six_figure",
    title: "Six-Figure Mind",
    description: "Earn 100,000 points",
    icon: "Trophy",
    metric: "points",
    threshold: 100000,
    effect: "mythic_rune",
    effectLabel: "Mythic Rune",
  },
];

export const NAME_EFFECT_LABELS: Record<NameEffectId, string> = {
  none: "Default",
  gold_shimmer: "Gold Shimmer",
  ember_glow: "Ember Glow",
  phoenix_aura: "Phoenix Aura",
  founders_mark: "Founder's Mark",
  diamond_trail: "Diamond Trail",
  neon_pulse: "Neon Pulse",
  frost_edge: "Frost Edge",
  royal_crown: "Royal Crown",
  solar_flare: "Solar Flare",
  void_black: "Void Black",
  rainbow_wave: "Rainbow Wave",
  electric: "Live Wire",
  mythic_rune: "Mythic Rune",
};
