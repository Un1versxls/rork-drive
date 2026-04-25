-- App users: stores Apple ID, profile, and subscription info captured during onboarding.
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  apple_user_id text unique,
  email text,
  name text,
  subscription_plan text check (subscription_plan in ('base','premium')),
  subscription_cycle text check (subscription_cycle in ('monthly','yearly')),
  subscription_active boolean not null default false,
  subscription_trial boolean not null default false,
  subscription_source text,
  subscription_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_apple_id_idx on public.app_users (apple_user_id);
create index if not exists app_users_email_idx on public.app_users (email);

alter table public.app_users enable row level security;

-- Anyone can insert/update their own onboarding row (anon key writes during onboarding).
drop policy if exists app_users_insert_any on public.app_users;
create policy app_users_insert_any
  on public.app_users for insert
  with check (true);

drop policy if exists app_users_update_any on public.app_users;
create policy app_users_update_any
  on public.app_users for update
  using (true)
  with check (true);

drop policy if exists app_users_select_any on public.app_users;
create policy app_users_select_any
  on public.app_users for select
  using (true);

-- Admins can do anything.
drop policy if exists app_users_admin_all on public.app_users;
create policy app_users_admin_all
  on public.app_users for all
  using (
    exists (
      select 1 from public.user_accounts admin
      where admin.id = auth.uid() and admin.is_admin = true
    )
  );
