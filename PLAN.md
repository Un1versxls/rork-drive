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
- [x] Remove stay_productive option from goal screen
- [x] Add /onboarding/skill-topic for build_skills (code, business, marketing, design, content, languages, speaking, finance)
- [x] Add email signup option alongside Apple Sign In on apple-signin screen
- [x] Generate a Crash Course pseudo-business with topic-tuned tasks for build_skills after paywall
- [x] Show learning-themed motivation insights on progress page when goal === build_skills
- [x] Rebrand "Your Business" → "Your Crash Course" on tasks/profile/complete for build_skills
