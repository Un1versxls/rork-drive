/**
 * "What's New" showcase template.
 *
 * Each release adds a new entry to SHOWCASE_UPDATES. The dashboard
 * surfaces only the LAST entry — older ids are kept around so we can
 * remember which ones a given user already dismissed.
 *
 * To roll a new update card (e.g. "Update 2.1"):
 *   1. Copy the most recent entry below.
 *   2. Bump `id`, `eyebrow`, and the first page headline/body to the
 *      most prominent new feature. The first page MUST have a visual
 *      `variant` (animation) so the card opens with motion.
 *   3. Append more `pages` for other recent features (promos, tips, …).
 *   4. Keep `holdMs` at 5000 unless the page is exceptionally short.
 *   5. Set `showOnFirstLaunch: true` for major releases you want every
 *      user to see immediately on their next app open.
 */

export type ShowcaseVariant =
  /** AI "Ask the Coach" phone-mockup animation (default for AI updates). */
  | "ai-coach"
  /** Limited-time badge promotion — trophy + badge shower. */
  | "badge-promo"
  /** Stability / bug-fix release — orbiting gears + gold sparkle sweep. */
  | "bug-fixes";

export interface ShowcasePage {
  /** Visual animation rendered between the headline and the CTA. */
  variant: ShowcaseVariant;
  /** Small pill text above the headline (e.g. "UPDATE 2.5", "LIMITED OFFER"). */
  eyebrow: string;
  headline: string;
  body: string;
  /** Button label shown once the hold completes. */
  cta: string;
  /** Override the per-page hold in ms. Defaults to 5000. */
  holdMs?: number;
}

export interface ShowcaseUpdate {
  /** Stable id, e.g. "update-2.5". Bump for each new update card. */
  id: string;
  /** Pages displayed in order. Each must be held the full holdMs before advancing. */
  pages: ShowcasePage[];
  /**
   * When true, the card shows on the FIRST dashboard launch after onboarding
   * (instead of being deferred to the next session). Use for major releases.
   */
  showOnFirstLaunch?: boolean;
  /**
   * Path to navigate to when the last page is dismissed. Optional —
   * defaults to staying on the dashboard.
   */
  finalRoute?: "/badges" | null;
}

export const SHOWCASE_UPDATES: ShowcaseUpdate[] = [
  {
    id: "update-3.0",
    showOnFirstLaunch: true,
    finalRoute: "/badges",
    pages: [
      {
        variant: "ai-coach",
        eyebrow: "UPDATE 3.0",
        headline: "Ask the Coach, on every task",
        body:
          "Tap any task and hit Ask the Coach — instant, personalized guidance trained on your business.",
        cta: "What else is new",
      },
      {
        variant: "badge-promo",
        eyebrow: "LIMITED TIME",
        headline: "Collect every badge → 1 month of Premium, free",
        body:
          "Earn every non-membership badge in the Badge Room and we'll credit you a free month of Premium. Limited time.",
        cta: "Almost done",
      },
      {
        variant: "bug-fixes",
        eyebrow: "3.0 · BUG FIXES",
        headline: "Smoother, faster, sturdier",
        body:
          "Tons of fixes under the hood — faster sign-in sync, no more lost task progress, sharper roadmap, snappier milestone taps, smarter age-aware business picks, and dozens of small polish passes.",
        cta: "View badges",
      },
    ],
  },
];

/** Convenience accessor for the most recent update card. */
export function currentShowcase(): ShowcaseUpdate | null {
  return SHOWCASE_UPDATES.length > 0 ? SHOWCASE_UPDATES[SHOWCASE_UPDATES.length - 1] : null;
}
