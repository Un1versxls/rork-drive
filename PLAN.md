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



