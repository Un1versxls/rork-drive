-- Extend redeem_codes so a code can grant admin access, or grant a plan
-- without requiring an admin row. Managed via the Supabase Table Editor
-- (which is the "spreadsheet" you edit).

alter table public.redeem_codes
  add column if not exists grants_admin boolean not null default false;

alter table public.redeem_codes
  add column if not exists note text;

-- Allow 'admin' as a plan value too (for codes that only grant admin and nothing else)
alter table public.redeem_codes drop constraint if exists redeem_codes_plan_check;
alter table public.redeem_codes
  add constraint redeem_codes_plan_check
  check (plan in ('base','premium','admin'));
