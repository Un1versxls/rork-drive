-- Hard-reset user_accounts policies to eliminate infinite recursion.
-- Root cause: the admin_all policy referenced public.user_accounts inside its
-- USING clause, which re-triggered the same policy when evaluated.
-- Fix: route admin checks through a SECURITY DEFINER function that bypasses RLS,
-- and drop every legacy policy that referenced user_accounts directly.

-- 1. Helper function (idempotent). SECURITY DEFINER + owner = postgres bypasses RLS.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.user_accounts where id = uid), false);
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

-- 2. Drop EVERY known policy on user_accounts so we can recreate cleanly.
drop policy if exists user_accounts_select_self on public.user_accounts;
drop policy if exists user_accounts_insert_self on public.user_accounts;
drop policy if exists user_accounts_update_self on public.user_accounts;
drop policy if exists user_accounts_admin_all on public.user_accounts;
drop policy if exists user_accounts_admin_select on public.user_accounts;
drop policy if exists user_accounts_admin_update on public.user_accounts;

-- 3. Recreate self-access policies (no recursion).
create policy user_accounts_select_self
  on public.user_accounts for select
  using (auth.uid() = id);

create policy user_accounts_insert_self
  on public.user_accounts for insert
  with check (auth.uid() = id);

create policy user_accounts_update_self
  on public.user_accounts for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4. Admin policy uses the SECURITY DEFINER helper (no self-reference under RLS).
create policy user_accounts_admin_all
  on public.user_accounts for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 5. Same fix on every other table whose policies reference user_accounts.
drop policy if exists redeem_codes_admin_all on public.redeem_codes;
create policy redeem_codes_admin_all
  on public.redeem_codes for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists survey_responses_admin_all on public.survey_responses;
create policy survey_responses_admin_all
  on public.survey_responses for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists app_users_admin_all on public.app_users;
create policy app_users_admin_all
  on public.app_users for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
