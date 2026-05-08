-- Track which auth provider was used (apple, email/password, etc.) so we can
-- show users how they signed up and so analytics know the breakdown.
alter table public.app_users
  add column if not exists auth_provider text;

create index if not exists app_users_auth_provider_idx on public.app_users (auth_provider);
