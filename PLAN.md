# Simpler onboarding, branded badges, paywall polish & first-time tour

## Features

**New onboarding (simpler, branchy)**

- Replace the multi-goal screen with just **2 choices**: "Start an AI Business" or "Start an In-Person Side Hustle".
- Each path asks 3 quick questions tailored to it (time available, experience, budget/interest), then finishes.
- Remove Day Trading, "learn a skill", and other generic goals from the entry point.

**Business pick screen (post-onboarding)**

- App generates **3 businesses**: 2 Pro-only + 1 free, with a clear gold "PRO" badge on the locked ones.
- AI path Pro examples: YouTube Automation, AI Day Trading, AI SaaS, AI Automation Agency. Free: simpler AI side project.
- In-person path Pro examples: Mobile Detailing Empire, Pressure Washing Franchise, Vending Route. Free: car washing / lawn care.

**Paywall flow**

- Picking the **free business** opens the full paywall (phone animation, feature pages, plan picker) pre-selected on **Base — 1 month**.
- Picking a **Pro business** opens the same paywall pre-selected on **Pro — 1 month** with a banner up top: "This business requires Pro to unlock."
- If a user with a Pro pick downgrades to Base at checkout, a friendly screen says "Looks like this is the business for you" and swaps them to the free alternative they could have chosen earlier.

**Reward / badge system**

- Streak milestones unlock collectible badges that change the look of your name on the dashboard:
  - 3-day: silver shimmer
  - 7-day: blue glow
  - 10-day: pulsing gold light
  - 30-day: rainbow gradient
  - 100-day: animated fire
- New "Badges" section where users can view unlocked badges and **equip one** to style their name.
- Badge gets a small animated icon next to the streak counter too.

**First-time feature tour**

- On first app open after onboarding, a non-closable in-app tour highlights 5 things in sequence with animation:
  1. Your daily tasks
  2. Streak & rewards
  3. Equipping badges to style your name
  4. Switching businesses
  5. Pro unlocks custom businesses (small UI panel teaser)
- Only ever shown once per account.

**Bug fixes & polish**

- Fix chatbot button: add proper safe-area padding so it opens correctly on iPhone (notch + home indicator clearance).
- Sweep the codebase for any current errors/warnings.
- Tighten copy and reduce visual noise across onboarding, paywall, and sign-up so each screen feels minimal and snappy.
- Smoother transitions between onboarding steps and into the paywall.

## Design

- Onboarding: big, friendly two-card pick (AI vs In-person) with subtle motion, then minimal one-question-per-screen flow.
- Business cards: clean dark cards, gold border + "PRO" chip for locked ones, single bright accent for the free pick.
- Paywall banner (when Pro required): slim gold strip at the top of the paywall with a lock icon.
- Badges: small circular crests with metallic finishes; equipping one applies an animated effect to the dashboard name (glow, pulse, shimmer, gradient, flame).
- Tour: spotlight-style overlay with soft dimming, animated arrows, and a "Next" button only (no close).

## Screens

- **Onboarding intro** — 2 path cards: AI Business / In-Person Hustle.
- **Branching questions** — 3 short screens per path.
- **Business pick** — 2 Pro + 1 Free, clear lock styling.
- **Paywall** — phone animation, feature pages, plan picker pre-selected based on pick + optional "Pro required" banner.
- **Downgrade confirm screen** — shown when a Pro picker selects Base, switches them to the free business.
- **Dashboard** — name styled by equipped badge, animated badge near streak.
- **Badges screen** — grid of all badges with locked/unlocked state and an "Equip" button.
- **First-time tour overlay** — 5-step guided animation over the dashboard. 

