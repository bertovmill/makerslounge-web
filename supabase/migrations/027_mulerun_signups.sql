-- Mulerun hack night signups — team matching form
-- Run this in the Supabase SQL editor before May 14, 2026

create table if not exists public.mulerun_signups (
  id uuid default gen_random_uuid() primary key,
  name text not null check (length(trim(name)) between 1 and 80),
  categories text[] not null default '{}' check (array_length(categories, 1) between 1 and 3),
  created_at timestamptz default now() not null
);

create index if not exists mulerun_signups_created_at_idx
  on public.mulerun_signups (created_at desc);

alter table public.mulerun_signups enable row level security;

-- Anyone (no auth) can submit a signup
drop policy if exists "mulerun_signups_anon_insert" on public.mulerun_signups;
create policy "mulerun_signups_anon_insert" on public.mulerun_signups
  for insert to anon, authenticated with check (true);

-- Anyone (no auth) can read signups — needed for the live match view
drop policy if exists "mulerun_signups_anon_select" on public.mulerun_signups;
create policy "mulerun_signups_anon_select" on public.mulerun_signups
  for select to anon, authenticated using (true);
