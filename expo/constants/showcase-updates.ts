/**
 * "What's New" dashboard showcase template.
 *
 * Add a new entry to the array and bump the id when shipping a feature
 * you want users to see one time on next app open. The dashboard reads
 * the LAST entry as the current showcase. Old ids are remembered as
 * "seen" via Supabase + AsyncStorage so users won't get re-prompted
 * with prior updates after this one rolls out.
 */
export interface ShowcaseUpdate {
  /** Stable id, e.g. "ask-ai-v1". Bump for each new update card. */
  id: string;
  /** Big headline shown on the card. */
  headline: string;
  /** Body copy under the headline. Keep short — 1–2 lines. */
  body: string;
  /** Optional accent color for the icon ring. Defaults to gold. */
  accent?: string;
  /** Optional emoji shown above the headline. */
  emoji?: string;
}

export const SHOWCASE_UPDATES: ShowcaseUpdate[] = [
  {
    id: "ask-ai-v1",
    headline: "Ask AI anything",
    body: "New in this update: tap the AI button to get instant business guidance.",
    accent: "#d4af37",
    emoji: "🤖",
  },
];

/** Convenience accessor for the most recent update card. */
export function currentShowcase(): ShowcaseUpdate | null {
  return SHOWCASE_UPDATES.length > 0 ? SHOWCASE_UPDATES[SHOWCASE_UPDATES.length - 1] : null;
}
