-- Email OTP codes for Resend-based verification during onboarding.
create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists email_otps_email_idx on public.email_otps (email, created_at desc);
create index if not exists email_otps_expires_idx on public.email_otps (expires_at);

alter table public.email_otps enable row level security;

-- Only edge functions (service role) should read/write. No client policies.
-- RLS is on + no policies = anon/auth roles are blocked by default.
