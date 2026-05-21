-- Per-user bonus business switches (admin can edit this column directly to grant extra).
-- Also tracks whether the "buy premium with 0 left" +2 bonus has already been given.
alter table public.app_users
  add column if not exists business_switch_bonus integer not null default 0,
  add column if not exists premium_switch_bonus_granted boolean not null default false;
