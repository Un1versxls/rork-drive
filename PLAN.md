# User IDs, "What's New" showcase, paywall back animation & onboarding polish

## What you'll get

### 1. Personal user ID on Profile

- Every user gets a short, readable code like `**DRIVE-A4F2K9**` generated deterministically from their account (so it's stable across devices and sign-ins).
- Shown right under the email on the Profile screen with a small "tap to copy" feel.
- Mirrored to Supabase so support can look people up by it.

### 2. Business swap counter syncs correctly

- The "x3 swaps remaining" badge will read straight from the cloud and self-correct if it drifts (e.g. if Supabase says they should have 2 but the device shows 3, it'll quietly fix itself to the right number on next sign-in / app open).
- The cap (3 free / 5 premium) is enforced on both sides so users can't get extra swaps by reinstalling.

### 3. Paywall "go back" animation matches what you see going forward

- When opening the paywall from the Profile plan-expand area, the page slides in with a smooth transition.
- Pressing back will now play the **exact same transition in reverse** — same easing, same duration, same direction — instead of the current mismatched jump. Feels symmetrical every time.

### 4. "What's New" dashboard showcase (reusable template)

- A soft, rounded-square card overlays the dashboard the next time the user opens the app.
- **First update card:**
  - Headline: **"Ask AI anything"**
  - Body: **"New in this update: tap the AI button to get instant business guidance."**
- **Behavior:**
  - Only shows on the **dashboard** (never during onboarding or the first-time tutorial).
  - **Skipped** the very first session after sign-up / after the tutorial closes — it'll appear the *next* time they open the app.
  - User **cannot dismiss it for the first 4 seconds** (close button is greyed out, then activates with a soft pulse).
  - Once dismissed, **never shows again** unless you (admin) manually re-trigger it.
  - Last-seen showcase ID is stored both locally (instant) and on Supabase (`last_showcase_seen` column) so it follows the user across devices.
- **Reusable template:** future updates are a one-liner — give me an `id`, headline, and body, and the same card system handles it. Old IDs stay marked seen; only new IDs trigger the popup.

### 5. Onboarding emoji rating — less empty

- The emoji rating block is **vertically centered** on its screen instead of floating near the top.
- A **soft radial glow** sits behind the currently selected emoji — subtle, just enough to give the screen presence without being loud. Glow color matches the emoji's mood (warm for high ratings, cool for low).

### 6. TestFlight push

- After all the above is in, I'll cut a new build (v1.9.5, build 35) and upload it to TestFlight. Invite arrives in 5–30 minutes per usual.

---

## Out of scope (not changing)

- Nightly 5pm sync (already shipped previously).
- Sign-in routing for active/expired subs (already shipped previously).
- Age slider / EmojiRating crash fixes (already shipped previously).

