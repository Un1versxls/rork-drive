-- Fix infinite recursion in user_accounts admin policy.
-- The admin_all policy did `select 1 from user_accounts where ...` which itself
-- triggers the same policy, causing infinite recursion. We replace it with a
-- SECURITY DEFINER helper that bypasses RLS to do the check.

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

-- user_accounts: replace recursive policy
drop policy if exists user_accounts_admin_all on public.user_accounts;
create policy user_accounts_admin_all
  on public.user_accounts for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- redeem_codes: same fix
drop policy if exists redeem_codes_admin_all on public.redeem_codes;
create policy redeem_codes_admin_all
  on public.redeem_codes for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- survey_responses: same fix
drop policy if exists survey_responses_admin_all on public.survey_responses;
create policy survey_responses_admin_all
  on public.survey_responses for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- app_users: same fix if a similar policy exists
drop policy if exists app_users_admin_all on public.app_users;
create policy app_users_admin_all
  on public.app_users for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
