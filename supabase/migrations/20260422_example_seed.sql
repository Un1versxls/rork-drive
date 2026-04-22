-- Example seed rows so you can see the exact shape/style of each table.
-- Safe to re-run: uses on conflict do nothing.

-- ──────────────────────────────────────────────────────────────
-- redeem_codes: admin + free-sub codes you hand out to creators
-- ──────────────────────────────────────────────────────────────
-- plan: 'base' or 'premium'  (what the user gets when they redeem)
-- is_admin: true = this code unlocks admin panel instead of a plan
-- max_uses: how many times the code can be claimed total
-- active: flip to false to kill a code without deleting it
insert into public.redeem_codes (code, plan, is_admin, max_uses, uses, active)
values
  ('ADMIN-MASTER',   'premium', true,  1,   0, true),
  ('CREATOR-PREMIUM-2026', 'premium', false, 50,  0, true),
  ('CREATOR-BASE-2026',    'base',    false, 100, 0, true),
  ('FRIEND-FAMILY-01',     'premium', false, 10,  0, true),
  ('EXPIRED-EXAMPLE',      'base',    false, 1,   1, false)
on conflict (code) do nothing;

-- ──────────────────────────────────────────────────────────────
-- survey_responses: what the onboarding survey writes
-- ──────────────────────────────────────────────────────────────
-- user_id can be null (if they declined before signing in).
-- decline_reason is only set when the user exits the paywall.
insert into public.survey_responses
  (user_id, email, name, goal, experience, time_commitment, priority, industry, budget, obstacle, source, decline_reason)
values
  (null, 'alex.example@gmail.com',  'Alex Rivera',  'Start a business', 'Beginner',     '1-2 hours/day', 'Make money fast',    'E-commerce',    '$0-100',    'Not sure where to start', 'TikTok',    null),
  (null, 'sam.example@gmail.com',   'Sam Chen',     'Scale a business', 'Intermediate', '3-5 hours/day', 'Build a brand',      'SaaS',          '$500-2000', 'Time management',         'Instagram', null),
  (null, 'jordan.example@gmail.com','Jordan Patel', 'Side hustle',      'Advanced',     '30 min/day',    'Financial freedom',  'Content/Media', '$100-500',  'Consistency',             'YouTube',   'Too expensive'),
  (null, 'test@example.com',        null,           'Learn skills',     'Beginner',     'Flexible',      'Long-term growth',   'Other',         'Unsure',    'Fear of failure',         'Friend',    null);
