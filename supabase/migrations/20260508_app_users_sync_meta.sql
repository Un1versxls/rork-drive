-- Track when the client last synced (migrated) state to the cloud, and
-- explicitly persist the list of past businesses so it survives even if
-- the state_blob ever gets trimmed.
alter table public.app_users
  add column if not exists last_migrated_at timestamptz,
  add column if not exists past_businesses jsonb;

create index if not exists app_users_last_seen_at_idx on public.app_users (last_seen_at);
