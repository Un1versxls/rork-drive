# Cal AI–style simplicity, paid-only $23.99 trial flow, Premium tier, and user accounts

## Look & feel — full redesign (Cal AI simple, but keep the flame)

- Clean white backgrounds, black text, lots of whitespace, rounded cards, one bold action button per screen.
- All emojis through onboarding shown in a gold tint.
- Keep the flame / streak effect on the progress screen and splash as the signature moment.
- Remove busy gradients, glass blurs, and heavy decorations from paywall, tabs, and tasks.
- Simple typography hierarchy: one big headline, one short subline, bold CTA.

## Loading screen

- Remove the project preview image that flashes before the app loads.
- New splash: just the app icon + the word "DRIVE" underneath, shown for exactly 2 seconds, then the app opens.

## Onboarding — simpler, with new steps

- Save progress automatically at every step (user can close the app and come back to the same question).
- All option emojis shown in gold.
- New question: **"Where did you hear about us?"** with multiple choice: TikTok, Instagram, A friend, A creator, Other.
- New **Results page** (placeholder for now) that shows:
  - A 5-star rating with review count as social proof.
  - Placeholder success stats (you'll fill in later).
  - Room for before/after user images (placeholder).
- Final onboarding screen becomes the **free trial offer** (see next section).

## Paid-only — new paywall flow

- Remove Free, Pro, and Unlimited plans entirely. Only two plans exist now:

  **Base — $23.99**
  - Monthly: $23.99/month, auto-renews monthly through Apple.
  - Yearly: same $23.99 price shown, multiplied to yearly, then **$20 off** — presented as the best deal.
  - Includes: pick businesses in the $50–$1,500 range.
  - Comes with a free trial before the first charge.

  **Premium — $35**
  - Monthly: $35/month, auto-renews monthly through Apple.
  - Yearly: same $35 price shown, multiplied to yearly, then **$30 off**.
  - Includes everything in Base **plus**:
    - Unlock high-ticket businesses ($1,500–$10,000).
    - Build your own custom business (tell Drive your idea and it generates daily tasks for you).
    - Priority matching and premium-only ideas.
  - Presented with enticing copy aimed at 16–26 TikTok users ("for people actually trying to make real money", "unlock the big leagues", etc).

- Paywall screen itself is dead simple:
  - Headline: "We want you to try it free."
  - Two clean toggle cards: Yearly (best value, big savings badge) and Monthly.
  - Plan switcher between Base and Premium at the top.
  - One gold CTA button: "Start free trial".
  - Tiny "Restore purchase" and legal text at the bottom.

## If the user declines / closes the paywall

1. First, show a short **"Why aren't you interested?"** screen with multiple choice:
   - Too expensive
   - Not sure it's worth it
   - Don't have the money right now
   - Just browsing
   - Other
2. After they answer, send them **back to the free trial offer** with slightly softer copy ("One more look — your first week is on us").
3. The app stays locked until they start a trial. No free tier exists.

## Custom business builder (Premium only)

- New screen where the user types their own business / project idea and Drive generates daily tasks for it.
- Shown as a teaser card to Base users with a gold lock — tapping it opens the Premium upgrade paywall.
- Fully unlocked for Premium subscribers.

## Tasks & progress — cleaner copy

- When the user completes half their daily tasks: a small celebratory popup like **"Great job — halfway there 🔥"**.
- Progress screen: remove "Avg skip rate" from the main view.
- Replace it with friendly achievement lines like:
  - "You've turned 56 minutes into real work this week."
  - "3 days on fire in a row."
  - "You finished more tasks than 72% of new users."
- Add a small **"Advanced stats"** panel at the bottom that opens to reveal the old detailed numbers (skip rate, completion %, streak history) for users who want them.

## User accounts & admin system

- Full sign-up / log-in with email.
- Every user gets a unique ID that you can see.
- Accounts sync progress across devices.
- **Admin panel** (only visible to your dev accounts):
  - See a list of users.
  - Grant free Premium to any user (for giveaways, creators, dev testing).
  - Mark accounts as "dev" so they skip the paywall.
  - Revoke access.
- Redeem-a-code screen for regular users, so you can hand out free premium codes to TikTok followers.

## Rate the app

- On the results page during onboarding, show a 5-star social-proof rating with review count.
- After the user has used the app for a bit, ask them once to rate the app.
- If they haven't rated, ask again every 30 days (gentle, dismissible).

## App icon

- Keep your current updated app store icon exactly as you set it — no changes here.

## Screens in the app

1. **Splash** — icon + "DRIVE" for 2 seconds.
2. **Onboarding** — name, goal, experience, time, priority, industry, budget, obstacle, where-did-you-hear, results page, free trial offer. Progress saved.
3. **Decline survey → Back to trial offer** — only if user dismisses paywall.
4. **Sign up / Log in** — email account, unique ID.
5. **Tasks (home)** — today's tasks, halfway celebration, streak flame kept.
6. **Progress** — friendly achievements on top, advanced stats panel at the bottom.
7. **Profile / Settings** — account info, subscription status, redeem code, rate the app, restore purchase, log out.
8. **Custom Business (Premium)** — type your idea, generate daily tasks. Locked teaser for Base users.
9. **Admin panel** — only for dev accounts: user list, grant premium, mark dev, revoke.

## On your "do I have enough credits" question

Credits here are for building, not for running a backend — the accounts + admin system will run on the Supabase backend that's already wired into your project, so there's no extra ongoing cost for that. The only real cost to you later will be Apple's cut of the subscriptions, which only happens when people actually pay.
