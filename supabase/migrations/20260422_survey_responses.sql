-- Onboarding survey responses: tracks each user's answers + email for spreadsheet export.
create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  name text,
  goal text,
  experience text,
  time_commitment text,
  priority text,
  industry text,
  budget text,
  obstacle text,
  source text,
  decline_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists survey_responses_email_idx on public.survey_responses (email);
create index if not exists survey_responses_created_idx on public.survey_responses (created_at desc);

alter table public.survey_responses enable row level security;

-- Anyone (anon or authenticated) can insert their own response during onboarding.
drop policy if exists survey_responses_insert_any on public.survey_responses;
create policy survey_responses_insert_any
  on public.survey_responses for insert
  with check (true);

-- Users can see their own rows.
drop policy if exists survey_responses_select_self on public.survey_responses;
create policy survey_responses_select_self
  on public.survey_responses for select
  using (auth.uid() = user_id);

-- Admins see and manage everything.
drop policy if exists survey_responses_admin_all on public.survey_responses;
create policy survey_responses_admin_all
  on public.survey_responses for all
  using (
    exists (
      select 1 from public.user_accounts admin
      where admin.id = auth.uid() and admin.is_admin = true
    )
  );
