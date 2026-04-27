-- Add optional display name to user_accounts
alter table public.user_accounts
  add column if not exists name text;
