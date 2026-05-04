# Fix cross-device sync, sign-in loop, email signup error, and add day trading path

## Problems being fixed

- After signing in on a new phone (TestFlight), the app keeps bouncing back to sign-in instead of opening the dashboard.
- Creating an account with email shows "edge function returned a non-2xx status code".
- Progress, name, tasks, streak, business, switches and timers don't follow the user across devices.
- No flow yet for people who want to start (or learn) day trading as their hustle.

## What will change

### 1. Make email sign-up actually work
- Replace the brittle 6-digit email-code step with a normal email + password account creation.
- The user types their email and a password, taps "Create account", and they're signed in immediately — no edge function involved.
- "Resend code" / OTP screens are removed from the sign-up path so the "non-2xx" error can't appear.

### 2. Stay signed in & land on the dashboard correctly
- When a returning user signs in on any device, the app pulls down their full saved profile from the cloud first, then opens straight to the dashboard.
- Fixes the infinite "sign in → kicked back to sign in" loop by trusting the cloud record instead of the empty local state on a fresh phone.
- Sessions remain remembered for 30 days as before.

### 3. Full cross-device memory
Everything below is now saved to the cloud the moment it changes, and re-loaded on a new device so the experience is identical:
- Name, email, current goal, business, business task pool
- Today's tasks and their completed/skipped status
- Streak, best streak, total points, last active date, daily history
- Time until new tasks (date keys are restored so the next-day refresh lines up)
- Business-switch counter (the gold ×5 badge), custom-build counter and the month they reset on
- Unlocked badges, achievements, equipped name effect

### 4. New "Day Trading" path
- On the goal screen, "Earn extra income" and "Learn a skill" each get a new sub-option for **Day Trading**.
- Choosing it routes into a tailored onboarding mini-flow that asks about starting capital, market preference (stocks, crypto, forex), and whether they want a "start a side hustle" plan or a "learn the fundamentals" plan.
- A dedicated day-trading task pool is added — example tasks: paper-trade for 30 minutes, journal one trade, watch one market open, study one chart pattern, review risk-management rules, set up a broker account, define a daily loss limit, etc.
- The plan summary and dashboard reflect "Day Trading" as the chosen path with its own tagline and milestones.

### 5. Small reliability fixes spotted along the way
- Sign-in screen gracefully recovers if the cloud record is missing (falls back to onboarding instead of crashing).
- Cloud sync now runs on every state change after sign-in, not just on selected events.
- Safer task-list access so opening a task right after sign-in can't throw an "undefined value" error.

## Screens added or changed

- **Goal screen** — new "Day Trading" option appears under both Earn income and Learn a skill.
- **Day Trading intro** — short explainer + capital + market + side-hustle-vs-learn choice.
- **Sign-up screen** — single-step email + password, no verification code.
- **Sign-in screen** — pulls full progress from cloud before opening the dashboard.
- **Dashboard** — unchanged visually, but now shows the exact same data on every device.