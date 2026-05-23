-- Track subscription / trial expiry so signed-in users with an expired
-- subscription get routed to the paywall instead of the dashboard, and so
-- Supabase shows "time left" at a glance per row.
alter table if exists public.app_users
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists last_nightly_sync_at timestamptz;
