-- User accounts: extends auth.users with app-level metadata
create table if not exists public.user_accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  is_admin boolean not null default false,
  is_dev boolean not null default false,
  admin_granted_premium boolean not null default false,
  granted_premium_plan text check (granted_premium_plan in ('base','premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_accounts enable row level security;

-- Each user can read/update their own row.
drop policy if exists user_accounts_select_self on public.user_accounts;
create policy user_accounts_select_self
  on public.user_accounts for select
  using (auth.uid() = id);

drop policy if exists user_accounts_insert_self on public.user_accounts;
create policy user_accounts_insert_self
  on public.user_accounts for insert
  with check (auth.uid() = id);

drop policy if exists user_accounts_update_self on public.user_accounts;
create policy user_accounts_update_self
  on public.user_accounts for update
  using (auth.uid() = id);

-- Admins can read + update everyone.
drop policy if exists user_accounts_admin_all on public.user_accounts;
create policy user_accounts_admin_all
  on public.user_accounts for all
  using (
    exists (
      select 1 from public.user_accounts admin
      where admin.id = auth.uid() and admin.is_admin = true
    )
  );

-- Redeem codes: admins create, anyone authenticated can read+claim.
create table if not exists public.redeem_codes (
  code text primary key,
  plan text not null check (plan in ('base','premium')) default 'premium',
  max_uses integer not null default 1,
  uses integer not null default 0,
  active boolean not null default true,
  claimed_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.redeem_codes enable row level security;

drop policy if exists redeem_codes_select on public.redeem_codes;
create policy redeem_codes_select
  on public.redeem_codes for select
  using (auth.role() = 'authenticated');

drop policy if exists redeem_codes_admin_all on public.redeem_codes;
create policy redeem_codes_admin_all
  on public.redeem_codes for all
  using (
    exists (
      select 1 from public.user_accounts admin
      where admin.id = auth.uid() and admin.is_admin = true
    )
  );

-- Allow any authenticated user to claim (update) an active code once.
drop policy if exists redeem_codes_claim on public.redeem_codes;
create policy redeem_codes_claim
  on public.redeem_codes for update
  using (active = true and uses < max_uses)
  with check (active = true);

-- Auto-create user_accounts row on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_accounts (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
