-- Session tracking & analytics columns for app_users.
-- Captures sessions-per-day, lifetime totals, avg tasks/day, and ensures
-- the age column is available alongside onboarding answers.
alter table if exists public.app_users
  add column if not exists age integer,
  add column if not exists sessions_by_date jsonb default '{}'::jsonb,
  add column if not exists total_sessions integer default 0,
  add column if not exists sessions_today integer default 0,
  add column if not exists avg_tasks_per_day numeric(10,2) default 0,
  add column if not exists last_session_at timestamptz;
