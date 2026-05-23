-- Adds richer per-user data columns for app analytics & onboarding.
alter table if exists public.app_users
  add column if not exists age integer,
  add column if not exists equipped_effect text,
  add column if not exists unlocked_badges jsonb default '[]'::jsonb,
  add column if not exists unlocked_achievements jsonb default '[]'::jsonb,
  add column if not exists total_completed integer default 0,
  add column if not exists total_skipped integer default 0,
  add column if not exists motivation_hint_seen boolean default false,
  add column if not exists task_hint_seen boolean default false,
  add column if not exists subtask_hint_seen boolean default false,
  add column if not exists app_version text,
  add column if not exists platform text;
