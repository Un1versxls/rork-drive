-- Persist the entire client AppState as a JSON blob so we can restore
-- the exact same experience across devices: tasks, history, badges,
-- achievements, switch counters, equipped effects, etc.
alter table public.app_users
  add column if not exists state_blob jsonb;

-- Day-trading specific onboarding answers.
alter table public.app_users
  add column if not exists day_trading_mode text,
  add column if not exists day_trading_market text,
  add column if not exists day_trading_capital text;
