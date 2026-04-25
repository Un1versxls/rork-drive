import type { Plan, BillingCycle } from "@/types";

export const PLANS: Plan[] = [
  {
    id: "base",
    name: "Base",
    monthlyPrice: 3.99,
    yearlyPrice: 49.99,
    tagline: "Start your side hustle",
    incomeTier: "standard",
    incomeRange: "$50 – $1,500 / month",
    premiumBusinesses: false,
    taskLimit: 6,
    multiplier: 2,
    perks: [
      "Pick from hand-picked businesses ($50 – $1,500 range)",
      "Personalized daily tasks",
      "Streak tracking + rewards",
      "3-day free trial",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 5.99,
    yearlyPrice: 69.99,
    tagline: "For people actually trying to make real money",
    incomeTier: "premium",
    incomeRange: "$1,500 – $10,000 / month",
    premiumBusinesses: true,
    taskLimit: 10,
    multiplier: 3,
    recommended: true,
    perks: [
      "Unlock high-ticket businesses ($1,500 – $10,000 range)",
      "Build your OWN custom business — we make the daily tasks",
      "Priority matching + premium-only ideas",
      "Everything in Base",
      "3-day free trial",
    ],
  },
];

export function getPlan(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function priceFor(plan: Plan, cycle: BillingCycle): number {
  if (cycle === "monthly") return plan.monthlyPrice;
  return plan.yearlyPrice;
}

export function monthlyEquivalent(plan: Plan, cycle: BillingCycle): number {
  if (cycle === "monthly") return plan.monthlyPrice;
  return Math.round((plan.yearlyPrice / 12) * 100) / 100;
}

export function yearlySavings(plan: Plan): number {
  const full = plan.monthlyPrice * 12;
  return Math.max(0, Math.round((full - plan.yearlyPrice) * 100) / 100);
}
