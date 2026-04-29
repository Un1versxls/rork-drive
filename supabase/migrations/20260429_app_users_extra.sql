-- Extend app_users with extra profile / business / source info captured during onboarding.
alter table public.app_users
  add column if not exists user_id uuid,
  add column if not exists goal text,
  add column if not exists skill_topic text,
  add column if not exists experience text,
  add column if not exists time_commitment text,
  add column if not exists priority text,
  add column if not exists industry text,
  add column if not exists budget text,
  add column if not exists obstacle text,
  add column if not exists source text,
  add column if not exists decline_reason text,
  add column if not exists business_id text,
  add column if not exists business_name text,
  add column if not exists business_tagline text,
  add column if not exists points integer,
  add column if not exists streak integer,
  add column if not exists best_streak integer,
  add column if not exists onboarded boolean,
  add column if not exists last_active_date text,
  add column if not exists last_seen_at timestamptz;

create index if not exists app_users_user_id_idx on public.app_users (user_id);
