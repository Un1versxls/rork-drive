-- DRIVE Business / Routine / Skill Library
-- Edit rows directly in Supabase Table Editor to add, disable, or remove options.

create table if not exists public.business_library (
  id text primary key,
  name text not null,
  category text not null default 'business' check (category in ('business', 'routine', 'skill')),
  tagline text,
  description text,
  why_fit text,
  startup_cost text,
  time_to_income text,
  first_milestones jsonb default '[]'::jsonb,
  task_pool jsonb default '[]'::jsonb,
  matching_goals text[] default '{}',
  matching_experience text[] default '{}',
  difficulty int default 2,
  active boolean not null default true,
  times_suggested int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_library_active_idx on public.business_library (active);
create index if not exists business_library_category_idx on public.business_library (category);

alter table public.business_library enable row level security;

drop policy if exists "public read active entries" on public.business_library;
create policy "public read active entries"
  on public.business_library for select
  using (active = true);

drop policy if exists "public insert entries" on public.business_library;
create policy "public insert entries"
  on public.business_library for insert
  with check (true);

drop policy if exists "public update times_suggested" on public.business_library;
create policy "public update times_suggested"
  on public.business_library for update
  using (true)
  with check (true);
