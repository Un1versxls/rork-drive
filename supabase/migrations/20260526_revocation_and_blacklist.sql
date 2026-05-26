-- Access revocation + device blacklist
alter table public.user_accounts
  add column if not exists is_revoked boolean not null default false,
  add column if not exists revoked_at timestamptz,
  add column if not exists last_device_id text;

alter table public.app_users
  add column if not exists last_device_id text;

create table if not exists public.blacklisted_devices (
  device_id text primary key,
  reason text,
  user_id uuid,
  email text,
  created_at timestamptz not null default now()
);

alter table public.blacklisted_devices enable row level security;

drop policy if exists "blacklist read" on public.blacklisted_devices;
create policy "blacklist read" on public.blacklisted_devices
  for select to anon, authenticated using (true);

drop policy if exists "blacklist admin write" on public.blacklisted_devices;
create policy "blacklist admin write" on public.blacklisted_devices
  for all to authenticated
  using (exists (select 1 from public.user_accounts a where a.id = auth.uid() and a.is_admin = true))
  with check (exists (select 1 from public.user_accounts a where a.id = auth.uid() and a.is_admin = true));
