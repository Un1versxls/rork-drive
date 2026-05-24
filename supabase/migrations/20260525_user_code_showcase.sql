-- Personal user code (DRIVE-XXXXXX) so support can look up users by a
-- short readable id. Generated deterministically client-side from the
-- account's stable identifier.
alter table if exists app_users
  add column if not exists user_code text;

-- "What's New" dashboard showcase tracking. Holds the id of the last
-- showcase the user dismissed so newer ids trigger the overlay again
-- and old ones don't.
alter table if exists app_users
  add column if not exists last_showcase_seen text;

-- Business switch counter mirrored on the row so the cap can be
-- enforced cross-device. The state_blob already carries these but
-- having them as first-class columns lets admins inspect / edit them.
alter table if exists app_users
  add column if not exists business_switch_month text;

alter table if exists app_users
  add column if not exists business_switch_count integer;

create index if not exists app_users_user_code_idx on app_users (user_code);
