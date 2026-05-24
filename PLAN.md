# Smarter sign-in routing + AI "What's New" card with animated progress button

## Sign-in routing changes

**Early sign-in (from the "What's your goal?" screen — the one right after age):**

- If the account has an **active subscription** → skip everything and go straight to the dashboard. No business chooser, no paywall.
- If the account's subscription **expired** → go to the paywall with the existing "Your account's subscription has expired." banner.
- If no subscription history → continue normal onboarding.

**Late sign-in (after the user has already picked a business in onboarding):**

**Also show the user their id below their name on profile page but just simple text no copy and paste or anything just so they can tell me for customer support.**



**And when I go back from the payment page take me to the animation right before it and keep me there and if I close and reopen the app while on any of the paywall pages then send me back to the create account or sign in oage**

- Show a small business-chooser screen **only when** the cloud account has a *different* saved business/path than the one they just picked. If they match (or cloud has nothing saved), skip the chooser.
- After choosing (or auto-skipping):
  - Active subscription → straight to the dashboard.
  - Expired subscription → paywall with the expired banner.
  - No subscription history → normal paywall.

This applies to both email sign-in and Apple sign-in.

## "What's New" card redesign (AI feature)

Reuse the existing showcase template (so future updates just need a new entry) and upgrade the visual to match the paywall's automation/AI feel:

- **Brand-new AI-themed animation** sitting right below the headline + description, styled like the paywall feature card — soft rounded square with a subtle glow, animated AI elements (pulsing nodes, flowing connection lines, gentle sparkle) so it feels alive instead of just an emoji.
- **Forced 4-second wait** before the user can dismiss — the wait is shown as a **progress bar that slowly lights up the inside of the "Got it" button from left to right**. When it fills completely the button becomes tappable and gives a soft haptic confirmation. No countdown number — pure visual fill.
- Tapping outside or the small X does nothing during the wait, same as today.
- Once dismissed, the id is remembered locally and synced to Supabase (`last_showcase_seen`), so it never shows again unless a new showcase id is added.
- Still skipped on the very first dashboard open after sign-up/tutorial — shows on the next launch.

The card stays a reusable template: shipping the next "What's New" just means adding a new entry to the showcase list with id, headline, body, and (optional) animation variant.

## Delivery

Push the new build to TestFlight automatically once everything compiles.

## Out of scope (already shipped, leaving as-is)

- Nightly 5pm sync, business-switch sync — already live in previous builds.

