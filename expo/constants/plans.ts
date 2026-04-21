import type { Plan } from "@/types";

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    taskLimit: 3,
    multiplier: 1,
    tagline: "Start moving",
    incomeTier: "starter",
    incomeRange: "$0 \u2013 $50 / month",
    premiumBusinesses: false,
    perks: [
      "3 daily tasks",
      "1x points",
      "Basic streak tracking",
      "Starter side hustles ($0\u2013$50/mo range)",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    taskLimit: 6,
    multiplier: 2,
    tagline: "Most popular",
    incomeTier: "growth",
    incomeRange: "$100 \u2013 $1,000 / month",
    premiumBusinesses: false,
    perks: [
      "6 daily tasks",
      "2x points",
      "Streak boosters",
      "All badges",
      "Growth businesses ($100\u2013$1k/mo range)",
    ],
    recommended: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: 79,
    taskLimit: 10,
    multiplier: 3,
    tagline: "Go pro",
    incomeTier: "premium",
    incomeRange: "$1,000 \u2013 $10,000+ / month",
    premiumBusinesses: true,
    perks: [
      "10 daily tasks",
      "3x points",
      "Priority categories",
      "Advanced stats",
      "Premium Mode \u2014 unlock high-ticket businesses ($1k\u2013$10k+/mo)",
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: 149,
    taskLimit: 99,
    multiplier: 5,
    tagline: "No limits",
    incomeTier: "elite",
    incomeRange: "$10,000+ / month",
    premiumBusinesses: true,
    perks: [
      "Unlimited tasks",
      "5x points",
      "Everything in Elite",
      "Founding member",
      "Elite Mode \u2014 scale-ready businesses ($10k+/mo potential)",
    ],
  },
];

export function getPlan(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
