# AI scope, swipe hint, onboarding gestures, badges & Supabase fix

**AI assistant scope**

- Restrict the in-app AI to only answering questions about the user's current tasks — no writing, drafting, generating content, or doing work on the user's behalf.
- If asked to do work, it politely declines and offers a clarifying question instead.

**Motivation card hint animation**

- The first time someone reaches the dashboard after finishing the 5-step tutorial, the motivation card under the streak does a gentle half-swipe-up wiggle (with a subtle haptic tick) to teach that it can be swiped to change.
- Plays once, then never again.

**Dashboard swipe behavior**

- Swiping right inside the dashboard no longer kicks you back to onboarding.
- Replaced with a smooth horizontal swipe animation between dashboard sections plus a soft haptic when the swipe completes.

**Onboarding swipe lock**

- Disabled the back-swipe gesture on every onboarding screen so people can only move forward with the arrow button.

**Keyboard-safe text boxes**

- Every remaining text input that wasn't already lifted now floats above the keyboard while typing.

**Badge room improvements**

- Visual refresh of the badge room tab: better spacing, locked/unlocked states, subtle shine on earned badges, cleaner section headers.
- Added new badge categories beyond streaks and points:
  - First task completed
  - Finish a full task in one day
  - Try 3 different businesses
  - Complete a task before noon (early bird)
  - Use the app 7 different days
  - Redeem a code
  - Reach Premium
- Show a small notification when someone gets a badge

**Supabase sync fix**

- Fixed the "business change bonuses column not found" error so the new bonus columns sync cleanly on every device, with a safe fallback if the migration hasn't run yet on a given project.

---

# Age picker, task widgets, hint coachmarks & richer Supabase data

**Age picker in onboarding**

- New onboarding step right after the welcome screen with a slider from 13 to 65.
- Sub-copy explains it's used to recommend businesses they can legally do — saves them from picking something that would get them in trouble.
- Age stored on profile and synced to Supabase (new `age` column).

**Recommended age ranges on businesses**

- Path cards (AI vs In-Person) show a small "Best for 17+" / "Great for teens" hint.
- Each business idea carries a `recommendedAge` label that renders as a pill on the pick-business cards and the swap-business match screen.
- AI-heavy / capital-heavy businesses default to 17+, in-person low-cost hustles to teen-friendly.

**In-app task widgets — removed**

- Removed the dashboard widget strip per user request.
- Native iOS Home Screen / Lock Screen widgets require a Swift WidgetKit extension target, which this Expo project does not support.

**Task & subtask coachmarks**

- First open of the dashboard after the tour wiggles the first pending task card with a soft haptic — teaches that you can tap a task to open its plan. Fires once.
- First time the task detail sheet opens after the tour, the first subtask checkbox wiggles & glows so users learn they can check sub-steps off. Fires once.
- Both reuse the motivation-hint animation style.

**More Supabase data**

- Added columns: `age`, `equipped_effect`, `unlocked_badges`, `unlocked_achievements`, `total_completed`, `total_skipped`, `task_hint_seen`, `subtask_hint_seen`, `motivation_hint_seen`, `app_version`, `platform`.
- Sync layer pushes them on every state commit, falling back gracefully if the column doesn't exist on older projects.

