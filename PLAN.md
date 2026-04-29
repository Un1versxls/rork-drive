# Onboarding flow rework

## Goals
- "Run / grow my business" should skip onboarding questions, go straight to a custom-business builder, then to the paywall.
- Different question paths for build_skills / stay_productive (no business assignment).
- earn_income keeps current business-matching flow.
- Move the reviews/results page to the middle of the questionnaire with fade-in + stars-pop animations.

## Tasks
- [x] Update goal.tsx to route grow_business → /onboarding/build-business
- [x] Create /onboarding/build-business with X (back to goal) and Create tasks → paywall
- [x] Animate results.tsx (review fade-ins, stars pop one-by-one)
- [x] Insert results mid-flow (after priority); for skills/productive skip industry+budget
- [x] Paywall routes to /complete (not /match) for grow_business / build_skills / stay_productive
- [x] Update verify.tsx and source.tsx flow accordingly
