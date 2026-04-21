export type StreakTier =
  | "none"
  | "spark"
  | "flame"
  | "blaze"
  | "ember"
  | "inferno"
  | "nuclear"
  | "phoenix";

export interface StreakTierMeta {
  id: StreakTier;
  label: string;
  minDays: number;
  primary: string;
  secondary: string;
  glow: string;
  rings: number;
  particleCount: number;
  rotationSpeed: number;
  miniFlames: number;
  nuclear: boolean;
  description: string;
}

export const STREAK_TIERS: Record<StreakTier, StreakTierMeta> = {
  none: {
    id: "none",
    label: "Begin",
    minDays: 0,
    primary: "#c9a87c",
    secondary: "#e8d5b7",
    glow: "rgba(201,168,124,0.35)",
    rings: 0,
    particleCount: 0,
    rotationSpeed: 0,
    miniFlames: 0,
    nuclear: false,
    description: "Start today.",
  },
  spark: {
    id: "spark",
    label: "Spark",
    minDays: 1,
    primary: "#d4af37",
    secondary: "#e8d5b7",
    glow: "rgba(212,175,55,0.5)",
    rings: 1,
    particleCount: 6,
    rotationSpeed: 6000,
    miniFlames: 0,
    nuclear: false,
    description: "The first flame.",
  },
  flame: {
    id: "flame",
    label: "Flame",
    minDays: 3,
    primary: "#d4a027",
    secondary: "#f0c55a",
    glow: "rgba(212,160,39,0.6)",
    rings: 2,
    particleCount: 10,
    rotationSpeed: 4800,
    miniFlames: 0,
    nuclear: false,
    description: "Warming up.",
  },
  blaze: {
    id: "blaze",
    label: "Blaze",
    minDays: 7,
    primary: "#e89b2b",
    secondary: "#ffd97a",
    glow: "rgba(232,155,43,0.7)",
    rings: 3,
    particleCount: 14,
    rotationSpeed: 3600,
    miniFlames: 0,
    nuclear: false,
    description: "Full momentum.",
  },
  ember: {
    id: "ember",
    label: "Ember Storm",
    minDays: 10,
    primary: "#f08a1e",
    secondary: "#ffce6a",
    glow: "rgba(240,138,30,0.75)",
    rings: 3,
    particleCount: 16,
    rotationSpeed: 3200,
    miniFlames: 6,
    nuclear: false,
    description: "Flames orbit you.",
  },
  inferno: {
    id: "inferno",
    label: "Inferno",
    minDays: 30,
    primary: "#f26b1a",
    secondary: "#ffb74d",
    glow: "rgba(242,107,26,0.78)",
    rings: 4,
    particleCount: 20,
    rotationSpeed: 2800,
    miniFlames: 8,
    nuclear: false,
    description: "Unstoppable.",
  },
  nuclear: {
    id: "nuclear",
    label: "Nuclear",
    minDays: 50,
    primary: "#d8ff3a",
    secondary: "#8bff4d",
    glow: "rgba(180,255,80,0.85)",
    rings: 5,
    particleCount: 26,
    rotationSpeed: 2000,
    miniFlames: 10,
    nuclear: true,
    description: "Critical mass.",
  },
  phoenix: {
    id: "phoenix",
    label: "Phoenix",
    minDays: 100,
    primary: "#fff1b8",
    secondary: "#ffd66b",
    glow: "rgba(255,241,184,0.9)",
    rings: 6,
    particleCount: 30,
    rotationSpeed: 1600,
    miniFlames: 12,
    nuclear: true,
    description: "Legendary.",
  },
};

export function getStreakTier(days: number): StreakTierMeta {
  if (days >= 100) return STREAK_TIERS.phoenix;
  if (days >= 50) return STREAK_TIERS.nuclear;
  if (days >= 30) return STREAK_TIERS.inferno;
  if (days >= 10) return STREAK_TIERS.ember;
  if (days >= 7) return STREAK_TIERS.blaze;
  if (days >= 3) return STREAK_TIERS.flame;
  if (days >= 1) return STREAK_TIERS.spark;
  return STREAK_TIERS.none;
}
