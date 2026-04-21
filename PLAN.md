# Add business library, streak effects, task helper AI, achievement styles, and notifications

## Central Business/Routine/Skill Library (editable by you)

- **Shared library, easy to edit**: All possible businesses, routines, and skills live in one central list stored in your Supabase database (works like a spreadsheet — you can view, add, edit, or delete rows from the Supabase dashboard at any time).
- **Auto-sync on unlock**: When a user finishes onboarding and the app generates 3 business suggestions, any new business that isn't already in the library gets added automatically. Existing ones are reused.
- **Removable options**: If you delete a row from the library, users will no longer get that option going forward.
- **Fields for each entry**: name, category (business/routine/skill), description, typical daily tasks, difficulty, matching goals/experience, and an "active" toggle so you can disable without deleting.

## Loading Screen with Streak Effects

- **App open loading screen**: When the app opens, a short loading screen shows the user's current streak number front and center, with a tailored visual effect based on streak size.
- **Streak tiers** (each with a distinctive, premium-feeling effect):
  - **Spark (1–2 days)**: soft gold shimmer with rising particles
  - **Flame (3–6)**: warm flickering flame glow around the number
  - **Blaze (7–29)**: animated ember trail with pulsing gold rings
  - **Inferno (30–99)**: roaring flame column with heat-wave distortion
  - **Phoenix (100+)**: radiant gold-white aura with rotating rays and drifting embers
- **Tap the streak icon in-app**: Triggers a vibration and plays a smaller 1–2 second version of the user's current streak effect right on the icon.

## Task Detail Panel + AI Question Coach

- **Tap a task** to open a clean slide-up panel with:
  - Full task description and why it matters for the user's chosen business
  - Step-by-step breakdown (checkable sub-steps)
  - Estimated time and difficulty
  - "Mark complete" and "Skip" buttons
- **Built-in AI coach chat** inside the panel:
  - Only asks guiding Socratic questions to help the user think it through
  - Will never do the work, write content, or give direct answers — strictly asks clarifying and reflective questions
  - Friendly, short responses styled like a coach
  - Clear label so the user knows it's a thinking partner, not a doer

## Achievements with Equippable Name Effects

- **Achievements screen** on the Progress tab with badges that unlock as users hit milestones.
- **Equippable effects**: Certain achievements unlock a visual effect the user can equip to style their own name across the app (profile, leaderboard, etc.).
  - **Gold Shimmer** (starter unlock): animated gold gradient sweeping across name letters
  - **Ember Glow** (7-day streak): warm glowing outline
  - **Phoenix Aura** (100-day streak): radiant gold-white halo behind name
  - **Founder's Mark** (complete first business milestone): subtle gold underline with a small crown
  - **Diamond Trail** (Elite/Unlimited plan): soft sparkle particles
- **Equip flow**: Tap an unlocked achievement → preview the effect on your name → tap "Equip". Only one equipped at a time. Haptic feedback on equip.

## Vibrations Everywhere

Gentle haptic feedback added to all meaningful interactions:
- Button taps, tab switches, onboarding answer selection
- Completing a task (satisfying double-tap pattern)
- Skipping a task (soft warning)
- Unlocking achievements (celebratory pattern)
- Equipping effects, streak icon tap, opening/closing task panel
- Receiving AI coach replies (subtle tick)

## Notification Opt-in Flow

- **After onboarding**, a friendly screen asks: "Want reminders to keep your momentum?" with Allow / Not now.
- **If allowed**, a second screen lets the user pick notification types (multi-select):
  - Daily task reminders (with time picker)
  - Streak protection alerts (end-of-day warning if tasks aren't done)
  - Achievement unlocks
  - Business milestone nudges
  - Motivating streak reminders ("Remember why you started" style messages)
- **Settings in Profile tab**: User can revisit and change these anytime, plus change reminder time.

## Design Notes

- Maintains your warm off-white + gold/caramel palette throughout all new screens.
- New panels and effects use glassmorphism cards, gentle shadows, and Outfit/Inter typography already in the app.
- All effects are smooth and feel premium — no harsh or gimmicky animations.